//@ts-check
import { Player, system, world } from "@minecraft/server";
import { registerCommand } from "./commandBase";
import { ActionFormData, FormCancelationReason, MessageFormData, ModalFormData } from "@minecraft/server-ui";

export function fstInit(){}

const maxFsts = 6, maxLength = 20;

registerCommand({
    names: ["s", "cyy", "fst", "set", "szcyy", "setfst"],
    description: "打开常用语管理窗口。",
    args: [],
    callback: (_name, player)=>{
        player.sendMessage("常用语管理窗口已打开，请关闭聊天栏查看。");
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
    mainForm.button("§4§l删除所有常用语", "textures/ui/icon_trash.png").button("关闭", "textures/ui/crossout");
    mainForm.show(player).then(response=>{
        if(response.cancelationReason === FormCancelationReason.UserBusy) system.run(()=>showMain(player));
        else if(response.selection !== undefined){
            if(response.selection < maxFsts){
                const selection = response.selection + 1;
                showFstOp(player, selection);
            }
            else if(response.selection === maxFsts){
                const removeAllForm = new MessageFormData().title("确认操作").body("确认删除所有常用语？此操作不可恢复！").button1("§4确认").button2("取消");
                removeAllForm.show(player).then(response=>{
                    if(response.selection === 0) for(let i = 1; i <= maxFsts; i++) player.setDynamicProperty(`cyy${i}`, undefined);
                    showMain(player);
                });
            }
        }
    });
}

/**进入常用语分条管理窗口。
 * @param {Player} player
 * @param {number} index
 */
function showFstOp(player, index){
    const
        fst = /**@type {string | undefined}*/ (player.getDynamicProperty(`cyy${index}`)),
        fstOpForm = new ModalFormData().title(`常用语${index}：${fst ?? "<未设置>"}`).textField("修改内容", "(不修改)").toggle("删除该常用语（优先级大于修改内容）", false);
    fstOpForm.show(player).then(response=>{
        if(response.cancelationReason == FormCancelationReason.UserBusy) system.run(()=>showFstOp(player, index));
        else if(response.formValues){
            if(response.formValues[1] === true){
                player.setDynamicProperty(`cyy${index}`, undefined);
                showMain(player);
            }
            else if(response.formValues[0] !== ""){
                if(/**@type {string}*/ (response.formValues[0]).length <= maxLength){
                    player.setDynamicProperty(`cyy${index}`, response.formValues[0]);
                    showMain(player);
                }
                else{
                    const errorForm = new MessageFormData().title("修改失败").body(`常用语过长，不能超过${maxLength}个字符！`).button1("确定").button2("取消");
                    errorForm.show(player).then(()=>showMain(player));
                }
            }
            else if(!response.canceled) showMain(player);
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