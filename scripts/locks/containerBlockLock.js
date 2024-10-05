import { Block, BlockComponentTypes, BlockInventoryComponent, system, world } from "@minecraft/server";
import { randomInt } from "../utils/random";
import { getPassword, isContainer, resetPassword, setPassword } from "../common";

export function containerBlockLockInit(){}

/**@typedef {0 | 1 | 2 | 3 | 4 | 5} SixDirection*/

world.beforeEvents.playerInteractWithBlock.subscribe(data=>{
    if(isContainer(data.block)){
        const
            /**@type {Block}*/
            containerBlock = data.block,
            password = getPassword(containerBlock, false, false),
            opassword = getPassword(containerBlock, true, false),
            hideSuccess = data.player.getDynamicProperty("hideSuccess"),
            hideFailure = data.player.getDynamicProperty("hideFailure"),
            item = data.itemStack,
            /**@type {import("@minecraft/server").Vector3}*/
            center = {
                x: containerBlock.location.x + 0.5,
                y: containerBlock.location.y + 0.5,
                z: containerBlock.location.z + 0.5,
            };
        if(
            (password || opassword)
         && (!item
             || (
                    (item.typeId !== "minecraft:trial_key" || password !== item.nameTag)
                 && (item.typeId !== "minecraft:ominous_trial_key" || opassword !== item.nameTag)
                )
            )
        ){
            data.cancel = true;
            if(!hideFailure) data.player.sendMessage("§c容器已上锁，请用正确的（不祥）试炼钥匙解锁！");
            system.run(()=>{
                containerBlock.dimension.playSound("vault.insert_item_fail", center, {
                    volume: 1.0,
                    pitch: randomInt(8, 11) / 10
                });
                const particleCount = randomInt(15, 25);
                for(let i = 0; i < particleCount; i++) containerBlock.dimension.spawnParticle("minecraft:basic_smoke_particle", {
                    x: containerBlock.location.x + randomInt(-10, 110) / 100,
                    y: containerBlock.location.y + randomInt(10, 60) / 100,
                    z: containerBlock.location.z + randomInt(-10, 110) / 100,
                });
            });
        }
        else if(
            !(password || opassword)
         && item
         && (item.typeId === "minecraft:trial_key" || item.typeId === "minecraft:ominous_trial_key")
         && item.nameTag
        ){
            data.cancel = true;
            setPassword(containerBlock, item.nameTag, item.typeId === "minecraft:ominous_trial_key", false);
            const anotherChestBlock = findLinkedDoubleChest(containerBlock);
            if(anotherChestBlock) setPassword(anotherChestBlock, item.nameTag, item.typeId === "minecraft:ominous_trial_key", false);
            if(!hideSuccess) data.player.sendMessage("§e容器已上锁。");
            system.run(()=>{
                containerBlock.dimension.playSound("vault.insert_item", center, {
                    volume: 1.0,
                    pitch: randomInt(8, 11) / 10
                });
                const particleCount = randomInt(10, 20);
                for(let i = 0; i < particleCount; i++) containerBlock.dimension.spawnParticle("minecraft:villager_happy", {
                    x: containerBlock.location.x + randomInt(-10, 110) / 100,
                    y: containerBlock.location.y + randomInt(-10, 110) / 100,
                    z: containerBlock.location.z + randomInt(-10, 110) / 100,
                });
            });
        }
    }
});

/**返回undefined，要不传入方块不符合条件，要不没有双箱子。
 * @typedef {"north" | "south" | "west" | "east"} DirectionOfChest
 * @param {Block} block
 * @returns {Block | undefined}
 */
function findLinkedDoubleChest(block){
    if(block.typeId === "minecraft:chest" && /**@type {BlockInventoryComponent}*/(block.getComponent(BlockComponentTypes.Inventory)).container?.size === 54){
        const direction = /**@type {DirectionOfChest}*/ (block.permutation.getState("minecraft:cardinal_direction"));
        switch(direction){
            case "north":
                if(getLargeChestBlocks(block, direction, "west") % 2) return block.west(1);
                else if(getLargeChestBlocks(block, direction, "east") % 2) return block.east(1);
                break;
            case "south":
                if(getLargeChestBlocks(block, direction, "west") % 2) return block.west(1);
                else if(getLargeChestBlocks(block, direction, "east") % 2) return block.east(1);
                break;
            case "west":
                if(getLargeChestBlocks(block, direction, "north") % 2) return block.north(1);
                else if(getLargeChestBlocks(block, direction, "south") % 2) return block.south(1);
                break;
            case "east":
                if(getLargeChestBlocks(block, direction, "north") % 2) return block.north(1);
                else if(getLargeChestBlocks(block, direction, "south") % 2) return block.south(1);
                break;
        }
        console.error(`Direction for chest get other cases: ${direction}`);
        world.sendMessage("§e出现了一个 bug，请通知开发者查看日志！");
    }
    else return undefined;
}

