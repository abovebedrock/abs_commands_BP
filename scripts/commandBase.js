import { Player, world } from "@minecraft/server";
import { separator, updateSeparator } from "./common";

export function commandInit(){}

//#region 前缀
export const prefixs = [".", "。", ",", "，"];
//#endregion

//#region 命令注册与存储
/**
 * @typedef {{
 *     name :string;
 *     type :"string" | "number" | "boolean";
 *     optional :boolean;
 * }} argumentDef
 * @typedef {{
 *     names :string[];
 *     args :argumentDef[];
 *     description :string;
 *     callback :(usedName :string, player :Player, args :Record<string, (string | number | boolean)>)=>boolean | Promise<boolean>;
 *     tagsRequired? :string[];
 *     hidden? :boolean;
 *     document? :string;
 * }} Command 命令存储数组
 * 
 * 暂不使用`hidden`属性！
 * @type {Command[]}
 */
const commands = [];

/**注册命令，可选参数必须排在必选参数后面
 * @param {Command} args 函数参数
 * @returns {boolean} 是否成功注册命令。
 */
export function registerCommand(args){
    if(args.names.length === 0){
        world.sendMessage("§c内部错误。请报告管理员。");
        console.error(`Found command with no names!`);
        return false;
    }
    for(let i = 0; i < commands.length; i++) for(let j = 0; j < commands[i].names.length; j++) for(let k = 0; k < args.names.length; k++) if(commands[i].names[j] === args.names[k]){
        world.sendMessage("§c内部错误。请报告管理员。");
        console.error(`Duplicate name on [${commands[i].names.join(", ")}] and new [${args.names.join(", ")}]`);
        return false;
    }
    commands.push({
        names: args.names,
        args: args.args,
        description: args.description,
        tagsRequired: args.tagsRequired,
        hidden: args.hidden,
        callback: args.callback,
        document: args.document
    });
    return true;
}
//#endregion

//#region 命令执行
world.beforeEvents.chatSend.subscribe(data=>{
    if(!data.targets && prefixs.includes(data.message[0])){
        data.cancel = true;
        fireCommand(data.message, data.sender);
        return;
    }
    if(!prefixs.includes(data.message[0])) console.log(`<${data.sender.name}> ${data.message}`);
});

/**
 * @param {string} message
 * @param {Player} player
 */
export function fireCommand(message, player){
    const
        raw = message.substring(1, message.length).split(" "),
        name = raw.shift();
    let firedCommand = false;
    for(let i = 0; i < commands.length; i++) for(let j = 0; j < commands[i].names.length; j++) if(commands[i].names[j] === name && checkTags(commands[i].tagsRequired, player)){
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
                    if(raw[k] !== undefined && (raw[k][0] === "t" || raw[k][0] === "f")) argsToSend[argDefs[k].name] = raw[k][0] === "t" ? true : false;
                    else if(raw[k] !== undefined || !foundOptional) hasError = true;
                    break;
                case "number":
                    const num = parseFloat(raw[k]);
                    if(/^-?(?:(?:[1-9]\d*)|[0])(?:\.\d+)?$/.test(raw[k]) && !isNaN(num) && isFinite(num)) argsToSend[argDefs[k].name] = num;
                    else if(raw[k] !== undefined || !foundOptional) hasError = true;
                    break;
                case "string":
                    if(raw[k] !== undefined && raw[k] !== "") argsToSend[argDefs[k].name] = raw[k];
                    else if(!foundOptional) hasError = true;
                    break;
                default:
                    console.error(`Illegal argument type in command ${name}: ${argDefs[k].name} is ${argDefs[k].type}`);
                    player.sendMessage("§c内部错误。请报告管理员。");
                    return;
            }
            if(hasError){
                errorString = `§c${prefixs[0]}${name}错误：意外的“${raw[k]}”出现在参数“${argDefs[k].name}”，应为${argDefs[k].type}类型`;
                break;
            }
        }
        if(!hasError){
            commands[i].callback(name, player, argsToSend);
            firedCommand = true;
        }
        else{
            console.warn(`${player.name}: ${errorString}`);
            player.sendMessage(errorString);
        }
        return;
    }
    if(!firedCommand) player.sendMessage(`§c命令不存在或执行权限不足：${name}。输入${prefixs[0]}help获取命令帮助。`);
}

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
//#endregion

