//@ts-check
import { Block, BlockPermutation, Dimension, ItemStack, Player, system, world } from "@minecraft/server";
import { randomInt } from "../utils/random";

export function doorLockInit(){}

/**@typedef {0 | 1 | 2 | 3 | 4 | 5} SixDirection*/
/**@typedef {0 | 1 | 2 | 3} FourDirection*/

const doorIds = [
    "wooden",
    "spruce",
    "birch",
    "jungle",
    "acacia",
    "dark_oak",
    "mangrove",
    "cherry",
    "bamboo",
    "crimson",
    "warped",
    "copper",
    "exposed_copper",
    "weathered_copper",
    "oxidized_copper",
    "waxed_copper",
    "waxed_exposed_copper",
    "waxed_weathered_copper",
    "waxed_oxidized_copper"
];

/**判断是否为可以锁上的门，除了铁门外任何门都可以。
 * @param {Block} block
 * @returns {boolean}
 */
function isDoor(block){
    return doorIds.map(value=>`minecraft:${value}_door`).includes(block.typeId);
}

/**获取维度魔数。
 * @param {Dimension} dimension
 * @returns {"o" | "n" | "e"}
 */
function getDimensionML(dimension){
    return dimension.id === "minecraft:overworld" ? "o" : dimension.id === "minecraft:nether" ? "n" : "e";
}

/**生成附加属性键名。
 * @param {Block} block
 * @param {boolean} isOminous
 */
function generateKey(block, isOminous){
    return `d${isOminous === true ? "o" : ""}${block.location.x},${block.location.y},${block.location.z}${getDimensionML(block.dimension)}`;
}

/**设置坐标密码。
 * @param {Block} block
 * @param {string} password
 * @param {boolean} isOminous
 */
function setPassword(block, password, isOminous){
    //world.sendMessage(`set ${block.location.x} ${block.location.y} ${block.location.z}`);
    world.setDynamicProperty(generateKey(block, isOminous), password);
}

/**获取密码。
 * @param {Block} block
 * @param {boolean} isOminous
 * @returns {string | undefined}
 */
function getPassword(block, isOminous){
    return /**@type {string | undefined}*/ (world.getDynamicProperty(generateKey(block, isOminous)));
}

/**重置坐标的全部密码。
 * @param {Block} block
 */
function resetPassword(block){
    //world.sendMessage(`reset ${generateKey(block, false)}`);
    world.setDynamicProperty(generateKey(block, false), undefined);
    world.setDynamicProperty(generateKey(block, true), undefined);
}

//@ts-ignore 扩展。。。。。
world.beforeEvents.playerInteractWithBlock.subscribe(
    /**@param {{
     *     block :Block;
     *     blockFace :Direction;
     *     cancel :boolean;
     *     faceLocation :import("@minecraft/server").Vector3;
     *     itemStack? :ItemStack;
     *     player :Player;
     * }} data*/
    data=>{
        if(isDoor(data.block)){
            const
                isUpperHalf = /**@type {boolean}*/ (data.block.permutation.getState("upper_block_bit")),
                upperBlock = /**@type {Block}*/ (isUpperHalf ? data.block : data.block.above(1)),
                lowerBlock = /**@type {Block}*/ (isUpperHalf ? data.block.below(1) : data.block),
                actualDirection = getActualDirection(upperBlock),
                hingeBit = /**@type {boolean}*/ (upperBlock.permutation.getState("door_hinge_bit")),
                openBit = /**@type {boolean}*/ (lowerBlock.permutation.getState("open_bit")),
                password = getPassword(upperBlock, false),
                opassword = getPassword(upperBlock, true),
                player = data.player,
                hideSuccess = player.getDynamicProperty("hideSuccess"),
                hideFailure = player.getDynamicProperty("hideFailure"),
                item = data.itemStack,
                /**@type {import("@minecraft/server").Vector3}*/
                center = {
                    x: upperBlock.location.x + 0.5,
                    y: upperBlock.location.y,
                    z: upperBlock.location.z + 0.5,
                };
            if(password || opassword){
                if(!item
                 || (
                        (item.typeId !== "minecraft:trial_key" || password !== item.nameTag)
                     && (item.typeId !== "minecraft:ominous_trial_key" || opassword !== item.nameTag)
                    )
                ){
                    data.cancel = true;
                    cancelPlayerMove(upperBlock, lowerBlock);
                    if(!hideFailure) player.sendMessage("§c门已上锁，请用正确的（不祥）试炼钥匙解锁！");
                    system.run(()=>{
                        upperBlock.dimension.playSound("vault.insert_item_fail", center, {
                            volume: 1.0,
                            pitch: randomInt(8, 11) / 10
                        });
                        emitParticles(upperBlock, "minecraft:basic_smoke_particle", actualDirection, hingeBit, openBit);
                    });
                }
                else{
                    if(!hideSuccess) player.sendMessage("§e门锁已打开。");
                    resetPassword(upperBlock);
                    const theOtherDoor = getDoubleDoor(upperBlock);
                    if(theOtherDoor){
                        resetPassword(theOtherDoor);
                        const lowerBlock = /**@type {Block}*/ (theOtherDoor.below(1));
                        system.run(()=>lowerBlock.setPermutation(lowerBlock.permutation.withState("open_bit", /**@type {boolean}*/ !(lowerBlock.permutation.getState("open_bit")))));
                    }
                }
            }
            else if(item
             && (item.typeId === "minecraft:trial_key" || item.typeId === "minecraft:ominous_trial_key")
             && item.nameTag
            ){
                data.cancel = true;
                setPassword(upperBlock, item.nameTag, item.typeId === "minecraft:ominous_trial_key");
                const theOtherDoor = getDoubleDoor(upperBlock);
                if(theOtherDoor) setPassword(theOtherDoor, item.nameTag, item.typeId === "minecraft:ominous_trial_key");
                if(!hideSuccess) player.sendMessage("§e门已上锁。");
                system.run(()=>{
                    upperBlock.dimension.playSound("vault.insert_item", center, {
                        volume: 1.0,
                        pitch: randomInt(8, 11) / 10
                    });
                    emitParticles(upperBlock, "minecraft:villager_happy", actualDirection, hingeBit, openBit);
                });
            }
        }
    }
);

