import { Dimension, Player, system, world } from "@minecraft/server";
import { prefixs, registerCommand } from "./commandBase";
import { dimensionIds, dimensionLocalezhCN, getCoordinate, getDimensionML, getDistance, getHorizontalDistance, getManhattanDistance, getNetherCoordinate, getOverworldCoordinate, getSubchunkCoordinate, retrieveDimension } from "./common";
import { ActionFormData, FormCancelationReason, MessageFormData, ModalFormData } from "@minecraft/server-ui";

export function civilInit(){};

/**标记点格式。
 * @typedef {[import("@minecraft/server").Vector3, Dimension]} MarkPoint*/

/**@typedef {{
 *     x :number;
 *     y :number;
 *     z :number;
 *     dimension :Dimension;
 * }} extendedCoordinate
 */

//#region 主方法
registerCommand({
    names: ["l", "ci", "civil", "ce", "tm", "gc", "engineer", "kt"],
    description: `打开工程工具箱窗口。请查看窗口内的使用手册获取参数信息。`,
    document: "//todo:",
    args: [{
        name: "magicString",
        optional: true,
        type: "string"
    }],
    callback: (_names, player, args)=>{
        const
            showCommandTips = player.getDynamicProperty("hideCivilCommandTips") !== true,
            [coord, dimension] = getMarkPoint(player);
        switch(args.magicString){
            case "set":
                if(coord !== undefined) player.sendMessage(`§c已经存在标记点： ${dimensionLocalezhCN.get(dimension.id)} (${coord.x}, ${coord.y}, ${coord.z})${showCommandTips ? `， 输入${prefixs[0]}l del清除标记点` : ""}。`);
                else{
                    const [coord, dimension] = getCoordinate(player);
                    setMarkPoint(player);
                    player.sendMessage(`§e已经设置标记点 ${dimensionLocalezhCN.get(dimension.id)} (${coord.x}, ${coord.y}, ${coord.z})。`);
                }
                break;
            case "del":
                if(coord !== undefined){
                    removeMarkPoint(player);
                    player.sendMessage(`已经清除标记点 ${dimensionLocalezhCN.get(dimension.id)} (${coord.x}, ${coord.y}, ${coord.z})。`);
                }
                else player.sendMessage(`§c无标记点。${showCommandTips ? ` 输入${prefixs[0]}l set将当前坐标添加为标记点。` : ""}`);
                break;
            case "unlock":
                if(player.getDynamicProperty("lockPerspective") !== true && player.getDynamicProperty("lockMovement") !== true) player.sendMessage("§c无行动锁定。");
                else{
                    player.inputPermissions.cameraEnabled = true;
                    player.inputPermissions.movementEnabled = true;
                    player.setDynamicProperty("lockPerspective", false);
                    player.setDynamicProperty("lockMovement", false);
                    player.sendMessage("已经解除行动锁定。");
                }
                break;
            case undefined:
                if(showCommandTips) player.sendMessage(`工程工具箱窗口已打开，请关闭聊天栏查看。输入${prefixs[0]}l set将当前坐标添加为标记点。`);
                system.run(()=>{showMain(player)});
                break;
            default:
                player.sendMessage(`§c${prefixs[0]}l: ${args.magicString}不是一个有效子命令。${showCommandTips ? `请输入${prefixs[0]}l并查看使用手册，获取更多相关信息。` : ""}`);
                break;
        }
        return true;
    }
});
//#endregion

//#region 标记点操作
/**解析标记点。
 * @param {Player} player
 * @returns {[import("@minecraft/server").Vector3, Dimension] | [undefined, undefined]}
 */
function getMarkPoint(player){
    const data = player.getDynamicProperty("markedPoint");
    if(data === undefined) return [undefined, undefined];
    else{
        const datas = /**@type {string}*/ (data).split(",");
        return [{
            x: parseInt(datas[0]),
            y: parseInt(datas[1]),
            z: parseInt(datas[2]),
        }, retrieveDimension(/**@type {"o" | "n" | "e"}*/(datas[3]))];
    }
}