const helpNames = ["h", "bz", "help"];

//#region 帮助
registerCommand({
    names: helpNames,
    description: "显示命令帮助。",
    document: "该命令遍历所有注册的命令，筛走本玩家无权执行的和隐藏的命令，并将它们的所有名称、所有参数及类型以及描述打印给玩家。用于给玩家了解自己能执行的命令和它们的简短内容。",
    args: [{
        name: "commandName",
        optional: true,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const name = /**@type {string | undefined}*/ (args.commandName);
        if(name){
            if(helpNames.includes(name)) player.sendMessage(`§e§l——帮助的帮助？——§r§f\n自定义命令是一个插件，用于给玩家执行更多功能。和内置命令一样，需要输入前置符号才会触发（内置命令为“/”，自定义命令为“${prefixs[0]}”。）\n命令可能有参数，用于进一步细化操作。命令和参数、参数和参数之间§6使用一个空格§f隔开。\n参数有三种类型：§6string§f字符串、§6number§f数字、§6boolean§f布尔值（即§6true§f或§6false§f）。在${prefixs[0]}h的消息中，每个参数会以§6名称:类型§f的形式出现。\n参数可能是可选的（以[]标识），即可以不提供本参数，可选参数只能在必选参数（以<>标识）之后出现。\n§l当出现多个可选参数时，如果你需要设置更后的可选参数，你必须提供在这之前的所有可选参数，因为插件是按顺序匹配参数的，只提供后面的可选参数会导致插件匹配它到前面的可选参数。§r§f\n对于详细的命令描述和机制，可输入 ${prefixs[0]}w <命令名称> 查看。不带命令名称参数，将输出当前所有命令的详细文档（比较长）。也有以下几种游戏外部方式可以获得：\n1. 在QQ群内查找相关资料。\n2. 自行查阅GitHub源代码（https://github.com/abovebedrock/abs_commands_BP）。\n3. （即将到来）在基岩服官网命令解释板块查阅资料。\n4. 直接问开发者（不推荐）。`);
            else{
                for(let i = 0; i < commands.length; i++) for(let j = 0; j < commands[i].names.length; j++) if(commands[i].names[j] === name){
                    player.sendMessage(`§e§l关于${prefixs[0]}${name}的帮助：`);
                    let argString = "";
                    for(let j = 0; j < commands[i].args.length; j++){
                        if(!j) argString += " ";
                        const arg = commands[i].args[j];
                        argString += `${arg.optional ? "[" : "<"}${arg.name} :${arg.type}${arg.optional ? "]" : ">"}`;
                        if(j < commands[i].args.length - 1) argString += " ";
                    }
                    player.sendMessage(`${prefixs[0]}${commands[i].names[0]}${commands[i].names.length - 1 ? " (又称" : ""}${commands[i].names.slice(1).join(", ")}${commands[i].names.length - 1 ? ")" : ""}${argString} —— ${commands[i].description}`);
                    player.sendMessage(`输入${prefixs[0]}w ${commands[i].names[0]}获得更详细的文档。`);
                    return true;
                }
                player.sendMessage(`§c错误：未找到名称为${name}的命令。`);
            }
        }
        else{
            let validCommands = 0;
            player.sendMessage("§e§l——基岩服自定义命令帮助——");
            for(let i = 0; i < commands.length; i++) if(!commands[i].hidden && checkTags(commands[i].tagsRequired, player)){
                validCommands++;
                let argString = "";
                for(let j = 0; j < commands[i].args.length; j++){
                    if(!j) argString += " ";
                    const arg = commands[i].args[j];
                    argString += `${arg.optional ? "[" : "<"}${arg.name} :${arg.type}${arg.optional ? "]" : ">"}`;
                    if(j < commands[i].args.length - 1) argString += " ";
                }
                player.sendMessage(`${prefixs[0]}${commands[i].names[0]}${argString} —— ${commands[i].description}`);
            }
            player.sendMessage(`§e列出完毕，共有 ${validCommands} 条命令。\n§7<>表示必选参数，[]表示可选参数，:前为参数名称，后为参数类型。\n§l输入${prefixs[0]}h <命令名称>可以只显示某个命令的帮助。`);
        }
        return true;
    }
});

registerCommand({
    names: ["w", "wd", "document"],
    description: "显示命令完整文档。",
    document: "该命令如果输入commandName参数，则会查找是否有存在该命令名称的命令，并打印该命令的文档；如果输入参数并未找到相应命令，则报错；如果没有输入，则遍历所有注册的命令，筛走本玩家不能执行的和隐藏的命令，并将它们的所有名称、描述和详细文档全部打印给玩家，让玩家有对自己能执行的命令的全面了解。",
    args: [{
        name: "commandName",
        optional: true,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const name = /**@type {string | undefined}*/ (args.commandName);
        if(name === undefined){
            player.sendMessage("§e§l——基岩服自定义命令完全文档——");
            for(let i = 0; i < commands.length; i++) if(!commands[i].hidden && checkTags(commands[i].tagsRequired, player) && commands[i].document){
                player.sendMessage(`${prefixs[0]}${commands[i].names.length - 1 ? "<" : ""}${commands[i].names.join(" | ")}${commands[i].names.length - 1 ? ">" : ""} —— ${commands[i].description}${/**@type {string}*/ (commands[i].document)}`);
                player.sendMessage("§7————————");
            }
            player.sendMessage(`列出完毕。没有文档的命令不会列出，请参见帮助：${prefixs[0]}h <命令名称>，文档：${prefixs[0]}w <命令名称>。`);
        }
        else{
            for(let i = 0; i < commands.length; i++) for(let j = 0; j < commands[i].names.length; j++) if(commands[i].names[j] === name){
                player.sendMessage(`§e§l关于${prefixs[0]}${name}的文档：`);
                player.sendMessage(`${prefixs[0]}${commands[i].names[0]}${commands[i].names.length - 1 ? " (又称" : ""}${commands[i].names.slice(1).join(", ")}${commands[i].names.length - 1 ? ")" : ""} —— ${commands[i].description}${commands[i].document ? commands[i].document : ""}`);
                return true;
            }
            player.sendMessage(`§c错误：未找到名称为${name}的命令。`);
        }
        return true;
    }
});
//#endregion

//#region 玩家自助重置
const confirmStagePlayers = [];

registerCommand({
    names: ["reset_all", "reset_all_confirm", "nope"],
    description: "【仅限出现故障时使用】清除所有你关联的命令数据，如常用语等。",
    document: `本命令仅限在玩家数据出现问题，导致玩家游玩出现异常时由玩家使用。一般情况下切勿使用。会删除所有玩家的附加属性，包括某些需要游戏内工作得来的属性，比如追溯指针交换的死亡坐标显示。使用该命令前，请务必咨询开发者！由于本命令的危险性，设置了两步验证法。先输入${prefixs[0]}reset_all启动重置进程，再输入${prefixs[0]}reset_all_confirm确认，完成重置。如果并不确认，可以输入${prefixs[0]}nope取消进程。不在进程中输入${prefixs[0]}reset_all_confirm或${prefixs[0]}nope，或者在进程中输入${prefixs[0]}reset_all都是无效的。`,
    args: [],
    callback: (name, player)=>{
        if(name == "reset_all"){
            if(confirmStagePlayers.includes(player.name)) player.sendMessage(`§c你已经在清除确认阶段了！请先输入${prefixs[0]}nope取消清除。`);
            else{
                player.sendMessage(`§c§l你确定要清除所有你关联的自定义命令存储的数据吗？这可能会导致权限丢失、信息丢失或产生bug！确保你得到了可信的指导再这样做！如果你确认，请输入${prefixs[0]}reset_all_confirm；否则请输入${prefixs[0]}nope取消清除。`);
                confirmStagePlayers.push(player.name);
            }
        }
        else if(name == "reset_all_confirm"){
            if(confirmStagePlayers.includes(player.name)){
                player.clearDynamicProperties();
                player.sendMessage("§e已经清除所有你关联的数据。建议重新进入游戏，以避免可能的bug。");
                confirmStagePlayers.splice(confirmStagePlayers.indexOf(player.name), 1);
            }
            else player.sendMessage(`§c错误：请输入${prefixs[0]}reset_all开始清除数据。`);
        }
        else if(name == "nope"){
            if(confirmStagePlayers.includes(player.name)){
                player.sendMessage("已经退出数据清除。");
                confirmStagePlayers.splice(confirmStagePlayers.indexOf(player.name), 1);
            }
            else player.sendMessage(`§c错误：请输入${prefixs[0]}reset_all开始清除数据。`);
        }
        return true;
    }
});
//#endregion

//#region 调试命令
registerCommand({
    names: ["gpp"],
    description: "获取玩家的附加属性。",
    tagsRequired: ["dev"],
    args: [
        {
            name: "player",
            optional: false,
            type: "string"
        },
        {
            name: "property",
            optional: false,
            type: "string"
        }
    ],
    callback: (_name, player, args)=>{
        const target = world.getPlayers({name: /**@type {string}*/ (args.player)});
        if(target.length === 0) player.sendMessage("§c玩家不在线");
        else{
            const content = target[0].getDynamicProperty(/**@type {string}*/ (args.property));
            switch(typeof content){
                case "string":
                case "number":
                    player.sendMessage(`${args.property}： ${content}`);
                    break;
                case "boolean":
                    player.sendMessage(`${args.property}： ${content}\nreal boolean!`);
                    break;
                case "undefined":
                    player.sendMessage(`${args.property}： undefined\nreal undefined!`);
                    break;
                case "object":
                    player.sendMessage(`${args.property}： ${content.x}, ${content.y}, ${content.z}\nreal Vector3!`);
                    break;
            }
        }
        return true;
    }
});

registerCommand({
    names: ["spp"],
    description: "设置玩家的附加属性，undefined6，true6，false6，不支持坐标。",
    tagsRequired: ["dev"],
    args: [
        {
            name: "player",
            optional: false,
            type: "string"
        },
        {
            name: "property",
            optional: false,
            type: "string"
        },
        {
            name: "value",
            optional: false,
            type: "string"
        }
    ],
    callback: (_name, player, args)=>{
        const target = world.getPlayers({name: /**@type {string}*/ (args.player)});
        if(target.length === 0) player.sendMessage("§c玩家不在线");
        else{
            if(args.value === "undefined6") target[0].setDynamicProperty(/**@type {string}*/ (args.property), undefined);
            else if(args.value === "true6") target[0].setDynamicProperty(/**@type {string}*/ (args.property), true);
            else if(args.value === "false6") target[0].setDynamicProperty(/**@type {string}*/ (args.property), false);
            else target[0].setDynamicProperty(/**@type {string}*/ (args.property), args.value);
            player.sendMessage(`成功设置${target[0].name}的附加属性${args.property}为${args.value}。`);
        }
        return true;
    }
});

registerCommand({
    names: ["cpp"],
    description: "清除玩家的附加属性。",
    tagsRequired: ["dev"],
    args: [{
        name: "player",
        optional: false,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const target = world.getPlayers({name: /**@type {string}*/ (args.player)});
        if(target.length === 0) player.sendMessage("§c玩家不在线");
        else{
            target[0].clearDynamicProperties();
            player.sendMessage(`成功清除${target[0].name}的附加属性。`);
        }
        return true;
    }
});

registerCommand({
    names: ["qpp"],
    description: "查询玩家的附加属性信息。",
    tagsRequired: ["dev"],
    args: [{
        name: "player",
        optional: false,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const target = world.getPlayers({name: /**@type {string}*/ (args.player)});
        if(target.length === 0) player.sendMessage("§c玩家不在线");
        else{
            player.sendMessage(`所有ID： ${[target[0].getDynamicPropertyIds().join(",")]}`);
            player.sendMessage(`占用大小： ${target[0].getDynamicPropertyTotalByteCount()}`);
        }
        return true;
    }
});

registerCommand({
    names: ["gwp"],
    description: "获取世界的附加属性。自动转化老版留言格式为新版留言。",
    tagsRequired: ["dev"],
    args: [{
        name: "property",
        optional: false,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const message = /**@type {string}*/ (args.property).split("#");
        if(message.length === 3){
            player.sendMessage(/**@type {string}*/ (world.getDynamicProperty(/**@type {string}*/ (args.property).replaceAll("#", separator.value))).replaceAll(separator.value, "#"));
            player.sendMessage(`成功获取留言。`);
        }
        else{
            const content = world.getDynamicProperty(/**@type {string}*/ (args.property));
            switch(typeof content){
                case "string":
                case "number":
                    player.sendMessage(`${args.property}： ${content}`);
                    break;
                case "boolean":
                    player.sendMessage(`${args.property}： ${content}\nreal boolean!`);
                    break;
                case "undefined":
                    player.sendMessage(`${args.property}： undefined\nreal undefined!`);
                    break;
                case "object":
                    player.sendMessage(`${args.property}： ${content.x}, ${content.y}, ${content.z}\nreal Vector3!`);
                    break;
            }
        }
        return true;
    }
});

registerCommand({
    names: ["swp"],
    description: "设置世界的附加属性，undefined6，true6，false6，不支持坐标。自动转化老版留言格式为新版留言。",
    tagsRequired: ["dev"],
    args: [
        {
            name: "property",
            optional: false,
            type: "string"
        },
        {
            name: "value",
            optional: false,
            type: "string"
        }
    ],
    callback: (_name, player, args)=>{
        if(args.property === "separator"){
            player.sendMessage(`§c请使用${prefixs[0]}separator设置分隔符！`);
            return false;
        }
        else{
            const message = /**@type {string}*/ (args.property).split("#");
            if(message.length === 3){
                const newProperty = /**@type {string}*/ (args.property).replaceAll("#", separator.value), newValue = /**@type {string}*/ (args.value).replaceAll("#", separator.value);
                world.setDynamicProperty(newProperty, newValue);
                player.sendMessage(`成功设置留言${newProperty}为${newValue}。`);
            }
            else{
                if(args.value === "undefined6") world.setDynamicProperty(/**@type {string}*/ (args.property), undefined);
                else if(args.value === "true6") world.setDynamicProperty(/**@type {string}*/ (args.property), true);
                else if(args.value === "false6") world.setDynamicProperty(/**@type {string}*/ (args.property), false);
                else world.setDynamicProperty(/**@type {string}*/ (args.property), args.value);
                player.sendMessage(`成功设置世界附加属性${args.property}为${args.value}。`);
            }
        }
        return true;
    }
});

registerCommand({
    names: ["cwp"],
    description: "清除世界的附加属性。separator受到特别保护，请手动删除。",
    tagsRequired: ["dev"],
    args: [],
    callback: (_name, player)=>{
        //当cache为undefined时，直接使用separator.value更新separator就会出现undefined，此时数据显然已经消失了。
        const value = /**@type {string}*/ (world.getDynamicProperty("separator"));
        world.clearDynamicProperties();
        updateSeparator(value);
        player.sendMessage("成功清除世界附加属性。separator受到特别保护，请手动删除。");
        return true;
    }
});

registerCommand({
    names: ["qwp"],
    description: "查询世界的附加属性信息。",
    tagsRequired: ["dev"],
    args: [],
    callback: (_name, player)=>{
        player.sendMessage(`所有ID： ${[world.getDynamicPropertyIds().join(" ")]}`);
        player.sendMessage(`占用大小： ${world.getDynamicPropertyTotalByteCount()}`);
        return true;
    }
});

registerCommand({
    names: ["eval"],
    description: "空壳命令，执行在回调中的任何代码。",
    tagsRequired: ["dev"],
    args: [],
    callback: async (_name, player)=>{
        return true;
    }
});
//#endregion