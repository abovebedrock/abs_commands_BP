import { Player, system, world } from "@minecraft/server";
import { registerCommand } from "../commandBase";

export function banInit(){}

const unbanList = [
    ""
];

console.warn(`Unban list: ${unbanList.join(", ")}`);

registerCommand({
    names: ["ban"],
    description: "封禁或解禁玩家。持续时间以秒计。",
    args: [
        {
            name: "playerOrList",
            optional: false,
            type: "string"
        },
        {
            name: "isUnban",
            optional: true,
            type: "boolean"
        },
        {
            name: "duration",
            optional: true,
            type: "number"
        }
    ],
    tagsRequired: ["dev"],
    callback: (_names, player, args)=>{
        if(args.playerOrList === "list"){
            const wps = world.getDynamicPropertyIds(), results = ["名称： 天，小时，分钟，秒"];
            for(let i = 0; i < wps.length; i++) if(wps[i].startsWith("b#", 0)) results.push(`${wps[i].substring(2, wps[i].length)}： ${getRestDuration(Math.floor((parseInt(/**@type {string}*/ (world.getDynamicProperty(wps[i])).split("#")[0]) - system.currentTick) / 20)).join(",")}`);
            player.sendMessage(results.length === 1 ? "无封禁玩家。" : results.join("\n"));
        }
        else{
            const banData = world.getDynamicProperty(`b#${args.playerOrList}`);
            if(args.isUnban === true){
                if(banData !== undefined){
                    unban(/**@type {string}*/ (args.playerOrList));
                    player.sendMessage(`已经解禁${args.playerOrList}。`);
                }
                else player.sendMessage(`§c${args.playerOrList}没有被封禁。`);
            }
            else if(banData !== undefined) player.sendMessage(`§c${args.playerOrList}已经被封禁了。为了防止手滑，请先解禁后再封禁！`);
            else if(args.duration === undefined) player.sendMessage("§c请给出封禁时长！");
            else{
                ban(/**@type {string}*/ (args.playerOrList), /**@type {number}*/ (args.duration));
                player.dimension.runCommandAsync(`/kick ${args.playerOrList}`);
                player.sendMessage(`成功封禁${args.playerOrList}。`);
            }
        }
        return true;
    }
});

/**封禁玩家。
 * @param {Player | string} playerOrName
 * @param {number} durationSecond
 * @param {string | undefined} [reason]
 */
export function ban(playerOrName, durationSecond, reason){
    if(typeof playerOrName === "string"){
        if(unbanList.includes(playerOrName)){
            console.log(`Hit unban list: ${playerOrName}`);
            return;
        }
        banRegister(playerOrName, durationSecond, reason);
        console.warn(`Ban action is not taken because \`player\` get string "${playerOrName}".`);
    }
    else{
        if(unbanList.includes(playerOrName.name)){
            console.log(`Hit unban list: ${playerOrName.name}`);
            return;
        }
        banRegister(playerOrName.name, durationSecond, reason);
        banAction(playerOrName, reason, durationSecond);
    }
}

/**记录封禁信息。
 * @param {string} name
 * @param {number} durationSecond
 * @param {string | undefined} [reason]
 */
function banRegister(name, durationSecond, reason){
    for(let i = 0; i < unbanList.length; i++) if(name === unbanList[i]){
        console.error(`Banregister: ${name} is already banned!`);
        return;
    }
    if(durationSecond !== 0) world.setDynamicProperty(`b#${name}`, `${system.currentTick + durationSecond * 20}#${reason !== undefined ? reason : ""}`);
    else world.setDynamicProperty(`b#${name}`, `#${reason !== undefined ? reason : ""}`);
}

/**执行封禁。
 * @param {Player} player
 * @param {number} durationSecond
 */
function banAction(player, reason, durationSecond){
    if(durationSecond === 0) system.run(()=>player.dimension.runCommand(`kick ${player.name} §c§l您已被封禁！§r§f${reason ? `原因： ${reason}` : ""}§c您的封禁是永久的。§f若要进行申诉，请将本截图发至群内并对您的行为做出诚实的解释。`));
    else{
        const [day, hour, minute, second] = getRestDuration(durationSecond);
        system.run(()=>player.dimension.runCommand(`kick ${player.name} §c§l您已被封禁！§r§f${reason ? `原因： ${reason}` : ""}§c您的封禁时间剩余${day}天${hour}小时${minute}分钟${second}秒。§f若要进行申诉，请将本截图发至群内并对您的行为做出诚实的解释。`));
    }
}

/**`[day, hour, minute, second]`
 * @returns {[number, number, number, number]}
 */
function getRestDuration(durationSecond){
    const
        day = Math.floor(durationSecond / 86400),
        hour = Math.floor((durationSecond - day * 86400) / 3600),
        minute = Math.floor((durationSecond - day * 86400 - hour * 3600) / 60),
        second = durationSecond - day * 86400 - hour * 3600 - minute * 60;
    return [day, hour, minute, second];
}

/**解封玩家。
 * @param {string} name
 */
export function unban(name){
    const banData = world.getDynamicProperty(`b#${name}`);
    if(banData !== undefined) world.setDynamicProperty(`b#${name}`, undefined);
    else console.error(`${name} is not banned!`);
}

world.afterEvents.playerSpawn.subscribe(data=>{
    if(data.initialSpawn){
        for(let i = 0; i < unbanList.length; i++) if(data.player.name === unbanList[i]){
            console.warn(`List unbanned ${data.player.name}.`);
            unban(data.player.name);
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
                else unban(data.player.name);
            }
        }
    }
});