/**设置标记点。如果不提供可选参数，则使用玩家目前的位置。
 * @param {Player} player
 * @param {import("@minecraft/server").Vector3} [coord]
 * @param {Dimension} [dimension]
 * @returns {MarkPoint}
 */
function setMarkPoint(player, coord, dimension){
    if(!coord || !dimension){
        const [coord, altDimension] = getCoordinate(player);
        player.setDynamicProperty("markedPoint", `${coord.x},${coord.y},${coord.z},${getDimensionML(altDimension)}`);
        return [coord, altDimension];
    }
    else{
        player.setDynamicProperty("markedPoint", `${coord.x},${coord.y},${coord.z},${getDimensionML(dimension)}`);
        return [coord, dimension];
    }
}

/**清除标记点并返回数据。
 * @param {Player} player
 * @returns {MarkPoint | [undefined, undefined]}
 */
function removeMarkPoint(player){
    const data = getMarkPoint(player);
    player.setDynamicProperty("markedPoint", undefined);
    return data;
}
//#endregion

/**显示主窗口。
 * @param {Player} player
 */
function showMain(player){
    const
        showCommandTips = player.getDynamicProperty("hideCivilCommandTips") !== true,
        [coord, dimension] = getMarkPoint(player),
        mainForm = new ActionFormData().title("工程工具箱")
        .button(`§l${coord ? `${dimensionLocalezhCN.get(dimension.id)} (${coord.x}, ${coord.y}, ${coord.z})` : `无标记点${ showCommandTips ? "， 点击此处设置" : ""}`}`, "textures/ui/pointer");
        if(coord){
            mainForm
            .button("测量距离", "textures/ui/redstone_arrow_powered")
            .button("挖掘隧道", "textures/ui/icon_iron_pickaxe")
            .button("铺设平面", "textures/ui/slot_disabled_pocket")
            .button("填充长方体", "textures/ui/world_glyph");
        }
        mainForm.button("行动锁定", "textures/ui/icon_lock").button("其它", "textures/ui/permissions_custom_dots").button(`使用手册${showCommandTips ? "§9§l【请点我学习本工具！】" : ""}`, "textures/ui/creative_icon").button("关闭窗口", "textures/ui/crossout");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    mainForm.show(player).then(response=>{
        if(response.cancelationReason === FormCancelationReason.UserBusy) system.run(()=>showMain(player));
        else{
            if(coord) switch(response.selection){
                case 0:
                    showMarkPoint(player, [coord, dimension]);
                    break;
                case 1:
                    break;
                case 2:
                    break;
                case 3:
                    break;
                case 4:
                    break;
                case 5:
                    showActionLock(player);
                    break;
                case 6:
                    showSettings(player);
                    break;
                case 7:
                    showDocument(player);
                    break;
            }
            else switch(response.selection){
                case 0:
                    showMarkPoint(player, [coord, dimension]);
                    break;
                case 1:
                    showActionLock(player);
                    break;
                case 2:
                    showSettings(player);
                    break;
                case 3:
                    showDocument(player);
                    break;
            }
        }
    });
}

/**显示标记点主窗口。
 * @param {Player} player
 * @param {MarkPoint} markedPoint
 */
