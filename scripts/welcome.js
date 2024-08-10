//@ts-check
import { world, system } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function welcomeInit(){}

registerCommand({
    names: ["j", "join", "tips", "jointips"],
    description: "设置进入游戏时是否显示提示。",
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
        if(player.getDynamicProperty("disableWelcome") != true){
            player.sendMessage(`§6§l基岩之上服务器第八季`);
            player.sendMessage(`§b欢迎玩家${player.name}，输入.h查看命令帮助，输入.j false关闭进服提示。`);
        }
    }, 80);
});