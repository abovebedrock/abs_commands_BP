//@ts-check
import { Player, system, world } from "@minecraft/server";
import { registerCommand } from "./commandBase";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

export function fstInit(){}

const maxFsts = 6;

registerCommand({
    names: ["s", "cyy", "set", "szcyy", "setfst"],
    description: "打开常用语管理窗口。",
    args: [],
    callback: (_name, player)=>{
        player.sendMessage("窗口已打开，请关闭聊天栏查看。");
        system.run(()=>showMain(player));
        return true;
    }
});

/**进入常用语管理主窗口。
 * @param {Player} player
 */
function showMain(player){
    const mainForm = new ActionFormData().title("管理常用语");
    for(let i = 1; i <= maxFsts; i++){
        const data = player.getDynamicProperty(`cyy${i}`);
        if(data !== undefined) mainForm.button(`${i}：${data}`);
        else mainForm.button(`${i}<未设置>`);
    }
    mainForm.button("§6§l删除所有常用语", "textures/ui/icon_trash.png");
    mainForm.show(player).then(response=>{
        if(response.cancelationReason === FormCancelationReason.UserBusy) system.run(()=>showMain(player));
        else{

        }
    });
}

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
        if(index > maxFsts) player.sendMessage(`您最多有${maxFsts}条常用语！`);
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