function showMarkPoint(player, markedPoint){
    const options = ["不更新", `${markedPoint[0] ? "更改" : "新建"}标记点`];
    if(markedPoint[0]) options.push("删除标记点");
    const [coord, dimension] = getCoordinate(player), markPointForm = new ModalFormData().title(`${dimensionLocalezhCN.get(markedPoint[1].id)} (${markedPoint[0].x}, ${markedPoint[0].y}, ${markedPoint[0].z})`).dropdown(`当前位置： ${dimensionLocalezhCN.get(dimension.id)} (${coord.x}, ${coord.y}, ${coord.z})\n${getPointDescStr(player, markedPoint)}\n\n更新标记点：`, options, 0).submitButton("确定");
    if(markedPoint[0]) markPointForm.toggle("在世界中显示标记点（仅自己可见）").toggle("打印所有信息到聊天并关闭窗口").toggle("向公屏发送标记点坐标并关闭窗口");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    markPointForm.show(player).then(response=>{
        if(!response.canceled){
            const operation = /**@type {number}*/ (response.formValues[0]), showPoint = /**@type {boolean}*/ (response.formValues[1]), printInfo = /**@type {boolean}*/ (response.formValues[2]), sendCoord = /**@type {boolean}*/ (response.formValues[3]);
            if(showPoint === true){

            }
            if(printInfo === true || sendCoord === true){
                if(printInfo === true) player.sendMessage(`§e§l标记点： ${dimensionLocalezhCN.get(markedPoint[1].id)} (${markedPoint[0].x}, ${markedPoint[0].y}, ${markedPoint[0].z})§r\n${getPointDescStr(player, markedPoint)}`);
                if(sendCoord === true){
                    const str = `<${player.name}> ${dimensionLocalezhCN.get(markedPoint[1].id)} ${markedPoint[0].x} ${markedPoint[0].y} ${markedPoint[0].z}`;
                    world.sendMessage(str);
                    console.log(`[civil] ${str}`);
                }
                if(operation === 2) removeMarkPoint(player);
                return;
            }
            switch(operation){
                case 0:
                    showMain(player);
                    break;
                case 1:
                    showEditMarkPoint(player);
                    break;
                case 2:
                    removeMarkPoint(player);
                    showMarkPoint(player, [undefined, undefined]);
                    break;
            }
        }
        else showMain(player);
    });
}

/**在坐标位置为玩家显示粒子效果。
 * @param {Player} player
 * @param {MarkPoint} markedPoint
 */
function setDisplay(player, markedPoint){

}

/**显示编辑标记点数据窗口。
 * @param {Player} player
 * @param {string} [preX]
 * @param {string} [preY]
 * @param {string} [preZ]
 * @param {string} [preDim]
 */
function showEditMarkPoint(player, preX, preY, preZ, preDim){
    const
        [altCoord, altDimension] = getCoordinate(player),
        lastMarkedPoint = getMarkPoint(player),
        editMarkPointForm = new ModalFormData().title("编辑标记点").textField("若全部留空，则为当前所在位置。输入标记点：\n\nX坐标：", `${altCoord.x}`, preX).textField("Y坐标：", `${altCoord.y}`, preY).textField("Z坐标：", `${altCoord.z}`, preZ).textField("维度： 主世界（o）、下界（n）或末地（e）", dimensionLocalezhCN.get(altDimension.id), preDim).submitButton("确定");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    editMarkPointForm.show(player).then(response=>{
        if(!response.canceled){
            const xStr = /**@type {string}*/ (response.formValues[0]), yStr = /**@type {string}*/ (response.formValues[1]), zStr = /**@type {string}*/ (response.formValues[2]), dimStr = /**@type {string}*/ (response.formValues[3]);
            if(xStr === "" || yStr === "" || zStr === "" || dimStr === ""){
                if(xStr === "" && yStr === "" && zStr === "" && dimStr === "") showMarkPoint(player, setMarkPoint(player));
                else{
                    const errorForm = new MessageFormData().title("输入数据不全").body("输入的数据不完整，请检查是否有留空的输入框。若要使用当前所在位置，请将全部输入框留空。\n点击确定返回修改，点击取消回到标记点页面。").button1("取消").button2("确定");
                    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
                    errorForm.show(player).then(response=>{
                        if(response.selection === 0) showMarkPoint(player, lastMarkedPoint);
                        else showEditMarkPoint(player, xStr, yStr, zStr, dimStr);
                    });
                    return;
                }
            }
            else{
                const x = parseInt(xStr), y = parseInt(yStr), z = parseInt(zStr), dimension = parseDimInput(dimStr);
                if(isNaN(x) || isNaN(y) || isNaN(z) || !isFinite(x) || !isFinite(y) || !isFinite(z) || !dimension){
                    const errorForm = new MessageFormData().title("输入数据有误").body("输入的数据有误，无法解析。\n对于维度，请完整输入“主世界”、“下界”、“末地”、“o”、“n”、“e”中的任一值。\n点击确定返回修改，点击取消回到标记点页面。").button1("取消").button2("确定");
                    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
                    errorForm.show(player).then(response=>{
                        if(response.selection === 0) showMarkPoint(player, lastMarkedPoint);
                        else showEditMarkPoint(player, xStr, yStr, zStr, dimStr);
                    });
                    return;
                }
                else showMarkPoint(player, setMarkPoint(player, {x, y, z}, dimension));
            }
        }
        else showMarkPoint(player, lastMarkedPoint);
    });
}

