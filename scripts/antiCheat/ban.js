//@ts-check
import { Player, system, world } from "@minecraft/server";

export function banInit(){}

const unbanList = [
    ""
];

/**封禁玩家。
 * @param {Player} player
 * @param {number} durationSecond
 * @param {string} [reason]
 */
export function ban(player, durationSecond, reason){
    for(let i = 0; i < unbanList.length; i++) if(player.name === unbanList[i]) return;
    if(durationSecond !== 0) world.setDynamicProperty(`b#${player.name}`, `${system.currentTick + durationSecond * 20}#${reason}`);
    else world.setDynamicProperty(`b#${player.name}`, `#${reason}`);
    banAction(player, reason, durationSecond);
}

/**执行封禁。
 * @param {Player} player
 * @param {number} durationSecond
 */
function banAction(player, reason, durationSecond){
    if(durationSecond === 0) system.run(()=>player.dimension.runCommand(`kick ${player.name} §c§l您已被封禁！§r§f${reason ? `原因： ${reason}` : ""}§c您的封禁是永久的。§f若要进行申诉，请将本截图发至群内并对您的行为做出诚实的解释。`));
    else{
        const
            day = Math.floor(durationSecond / 86400),
            hour = Math.floor((durationSecond - day * 86400) / 3600),
            minute = Math.floor((durationSecond - day * 86400 - hour * 3600) / 60),
            second = durationSecond - day * 86400 - hour * 3600 - minute * 60;
        system.run(()=>player.dimension.runCommand(`kick ${player.name} §c§l您已被封禁！§r§f${reason ? `原因： ${reason}` : ""}§c您的封禁时间剩余${day}天${hour}小时${minute}分钟${second}秒。§f若要进行申诉，请将本截图发至群内并对您的行为做出诚实的解释。`));
    }
}

/**解封玩家。
 * @param {Player} player
 */
export function unban(player){
    const banData = world.getDynamicProperty(`b#${player.name}`);
    if(banData !== undefined) world.setDynamicProperty(`b#${player.name}`, undefined);
    else console.error(`${player.name} is not banned!`);
}

world.afterEvents.playerSpawn.subscribe(data=>{
    if(data.initialSpawn){
        for(let i = 0; i < unbanList.length; i++) if(data.player.name === unbanList[i]){
            unban(data.player);
            return;
        }
        const banData = /**@type {string | undefined}*/ (world.getDynamicProperty(`b#${data.player.name}`));
        if(banData !== undefined){
            console.warn(`Banned ${data.player.name} tried logging on.`);
            const banRaw = banData.split("#"), durationTick = parseInt(banRaw[0]);
            banRaw.splice(0, 1);
            if(isNaN(durationTick)) banAction(data.player, banRaw.join("#"), 0);
            else{
                const remainingDurationSecond = Math.floor((durationTick - system.currentTick) / 20);
                if(remainingDurationSecond > 0) banAction(data.player, banRaw.join("#"), remainingDurationSecond);
                else unban(data.player);
            }
        }
    }
});