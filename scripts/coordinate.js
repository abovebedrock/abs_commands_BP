//@ts-check
import { world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function coordinateInit(){}

registerCommand({
    names: ["c", "coord", "coordinate"],
    description: "快速向公屏发送自己的坐标。",
    args: [],
    callback: (_name, player)=>{
        world.sendMessage(`<${player.name}> ${player.dimension.id === "minecraft:overworld" ? "主世界" : player.dimension.id === "minecraft:nether" ? "下界" : "末地"} ${player.location.x.toFixed(0)} ${player.location.y.toFixed(0)} ${player.location.z.toFixed(0)}`);
        return true;
    }
});