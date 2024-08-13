//@ts-check
import { Player, world } from "@minecraft/server";

export function deathCoordsInit(){}

/**@type {Map<string, import("@minecraft/server").Vector3>}*/
const deadPlayerLocations = new Map();

world.afterEvents.entityDie.subscribe(data=>{
    if(data.deadEntity.typeId === "minecraft:player"){
        deadPlayerLocations.set(/**@type {Player}*/ (data.deadEntity).name, data.deadEntity.location);
        console.log(`${/**@type {Player}*/ (data.deadEntity).name} died at (${data.deadEntity.location.x.toFixed(0)}, ${data.deadEntity.location.y.toFixed(0)}, ${data.deadEntity.location.z.toFixed(0)}) from ${data.damageSource.cause}, ${data.damageSource.damagingEntity?.typeId}, ${data.damageSource.damagingProjectile?.typeId}`);
    }
});

world.afterEvents.playerSpawn.subscribe(data=>{
    if(!data.initialSpawn){
        const location = deadPlayerLocations.get(data.player.name);
        deadPlayerLocations.delete(data.player.name);
        if(location) data.player.sendMessage(`§4§l您死在了(${location.x.toFixed(0)}, ${location.y.toFixed(0)}, ${location.z.toFixed(0)})。`);
        else data.player.sendMessage("§e§l您死在了没有坐标的地方！");
    }
});