/**在把手位置发出粒子。
 * @param {Block} upperBlock
 * @param {string} id 粒子ID。
 * @param {FourDirection} actualDirection
 * @param {boolean} hingeBit
 * @param {boolean} openBit
 */
function emitParticles(upperBlock, id, actualDirection, hingeBit, openBit){
    const
        particleCount = randomInt(8, 16),
        actualHinge = openBit ? !hingeBit : hingeBit;
    for(let i = 0; i < particleCount; i++) switch(actualDirection){
        //0：朝西1：朝北2：朝东3：朝南
        case 0:
            if(actualHinge) upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + randomInt(-10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + randomInt(10, 30) / 100,
            });
            else upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + randomInt(-10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + 1 - randomInt(10, 30) / 100,
            });
            break;
        case 1:
            if(actualHinge) upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + 1 - randomInt(10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + randomInt(-10, 30) / 100,
            });
            else upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + randomInt(10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + randomInt(-10, 30) / 100,
            });
            break;
        case 2:
            if(actualHinge) upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + 1 - randomInt(-10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + 1 - randomInt(10, 30) / 100,
            });
            else upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + 1 - randomInt(-10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + randomInt(10, 30) / 100,
            });
            break;
        case 3:
            if(actualHinge) upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + randomInt(10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + 1 - randomInt(-10, 30) / 100,
            });
            else upperBlock.dimension.spawnParticle(id, {
                x: upperBlock.location.x + 1 - randomInt(10, 30) / 100,
                y: upperBlock.location.y + randomInt(-10, 10) / 100,
                z: upperBlock.location.z + 1 - randomInt(-10, 30) / 100,
            });
            break;
    }
}

//@ts-ignore扩展。。。。
world.afterEvents.playerInteractWithBlock.subscribe(
    /**@param {{
     *     block :Block;
     *     blockFace :Direction;
     *     faceLocation :import("@minecraft/server").Vector3;
     *     itemStack? :ItemStack;
     *     player :Player;
     * }} data*/
    data=>{
        if(isDoor(data.block)){
            const
                upperBlock = /**@type {Block}*/ (data.block.permutation.getState("upper_block_bit") ? data.block : data.block.above(1)),
                theOtherDoor = getDoubleDoor(upperBlock);
            if(!getPassword(upperBlock, false) && !getPassword(upperBlock, true) && theOtherDoor){
                const
                    password = getPassword(theOtherDoor, false),
                    opassword = getPassword(theOtherDoor, true);
                if(password) setPassword(upperBlock, password, false);
                else if(opassword) setPassword(upperBlock, opassword, true);
            }
        }
    }
);

const deprecatedOnNextVersion = 0.09126, pRadius = 0.3, checkTimes = 5;

/**智能的碰撞箱检测拉回玩家！！！
 * @param {Block} upperBlock
 * @param {Block} lowerBlock
 */