//#region 标记点数据
/**转换用户输入为维度。
 * @param {string} dimStr
 * @returns {Dimension | undefined}
 */
function parseDimInput(dimStr){
    if(dimStr === "o" || dimStr === "主世界") return world.getDimension(dimensionIds[0]);
    else if(dimStr === "n" || dimStr === "下界") return world.getDimension(dimensionIds[1]);
    else if(dimStr === "e" || dimStr === "末地") return world.getDimension(dimensionIds[2]);
    else return undefined;
}

/**获得标记点的描述。
 * @param {Player} player
 * @param {MarkPoint} markedPoint
 * @returns {string}
 */
function getPointDescStr(player, markedPoint){
    if(markedPoint[0] === undefined) return "无标记点";
    else{
        const [playerCoord, playerDimension] = getCoordinate(player);
        switch(markedPoint[1].id){
            case dimensionIds[0]: switch(playerDimension.id){
                case dimensionIds[0]: return `${dimensionLocalezhCN.get(dimensionIds[0])} ${getDimDescStr(playerCoord, markedPoint[0], true)}\n${dimensionLocalezhCN.get(dimensionIds[1])} ${getDimDescStr(getNetherCoordinate(playerCoord), getNetherCoordinate(markedPoint[0]), true)}`;
                case dimensionIds[1]: return `${dimensionLocalezhCN.get(dimensionIds[0])} ${getDimDescStr(getOverworldCoordinate(playerCoord), markedPoint[0], true)}\n${dimensionLocalezhCN.get(dimensionIds[1])} ${getDimDescStr(playerCoord, getNetherCoordinate(markedPoint[0]), true)}`;
                case dimensionIds[2]: return `${dimensionLocalezhCN.get(dimensionIds[0])} ${getDimDescStr(playerCoord, markedPoint[0], false)}`;
            }
            case dimensionIds[1]: switch(playerDimension.id){
                case dimensionIds[0]: return `${dimensionLocalezhCN.get(dimensionIds[1])} ${getDimDescStr(getNetherCoordinate(playerCoord), markedPoint[0], true)}\n${dimensionLocalezhCN.get(dimensionIds[0])} ${getDimDescStr(playerCoord, getOverworldCoordinate(markedPoint[0]), true)}`;
                case dimensionIds[1]: return `${dimensionLocalezhCN.get(dimensionIds[1])} ${getDimDescStr(playerCoord, markedPoint[0], true)}\n${dimensionLocalezhCN.get(dimensionIds[0])} ${getDimDescStr(getOverworldCoordinate(playerCoord), getOverworldCoordinate(markedPoint[0]), true)}`;
                case dimensionIds[2]: return `${dimensionLocalezhCN.get(dimensionIds[1])} ${getDimDescStr(playerCoord, markedPoint[0], false)}`;
            }
            case dimensionIds[2]: switch(playerDimension.id){
                case dimensionIds[2]: return `${dimensionLocalezhCN.get(dimensionIds[2])} ${getDimDescStr(playerCoord, markedPoint[0], true)}`;
                default: return `${dimensionLocalezhCN.get(dimensionIds[2])} ${getDimDescStr(playerCoord, markedPoint[0], false)}`;
            }
        }
    }
}

/**获得对于一个维度的完整坐标描述，不包括最前面的维度。
 * @param {import("@minecraft/server").Vector3} playerCoord
 * @param {import("@minecraft/server").Vector3} pointCoord
 * @param {boolean} showDistances
 */
