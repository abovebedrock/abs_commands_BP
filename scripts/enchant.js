import { registerCommand } from "./commandBase";

export function enchantInit(){}

const
    extraPrice = 5,
    a = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f"];

registerCommand({
    names: ["e", "fm", "ench", "enchant"],
    description: "【暂不开发】允许以超过铁砧上限的经验级代价附魔物品。",
    document: `付出额外的${extraPrice}级经验，绕过原版的铁砧39级“过于昂贵”限制，将魔咒添加到物品上。本命令一共需要执行三次才能完成。手持需要添加魔咒的物品执行第一次指令，将返回物品当前的操作次数；`,
    args: [],
    hidden: true,
    callback: (_name, player, args)=>{
        player.sendMessage("§c由于有Mojang计划废弃过于昂贵机制的消息，附魔功能暂时不开发。");
        return true;
    }
});