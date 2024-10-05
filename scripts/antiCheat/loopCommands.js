import { Dimension, EntityComponentTypes, EntityInventoryComponent, GameMode, PlayerCursorInventoryComponent, system, world } from "@minecraft/server";
import { ban } from "./ban";
import { dimensionIds, retrieveDimension } from "../common";

export function loopCommandsInit(){}

const
    o = retrieveDimension("o"),
    n = retrieveDimension("n"),
    e = retrieveDimension("e"),
    wind = "minecraft:wind_charge_projectile",
    bWind = "minecraft:breeze_wind_charge_projectile";

system.runInterval(()=>{
    capY320(o, wind);
    capY320(n, wind);
    capY320(e, wind);
    capY320(o, bWind);
    capY320(n, bWind);
    capY320(e, bWind);
}, 80);

system.runInterval(()=>{
    const
        csPlayers = world.getPlayers({excludeGameModes: [GameMode.survival, GameMode.adventure]}),
        saPlayers = world.getPlayers({excludeGameModes: [GameMode.creative, GameMode.spectator]});
    for(let i = 0; i < csPlayers.length; i++) if(!csPlayers[i].hasTag("dev")) ban(csPlayers[i], 604800, `非法获得${csPlayers[i].getGameMode() === GameMode.creative ? "创造" : "旁观"}模式。`);
    for(let i = 0; i < saPlayers.length; i++){
        if(saPlayers[i] && saPlayers[i].isFlying) ban(csPlayers[i], 604800, `飞行。`);
    }
}, 4);

system.runInterval(()=>{
    remove(o, "minecraft:ender_dragon");
    remove(n, "minecraft:ender_dragon");
    remove(o, "minecraft:command_block_minecart");
    remove(n, "minecraft:command_block_minecart");
    remove(e, "minecraft:command_block_minecart");
    remove(o, "minecraft:npc");
    remove(n, "minecraft:npc");
    remove(e, "minecraft:npc");
    removeSurvival([
        "spawn_egg",
        "barrier",
        "command_block",
        "structure_block",
        "spawner",
        "invisible_bedrock",
    ], true);
}, 2);

/**删除y超过世界建筑限制的风弹。
 * @param {Dimension} dimension
 * @param {string} type
 */
function capY320(dimension, type){
    const entities = dimension.getEntities({type});
    for(let i = 0; i < entities.length; i++) if(entities[i].location.y >= 322) entities[i].remove();
}

/**删除违规实体。
 * @param {Dimension} dimension
 * @param {string} type
 */
function remove(dimension, type){
    const entities = dimension.getEntities({type});
    for(let i = 0; i < entities.length; i++){
        console.error(`Illegal entity ${type} found in ${dimension} ${entities[i].location.x.toFixed(1)} ${entities[i].location.y.toFixed(1)} ${entities[i].location.z.toFixed(1)}`);
        entities[i].remove();
    }
}

/**删除包含ID字符串的违规物品。
 * @param {string[]} ids
 * @param {boolean} banPlayer 是否封禁玩家，目前是一星期
 */
function removeSurvival(ids, banPlayer){
    const players = world.getPlayers({excludeGameModes: [GameMode.creative, GameMode.spectator]});
    for(let i = 0; i < players.length; i++){
        const
            inventory = /**@type {EntityInventoryComponent | undefined}*/ (players[i].getComponent(EntityComponentTypes.Inventory)),
            cursor = /**@type {PlayerCursorInventoryComponent | undefined}*/ (players[i].getComponent(EntityComponentTypes.CursorInventory));
        if(inventory && inventory.container){
            const container = inventory.container;
            for(let j = 0; j < container.size; j++) for(let k = 0; k < ids.length; k++){
                const item = container.getItem(j), cursorItem = cursor?.item;
                if(item){
                    if(item.typeId.includes(ids[k])){
                        container.setItem(j);
                        console.error(`Illegal item ${item.typeId.replace("minecraft:", "")} x${item.amount} found in ${players[i].name} at (${players[i].location.x.toFixed(1)},${players[i].location.y.toFixed(1)},${players[i].location.z.toFixed(1)})`);
                        if(banPlayer) ban(players[i], 604800, `持有违禁物品（${item.typeId.replace("minecraft:", "")}）。`);
                    }
                    if(item.getLore().includes("(+DATA)")){
                        container.setItem(j);
                        console.error(`NBT item ${item.typeId.replace("minecraft:", "")} x${item.amount} found in ${players[i].name} at (${players[i].location.x.toFixed(1)},${players[i].location.y.toFixed(1)},${players[i].location.z.toFixed(1)})`);
                        if(banPlayer) ban(players[i], 604800, `持有带NBT物品（${item.typeId.replace("minecraft:", "")}）。`);
                    }
                }
                if(cursorItem){
                    if(cursorItem.typeId.includes(ids[k])){
                        cursor.clear();
                        console.error(`Illegal item ${cursorItem.typeId.replace("minecraft:", "")} x${cursorItem.amount} found in ${players[i].name} at (${players[i].location.x.toFixed(1)},${players[i].location.y.toFixed(1)},${players[i].location.z.toFixed(1)})`);
                        if(banPlayer) ban(players[i], 604800, `持有违禁物品（${cursorItem.typeId.replace("minecraft:", "")}）。`);
                    }
                    if(cursorItem.getLore().includes("(+DATA)")){
                        cursor.clear();
                        console.error(`NBT item ${cursorItem.typeId.replace("minecraft:", "")} x${cursorItem.amount} found in ${players[i].name} at (${players[i].location.x.toFixed(1)},${players[i].location.y.toFixed(1)},${players[i].location.z.toFixed(1)})`);
                        if(banPlayer) ban(players[i], 604800, `持有带NBT物品（${cursorItem.typeId.replace("minecraft:", "")}）。`);
                    }
                }
                
            }
        }
    }
}