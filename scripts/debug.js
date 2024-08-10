//@ts-check
import { system, Player, world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function debugInit(){}

registerCommand({
    names: ["getpp"],
    description: "获取玩家的附加属性。",
    tagRequired: ["dev"],
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
                    player.sendMessage(`${content}`);
                    break;
                case "boolean":
                    player.sendMessage(content ? "true" : "false");
                    break;
                case "undefined":
                    player.sendMessage("undefined");
                    player.sendMessage("real undefined!");
                    break;
                case "object":
                    player.sendMessage(`${content.x}, ${content.y}, ${content.z}`);
                    player.sendMessage("real Vector3!");
                    break;
            }
        }
        return true;
    }
});

registerCommand({
    names: ["setpp"],
    description: "设置玩家的附加属性，undefined6，true6，false6，不支持坐标。",
    tagRequired: ["dev"],
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
            if(args.value === "undefined6") player.setDynamicProperty(/**@type {string}*/ (args.property), undefined);
            else if(args.value === "true6") player.setDynamicProperty(/**@type {string}*/ (args.property), true);
            else if(args.value === "false6") player.setDynamicProperty(/**@type {string}*/ (args.property), false);
            else player.setDynamicProperty(/**@type {string}*/ (args.property), args.value);
        }
        return true;
    }
});