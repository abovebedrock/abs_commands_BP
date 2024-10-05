import { Block, Dimension, Player, system, world } from "@minecraft/server";
import { decide, randomInt } from "../utils/random";
import { boxList, getManhattanDistance, getPassword, getPlayerHeight, is2BDoor, isFenceGate, isTrapdoor, radiusList, resetPassword, setPassword } from "../common";

export function doorLockInit(){}

//#region 类型定义
/**0 西 1 北 2 东 3 南
 * @typedef {0 | 1 | 2 | 3} FourDirection*/

/**0 南北 1 西东
 * @typedef {0 | 1} TwoDirection*/
//#endregion

//#region 工具方法
/**基于门的开闭、门轴方向，获得门的实际面向方向（门在方块内偏向的方向）。
 * @param {Block} upperBlock
 * @returns {FourDirection}
 */
function get2BDirection(upperBlock){
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

/**获得栅栏门的实际面向方位。
 * @param {Block} block
 * @returns {TwoDirection}
 */
function getFGDirection(block){
    //真的有病，这个FourDirection和门的还不一样，0南1西2北3东
    const nbDirection = /**@type {0 | 1 | 2 | 3}*/ (block.permutation.getState("direction"));
    switch(nbDirection){
        case 0: case 2: return 0;
        case 1: case 3: return 1;
    }
}

/**获得活板门的轴在方块内的相对方位，即其竖直时的方块相对方位。
 * @param {Block} block
 * @returns {FourDirection}
 */
function getTDDirection(block){
    //真的有病，这个FourDirection也跟门的不一样，0东1西2南3北
    const nbDirection = /**@type {0 | 1 | 2 | 3}*/ (block.permutation.getState("direction"));
    switch(nbDirection){
        case 0: return 0;
        case 1: return 2;
        case 2: return 1;
        case 3: return 3;
    }
}

/**获取所有门的碰撞箱中心坐标。
 * @param {Block} upperBlock 如果不是2B门就你懂的，这个玩意是提示你2B门要传上面半边
 * @returns {import("@minecraft/server").Vector3}
 */
function getGeometryCenter(upperBlock){
    const {location} = upperBlock;
    if(is2BDoor(upperBlock)){
        const direction = get2BDirection(upperBlock);
        switch(direction){
            case 0: return {
                x: location.x + boxList.door.front,
                y: location.y,
                z: location.z + boxList.door.side
            };
            case 1: return {
                x: location.x + boxList.door.side,
                y: location.y,
                z: location.z + boxList.door.front
            };
            case 2: return {
                x: location.x + 1 - boxList.door.front,
                y: location.y,
                z: location.z + boxList.door.side
            };
            case 3: return {
                x: location.x + boxList.door.side,
                y: location.y,
                z: location.z + 1 - boxList.door.front
            };
        }
    }
    else if(isFenceGate(upperBlock)) return {
        x: location.x + boxList.door.side,
        y: location.y + boxList.fenceGate.height,
        z: location.z + boxList.door.side
    };
    else if(isTrapdoor(upperBlock)){
        const directon = getTDDirection(upperBlock);
        if(/**@type {boolean}*/ !(upperBlock.permutation.getState("open_bit"))){
            if(/**@type {boolean}*/ (upperBlock.permutation.getState("upside_down_bit"))) return {
                x: location.x + boxList.door.side,
                y: location.y + 1 - boxList.door.front,
                z: location.z + boxList.door.side
            };
            else return {
                x: location.x + boxList.door.side,
                y: location.y + boxList.door.front,
                z: location.z + boxList.door.side
            };
        }
        else switch(directon){
            case 0: return {
                x: location.x + boxList.door.front,
                y: location.y + boxList.trapdoor.height,
                z: location.z + boxList.door.side
            };
            case 1: return {
                x: location.x + boxList.door.side,
                y: location.y + boxList.trapdoor.height,
                z: location.z + boxList.door.front
            };
            case 2: return {
                x: location.x + 1 - boxList.door.front,
                y: location.y + boxList.trapdoor.height,
                z: location.z + boxList.door.side
            };
            case 3: return {
                x: location.x + boxList.door.side,
                y: location.y + boxList.trapdoor.height,
                z: location.z + 1 - boxList.door.front
            };
        }
    }
    else{
        console.error(`GetGeometryCenter get block ${upperBlock.typeId}!`);
        world.sendMessage("§e666又有bug了，赶紧的找开发者！");
    }
}

/**检测某门是否与玩家“碰撞”。为了对抗JS number精度，实际上玩家与门距离小于0.00001也会被判断为碰撞。
 * @param {Block} upperBlock 如果不是2B门就你懂的，这个玩意是提示你2B门要传上面半边
 * @param {Player} player
 * @param {import("@minecraft/server").Vector3 | undefined} [cachedCenter] 用于缓存几何中心，防止多次调用
 * @param {number | undefined} [cachedHeight] 用于缓存玩家高度，防止在一次检测中多次调用
 * @returns {boolean}
 */
function collidesWithPlayer(upperBlock, player, cachedCenter, cachedHeight){
    const
        playerHeight = getPlayerHeight(player),
        manhattan = getManhattanDistance(cachedCenter ?? getGeometryCenter(upperBlock), {
            x: player.location.x,
            y: player.location.y + playerHeight / 2,
            z: player.location.z
        });
    //world.sendMessage(`${manhattan.x} ${manhattan.y} ${manhattan.z}`);
    /**0 西 1 北 2 东 3 南 FourDirection*/
    if(is2BDoor(upperBlock)){
        const direction = get2BDirection(upperBlock);
        switch(direction){
            case 0: case 2: return (
                manhattan.x < radiusList.door.front + radiusList.player.horizontal
             && manhattan.y < radiusList.door.height + playerHeight
             && manhattan.z < radiusList.door.side + radiusList.player.horizontal
            );
            case 1: case 3: return (
                manhattan.x < radiusList.door.side + radiusList.player.horizontal
             && manhattan.y < radiusList.door.height + playerHeight
             && manhattan.z < radiusList.door.front + radiusList.player.horizontal
            );
        }
    }
    else if(isFenceGate(upperBlock)){
        const direction = getFGDirection(upperBlock);
        switch(direction){
            case 0: return (
                manhattan.x < radiusList.door.side + radiusList.player.horizontal
             && manhattan.y < radiusList.fenceGate.height + playerHeight
             && manhattan.z < radiusList.fenceGate.front + radiusList.player.horizontal
            );
            case 1: return (
                manhattan.x < radiusList.fenceGate.front + radiusList.player.horizontal
             && manhattan.y < radiusList.fenceGate.height + playerHeight
             && manhattan.z < radiusList.door.side + radiusList.player.horizontal
            );
        }
    }
    else if(isTrapdoor(upperBlock)){
        const direction = getTDDirection(upperBlock);
        if(/**@type {boolean}*/ !(upperBlock.permutation.getState("open_bit"))) return (
            manhattan.x < radiusList.door.side + radiusList.player.horizontal
         && manhattan.y < radiusList.door.front + playerHeight
         && manhattan.z < radiusList.door.side + radiusList.player.horizontal
        );
        else switch(direction){
            case 0: case 2: return (
                manhattan.x < radiusList.door.front + radiusList.player.horizontal
             && manhattan.y < radiusList.trapdoor.height + playerHeight
             && manhattan.z < radiusList.door.side + radiusList.player.horizontal
            );
            case 1: case 3: return (
                manhattan.x < radiusList.door.side + radiusList.player.horizontal
             && manhattan.y < radiusList.trapdoor.height + playerHeight
             && manhattan.z < radiusList.door.front + radiusList.player.horizontal
            );
        }
    }
    else{
        console.error(`CollideWithPlayer get block ${upperBlock.typeId}!`);
        world.sendMessage("§e666又有bug了，赶紧的找开发者！");
    }
}

/**获取2B门把手中心位置。
 * @param {Block} upperBlock
 * @returns {import("@minecraft/server").Vector3}
 */
function getKnobLocation(upperBlock){
    const
        direction = get2BDirection(upperBlock),
        //从外面（方块边界面）看去，门的把手是否在左边。
        isLeft = /**@type {boolean}*/ (upperBlock.permutation.getState("door_hinge_bit")) !== /**@type {boolean}*/ (upperBlock.below(1).permutation.getState("open_bit"));
    switch(direction){
        case 0:
            if(isLeft) return {
                x: upperBlock.location.x + boxList.door.front,
                y: upperBlock.location.y,
                z: upperBlock.location.z + boxList.door.deltaKnob
            };
            else return {
                x: upperBlock.location.x + boxList.door.front,
                y: upperBlock.location.y,
                z: upperBlock.location.z + 1 - boxList.door.deltaKnob
            };
        case 1:
            if(isLeft) return {
                x: upperBlock.location.x + 1 - boxList.door.deltaKnob,
                y: upperBlock.location.y,
                z: upperBlock.location.z + boxList.door.front
            };
            else return {
                x: upperBlock.location.x + boxList.door.deltaKnob,
                y: upperBlock.location.y,
                z: upperBlock.location.z + boxList.door.front
            };
        case 2:
            if(isLeft) return {
                x: upperBlock.location.x + 1 - boxList.door.front,
                y: upperBlock.location.y,
                z: upperBlock.location.z + 1 - boxList.door.deltaKnob
            };
            else return {
                x: upperBlock.location.x + 1 - boxList.door.front,
                y: upperBlock.location.y,
                z: upperBlock.location.z + boxList.door.deltaKnob
            };
        case 3:
            if(isLeft) return {
                x: upperBlock.location.x + boxList.door.deltaKnob,
                y: upperBlock.location.y,
                z: upperBlock.location.z + 1 - boxList.door.front
            };
            else return {
                x: upperBlock.location.x + 1 - boxList.door.deltaKnob,
                y: upperBlock.location.y,
                z: upperBlock.location.z + 1 - boxList.door.front
            };
    }
}

/**如果有配对的双2B门，则返回上门方块，否则返回`undefined`。允许不同种的2B门配对。
 * @param {Block} upperBlock
 * @returns {Block | undefined}
 */
function getDouble2B(upperBlock){
    const
        actualDirection = get2BDirection(upperBlock),
        hingeBit = /**@type {boolean}*/ (upperBlock.permutation.getState("door_hinge_bit")),
        openBit = /**@type {boolean}*/ (upperBlock.below(1).permutation.getState("open_bit")),
        blockToCheck = (()=>{
            switch(actualDirection){
                case 0:
                    if(hingeBit){
                        if(openBit) return upperBlock.south(1);
                        else return upperBlock.north(1);
                    }
                    else{
                        if(openBit) return upperBlock.north(1);
                        else return upperBlock.south(1);
                    }
                case 1:
                    if(hingeBit){
                        if(openBit) return upperBlock.west(1);
                        else return upperBlock.east(1);
                    }
                    else{
                        if(openBit) return upperBlock.east(1);
                        else return upperBlock.west(1);
                    }
                case 2:
                    if(hingeBit){
                        if(openBit) return upperBlock.north(1);
                        else return upperBlock.south(1);
                    }
                    else{
                        if(openBit) return upperBlock.south(1);
                        else return upperBlock.north(1);
                    }
                case 3:
                    if(hingeBit){
                        if(openBit) return upperBlock.east(1);
                        else return upperBlock.west(1);
                    }
                    else{
                        if(openBit) return upperBlock.west(1);
                        else return upperBlock.east(1);
                    }
            }
        })();
    if(blockToCheck && is2BDoor(blockToCheck) && get2BDirection(blockToCheck) === actualDirection && (blockToCheck.permutation.getState("door_hinge_bit") !== hingeBit || /**@type {Block}*/ (blockToCheck.below(1)).permutation.getState("open_bit") !== openBit)) return blockToCheck;
}
//#endregion

//#region 主方法
const offsetSmoke = {x: 10, y: 5, z: 10}, offsetGreen = {x: 15, y: 8, z: 15};

world.beforeEvents.playerInteractWithBlock.subscribe(data=>{
    const
        {block: block_, player, itemStack: item} = data,
        is2B = is2BDoor(block_),
        isFG = isFenceGate(block_),
        isTD = isTrapdoor(block_);
    if(is2B || isFG || isTD){
        const
            hideSuccess = player.getDynamicProperty("hideSuccess"),
            hideFailure = player.getDynamicProperty("hideFailure"),
            block = is2B && /**@type {boolean}*/ !(block_.permutation.getState("upper_block_bit")) ? block_.above(1) : block_,
            password = getPassword(block, false, true),
            opassword = getPassword(block, true, true);
        if(password || opassword){
            if(!item
             || (
                    (item.typeId !== "minecraft:trial_key" || password !== item.nameTag)
                 && (item.typeId !== "minecraft:ominous_trial_key" || opassword !== item.nameTag)
                )
            ){
                data.cancel = true;
                cancelPlayerMove(block);
                if(!hideFailure){
                    if(decide(0.995)) player.sendMessage("§c门已上锁，请用正确的（不祥）试炼钥匙解锁！");
                    else player.sendMessage("§c门不能从这一侧打开 ：）");
                }
                system.run(()=>{
                    makeSound("vault.insert_item_fail", block, 1.0, randomInt(8, 11) / 10);
                    if(is2B) emitParticles("minecraft:basic_smoke_particle", getKnobLocation(block), block.dimension, offsetSmoke, offsetSmoke, 8, 16);
                    else emitParticles("minecraft:basic_smoke_particle", getGeometryCenter(block), block.dimension, offsetSmoke, offsetSmoke, 8, 16);
                });
            }
            else{
                if(!hideSuccess) player.sendMessage("§e门锁已打开。");
                resetPassword(block, true);
                if(is2B){
                    const theOther2BDoor = getDouble2B(block);
                    if(theOther2BDoor){
                        resetPassword(theOther2BDoor, true);
                        const otherLowerBlock = /**@type {Block}*/ (theOther2BDoor.below(1));
                        system.run(()=>otherLowerBlock.setPermutation(otherLowerBlock.permutation.withState("open_bit", /**@type {boolean}*/ !(otherLowerBlock.permutation.getState("open_bit")))));
                    }
                }
            }
        }
        else if(item
         && (item.typeId === "minecraft:trial_key" || item.typeId === "minecraft:ominous_trial_key")
         && item.nameTag
         && (!isFG || /**@type {boolean}*/ !(block.permutation.getState("open_bit")))
        ){
            data.cancel = true;
            const isOminous = item.typeId === "minecraft:ominous_trial_key";
            setPassword(block, item.nameTag, isOminous, true);
            if(is2B){
                const theOther2BDoor = getDouble2B(block);
                if(theOther2BDoor) setPassword(theOther2BDoor, item.nameTag, isOminous, true);
            }
            if(!hideSuccess) player.sendMessage("§e门已上锁。");
            system.run(()=>{
                makeSound("vault.insert_item", block, 1.0, randomInt(8, 11) / 10);
                if(is2B) emitParticles("minecraft:villager_happy", getKnobLocation(block), block.dimension, offsetGreen, offsetGreen, 6, 12);
                else emitParticles("minecraft:villager_happy", getGeometryCenter(block), block.dimension, offsetGreen, offsetGreen, 6, 12);
            });
        }
    }
});
//#endregion

//#region 粒子和声音
/**统一粒子释放方法。
 * @param {string} id 粒子ID。
 * @param {import("@minecraft/server").Vector3} location 中心位置。
 * @param {Dimension} dimension 维度。
 * @param {import("@minecraft/server").Vector3} offsetNeg 负方向概率盒，乘以100，**不用负数！**
 * @param {import("@minecraft/server").Vector3} offsetPos 正方向概率盒，乘以100。
 * @param {number} min 最小数量。
 * @param {number} max 最大数量。
 */
function emitParticles(id, location, dimension, offsetNeg, offsetPos, min, max){
    const count = randomInt(min, max);
    for(let i = 0; i < count; i++) dimension.spawnParticle(id, {
        x: location.x + randomInt(-offsetNeg.x, offsetPos.x) / 100,
        y: location.y + randomInt(-offsetNeg.y, offsetPos.y) / 100,
        z: location.z + randomInt(-offsetNeg.z, offsetPos.z) / 100
    });
}

/**统一声音播放方法。
 * @param {string} id 声音ID。
 * @param {Block} block 方块，会在坐标中心播放声音。
 * @param {number} volume 音量，不提供内置随机，反正就一次。
 * @param {number} pitch 音高，不提供内置随机，反正就一次！
 */
function makeSound(id, block, volume, pitch){
    block.dimension.playSound(id, {x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5}, {volume, pitch});
}
//#endregion

//#region 拉回
const maxCheckTimes = 5, maxTDHitTimes = 3;

/**碰撞箱检测拉回玩家。
 * @param {Block} upperBlock
 */
function cancelPlayerMove(upperBlock){
    let checkedTimes = 0, TDhitTimes = maxTDHitTimes;
    const
        geoMetryCenter = getGeometryCenter(upperBlock),
        players = upperBlock.dimension.getPlayers({
            location: upperBlock.location,
            maxDistance: 3
        }),
        isTD = isTrapdoor(upperBlock),
        originalHeights = new Map(players.map(value=>[value, getPlayerHeight(value)])),
        originalLocations = new Map(players.map(value=>[value, value.location]));
    for(let i = 0; i < players.length; i++) system.run(()=>checkPlayer(players[i]));
    /**@param {Player} player*/
    function checkPlayer(player){
        if(checkedTimes < maxCheckTimes){
            //world.sendMessage("check");
            checkedTimes++;
            const velocity = player.getVelocity(), playerHeight = getPlayerHeight(player);
            //world.sendMessage(`${playerHeight} ${originalHeights.get(player)}`);
            //world.sendMessage(`${player.location.x} ${player.location.y} ${player.location.z}`);
            if(isTD && playerHeight !== originalHeights.get(player)){
                //world.sendMessage("tp1");
                player.teleport(originalLocations.get(player));
                TDhitTimes--;
                if(TDhitTimes > 0) system.run(()=>checkPlayer(player));
            }
            else if((velocity.x === 0 || velocity.y === 0 || velocity.z === 0) && collidesWithPlayer(upperBlock, player, geoMetryCenter, playerHeight)){
                //world.sendMessage("tp2");
                player.teleport(player.location);
                if(isTD){
                    TDhitTimes--;
                    if(TDhitTimes > 0) system.run(()=>checkPlayer(player));
                }
            }
            else system.run(()=>checkPlayer(player));
        }
    }
}
//#endregion

//#region 其他事件处理
//处理玩家放置2B门形成双2B门，给放置的门也上锁
world.afterEvents.playerPlaceBlock.subscribe(data=>{
    if(is2BDoor(data.block)){
        const
            upperBlock = /**@type {Block}*/ (/**@type {boolean}*/ (data.block.permutation.getState("upper_block_bit")) ? data.block : data.block.above(1)),
            theOtherDoor = getDouble2B(upperBlock);
        if(theOtherDoor){
            const
                password = getPassword(theOtherDoor, false, true),
                opassword = getPassword(theOtherDoor, true, true);
            if(password) setPassword(upperBlock, password, false, true);
            else if(opassword) setPassword(upperBlock, opassword, true, true);
        }
    }
});

//当双2B门的一个门已锁，另一个门被交互到双2B门一起的状态时，给另一个2B门也上锁，与现实中的双开门锁门操作十分相似
world.afterEvents.playerInteractWithBlock.subscribe(data=>{
    if(is2BDoor(data.block)){
        const
            upperBlock = /**@type {Block}*/ (data.block.permutation.getState("upper_block_bit") ? data.block : data.block.above(1)),
            theOtherDoor = getDouble2B(upperBlock);
        if(!getPassword(upperBlock, false, true) && !getPassword(upperBlock, true, true) && theOtherDoor){
            const
                password = getPassword(theOtherDoor, false, true),
                opassword = getPassword(theOtherDoor, true, true);
            if(password) setPassword(upperBlock, password, false, true);
            else if(opassword) setPassword(upperBlock, opassword, true, true);
        }
    }
});

//处理爆炸炸毁/改变状态的所有门。
world.beforeEvents.explosion.subscribe(data=>{
    //风弹就是需要破锁，刚好它被认为是可以“影响”东西的爆炸，那就不需要判定
    //但是基于设计，风弹是“暴力”破锁，风爆重锤锤击不是“暴力”，目前的判定法是存在data.source，可能有bug！
    //9.28 note: 如果栅栏门被吹开，那么就只能解锁，因为栅栏门设计的是开启的时候不能被锁
    const blocks = data.getImpactedBlocks();
    for(let i = 0; i < blocks.length; i++){
        const is2B = is2BDoor(blocks[i]), isFG = isFenceGate(blocks[i]), isTD = isTrapdoor(blocks[i]);
        if(
            (is2B || isFG || isTD) && data.source
         || (isFG && /**@type {boolean}*/ !(blocks[i].permutation.getState("open_bit")))
        ){
            resetPassword(blocks[i], true);
            if(is2B && /**@type {boolean}*/ !(blocks[i].permutation.getState("upper_block_bit"))) resetPassword(/**@type {Block}*/ (blocks[i].above(1)), true);
        }
    }
});

//处理破坏的所有门。
world.beforeEvents.playerBreakBlock.subscribe(data=>{
    if(is2BDoor(data.block) && /**@type {boolean}*/ !(data.block.permutation.getState("upper_block_bit"))) resetPassword(data.block.above(1), true);
    else resetPassword(data.block, true);
});

//保底方法，在玩家放置方块的时候重置密码！
world.beforeEvents.playerPlaceBlock.subscribe(data=>{
    if(data.permutationBeingPlaced.type.id !== "minecraft:water"){
        resetPassword(data.block, true);
        //保底重置2B门的密码。2B门不在下面存储密码，并且可以保证放置2B门时，一定是先放置下半方块，所以直接取上面。
        if(is2BDoor(data.permutationBeingPlaced.type.id)) resetPassword(/**@type {Block}*/ (data.block.above(1)), true);
    }
});
//#endregion