function getDimDescStr(playerCoord, pointCoord, showDistances){
    if(!showDistances) return `(${pointCoord.x}, ${pointCoord.y}, ${pointCoord.z})`;
    else{
        const
            distance = getDistance(playerCoord, pointCoord),
            hDistance = getHorizontalDistance(playerCoord, pointCoord),
            /**@type {import("@minecraft/server").Vector3}*/
            manDistance = {
                x: pointCoord.x - playerCoord.x,
                y: pointCoord.y - playerCoord.y,
                z: pointCoord.z - playerCoord.z
            },
            /**@type {import("@minecraft/server").Vector3}*/
            absManDistance = {
                x: Math.abs(manDistance.x),
                y: Math.abs(manDistance.y),
                z: Math.abs(manDistance.z)
            },
            subChunkCoord = getSubchunkCoordinate(pointCoord),
            maxManDistanceIndex = absManDistance.x >= absManDistance.y ? absManDistance.x === absManDistance.y ? 3 : absManDistance.x >= absManDistance.z ? absManDistance.x === absManDistance.z ? 3 : 0 : 2 : absManDistance.y >= absManDistance.z ? absManDistance.y === absManDistance.z ? 3 : 1 : absManDistance.x >= absManDistance.z ? absManDistance.x === absManDistance.z ? 3 : 0 : 2;
        return `(${pointCoord.x}, ${pointCoord.y}, ${pointCoord.z}) (${subChunkCoord[1].x} ${subChunkCoord[1].y} ${subChunkCoord[1].z} in ${subChunkCoord[0].x} ${subChunkCoord[0].y} ${subChunkCoord[0].z}) / (${maxManDistanceIndex === 0 ? "§e" : ""}${manDistance.x}${maxManDistanceIndex === 0 ? "§r" : ""}, ${maxManDistanceIndex === 1 ? "§e" : ""}${manDistance.y}${maxManDistanceIndex === 1 ? "§r" : ""}, ${maxManDistanceIndex === 2 ? "§e" : ""}${manDistance.z}${maxManDistanceIndex === 2 ? "§r" : ""}) ${getCarriedItemAmtStr(absManDistance.x + absManDistance.z)} ${getCarriedItemAmtStr(absManDistance.x + absManDistance.y + absManDistance.z)} / ${hDistance.toFixed(1)} ${distance.toFixed(1)}`;
    }
}

/**输入物品数量和可选的最大堆叠量，获得潜影盒、组进位字符串。
 * @param {number} amount
 * @param {number} [stackLimit_]
 * @returns {string}
 */
function getCarriedItemAmtStr(amount, stackLimit_){
    const
        stackLimit = stackLimit_ ?? 64,
        shulkerBoxUnit = 27 * stackLimit,
        lcheShulkerBoxUnit = 54 * shulkerBoxUnit,
        lcheShulkerBoxAmount = Math.floor(amount / lcheShulkerBoxUnit),
        shulkerBoxAmount = Math.floor((amount - lcheShulkerBoxAmount * lcheShulkerBoxUnit) / shulkerBoxUnit),
        stackAmount = Math.floor((amount - lcheShulkerBoxAmount * lcheShulkerBoxUnit - shulkerBoxAmount * shulkerBoxUnit) / stackLimit),
        remainder = amount - lcheShulkerBoxAmount * lcheShulkerBoxUnit - shulkerBoxAmount * shulkerBoxUnit - stackAmount * stackLimit;
    return `${lcheShulkerBoxAmount > 0 ? `${lcheShulkerBoxAmount}c+` : ""}${shulkerBoxAmount > 0 ? `${shulkerBoxAmount}b+` : ""}${stackAmount > 0 ? `${stackAmount}s+` : ""}${remainder}`;
}
//#endregion

/**
 * @param {Player} player
 */
function showMeasureDistance(player){

}

/**
 * @param {Player} player
 */
function showDigTunnel(player){

}

/**
 * @param {Player} player
 */
function showMakePlane(player){

}

/**
 * @param {Player} player
 */
function showFillCube(player){

}

/**显示其它窗口。
 * @param {Player} player
 */
