﻿//@ts-check
import { system, world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function dayInit(){}

registerCommand({
    names: ["d", "sj", "day", "time"],
    description: "显示时间量。",
    args: [],
    callback: (_name, player)=>{
        system.runTimeout(()=>{
            player.sendMessage(getTimeString(world.getAbsoluteTime(), "世界"));
            player.sendMessage(getTimeString(system.currentTick, "服务器"));
        }, Math.random() * 3);
        return true;
    }
});

/**通过刻数获取时间描述字符串。
 * @param {number} tick
 * @param {string} desc 时间描述
 * @returns {string}
 */
function getTimeString(tick, desc){
    const
        century = Math.floor(tick / 172800000),
        year = Math.floor((tick - century * 172800000) / 1728000),
        day = Math.floor((tick - century * 172800000 - year * 1728000) / 24000),
        minute = Math.floor((tick - century * 172800000 - year * 1728000 - day * 24000) / 1200),
        second = Math.floor((tick - century * 172800000 - year * 1728000 - day * 24000 - minute * 1200) / 20),
        millisecond = tick - century * 172800000 - year * 1728000 - day * 24000 - minute * 1200 - second * 20;
    return `§e${desc}时间：${!century ? "" : century}${year < 10 ? !year ? "0" : `0${year}` : year}年${day}日${minute}分${second}秒.${!millisecond ? "00" : millisecond === 1 ? "05" : millisecond * 5} （${tick}刻）`;
}