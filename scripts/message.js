//@ts-check
import { system, Player, world } from "@minecraft/server";
import { ActionFormData, FormCancelationReason, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { registerCommand } from "./commandBase";

export function messageInit(){}

const players = [
    "LJM12914",
    "DK6666Orange",
    "TJJ456",
    "gaobaisixi",
    "Cyttong0222",
    "wjlfish",
    "Lyzyx99",
    "Cr3st_39"
];

const maxMessages = 20;

registerCommand({
    names: ["m", "msg", "message"],
    description: "打开留言窗口。",
    args: [],
    callback: (_name, player)=>{
        player.sendMessage("窗口已打开，请关闭聊天栏查看。");
        system.run(()=>showMain(player));
        return true;
    }
});


/**进入留言窗口。
 * @param {Player} player
 */
function showMain(player){
    const mainForm = new ActionFormData().title("留言").button("给玩家留言", "textures/ui/newOffersIcon").button(`您的未读留言（2条）`, "textures/ui/mute_off").button("关闭", "textures/ui/crossout");
    mainForm.show(player).then(response=>{
        if(response.cancelationReason === FormCancelationReason.UserBusy) system.run(()=>showMain(player));
        else if(response.selection === 0){
            const
                filteredPlayers = ["§7<未选择>", ...players.filter(value=>!world.getPlayers({name: value}).length)],
                selectForm = new ModalFormData().title("选择玩家").dropdown("选择接收玩家：", filteredPlayers);
            selectForm.show(player).then(selectResponse=>{
                if(!selectResponse.canceled && selectResponse.formValues){
                    const target = filteredPlayers[/**@type {number}*/(selectResponse.formValues[0])];
                    if(target === "§7<未选择>") player.sendMessage("§c错误：未选择要发送留言的玩家！");
                    else{
                        let foundEmpty = false;
                        for(let i = 1; i <= maxMessages; i++) if(world.getDynamicProperty(`${target}#${i}`) === undefined){
                            foundEmpty = true;
                            const sendForm = new ModalFormData().title("编辑内容").textField(`发送给${target}：`, "输入留言内容");
                            sendForm.show(player).then(sendResponse=>{
                                const formValues = sendResponse.formValues;
                                if(!sendResponse.canceled && formValues){
                                    if(formValues[0] === "") player.sendMessage("§c错误：不能发送空白留言！");
                                    else{
                                        world.setDynamicProperty(`${target}#${i}`, "");
                                    }
                                }
                            });
                            break;
                        }
                        if(foundEmpty) player.sendMessage(`§e已经成功发送留言给${target}。在其上线前，你仍能在“已发送留言”处查看发送的内容。`);
                        else player.sendMessage(`§c错误：${target}拥有太多的未读留言，已经无法给其留言！`);
                    }
                    //else player.sendMessage("§c错误：未选择玩家。");
                }
            });
        }
        else if(response.selection === 1){
            const infoForm = new ActionFormData();
            player.sendMessage("b");
        }
    });
}