function showSettings(player){
    const
        showCommandTips = player.getDynamicProperty("hideCivilCommandTips") !== true,
        settingForm = new ModalFormData().title("其它").toggle("显示所有附加提示（熟悉操作后建议关闭）", showCommandTips).toggle("关闭窗口并显示当前区块边界").submitButton("应用");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    settingForm.show(player).then(response=>{
        if(!response.canceled){
            player.setDynamicProperty("hideCivilCommandTips", !response.formValues[0]);
            if(response.formValues[1]) showChunkBorder(player);
            else showMain(player);
        }
        else showMain(player);
    });
}

/**给玩家显示区块边界。
 * @param {Player} player
 */
function showChunkBorder(player){
    const
        [coord, dimension] = getCoordinate(player),
        [subChunkCoord, coordInchunk] = getSubchunkCoordinate(coord);
}

//#region 行动锁定
/**显示行动锁定窗口。
 * @param {Player} player
 */
function showActionLock(player){
    const
        /**@type {import("@minecraft/server").Vector2}*/
        rotation = {
            x: Math.round(player.getRotation().x),
            y: Math.round(player.getRotation().y)
        },
        lockPerspective = player.getDynamicProperty("lockPerspective") === true,
        lockMovement = player.getDynamicProperty("lockMovement") === true,
        actionLockForm = new ModalFormData().title("行动锁定")
        .dropdown(`所有行动锁定在重进游戏后会自动解除，也可以重新进入此处解除，还可以输入${prefixs[0]}l unlock快速解除。\n为了方便起见，若更新了锁定状态，将立即退出工具。\n\n锁定视角到预设：`, ["当前玩家视角", "正北（-Z）", "正南（+Z）", "正西（-X）", "正东（+X）", "正上（向北）", "正上（向南）", "正上（向西）", "正上（向东）", "正下（向北）", "正下（向南）", "正下（向西）", "正下（向东）"])
        .toggle("§l§e不使用预设，使用下方的自定义数据")
        .slider("-180：正北， -90：正西， 0：正南， 90：正东   方向角", -180, 179, 1, rotation.y)
        .slider("-90：正上， 0：水平， 90：正下             俯仰角", -90, 90, 1, rotation.x)
        .toggle("锁定视角总开关", lockPerspective)
        .toggle("锁定移动总开关", lockMovement)
        .submitButton("确定");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    actionLockForm.show(player).then(response=>{
        if(!response.canceled){
            const
                selectedPreset = /**@type {number}*/ (response.formValues[0]),
                presetData = presetMap.get(selectedPreset),
                customToggle = /**@type {boolean}*/ (response.formValues[1]),
                customY = /**@type {number}*/ (response.formValues[2]),
                customX = /**@type {number}*/ (response.formValues[3]),
                disablePerspective = /**@type {boolean}*/ (response.formValues[4]),
                disableMovement = /**@type {boolean}*/ (response.formValues[5]);
            //这里直接更新设置，会造成一游戏刻的解除锁定，所以需要先判断！
            if(disablePerspective === player.inputPermissions.cameraEnabled) player.inputPermissions.cameraEnabled = !disablePerspective;
            if(disableMovement === player.inputPermissions.movementEnabled) player.inputPermissions.movementEnabled = !disableMovement;
            player.setDynamicProperty("lockPerspective", disablePerspective);
            player.setDynamicProperty("lockMovement", disableMovement);
            if(disablePerspective && disableMovement){
                setPlayerPerspective(player, selectedPreset, customToggle ? customX : undefined, customToggle ? customY : undefined);
                player.sendMessage(`§6§l进入锁定视角和移动模式，无法改变视角、自主移动。输入${prefixs[0]}l unlock解除。`);
            }
            else{
                if(disablePerspective){
                    setPlayerPerspective(player, selectedPreset, customToggle ? customX : undefined, customToggle ? customY : undefined);
                    player.sendMessage(`§6§l进入锁定视角模式，无法改变视角。输入${prefixs[0]}l unlock解除。`);
                }
                if(disableMovement) player.sendMessage(`§6§l进入锁定移动模式，无法自主移动。输入${prefixs[0]}l unlock解除。`);
            }
            if(
                (!disablePerspective && !disableMovement)
             || (
                    lockPerspective === disablePerspective && lockMovement === disableMovement
                 && (
                        (customToggle && rotation.x === customX && rotation.y === customY)
                     || (
                            !customToggle
                         && (
                                selectedPreset === 0
                             || (rotation.x === presetData.x && rotation.y === presetData.y)
                            )
                        )
                    )
                )
            ) showMain(player);
        }
        else showMain(player);
    });
}

