import { registerCommand } from "./commandBase";

export function tridentInit(){}

const max = 128, defaultArg = 64;

registerCommand({
    names: ["tri", "trident"],
    description: "显示玩家附近所有的三叉戟实体坐标。",
    document: `用于检查并消除区块加载过多的问题，也可以用于标记某些地区或查找他人基地。最大距离参数的最小值为0，最大值为${max}。尝试以超范围的参数执行命令会被自动拉回到范围内。返回三叉戟的总数和它们的坐标，精确到小数点后一位。`,
    args: [{
        name: "maxDistance",
        optional: true,
        type: "number"
    }],
    callback: (_name, player, args)=>{
        let maxDistance = /**@type {number}*/ ("maxDistance" in args ? args.maxDistance : defaultArg);
        if(maxDistance > max) maxDistance = max;
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