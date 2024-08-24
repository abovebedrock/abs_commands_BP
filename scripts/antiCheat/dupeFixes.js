//@ts-check
import { BlockPermutation, ItemStack, world } from "@minecraft/server";

export function dupeFixesInit(){}

/* https://www.youtube.com/watch?v=RvZIPzqoYbE
 * 封禁思路：禁止在末地y<=16的地方激活/取消激活活塞
 */
world.afterEvents.pistonActivate.subscribe(data=>{
    const methodName = "End Regen";
    if(data.dimension.id === "minecraft:the_end" && data.piston.block.location.y <= 16){
        const nearPlayers = data.dimension.getPlayers({
            location: data.piston.block.location,
            closest: 100,
            maxDistance: 8
        });
        for(let i = 0; i < nearPlayers.length; i++) nearPlayers[i].sendMessage("§c§l禁止在末地y值较低处使用活塞！");
        console.warn(`${nearPlayers.map(value=>value.name).join(",")} tried dupe: ${methodName} `);
        const item = /**@type {ItemStack}*/ (data.piston.block.getItemStack(1));
        data.piston.block.setPermutation(BlockPermutation.resolve("minecraft:air"));
        data.dimension.spawnItem(item, {
            x: data.piston.block.location.x + 0.5,
            y: data.piston.block.location.y,
            z: data.piston.block.location.z + 0.5,
        });
    }
});