/**@type {Map<number, import("@minecraft/server").Vector2>}*/
const presetMap = new Map([
    [1, {x: 0, y: -180}],
    [2, {x: 0, y: 0}],
    [3, {x: 0, y: 90}],
    [4, {x: 0, y: -90}],
    [5, {x: -90, y: -180}],
    [6, {x: -90, y: 0}],
    [7, {x: -90, y: 90}],
    [8, {x: -90, y: -90}],
    [9, {x: 90, y: -180}],
    [10, {x: 90, y: 0}],
    [11, {x: 90, y: 90}],
    [12, {x: 90, y: -90}]
]);

/**减少重复代码量抽提的转变玩家视角方法。
 * @param {Player} player
 * @param {number} magicNumber
 * @param {number | undefined} customX
 * @param {number | undefined} customY
 */
function setPlayerPerspective(player, magicNumber, customX, customY){
    if(customX !== undefined && customY !== undefined) player.teleport(player.location, {
        rotation: {
            x: customX,
            y: customY
        }
    });
    else if(magicNumber !== 0){
        const preset = presetMap.get(magicNumber);
        player.teleport(player.location, {
            rotation: {
                x: preset.x,
                y: preset.y
            }
        });
    }
}

world.afterEvents.playerSpawn.subscribe(data=>{
    if(data.initialSpawn){
        const players = world.getPlayers({name: data.player.name});
        if(players.length > 0){
            players[0].setDynamicProperty("lockPerspective", false);
            players[0].setDynamicProperty("lockMovement", false);
        }
    }
});
//#endregion

//#region 使用手册
/**显示使用手册。
 * @param {Player} player
 */