/**探测该方向同朝向双箱子的个数。
 * @param {Block} block 初始方块。
 * @param {DirectionOfChest} faceDirection 方块朝向。
 * @param {DirectionOfChest} searchDirection 搜索方向。
 * @returns {number}
 */
function getLargeChestBlocks(block, faceDirection, searchDirection){
    let result = -1,
        /**@type {Block | undefined}*/
        newBlock = block;
    while(newBlock && newBlock.typeId === "minecraft:chest" && /**@type {BlockInventoryComponent}*/(newBlock.getComponent(BlockComponentTypes.Inventory)).container?.size === 54 && newBlock.permutation.getState("minecraft:cardinal_direction") === faceDirection){
        switch(searchDirection){
            case "north":
                newBlock = newBlock.north(1);
                break;
            case "south":
                newBlock = newBlock.south(1);
                break;
            case "west":
                newBlock = newBlock.west(1);
                break;
            case "east":
                newBlock = newBlock.east(1);
                break;
        }
        result++;
    }
    return result;
}

world.beforeEvents.explosion.subscribe(data=>{
    const blocks = data.getImpactedBlocks();
    for(let i = 0; i < blocks.length; i++) if(isContainer(blocks[i])) resetPassword(blocks[i], false);
});

world.beforeEvents.playerBreakBlock.subscribe(data=>resetPassword(data.block, false));

world.afterEvents.playerPlaceBlock.subscribe(data=>{
    const anotherChestBlock = findLinkedDoubleChest(data.block);
    if(anotherChestBlock){
        const password = getPassword(anotherChestBlock, false, false), opassword = getPassword(anotherChestBlock, true, false);
        if(password) setPassword(data.block, password, false, false);
        else if(opassword) setPassword(data.block, opassword, true, false);
    }
});

world.beforeEvents.playerPlaceBlock.subscribe(data=>{
    if(data.permutationBeingPlaced.type.id === "minecraft:dispenser"){
        const direction = /**@type {SixDirection}*/ (data.permutationBeingPlaced.getState("facing_direction"));
        switch(direction){
            case 0:
                const below = data.block.below(1);
                if(below) resetPassword(below, false);
                break;
            case 1:
                const above = data.block.above(1);
                if(above) resetPassword(above, false);
                break;
            case 2:
                const north = data.block.north(1);
                if(north) resetPassword(north, false);
                break;
            case 3:
                const south = data.block.south(1);
                if(south) resetPassword(south, false);
                break;
            case 4:
                const west = data.block.west(1);
                if(west) resetPassword(west, false);
                break;
            case 5:
                const east = data.block.east(1);
                if(east) resetPassword(east, false);
                break;
        }
    }
    if(data.permutationBeingPlaced.type.id !== "minecraft:water") resetPassword(data.block, false);
});

world.afterEvents.pistonActivate.subscribe(data=>{
    const
        isExpanding = data.isExpanding,
        originBlocks = data.piston.getAttachedBlocks(),
        faceLocation = /**@type {SixDirection}*/ (data.piston.block.permutation.getState("facing_direction"));
    system.runTimeout(()=>{
        for(let i = 0; i < originBlocks.length; i++){
            const movedBlock = (()=>{
                switch(faceLocation){
                    case 0: return isExpanding ? originBlocks[i].below(1) : originBlocks[i].above(1);
                    case 1: return isExpanding ? originBlocks[i].above(1) : originBlocks[i].below(1);
                    case 2: return isExpanding ? originBlocks[i].south(1) : originBlocks[i].north(1);
                    case 3: return isExpanding ? originBlocks[i].north(1) : originBlocks[i].south(1);
                    case 4: return isExpanding ? originBlocks[i].east(1) : originBlocks[i].west(1);
                    case 5: return isExpanding ? originBlocks[i].west(1) : originBlocks[i].east(1);
                }
            })();
            if(movedBlock && isContainer(movedBlock)){
                const password = getPassword(originBlocks[i], false, false), opassword = getPassword(originBlocks[i], true, false);
                if(password){
                    resetPassword(originBlocks[i], false);
                    setPassword(movedBlock, password, false, false);
                }
                else if(opassword){
                    resetPassword(originBlocks[i], false);
                    setPassword(movedBlock, opassword, true, false);
                }
            }
        }
    }, 2);
});