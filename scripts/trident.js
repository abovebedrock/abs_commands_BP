//@ts-check
import { registerCommand } from "./commandBase";

export function tridentInit(){}

registerCommand({
    names: ["tri", "trident"],
    description: "显示玩家附近所有的三叉戟实体坐标。",
    args: [{
        name: "maxDistance",
        optional: true,
        type: "number"
    }],
    callback: (_name, player, args)=>{
        let maxDistance = /**@type {number}*/ ("maxDistance" in args ? args.maxDistance : 128);
        if(maxDistance > 192) maxDistance = 192;
        if(maxDistance < 0) maxDistance = 0;
        const tridents = player.dimension.getEntities({
            type: "minecraft:thrown_trident",
            location: player.location,
            maxDistance
        });
        if(!tridents.length) player.sendMessage(`在附近 ${maxDistance} 格未发现三叉戟。`);
        else{
            player.sendMessage(`§b在附近 ${maxDistance} 格发现 ${tridents.length} 个三叉戟：`)
            for(let i = 0; i < tridents.length; i++) player.sendMessage(`§${i % 2 ? "6" : "f"}${i + 1}： (${tridents[i].location.x.toFixed(1)}, ${tridents[i].location.y.toFixed(1)}, ${tridents[i].location.z.toFixed(1)})`);
        }
        return true;
    }
});