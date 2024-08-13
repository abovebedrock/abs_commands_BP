//@ts-check
import { world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function debugInit(){}

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
                    player.sendMessage(`${args.property}： ${content ? "true" : "false"}`);
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
            player.sendMessage(`所有ID：${[target[0].getDynamicPropertyIds().join(",")]}`);
            player.sendMessage(`占用大小：${target[0].getDynamicPropertyTotalByteCount()}`);
        }
        return true;
    }
});

registerCommand({
    names: ["gwp"],
    description: "获取世界的附加属性。",
    tagsRequired: ["dev"],
    args: [{
        name: "property",
        optional: false,
        type: "string"
    }],
    callback: (_name, player, args)=>{
        const content = world.getDynamicProperty(/**@type {string}*/ (args.property));
        switch(typeof content){
            case "string":
            case "number":
                player.sendMessage(`${args.property}： ${content}`);
                break;
            case "boolean":
                player.sendMessage(`${args.property}： ${content ? "true" : "false"}`);
                break;
            case "undefined":
                player.sendMessage(`${args.property}： undefined\nreal undefined!`);
                break;
            case "object":
                player.sendMessage(`${args.property}： ${content.x}, ${content.y}, ${content.z}\nreal Vector3!`);
                break;
        }
        return true;
    }
});

registerCommand({
    names: ["swp"],
    description: "设置世界的附加属性，undefined6，true6，false6，不支持坐标。",
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
        if(args.value === "undefined6") world.setDynamicProperty(/**@type {string}*/ (args.property), undefined);
        else if(args.value === "true6") world.setDynamicProperty(/**@type {string}*/ (args.property), true);
        else if(args.value === "false6") world.setDynamicProperty(/**@type {string}*/ (args.property), false);
        else world.setDynamicProperty(/**@type {string}*/ (args.property), args.value);
        player.sendMessage(`成功设置世界附加属性${args.property}为${args.value}。`);
        return true;
    }
});

registerCommand({
    names: ["cwp"],
    description: "清除世界的附加属性。",
    tagsRequired: ["dev"],
    args: [],
    callback: (_name, player)=>{
        world.clearDynamicProperties();
        player.sendMessage("成功清除世界附加属性。");
        return true;
    }
});

registerCommand({
    names: ["qwp"],
    description: "查询世界的附加属性信息。",
    tagsRequired: ["dev"],
    args: [],
    callback: (_name, player)=>{
        player.sendMessage(`所有ID：${[world.getDynamicPropertyIds().join(" ")]}`);
        player.sendMessage(`占用大小：${world.getDynamicPropertyTotalByteCount()}`);
        return true;
    }
});