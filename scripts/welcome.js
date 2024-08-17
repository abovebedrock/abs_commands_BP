//@ts-check
import { world, system } from "@minecraft/server";
import { prefix, registerCommand } from "./commandBase";

export function welcomeInit(){}

registerCommand({
    names: ["j", "join", "tips", "jointips"],
    description: "设置进入游戏时是否显示提示。",
    document: `默认情况下为显示提示，有助于自定义命令引入初期让更多玩家了解到本插件。一旦感觉厌烦，可以输入${prefix}j false关闭提示。`,
    args: [{
        name: "show",
        optional: false,
        type: "boolean"
    }],
    callback: (_name, player, args)=>{
        player.setDynamicProperty("disableWelcome", !args.show);
        player.sendMessage(`成功${args.show ? "开启" : "关闭"}进服提示。`);
        return true;
    }
});

world.afterEvents.playerSpawn.subscribe(data=>{
    if(data.initialSpawn) system.runTimeout(()=>{
        const player = world.getPlayers({name: data.player.name})[0];
        if(player.getDynamicProperty("disableWelcome") != true) player.sendMessage(`§6§l基岩之上服务器第八季\n§r§b欢迎玩家${player.name}，输入${prefix}h查看命令帮助，输入${prefix}j false关闭进服提示。`);
    }, 80);
});