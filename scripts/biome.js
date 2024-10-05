import { registerCommand } from "./commandBase";
import { getBiome, getCoordinate } from "./common";

export function biomeInit(){}

registerCommand({
    names: ["b", "biome", "qx", "swqx"],
    description: "获得你现在所处位置的生物群系（可能不准确）。",
    document: "使用了寻找最近的生物群系接口，通过遍历所有可能的生物群系，并选取最小的距离作为返回值。由于Mojang的奇怪接口bug，可能存在垂直生物群系不准确（如在地下某生物群系时得到地上的生物群系）的问题。值得注意的是，在地面看到的地貌和此处的生物群系可能不同，这不是接口的不准确性，而是Minecraft生成地貌时并不会完全忠于生物群系，而是在边界处有相当的模糊处理。",
    args: [{
        name: "showID",
        optional: true,
        type: "boolean"
    }],
    callback: async (_name, player, args)=>{
        const [id, name] = await getBiome(player), [coord] = getCoordinate(player);
        player.sendMessage(`坐标 (${coord.x}, ${coord.y}, ${coord.z}) 处于 ${name === undefined ? "虚空" : name}${args.showID ? `(${id})` : ""} 生物群系。`);
        return true;
    }
});