import { world } from "@minecraft/server";
import { registerCommand } from "./commandBase";
import { dimensionLocalezhCN, getBiome } from "./common";
import { getCoordinate } from "./common";

export function coordinateInit(){}

registerCommand({
    names: ["c", "zb", "coord", "coordinate"],
    description: "快速向公屏发送自己的坐标，可以选择是否随附生物群系。",
    document: "该命令执行后会向所有玩家发送模拟执行者聊天消息的一条信息，内容为执行命令的玩家的维度（中文）和三个坐标值，与执行者屏幕坐标一致。可以用来快速发送自己的坐标，避免记忆坐标的麻烦。",
    args: [{
        name: "withBiome",
        optional: true,
        type: "boolean"
    }],
    callback: async (_name, player, args)=>{
        const [coord, dimension] = getCoordinate(player), biome = await getBiome(player), str = `<${player.name}> ${dimensionLocalezhCN.get(dimension.id)} ${coord.x} ${coord.y} ${coord.z}${args.withBiome ? ` (${biome[1]})` : ""}`;
        world.sendMessage(str);
        console.log(`[coord] ${str}`);
        return true;
    }
});