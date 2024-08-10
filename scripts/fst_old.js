//@ts-check
import { world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function fstInit(){}

const max = 6;

registerCommand({
    names: ["s", "cyy", "set", "szcyy", "setfst"],
    description: "管理常用语。使用.s add添加或替换，.s list列出，.s remove删除，.s remove_all删除全部。",
    args: [
        {
            name: "operation",
            optional: false,
            type: "string"
        },
        {
            name: "number",
            optional: true,
            type: "number"
        },
        {
            name: "text",
            optional: true,
            type: "string"
        }
    ],
    callback: (_name, player, args)=>{
        /**@type {number}*/
        let index;
        switch(args.operation){
            case "add":
                if(args.number === undefined) player.sendMessage(`§c错误：未指定常用语。`);
                else if(args.text == undefined) player.sendMessage(`§c错误：未输入常用语。`);
                else{
                    index = Math.floor(/**@type {number}*/ (args.number));
                    if(index > max) player.sendMessage(`您最多设置${max}条常用语！`);
                    else if(index <= 0) player.sendMessage(`§c错误：${index}不是有效的正整数。`);
                    else{
                        const last = player.getDynamicProperty(`cyy${index}`);
                        if(last !== undefined) player.sendMessage(`已替代第${index}条常用语（${last}）。`);
                        else player.sendMessage(`已创建第${index}条常用语：${args.text}。`);
                        player.setDynamicProperty(`cyy${index}`, args.text);
                    }
                }
                break;
            case "remove":
                if(args.number === undefined) player.sendMessage(`§c错误：未指定常用语。`);
                else{
                    index = Math.floor(/**@type {number}*/ (args.number));
                    if(index > max) player.sendMessage(`您最多设置${max}条常用语！`);
                    else if(index <= 0) player.sendMessage(`§c错误：${index}不是有效的正整数。`);
                    else{
                        const fst = player.getDynamicProperty(`cyy${index}`);
                        if(fst !== undefined){
                            player.setDynamicProperty(`cyy${index}`, undefined);
                            player.sendMessage(`已删除第${index}条常用语（${fst}）`)
                        }
                        else player.sendMessage(`§c错误：未设置第${index}条常用语。`);
                    }
                }
                break;
            case "remove_all":
                for(let i = 0; i < max; i++) player.setDynamicProperty(`cyy${i}`, undefined);
                player.sendMessage("成功删除所有常用语。");
                break;
            case "list":
                player.sendMessage("§e设置的常用语：");
                for(let i = 1; i <= max; i++){
                    const fst = /**@type {string | undefined}*/ (player.getDynamicProperty(`cyy${i}`));
                    if(fst !== undefined) player.sendMessage(`第${i}条：${fst}`);
                    else player.sendMessage(`第${i}条：§7<未设置>`);
                }
                break;
            default:
                player.sendMessage(`§c未知操作：${args.operation}。请使用.s add添加或替换常用语，.s list列出常用语，.s remove删除常用语，.s remove_all删除所有常用语。`);
                break;
        }
        return true;
    }
});

registerCommand({
    names: ["a", "aaa", "send", "fscyy", "sendfst"],
    description: "发送常用语。",
    args: [{
        name: "number",
        optional: false,
        type: "number"
    }],
    callback: (_name, player, args)=>{
        const index = Math.floor(/**@type {number}*/ (args.number));
        if(index > max) player.sendMessage(`您最多有${max}条常用语！`);
        else if(index <= 0) player.sendMessage(`§c错误：${index}不是有效的正整数。`);
        else{
            const fst = player.getDynamicProperty(`cyy${index}`);
            if(fst !== undefined && fst !== ""){
                const str = `<${player.name}> ${fst}`;
                world.sendMessage(str);
                console.log(str);
            }
            else player.sendMessage(`§c未设置第${index}条常用语。`);
        }
        return true;
    }
});