//@ts-check
import { EntityComponentTypes, EntityInventoryComponent, GameMode, system, world } from "@minecraft/server";

export function loopCommandsInit(){}

const o = "minecraft:overworld", n = "minecraft:nether", e = "minecraft:the_end", wind = "minecraft:wind_charge_projectile", bWind = "minecraft:breeze_wind_charge_projectile";

system.runInterval(()=>{
    capY320(o, wind);
    capY320(n, wind);
    capY320(e, wind);
    capY320(o, bWind);
    capY320(n, bWind);
    capY320(e, bWind);
}, 40);

system.runInterval(()=>{
    remove(o, "minecraft:ender_dragon");
    remove(n, "minecraft:ender_dragon");
    removeSurvival([
        "spawn_egg",
        "barrier",
        "command_block",
        "structure_block",
        "spawner",
        //"invisible_bedrock",
    ], true);
}, 2);

/**删除y超过世界建筑限制的风弹。
 * @param {string} dimension
 * @param {string} type
 */
function capY320(dimension, type){
    const entities = world.getDimension(dimension).getEntities({type});
    for(let i = 0; i < entities.length; i++) if(entities[i].location.y >= 322) entities[i].remove();
}

/**删除违规实体。
 * @param {string} dimension
 * @param {string} type
 */
function remove(dimension, type){
    const entities = world.getDimension(dimension).getEntities({type});
    for(let i = 0; i < entities.length; i++) entities[i].remove();
}

/**删除包含ID字符串的违规物品。
 * @param {string[]} ids
 * @param {boolean} warn 是否警告玩家
 */
function removeSurvival(ids, warn){
    const players = world.getPlayers({
        excludeGameModes: [GameMode.creative, GameMode.spectator]
    });
    for(let i = 0; i < players.length; i++){
        const
            inventory = /**@type {EntityInventoryComponent | undefined}*/ (players[i].getComponent(EntityComponentTypes.Inventory)),
            //@ts-ignore
            cursor = /**@type {PlayerCursorInventoryComponent | undefined}*/ (players[i].getComponent(EntityComponentTypes.CursorInventory));
        if(inventory && inventory.container){
            const container = inventory.container;
            for(let j = 0; j < container.size; j++) for(let k = 0; k < ids.length; k++){
                const item = container.getItem(j), cursorItem = cursor?.item;
                if(item && item.typeId.includes(ids[k])){
                    container.setItem(j);
                    console.error(`Illegal item ${item.typeId} x${item.amount} found in ${players[i].name} at (${players[i].location.x.toFixed(1)},${players[i].location.y.toFixed(1)},${players[i].location.z.toFixed(1)})`);
                    if(warn) players[i].sendMessage(`§c§l检测到违禁物品：${item.typeId.replace("minecraft:", "")}，已清除并上报！`);
                }
                if(cursorItem && cursorItem.typeId.includes(ids[k])){
                    cursor.clear();
                    console.error(`Illegal item ${cursorItem.typeId} x${cursorItem.amount} found in ${players[i].name} at (${players[i].location.x.toFixed(1)},${players[i].location.y.toFixed(1)},${players[i].location.z.toFixed(1)})`);
                    if(warn) players[i].sendMessage(`§c§l检测到违禁物品：${cursorItem.typeId.replace("minecraft:", "")}，已清除并上报！`);
                }
            }
        }
    }
}