function cancelPlayerMove(upperBlock, lowerBlock){
    let h = 0;
    const
        doorLocation = lowerBlock.location,
        actualDirection = getActualDirection(upperBlock),
        players = lowerBlock.dimension.getPlayers({
            location: lowerBlock.location,
            maxDistance: 2
        });
    for(let i = 0; i < players.length; i++) system.run(()=>checkPlayer(players[i]));
    /**@param {Player} player*/
    function checkPlayer(player){
        if(h >= checkTimes) return;
        h++;
        const location = player.location, velocity = player.getVelocity(), height = getPlayerHeight(player);
        if(Math.abs(location.y + height / 2 - (doorLocation.y + 1)) < height / 2 + 1){
            let multiplyerX = 0, multiplyerY = 0, multiplyerZ = 0;
            switch(actualDirection){ //0：朝西1：朝北2：朝东3：朝南
                case 0:
                    if(
                        Math.abs(location.z - (doorLocation.z + 0.5)) < pRadius + 0.5
                     && location.x - (doorLocation.x + deprecatedOnNextVersion) > -0.39126305175781795
                     && location.x - (doorLocation.x + deprecatedOnNextVersion) < 0.3912457983398383
                    ){
                        const
                            x = Math.abs((pRadius + deprecatedOnNextVersion - Math.abs(location.x - (doorLocation.x + deprecatedOnNextVersion))) / velocity.x),
                            y = Math.abs((height / 2 + 1 - Math.abs(location.y + height / 2 - (doorLocation.y + 1))) / velocity.y),
                            z = Math.abs((pRadius + 0.5 - Math.abs(location.z - (doorLocation.z + 0.5))) / velocity.z),
                            min = Math.min(x, y, z);
                        if(min === x) multiplyerX = x;
                        else if(min === y) multiplyerY = y;
                        else multiplyerZ = z;
                    }
                    break;
                case 1:
                    if(
                        Math.abs(location.x - (doorLocation.x + 0.5)) < pRadius + 0.5
                     && location.z - (doorLocation.z + deprecatedOnNextVersion) > -0.3912592370605452
                     && location.z - (doorLocation.z + deprecatedOnNextVersion) < 0.39123816894531416
                    ){
                        const
                            x = Math.abs((pRadius + 0.5 - Math.abs(location.x - (doorLocation.x + 0.5))) / velocity.x),
                            y = Math.abs((height / 2 + 1 - Math.abs(location.y + height / 2 - (doorLocation.y + 1))) / velocity.y),
                            z = Math.abs((pRadius + deprecatedOnNextVersion - Math.abs(location.z - (doorLocation.z + deprecatedOnNextVersion))) / velocity.z),
                            min = Math.min(x, y, z);
                        if(min === x) multiplyerX = x;
                        else if(min === y) multiplyerY = y;
                        else multiplyerZ = z;
                    }
                    break;
                case 2:
                    if(
                        Math.abs(location.z - (doorLocation.z + 0.5)) < pRadius + 0.5
                     && location.x - (doorLocation.x + 1 - deprecatedOnNextVersion) > -0.3912457983398383
                     && location.x - (doorLocation.x + 1 - deprecatedOnNextVersion) < 0.3912592370605452
                    ){
                        const
                            x = Math.abs((pRadius + deprecatedOnNextVersion - Math.abs(location.x - (doorLocation.x + 1 - deprecatedOnNextVersion))) / velocity.x),
                            y = Math.abs((height / 2 + 1 - Math.abs(location.y + height / 2 - (doorLocation.y + 1))) / velocity.y),
                            z = Math.abs((pRadius + 0.5 - Math.abs(location.z - (doorLocation.z + 0.5))) / velocity.z),
                            min = Math.min(x, y, z);
                        if(min === x) multiplyerX = x;
                        else if(min === y) multiplyerY = y;
                        else multiplyerZ = z;
                    }
                    break;
                case 3:
                    if(
                        Math.abs(location.x - (doorLocation.x + 0.5)) < pRadius + 0.5
                     && location.z - (doorLocation.z + 1 - deprecatedOnNextVersion) > -0.39123816894531416
                     && location.z - (doorLocation.z + 1 - deprecatedOnNextVersion) < 0.3912592370605452
                    ){
                        const
                            x = Math.abs((pRadius + 0.5 - Math.abs(location.x - (doorLocation.x + 0.5))) / velocity.x),
                            y = Math.abs((height / 2 + 1 - Math.abs(location.y + height / 2 - (doorLocation.y + 1))) / velocity.y),
                            z = Math.abs((pRadius + deprecatedOnNextVersion - Math.abs(location.z - (doorLocation.z + 1 - deprecatedOnNextVersion))) / velocity.z),
                            min = Math.min(x, y, z);
                        if(min === x) multiplyerX = x;
                        else if(min === y) multiplyerY = y;
                        else multiplyerZ = z;
                    }
                    break;
            }
            if(isFinite(multiplyerX) && isFinite(multiplyerY) && isFinite(multiplyerZ) && (multiplyerX !== 0 || multiplyerY !== 0 || multiplyerZ !== 0)) player.teleport({
                x: location.x - velocity.x * multiplyerX,
                y: location.y - velocity.y * multiplyerY,
                z: location.z - velocity.z * multiplyerZ
            });
        }
        system.run(()=>checkPlayer(player));
    }
}

