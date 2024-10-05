import { prefixs, registerCommand } from "./commandBase";
import { undergroundData, statusTypes } from "./undergroundData";

export function undergroundInit(){}

registerCommand({
    names: ["u", "dt", "metro", "underground"],
    description: "查询地铁线路。",
    document: "§l注意：本命令的信息优先级高于游戏内告示牌。§r§f本命令只支持一个可选参数，当输入有效线路数字时，将返回线路示意图和各站基础信息；当输入有效站名时，将返回该站的详细信息，包括建设状态、线路、各下一站信息、坐标等；当输入无效字符或不提供参数时，将返回基于线路的所有线路和站点信息。",
    args: [{
        name: "lineOrStation",
        optional: true,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const str = /**@type {string | undefined}*/ (args.lineOrStation);
        if(str === undefined){
            player.sendMessage(`\n§l——显示全部线路——`);
            for(let i = 0; i < undergroundData.lines.length; i++){
                if(undergroundData.lines[i].length === 0) player.sendMessage(`${i + 1}号线： 未规划`);
                else{
                    let str = `§${undergroundData.lineColors[i]}${i + 1}号线： §f`;
                    for(let j = 0; j < undergroundData.lines[i].length; j++){
                        const
                            id = undergroundData.lines[i][j],
                            data = undergroundData.stations[Math.abs(id) - 1],
                            status = /**@type {string}*/ (id < 0 ? data.netherStatus : data.status);
                        str += `${id < 0 ? "§c" : ""}${data.interchange ? "§l" : ""}${status === statusTypes.operational ? "" : "("}${data.name}${status === statusTypes.operational ? "" : ")"}${data.interchange ? "§r" : ""}${id < 0 ? "§f" : ""}${j < undergroundData.lines[i].length - 1 ? `§${undergroundData.lineColors[i]}——§f` : ""}`;
                    }
                    player.sendMessage(str);
                }
            }
            if(undergroundData.additionalInfo !== "") player.sendMessage(`注：${undergroundData.additionalInfo}`);
            player.sendMessage(`线路颜色为其代表颜色，§l加粗§r§f的站点为换乘站（包括跨维度换乘），§c红色§f的站点为下界站，括号内的站点为未开通站。未开通站的站名可能在以后发生更改。了解详细站点信息，请输入${prefixs[0]}u <站名>；了解详细线路信息，请输入${prefixs[0]}u <线路编号>。`);
            player.sendMessage(`数据更新时间： ${undergroundData.updateTime}`);
        }
        else if(/^-?(?:(?:[1-9]\d*)|[0])$/.test(str)){
            const number = parseInt(str);
            if(number > undergroundData.lines.length || number <= 0) player.sendMessage(`§c错误：输入的线路${number}不存在。`);
            else{
                if(undergroundData.lines[number - 1].length === 0) player.sendMessage(`${number}号线未规划。`);
                else{
                    player.sendMessage(`\n§${undergroundData.lineColors[number - 1]}————${number}号线————`);
                    let str = "";
                    for(let i = 0; i < undergroundData.lines[number - 1].length; i++){
                        const
                            id = undergroundData.lines[number - 1][i],
                            data = undergroundData.stations[Math.abs(id) - 1],
                            status = /**@type {string}*/ (id < 0 ? data.netherStatus : data.status);
                        str += `${id < 0 ? "§c" : ""}${data.interchange ? "§l" : ""}${status === statusTypes.operational ? "" : "("}${data.name}${status === statusTypes.operational ? "" : ")"}${data.interchange ? "§r" : ""}${id < 0 ? "§f" : ""}${i < undergroundData.lines[number - 1].length - 1 ? `§${undergroundData.lineColors[number - 1]}——§f` : ""}`;
                    }
                    player.sendMessage(str);
                    if(undergroundData.additionalInfo !== "") player.sendMessage(`注：${undergroundData.additionalInfo}`);
                    player.sendMessage(`线路颜色为其代表颜色，§l加粗§r§f的站点为换乘站（包括跨维度换乘），§c红色§f的站点为下界站，括号内的站点为未开通站。未开通站的站名可能在以后发生更改。了解详细站点信息，请输入${prefixs[0]}u <站名>；了解详细线路信息，请输入${prefixs[0]}u <线路编号>。`);
                    player.sendMessage(`数据更新时间： ${undergroundData.updateTime}`);
                }
            }
        }
        else{
            for(let i = 0; i < undergroundData.stations.length; i++){
                if(undergroundData.stations[i].name === str){
                    const data = undergroundData.stations[i];
                    player.sendMessage(`\n————${data.name}站————`);
                    for(let j = 0; j < undergroundData.lines.length; j++) for(let k = 0; k < undergroundData.lines[j].length; k++) if(Math.abs(undergroundData.lines[j][k]) === i + 1){
                        player.sendMessage(`§${undergroundData.lineColors[j]}${j + 1}-${k + 1 >= 10 ? "" : "0"}${k + 1}`);
                        player.sendMessage(`往${undergroundData.stations[Math.abs(undergroundData.lines[j][0]) - 1].name}方向： ${k === 0 ? "——终点站——" : `下一站 ${undergroundData.stations[Math.abs(undergroundData.lines[j][k - 1]) - 1].name}${getInterchangeString(Math.abs(undergroundData.lines[j][k - 1]), j)}`}`);
                        player.sendMessage(`往${undergroundData.stations[Math.abs(undergroundData.lines[j][undergroundData.lines[j].length - 1]) - 1].name}方向： ${k === undergroundData.lines[j].length - 1 ? "——终点站——" : `下一站 ${undergroundData.stations[Math.abs(undergroundData.lines[j][k + 1]) - 1].name}${getInterchangeString(Math.abs(undergroundData.lines[j][k + 1]), j)}`}`);
                    }
                    player.sendMessage("\n");
                    if(data.status) player.sendMessage(`主世界站：${data.status}${data.status === statusTypes.operational ? `  坐标： (${data.coordinate?.x},${data.coordinate?.y},${data.coordinate?.z})`: ""}`);
                    else player.sendMessage("本站无主世界站");
                    if(data.netherStatus) player.sendMessage(`下界站：${data.netherStatus}${data.netherStatus === statusTypes.operational ? `  坐标： (${data.netherCoordinate?.x},${data.netherCoordinate?.y},${data.netherCoordinate?.z})`: ""}`);
                    else player.sendMessage("本站无下界站");
                    player.sendMessage(`\n了解详细站点信息，请输入${prefixs[0]}u <站名>；了解详细线路信息，请输入${prefixs[0]}u <线路编号>。`);
                    return true;
                }
            }
            player.sendMessage(`§c错误：“${str}”站不存在，请检查输入。`);
        }
        return true;
    }
});

/**
 * @param {number} stationNumber 站的编号，以1开始。
 * @param {number} originLineId 查找的初始线路的线路ID。
 * @returns {string}
 */
function getInterchangeString(stationNumber, originLineId){
    if(!undergroundData.stations[stationNumber - 1].interchange) return "";
    else{
        let results = [];
        for(let i = 0; i < undergroundData.lines.length; i++) if(i !== originLineId) for(let j = 0; j < undergroundData.lines[i].length; j++) if(Math.abs(undergroundData.lines[i][j]) === stationNumber) results.push(`§${undergroundData.lineColors[i]}${i + 1}号线§f`);
        return `  可换乘${results.join("，")}`;
    }
}