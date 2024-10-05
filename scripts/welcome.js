import { world, system } from "@minecraft/server";
import { prefixs, registerCommand } from "./commandBase";
import { getPerformanceString } from "./performance";
import { meta } from "./common";

export function welcomeInit(){}

registerCommand({
    names: ["j", "join", "jointips"],
    description: "设置进入游戏时是否显示提示。",
    document: `默认情况下为显示提示，有助于自定义命令引入初期让更多玩家了解到本插件。一旦感觉厌烦，可以输入${prefixs[0]}j false关闭提示。`,
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
    const name = data.player.name;
    if(data.initialSpawn) system.runTimeout(async ()=>{
        const players = world.getAllPlayers(), performanceStr = await getPerformanceString("b");
        for(let i = 0; i < players.length; i++) if(players[i].name === name && players[i].getDynamicProperty("disableWelcome") !== true) players[i].sendMessage(`§6§l基岩之上服务器第${meta.season}季\n§r${performanceStr}\n§b欢迎玩家${name}，输入${prefixs[0]}h查看命令帮助，输入${prefixs[0]}j false关闭本进服提示。`);
    }, 60);
});