/**获取玩家全身高度。
 * @param {Player} player
 * @returns {number}
 */
function getPlayerHeight(player){
    const playerEyeHeight = (player.getHeadLocation().y - player.location.y).toFixed(1);
    if(playerEyeHeight === "1.5") return 1.8;
    else if(playerEyeHeight === "1.2") return 1.49;
    else if(playerEyeHeight === "0.3") return 0.6;
    else{
        console.error(`Player ${player.name} eye height get ${playerEyeHeight}!`);
        world.sendMessage("§e出现了一个 bug，请通知开发者查看日志！");
        return 0;
    }
}

/**
 * @param {Block} upperBlock
 * @returns {FourDirection}
 */
function getActualDirection(upperBlock){
    const
        lowerBlock = /**@type {Block}*/ (upperBlock.below(1)),
        direction = /**@type {FourDirection}*/ (lowerBlock.permutation.getState("direction"));
    if(/**@type {boolean}*/ (lowerBlock.permutation.getState("open_bit"))){
        if(/**@type {boolean}*/ (upperBlock.permutation.getState("door_hinge_bit"))){
            if(direction === 0) return 3;
            else return /**@type {FourDirection}*/ (direction - 1);
        }
        else{
            if(direction === 3) return 0;
            else return /**@type {FourDirection}*/ (direction + 1);
        }
    }
    else return direction;
}

/**如果有配对的双门，则返回上门方块，否则返回`undefined`。允许不同种的门配对。
 * @param {Block} upperBlock
 * @returns {Block | undefined}
 */
function getDoubleDoor(upperBlock){
    const
        actualDirection = getActualDirection(upperBlock),
        hingeBit = /**@type {boolean}*/ (upperBlock.permutation.getState("door_hinge_bit")),
        blockToCheck = (()=>{
            switch(actualDirection){
                case 0:
                    if(hingeBit) return upperBlock.north(1);
                    else return upperBlock.south(1);
                case 1:
                    if(hingeBit) return upperBlock.east(1);
                    else return upperBlock.west(1);
                case 2:
                    if(hingeBit) return upperBlock.south(1);
                    else return upperBlock.north(1);
                case 3:
                    if(hingeBit) return upperBlock.west(1);
                    else return upperBlock.east(1);
            }
        })();
    if(blockToCheck && isDoor(blockToCheck) && getActualDirection(blockToCheck) === actualDirection && (blockToCheck.permutation.getState("door_hinge_bit") !== hingeBit || /**@type {Block}*/ (blockToCheck.below(1)).permutation.getState("open_bit"))) return blockToCheck;
}

world.beforeEvents.explosion.subscribe(data=>{
    const blocks = data.getImpactedBlocks();
    for(let i = 0; i < blocks.length; i++) if(isDoor(blocks[i])){
        resetPassword(blocks[i]);
        if(blocks[i].above(1)) resetPassword(/**@type {Block}*/ (blocks[i].above(1)));
    }
});

world.beforeEvents.playerBreakBlock.subscribe(data=>resetPassword(data.block));

world.afterEvents.playerPlaceBlock.subscribe(data=>{
    if(isDoor(data.block)){
        const
            upperBlock = /**@type {Block}*/ (/**@type {boolean}*/ (data.block.permutation.getState("upper_block_bit")) ? data.block : data.block.above(1)),
            theOtherDoor = getDoubleDoor(upperBlock);
        if(theOtherDoor){
            const
                password = getPassword(theOtherDoor, false),
                opassword = getPassword(theOtherDoor, true);
            if(password) setPassword(upperBlock, password, false);
            else if(opassword) setPassword(upperBlock, opassword, true);
        }
    }
});

//@ts-ignore
world.beforeEvents.playerPlaceBlock.subscribe(
    /**@param {{
     *     block :Block;
     *     cancel :boolean;
     *     dimension :Dimension;
     *     face :Direction;
     *     faceLocation :import("@minecraft/server").Vector3;
     *     permutationBeingPlaced :BlockPermutation;
     *     player :Player;
     * }} data*/
    data=>{
        if(data.permutationBeingPlaced.type.id !== "minecraft:water"){
            resetPassword(data.block);
            if(data.block.above(1)) resetPassword(/**@type {Block}*/ (data.block.above(1)));
        }
    }
);