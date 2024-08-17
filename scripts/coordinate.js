//@ts-check
import { world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function coordinateInit(){}

registerCommand({
    names: ["c", "zb", "coord", "coordinate"],
    description: "快速向公屏发送自己的坐标。",
    document: "该命令执行后会向所有玩家发送模拟执行者聊天消息的一条信息，内容为执行命令的玩家的维度（中文）和三个坐标值，与执行者屏幕坐标一致。可以用来快速发送自己的坐标，避免记忆坐标的烦恼。",
    args: [],
    callback: (_name, player)=>{
        world.sendMessage(`<${player.name}> ${player.dimension.id === "minecraft:overworld" ? "主世界" : player.dimension.id === "minecraft:nether" ? "下界" : "末地"} ${Math.floor(player.location.x)} ${Math.floor(player.location.y)} ${Math.floor(player.location.z)}`);
        return true;
    }
});