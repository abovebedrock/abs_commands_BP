import { system, Player, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { prefixs, registerCommand } from "./commandBase";
import { absPlayerNames, dimensionLocalezhCN, getBiome, getCoordinate, getTimeString, separator, updateSeparator } from "./common";

export function messageInit(){}

const maxMessages = 10;

registerCommand({
    names: ["separator"],
    description: "存取留言系统的分隔符，charCode, charCode, ...，建议0-31。",
    tagsRequired: ["dev"],
    args: [{
        name: "setValue",
        optional: true,
        type: "string",
    }],
    callback: (_name, player, args)=>{
        if(args.setValue){
            const data = /**@type {string}*/ (args.setValue).split(",");
            if(data.length){
                let str = "";
                for(let i = 0; i < data.length; i++) str += String.fromCharCode(parseInt(data[i]));
                player.sendMessage(str);
                updateSeparator(str);
            }
            else player.sendMessage("§c搞的啥子哦！");
        }
        else{
            const result = [];
            for(let i = 0; i < separator.value.length; i++) result.push(separator.value.charCodeAt(i));
            player.sendMessage(result.join(","));
        }
        return true;
    }
});

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

/**显示留言主窗口。
 * @param {Player} player
 */
function showMain(player){
    const
        info = getUnreadInfo(player),
        mainForm = new ActionFormData().title("留言").button("发送留言", "textures/ui/newOffersIcon").button(`收到的未读留言§l（${info.length}条）`, "textures/ui/FriendsDiversity").button("已发送的未读留言", "textures/ui/mute_off").button("关闭", "textures/ui/crossout");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
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

/**显示选择留言对象窗口。
 * @param {Player} player
 */
function showSendSelect(player){
    const
        filteredPlayers = ["§7", ...absPlayerNames.filter(value=>!world.getPlayers({name: value}).length)],
        selectForm = new ModalFormData().title("选择玩家").dropdown("选择接收玩家：", filteredPlayers).submitButton("确认");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    selectForm.show(player).then(selectResponse=>{
        if(!selectResponse.canceled && selectResponse.formValues){
            const target = filteredPlayers[/**@type {number}*/(selectResponse.formValues[0])];
            if(target !== "§7") showSendEdit(player, target);
            else showSendSelect(player);
        }
    });
}

/**显示输入留言内容窗口。
 * @param {Player} player 发送者。
 * @param {string} target 接收者的名称。
 * @param {string | undefined} [messageToReply] 需要被回复的消息。
 */
function showSendEdit(player, target, messageToReply){
    let foundEmpty = false;
    for(let i = 1; i <= maxMessages; i++) if(world.getDynamicProperty(`${target}${separator.value}${player.name}${separator.value}${i}`) === undefined){
        foundEmpty = true;
        const sendForm = new ModalFormData().title("编辑内容").textField(`${messageToReply ? `${messageToReply}\n\n` : ""}${messageToReply ? "回复" : "发送给"}${target}：`, "输入留言内容").toggle("附带发送时间").toggle("附带当前所在维度和坐标").toggle("附带当前所在生物群系").submitButton("发送");
        //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
        sendForm.show(player).then(async sendResponse=>{
            const formValues = sendResponse.formValues;
            if(!sendResponse.canceled && formValues){
                if(formValues[0] === "") showSendEdit(player, target, messageToReply);
                else{
                    const [coord, dimension] = getCoordinate(player), dimensionName = dimensionLocalezhCN.get(dimension.id);
                    //注意：由于需要适配自定义命令写入，设置属性的时候，所有的空格都会被转换为下划线，读取的时候记得转换回来！！
                    world.setDynamicProperty(`${target}${separator.value}${player.name}${separator.value}${i}`, `${formValues[0]}${separator.value}${formValues[1] === true ? getTimeString() : ""}${separator.value}${formValues[2] === true ? `${dimensionName}_(${coord.x},_${coord.y},_${coord.z})` : ""}${separator.value}${formValues[3] === true ? (await getBiome(player))[1] : ""}${separator.value}${messageToReply ?? ""}`);
                    if(messageToReply) showMain(player);
                    else player.sendMessage(`§e已经成功${messageToReply ? "回复" : "发送留言给"}${target}。在其上线并查看留言前，你仍能在“已发送的未读留言”处查看发送的内容。`);
                }
            }
        });
        break;
    }
    if(!foundEmpty) player.sendMessage(`§c${target}拥有太多的未读留言，无法再给其发送留言！`);
}

/**显示阅读未读留言主窗口。
 * @param {Player} player
 * @param {number} index
 */
function showReadMain(player, index){
    const
        info = getUnreadInfo(player),
        data = info[index],
        infoForm = new ActionFormData().body(`第${index + 1}条， 共${info.length}条\n\n${data.messageToReply ? `Re： ${data.messageToReply}\n` : ""}${data.content}\n\n#${data.innerIndex} — ${data.sender}${data.time ? ` 于 ${data.time.replaceAll("_", " ")}` : ""}\n${data.coordinates || data.biome ? `@ ${data.coordinates ? `${data.biome ? `${data.biome} ` : ""}${data.coordinates.replaceAll("_", " ")}` : data.biome ? data.biome : ""}` : ""}\n\n§c离开此页面后本留言将被删除！请通过截图保存信息。`),
        canReply = !world.getPlayers({name: data.sender}).length;
    if(canReply) infoForm.button(`回复 ${data.sender}`, "textures/ui/comment");
    if(index !== info.length - 1) infoForm.button("下一条", "textures/ui/arrow_right_white");
    infoForm.button("关闭", "textures/ui/crossout");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    infoForm.show(player).then(response=>{
        if(canReply && response.selection === 0) showSendEdit(player, data.sender, data.content);
        else if(((canReply && response.selection === 1) || (!canReply && response.selection === 0)) && index !== info.length - 1) showReadMain(player, index + 1);
        world.setDynamicProperty(`${player.name}${separator.value}${data.sender}${separator.value}${data.innerIndex}`, undefined);
    });
}

/**显示已发送的未读留言窗口。
 * @param {Player} player
 */
function showSent(player){
    const
        wps = world.getDynamicPropertyIds(),
        sents = [],
        sentForm = new ActionFormData().title("已发送的未读留言");
    for(let i = 0; i < wps.length; i++) if(wps[i].includes(separator.value)){
        const raw = wps[i].split(separator.value);
        if(raw.length === 3 && raw[1] === player.name){
            const data = /**@type {string}*/ (world.getDynamicProperty(wps[i])).split(separator.value);
            sents.push(`${data[4] ? `Re ${raw[0]}： ${data[4]}\n` : ""}${data[4] ? "" : `给 ${raw[0]}：\n`}${data[0]}\n#${raw[2]}${data[1] ? ` 于 ${data[1].replaceAll("_", " ")}` : ""}${data[2] || data[3] ? ` @ ${data[3] ? `${data[3]} ` : ""}${data[2] ? `${data[2].replaceAll("_", " ")}` : ""}` : ""}`);
        }
    }
    sentForm.body(`————共${sents.length}条————\n\n${sents.join("\n\n")}\n\n`).button("关闭", "textures/ui/crossout");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    sentForm.show(player);
}

world.afterEvents.playerSpawn.subscribe(data=>{
    const name = data.player.name;
    if(data.initialSpawn) system.runTimeout(()=>{
        const players = world.getAllPlayers();
        for(let i = 0; i < players.length; i++) if(players[i].name === name){
            const info = getUnreadInfo(players[i]);
            if(info.length) players[i].sendMessage(`§e§l你有${info.length}条未读留言，输入${prefixs[0]}m查看。`);
        }
    }, 81);
});

/**获取玩家的未读消息。
 * @param {Player} player
 * @typedef {{
 *     sender :string;
 *     innerIndex :number;
 *     content :string;
 *     time :string;
 *     coordinates :string;
 *     biome :string;
 *     messageToReply :string;
 * }[]} messageInfos
 * @returns {messageInfos}
 */
function getUnreadInfo(player){
    const
        wps = world.getDynamicPropertyIds(),
        /**@type {messageInfos}*/
        result = [];
    for(let i = 0; i < wps.length; i++) if(wps[i].includes(separator.value)){
        const raw = wps[i].split(separator.value);
        if(raw.length === 3 && raw[0] === player.name){
            const values = /**@type {string}*/ (world.getDynamicProperty(wps[i])).split(separator.value);
            result.push({
                sender: raw[1],
                innerIndex: parseInt(raw[2]),
                content: values[0],
                time: values[1],
                coordinates: values[2],
                biome: values[3],
                messageToReply: values[4]
            });
        }
    }
    return result;
}