import { Player, system, world } from "@minecraft/server";
import { fireCommand, prefixs, registerCommand } from "./commandBase";
import { ActionFormData, FormCancelationReason, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { absPlayerNames } from "./common";

export function fstInit(){}

const maxFsts = 8, maxLength = 50;

registerCommand({
    names: ["s", "cyy", "fst", "set", "szcyy", "setfst"],
    description: "打开常用语管理窗口。",
    document: `需要关闭聊天栏查看。窗口包含若干按钮，前${maxFsts}个按钮上的文字表示第n个常用语目前的设置，“<未设置>”则为空位置。点击最后的按钮“删除所有常用语”，会弹出一个确认弹窗，确认后会将所有常用语清空。“关闭”按钮则关闭窗口。也可以点击右上角的“×”关闭窗口。`,
    args: [],
    callback: (_name, player)=>{
        player.sendMessage("常用语管理窗口已打开，请关闭聊天栏查看。请使用.a <编号>发送常用语。");
        system.run(()=>showMain(player));
        return true;
    }
});

/**显示常用语管理主窗口。
 * @param {Player} player
 */
function showMain(player){
    const mainForm = new ActionFormData().title("管理常用语");
    for(let i = 1; i <= maxFsts; i++){
        const data = player.getDynamicProperty(`cyy${i}`);
        if(data !== undefined) mainForm.button(`${i}：${data}`);
        else mainForm.button(`${i}：§7<未设置>`);
    }
    mainForm.button("§4§l删除所有常用语", "textures/ui/icon_trash.png").button("关闭", "textures/ui/crossout");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    mainForm.show(player).then(response=>{
        if(response.cancelationReason === FormCancelationReason.UserBusy) system.run(()=>showMain(player));
        else if(response.selection !== undefined){
            if(response.selection < maxFsts){
                const selection = response.selection + 1;
                showFstOp(player, selection);
            }
            else if(response.selection === maxFsts){
                const removeAllForm = new MessageFormData().title("确认操作").body("确认删除所有常用语？此操作不可恢复！").button1("取消").button2("§4确认");
                //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
                removeAllForm.show(player).then(response=>{
                    if(response.selection === 1) for(let i = 1; i <= maxFsts; i++) player.setDynamicProperty(`cyy${i}`, undefined);
                    showMain(player);
                });
            }
        }
    });
}

/**显示常用语分条管理窗口。
 * @param {Player} player
 * @param {number} index
 */
function showFstOp(player, index){
    const
        fst = /**@type {string | undefined}*/ (player.getDynamicProperty(`cyy${index}`)),
        fstOpForm = new ModalFormData().title(`常用语${index}`).textField(`${fst ?? "§7<未设置>"}§r\n\n修改内容：`, "(不修改)").toggle("删除该常用语（优先级大于修改内容）", false).submitButton("确认");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
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
                    const errorForm = new MessageFormData().title("修改失败").body(`常用语过长，不能超过${maxLength}个字符！\n点击“确定”返回修改，“取消”回到主页`).button1("确定").button2("取消");
                    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
                    errorForm.show(player).then(response=>{
                        if(response.selection === 0) showFstOp(player, index);
                        else if(response.selection === 1) showMain(player);
                    });
                }
            }
            else if(!response.canceled) showMain(player);
        }
    });
}

const availableCommands = ["?", "help", "list", "me", "msg", "tell", "w"];

const chainedCommandsQuota = new Map(absPlayerNames.map(value=>[value, 10]));

registerCommand({
    names: ["a", "aaa", "send", "fscyy", "sendfst"],
    description: "发送常用语。",
    document: `输入空格+对应的序号，即可让游戏向所有玩家发送模拟执行者聊天消息的一条信息，内容为设定的常用语。如果未设置或超出最大序号限制或不为正整数，则会报错。`,
    args: [{
        name: "number",
        optional: false,
        type: "number"
    }],
    callback: async (_name, player, args)=>{
        const index = Math.floor(/**@type {number}*/ (args.number));
        if(index > maxFsts) player.sendMessage(`最多只有${maxFsts}条常用语！`);
        else if(index <= 0) player.sendMessage(`§c错误：${index}不是有效的正整数。`);
        else{
            const fst = /**@type {string | undefined}*/ (player.getDynamicProperty(`cyy${index}`));
            if(fst !== undefined && fst !== ""){
                //todo:执行自定义命令和原版命令
                if(fst[0] === "/" && availableCommands.includes(fst.substring(1, fst.indexOf(" ") === -1 ? fst.length : fst.indexOf(" ")))){
                    const run = player.runCommandAsync(fst);
                    run.catch(reason=>player.sendMessage(`§c命令 ${fst} 执行失败： ${reason}`));
                    const success = await run;
                    player.sendMessage(`命令 ${fst} ${success.successCount ? `已成功执行` : `执行失败`}。受限于接口能力，你不会收到正常执行命令的回显消息。`);
                }
                else if(prefixs.includes(fst[0])){
                    const quota = /**@type {number}*/ (chainedCommandsQuota.get(/**@type {typeof absPlayerNames[number]}*/ (player.name)));
                    if(quota > 0) system.run(()=>{
                        fireCommand(fst, player);
                        chainedCommandsQuota.set(/**@type {typeof absPlayerNames[number]}*/ (player.name), quota - 1);
                    });
                    else{
                        player.sendMessage("§c错误：你通过常用语链式执行的命令过多！");
                        system.runTimeout(()=>chainedCommandsQuota.set(/**@type {typeof absPlayerNames[number]}*/ (player.name), 10), 100);
                    }
                }
                else{
                    const str = `<${player.name}> ${fst}`;
                    world.sendMessage(str);
                    console.log(`[fst] ${str}`);
                }
            }
            else player.sendMessage(`§c未设置第${index}条常用语。`);
        }
        return true;
    }
});