function showDocument(player){
    const documentForm = new ActionFormData().title("使用手册")
        .body(`欢迎来到土木之魂——工程工具箱。本插件旨在给各种工程增添极致的便利性，若有任何意见建议，欢迎反馈。

本工具箱的基本机制是标记一个坐标点，并测量另一个点到该点的各种参数，或便捷化对这个点的记忆、操作。

本工具箱有以下板块：标记点、标记点显示与操作、基于标记点的测量、外围功能。

§l§e1. 标记点§r

标记点是工具箱的核心功能支撑。如果不设置标记点，绝大多数功能将不可使用。

在标记点页面（主页第一个按钮），会显示大量的相关数据，便于快速查询。

当标记点和玩家同时处于非末地的任一维度（不要求相同）时，将同时显示主世界和下界坐标信息，另一个维度的坐标使用坐标转换得到。如果标记点和玩家任一处于末地，则只会显示标记点的维度和坐标。每一个维度对应的数据格式如下:

格式                             示例值

<维度名称>                       主世界

(标记点X坐标, …Y…, …Z…)           (10, 64, -20)

(标记点X子区块坐标, …Y…, …Z…)     (10, 0, 12)
§7子区块是16×16×16的立方体。此处坐标均为0~15§r

§7 in 分隔符§r

(子区块X坐标, …Y…, …Z…)           (0, 4, -2)
§7子区块在世界中的区块坐标§r

§7 / 分隔符§r

(标记点X减当前位置X, …Y…, …Z…)    (-10, 0, §e30§r)
§7用于快速测距，标黄数据为绝对值最大值§r

<去标记点X、Z需要的方块数>        1b+3s+14
§7用于估算不考虑Y轴抵达的用料，c：大箱潜影盒（54个潜影盒），b：潜影盒，s：组（以64物品为一组计）§r

<去标记点X、Y、Z需要的方块数>       26s+63
§7用于估算精确抵达的用料，PS：示例数据为进位前极限§r

§7 / 分隔符§r

<水平面上的欧几里得距离>         1035.8
§7同样不考虑Y轴距离。保留一位小数，下同§r

<完全欧几里得距离>               1041.2

完整示例：
主世界 (35, 85, -43) / (§e95§r, -13, -42) 2s+9 2s+22 / 103.9 104.7

§l§e2. 标记点显示与操作§r

“在世界中显示标记点（仅自己可见）”为持久性开关，在玩家重新加入游戏后自动关闭； “打印所有信息到聊天并关闭窗口”和“向公屏发送标记点坐标并关闭窗口”是一次性开关，打开这些开关并点击确定后将立即关闭窗口并执行对应操作。如果此时还选择了操作标记点，则更改标记点会因窗口关闭而无用，§l但删除标记点选项会正常工作，且标记点已删除，不会在世界中显示§r。

“在世界中显示标记点（仅自己可见）”： 在标记点及其毗邻六面方块中显示仅自己可见的火焰和指引粒子。
“打印所有信息到聊天并关闭窗口”： 将标记点页面上的所有数据全部打印到聊天栏，仅自己可见，便于边干活边看数据。
“向公屏发送标记点坐标并关闭窗口”： 类似于在标记点执行${prefixs[0]}c false。

在没有标记点时，可以新建标记点；在存在标记点时，可以更改或删除标记点。也可以不打开窗口而使用${prefixs[0]}l set设置当前位置为标记点， ${prefixs[0]}l del删除标记点。如果选择新建或更改标记点，点击确定后，将进入编辑页面。§l请务必滚动页面到最上端，完整浏览窗口§r。若所有输入框全部留空，则新的数据为文本框内默认数据，即当前位置。若有输入框为空但不全空，认为漏填，会显示信息不全的警告，点击“确定”返回修改已填写的数据，“取消”回到标记点页面。若输入数据无法解析，会显示信息有误的警告，按钮同上。

对于维度的输入，可以选择输入中文全称（主世界、下界、末地）或英语小写缩写（o、n、e）。

§l§e3. 基于标记点的测量§r

目前提供四种工程测量：测量距离、挖掘隧道、铺设平面、填充长方体。实际上只有三种：直线、点到点算法、立体（平面就是某一个轴为1的立体）。所有测量工具坐标均可以快速输入为标记点或当前位置，也可以手动编辑。

“测量距离”： 相当于将标记点页面的数据筛选后展示，支持两坐标X、Y、Z三者任意混合的曼哈顿、欧几里得测量。

“挖掘隧道”： 提供两种模式， 1.输入隧道代码（基岩服隧道代码标准）和一个坐标，求最终抵达的坐标； 2.输入两个坐标和任意多的途经点或避让点/避让隧道，获得连通两坐标的最高效的隧道代码。

“铺设平面”： 显示两坐标X、Z（Z、Y；X、Y）轴之间铺设平面需要的方块数。

“填充长方体”： 显示填充两坐标之间的长方体需要的方块数。

§l§e4. 外围功能§r

点击行动锁定，可以选择锁定视角或锁定移动，方便某些情况下的方块放置等工作。

点击其它，可以立即显示当前坐标边界，还可以关闭所有的附加提示，包括添加标记点的提示、快速指令的提示等。如果已经熟悉操作，建议关闭这些提示，以减少干扰。

点击使用手册可以看到这一大堆鬼东西。

点击关闭窗口可以获得32767个127堆叠的含有27组每组64个含有27组127堆叠的含有27组127堆叠的带有游戏中所有附魔且为32767级的附魔金苹果的淡灰色潜影盒的NBT数据箱的淡蓝色潜影盒。如果没有获得，请立即找开发者用这个插件的后门给你补发:)

`).button("返回主页", "textures/ui/wysiwyg_reset");
    //@ts-ignore 实在是666，自己的server-ui依赖server@1.14.0而不是1.15.0-beta
    documentForm.show(player).then(response=>{
        showMain(player);
    });
}
//#endregion