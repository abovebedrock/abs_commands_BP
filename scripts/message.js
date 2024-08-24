//@ts-check
import { system, Player, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { prefix, registerCommand } from "./commandBase";

export function messageInit(){}

const absPlayerNames = [
    "LJM12914",
    "DK6666Orange",
    "Cyttong0222",
    "TJJ456",
    "Lyzyx99",
    "wjlfish",
    "gaobaisixi",
    "Cr3st_39"
];

const maxMessages = 8;

registerCommand({
    names: ["m", "msg", "message"],
    description: "打开留言窗口。",
    document: "需要关闭聊天栏查看。窗口包含四个按钮，完全可以顾名思义。发送方发送留言后，留言实际暂存于世界附加属性，因此发送方仍可以浏览自己发送的留言内容；发送方是否在线对留言的接收无影响。但是接收方一旦查看过留言，系统即删除该留言，留出空余位置供之后的留言，意味着双方均在接收方查看一次留言后无法再次浏览内容，这种阅后即焚的机制虽然比较麻烦（需要当即屏幕截图保存信息），但在提高安全性的同时也提高了开发效率，短期之内应该不会修改。",
    args: [],
    callback: (_name, player)=>{
        player.sendMessage("留言窗口已打开，请关闭聊天栏查看。");
        system.run(()=>showMain(player));
        return true;
    }
});

/**进入留言主窗口。
 * @param {Player} player
 */
function showMain(player){
    const
        info = getUnreadInfo(player),
        mainForm = new ActionFormData().title("留言").button("发送留言", "textures/ui/newOffersIcon").button(`收到的未读留言§l（${info.length}条）`, "textures/ui/FriendsDiversity").button("已发送的未读留言", "textures/ui/mute_off").button("关闭", "textures/ui/crossout");
    mainForm.show(player).then(response=>{
        if(response.cancelationReason === FormCancelationReason.UserBusy) system.run(()=>showMain(player));
        else if(response.selection === 0) showSendSelect(player);
        else if(response.selection === 1){
            if(info.length) showReadMain(player, 0);
            else world.sendMessage("§e目前无未读留言。");
        }
        else if(response.selection === 2) showSent(player);
    });
}

/**进入选择留言对象窗口。
 * @param {Player} player
 */
function showSendSelect(player){
    const
        filteredPlayers = ["§7", ...absPlayerNames.filter(value=>!world.getPlayers({name: value}).length)],
        //@ts-ignore
        selectForm = new ModalFormData().title("选择玩家").dropdown("选择接收玩家：", filteredPlayers).submitButton("确认");
    selectForm.show(player).then(selectResponse=>{
        if(!selectResponse.canceled && selectResponse.formValues){
            const target = filteredPlayers[/**@type {number}*/(selectResponse.formValues[0])];
            if(target !== "§7") showSendEdit(player, target);
            else showSendSelect(player);
        }
    });
}

/**进入输入留言内容窗口。
 * @param {Player} player 发送者。
 * @param {string} target 接收者的名称。
 */
function showSendEdit(player, target){
    let foundEmpty = false;
    for(let i = 1; i <= maxMessages; i++) if(world.getDynamicProperty(`${target}#${player.name}#${i}`) === undefined){
        foundEmpty = true;
        //@ts-ignore
        const sendForm = new ModalFormData().title("编辑内容").textField(`发送给${target}：`, "输入留言内容").submitButton("发送");
        sendForm.show(player).then(sendResponse=>{
            const formValues = sendResponse.formValues;
            if(!sendResponse.canceled && formValues){
                if(formValues[0] === "") showSendEdit(player, target);
                else{
                    world.setDynamicProperty(`${target}#${player.name}#${i}`, `${formValues[0]}`);
                    player.sendMessage(`§e已经成功发送留言给${target}。在其上线并查看留言前，你仍能在“已发送的未读留言”处查看发送的内容。`);
                }
            }
        });
        break;
    }
    if(!foundEmpty) player.sendMessage(`§c${target}拥有太多的未读留言，无法再给其发送留言！`);
}

/**进入阅读未读留言主窗口。
 * @param {Player} player
 * @param {number} index
 */
function showReadMain(player, index){
    const
        info = getUnreadInfo(player),
        infoForm = new ActionFormData().body(`第${index + 1}条，共${info.length}条\n发送者：${info[index].sender}\n${info[index].content}\n\n留言序号：${info[index].innerIndex}\n\n\n§c离开此页面后本留言将被删除！\n若需要保存信息，请使用截图等方式`);
    if(index !== info.length - 1) infoForm.button("下一条", "textures/ui/arrow_right_white");
    infoForm.button("关闭", "textures/ui/crossout");
    infoForm.show(player).then(response=>{
        if(response.selection === 0 && index !== info.length - 1) showReadMain(player, index + 1);
        world.setDynamicProperty(`${player.name}#${info[index].sender}#${info[index].innerIndex}`, undefined);
    });
}

/**进入已发送未读留言窗口。
 * @param {Player} player
 */
function showSent(player){
    const
        wps = world.getDynamicPropertyIds(),
        /**@type {string[]}*/
        sents = [],
        sentForm = new ActionFormData().title("已发送的未读留言");
    for(let i = 0; i < wps.length; i++) if(wps[i].includes("#")){
        const raw = wps[i].split("#");
        if(raw.length === 3 && raw[1] === player.name) sents.push(`给${raw[0]}的${raw[2]}号留言：${world.getDynamicProperty(wps[i])}`);
    }
    sentForm.body(`————共${sents.length}条————\n\n${sents.join("\n\n")}\n\n`).button("关闭", "textures/ui/crossout");
    sentForm.show(player);
}

world.afterEvents.playerSpawn.subscribe(data=>{
    if(data.initialSpawn) system.runTimeout(()=>{
        const info = getUnreadInfo(data.player);
        if(info.length) data.player.sendMessage(`§e§l你有${info.length}条未读留言，输入${prefix}m查看。`);
    }, 81);
});

/**获取玩家的未读消息。
 * @param {Player} player
 * @typedef {{
 *     sender :string;
 *     innerIndex :number;
 *     content :string;
 * }[]} messageInfos
 * @returns {messageInfos}
 */
function getUnreadInfo(player){
    const
        wps = world.getDynamicPropertyIds(),
        /**@type {messageInfos}*/
        result = [];
    for(let i = 0; i < wps.length; i++) if(wps[i].includes("#")){
        const raw = wps[i].split("#");
        if(raw.length === 3 && raw[0] === player.name) result.push({
            sender: raw[1],
            innerIndex: parseInt(raw[2]),
            content: /**@type {string}*/ (world.getDynamicProperty(wps[i]))
        });
    }
    return result;
}