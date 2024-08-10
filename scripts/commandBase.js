//@ts-check
import { Player, system, world } from "@minecraft/server";

export function commandInit(){}

//#region 前缀
let prefix = ".";

/**命令存储数组
 * @typedef {{
 *     name :string;
 *     type :"string" | "number" | "boolean";
 *     optional :boolean;
 * }} argumentDef
 * @typedef {{
 *     names :string[];
 *     args :argumentDef[];
 *     description :string;
 *     callback :(usedName :string, player :Player, args :Record<string, (string | number | boolean)>)=>boolean;
 *     tagRequired? :string[];
 *     hidden? :boolean;
 * }} Command
 * @type {Command[]}
 */
const commands = [];

//#region 命令注册
/**注册命令，可选参数必须排在必选参数后面
 * @param {Command} args 函数参数
 */
export function registerCommand(args){
    commands.push({
        names: args.names,
        args: args.args,
        description: args.description,
        tagRequired: args.tagRequired,
        hidden: args.hidden,
        callback: args.callback
    });
}
//#endregion


//@ts-ignore 扩展给我更新！
world.beforeEvents.chatSend.subscribe(data=>{
    if(!data.target && data.message[0] === prefix){
        data.cancel = true;
        const
            message = /**@type {string}*/ (data.message),
            raw = message.substring(1, message.length).split(" "),
            name = raw.shift();
        let firedCommand = false;
        for(let i = 0; i < commands.length; i++) for(let j = 0; j < commands[i].names.length; j++) if(commands[i].names[j] === name){
            const
                argDefs = commands[i].args,
                /**@type {Record<string, (string | number | boolean)>}*/
                argsToSend = {};
            let foundOptional = false, hasError = false, errorString = "";
            for(let k = 0; k < argDefs.length; k++){
                //会直接假设之后的都是optional，不管有没有出错
                if(argDefs[k].optional && !foundOptional) foundOptional = true;
                switch(argDefs[k].type){
                    case "boolean":
                        if(raw[k] === "true" || raw[k] === "false") argsToSend[argDefs[k].name] = raw[k] == "true" ? true : false;
                        else if(raw[k] !== undefined || !foundOptional) hasError = true;
                        break;
                    case "number":
                        const num = parseFloat(raw[k]);
                        if(/^-?(?:(?:[1-9]\d*)|[0])(?:\.\d+)?$/.test(raw[k]) && !isNaN(num) && isFinite(num)) argsToSend[argDefs[k].name] = num;
                        else if(raw[k] !== undefined || !foundOptional) hasError = true;
                        break;
                    case "string":
                        if(raw[k] !== "") argsToSend[argDefs[k].name] = raw[k];
                        else if(raw[k] !== undefined || !foundOptional) hasError = true;
                        break;
                    default:
                        console.error(`Illegal argument type in command ${name}: ${argDefs[k].name} is ${argDefs[k].type}`);
                        data.sender.sendMessage("§c内部错误。请报告管理员。");
                        return;
                }
                if(hasError){
                    errorString = `§c.${name}语法错误：意外的“${raw[k]}”出现在参数“${argDefs[k].name}”，应为${argDefs[k].type}类型`;
                    break;
                }
            }
            if(!hasError){
                commands[i].callback(name, data.sender, argsToSend);
                firedCommand = true;
            }
            else{
                console.warn(`Player ${data.sender.name} executed command .${name} and occured an error: ${errorString}`);
                data.sender.sendMessage(errorString);
            }
            return;
        }
        if(!firedCommand) data.sender.sendMessage(`§c命令不存在或执行权限不足：${name}。输入.help获取命令帮助。`);
        return;
    }
    if(data.message[0] != prefix) console.log(`<${data.sender.name}>${data.message}`);
});

registerCommand({
    names: ["h", "bz", "help"],
    description: "显示命令帮助。",
    args: [],
    callback: (_name, player)=>{
        let validCommands = 0;
        for(let i = 0; i < commands.length; i++) if(!commands[i].hidden && checkTags(commands[i].tagRequired, player)){
            validCommands++;
            let argString = "";
            for(let j = 0; j < commands[i].args.length; j++){
                if(!j) argString += " ";
                const arg = commands[i].args[j];
                argString += `${arg.optional ? "[" : "<"}${arg.name} :${arg.type}${arg.optional ? "]" : ">"}`;
                if(j < commands[i].args.length - 1) argString += " ";
            }
            player.sendMessage(`${prefix}<${commands[i].names.join(" | ")}>${argString} —— ${commands[i].description}`);
        }
        player.sendMessage(`§e列出完毕，共有 ${validCommands} 条命令。`);
        player.sendMessage("§7<>内为必选项；[]内为可选项；|分隔的为多选一；:前为参数名，后为参数类型。");
        return true;
    }}
);

/**检查玩家是否有权限看到并执行某个命令。
 * @param {string[] | undefined} tags 需要检查的标签集合，以或门连接。
 * @param {Player} player 玩家。
 * @returns {boolean}
 */
function checkTags(tags, player){
    if(tags === undefined) return true;
    for(let i = 0; i < tags.length; i++) if(player.hasTag(tags[i])) return true;
    return false;
}

const confirmStagePlayers = [];

registerCommand({
    names: ["reset_all", "reset_all_confirm", "nope"],
    description: "【仅限出现故障时使用】清除所有玩家关联的命令数据，如常用语等。",
    args: [],
    callback: (name, player)=>{
        if(name == "reset_all"){
            if(confirmStagePlayers.includes(player.name)) player.sendMessage("§c错误：你已经在清除确认阶段了！请先输入.nope取消清除。");
            else{
                player.sendMessage(`§c§l你确定要清除所有你关联的数据吗？这可能会导致信息丢失或产生bug！确保你得到了可信的指导再这样做！如果你确认，请输入指令.reset_all_confirm；否则请输入.nope取消清除。`);
                confirmStagePlayers.push(player.name);
            }
        }
        else if(name == "reset_all_confirm"){
            if(confirmStagePlayers.includes(player.name)){
                player.clearDynamicProperties();
                player.sendMessage("§e已经清除所有你关联的数据。建议重新进入游戏，以避免可能的bug。");
                confirmStagePlayers.splice(confirmStagePlayers.indexOf(player.name), 1);
            }
            else player.sendMessage("§c错误：请输入.reset_all开始清除数据。");
        }
        else if(name == "nope"){
            if(confirmStagePlayers.includes(player.name)){
                player.sendMessage("已经退出数据清除。");
                confirmStagePlayers.splice(confirmStagePlayers.indexOf(player.name), 1);
            }
            else player.sendMessage("§c错误：请输入.reset_all开始清除数据。");
        }
        return true;
    }
});