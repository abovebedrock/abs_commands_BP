//@ts-check
import { EntityComponentTypes, EntityEquippableComponent, EquipmentSlot, GameMode, Player, system, world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function deathCoordsInit(){}

/**@type {Map<string, [string, import("@minecraft/server").Vector3>]}*/
const deadPlayerLocations = new Map();

registerCommand({
    names: ["trackme"],
    description: "手持追溯指针，执行本命令献祭它，即可在每次死亡后获得死亡坐标提示。",
    document: "如果玩家并没有获得该权限，命令将会扣除一个追溯指针，并给予玩家死亡后获得死亡坐标的权限（附加属性）；否则将报错并不扣除。仅生存和冒险模式下的玩家会实际被扣除物品。玩家获得该权限后，每次死亡重生后，将获得游戏向其单独发送的死亡坐标信息，与死亡时玩家屏幕显示的坐标一致。",
    args: [],
    callback: (_name, player)=>{
        if(player.getDynamicProperty("eligibleForDeathCoord") === true) player.sendMessage("§c你已经开启了死亡坐标提示功能，无需再次开启！");
        else{
            const hand = /**@type {EntityEquippableComponent}*/ (player.getComponent(EntityComponentTypes.Equippable)).getEquipmentSlot(EquipmentSlot.Mainhand), item = hand.getItem();
            if(item && item.typeId === "minecraft:recovery_compass"){
                player.sendMessage("§e成功开启死亡坐标提示。");
                player.setDynamicProperty("eligibleForDeathCoord", true);
                const gamemode = player.getGameMode();
                if(gamemode === GameMode.adventure || gamemode === GameMode.survival) system.run(()=>{
                    if(item.amount > 1){
                        const newItem = item.clone();
                        newItem.amount--;
                        hand.setItem(newItem);
                    }
                    else hand.setItem();
                });
            }
            else player.sendMessage("§c你并没有手持追溯指针！");
        }
        return true;
    }
});

world.afterEvents.entityDie.subscribe(data=>{
    if(data.deadEntity.typeId === "minecraft:player"){
        deadPlayerLocations.set(/**@type {Player}*/ (data.deadEntity).name, [data.deadEntity.dimension.id === "minecraft:overworld" ? "主世界" : data.deadEntity.dimension.id === "minecraft:nether" ? "下界" : "末地", data.deadEntity.location]);
        console.log(`${/**@type {Player}*/ (data.deadEntity).name} died at (${data.deadEntity.location.x.toFixed(0)}, ${data.deadEntity.location.y.toFixed(0)}, ${data.deadEntity.location.z.toFixed(0)}) from ${data.damageSource.cause}, ${data.damageSource.damagingEntity?.typeId}, ${data.damageSource.damagingProjectile?.typeId}`);
    }
});

world.afterEvents.playerSpawn.subscribe(data=>{
    if(!data.initialSpawn && data.player.getDynamicProperty("eligibleForDeathCoord") === true){
        const info = deadPlayerLocations.get(data.player.name);
        deadPlayerLocations.delete(data.player.name);
        if(info) data.player.sendMessage(`§4§l您死在了${info[0]}的(${Math.floor(info[1].x)}, ${Math.floor(info[1].y)}, ${Math.floor(info[1].z)})。`);
        else data.player.sendMessage("§e§l您死在了没有坐标的地方！");
    }
});