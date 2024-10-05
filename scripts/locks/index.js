import { doorLockInit } from "./doorLock";
import { containerBlockLockInit } from "./containerBlockLock";
import { registerCommand } from "../commandBase";

export function lockInit(){};
doorLockInit();
containerBlockLockInit();

registerCommand({
    names: ["cl", "lock", "cltips", "locktips"],
    description: "设置如何显示交互锁功能的消息提示。",
    document: "交互锁包括容器锁和门锁，当加锁/解锁时，会在聊天栏中向玩家发送提示消息，这些消息默认完全开启，可能会打扰原版体验。可以选择关闭这些消息，仅靠粒子效果、状态和声音来判断操作是否成功。showSuccess为显示加锁/解锁成功，showFailure为显示解锁失败。",
    args: [
        {
            name: "showSuccess",
            optional: true,
            type: "boolean"
        },
        {
            name: "showFailure",
            optional: true,
            type: "boolean"
        }
    ],
    callback: (_name, player, args)=>{
        let changed = false;
        if(args.showSuccess !== undefined){
            changed = true;
            player.setDynamicProperty("hideSuccess", !args.showSuccess);
            player.sendMessage(`成功${args.showSuccess ? "开启" : "关闭"}方块交互成功提示。`);
        }
        if(args.showFailure !== undefined){
            changed = true;
            player.setDynamicProperty("hideFailure", !args.showFailure);
            player.sendMessage(`成功${args.showFailure ? "开启" : "关闭"}方块交互失败提示。`);
        }
        if(!changed) player.sendMessage("§c你没有指定任何设置参数。");
        return true;
    }
});