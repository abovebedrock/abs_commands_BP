//@ts-check
import { world } from "@minecraft/server";
import { registerCommand } from "./commandBase";

export function aboutInit(){}

registerCommand({
    names: ["about"],
    description: "关于服务器的一切。",
    document: "LJM12914荣誉出品。",
    args: [],
    callback: (_name, player)=>{
        player.sendMessage(`§e§l基岩之上服务器`);
        player.sendMessage("§。§e§lAboveBedrock SMP");
        player.sendMessage("第八季");
        player.sendMessage("§b版本：1.21.20/21");
        player.sendMessage(`白名单玩家：${[
            "LJM12914",
            "DK6666Orange",
            "TJJ456",
            "gaobaisixi",
            "Cyttong0222",
            "wjlfish",
            "Lyzyx99",
            "Cr3st_39"
        ].join(", ")}`);
        player.sendMessage("§b网站：https://www.abovebedrock.com");
        player.sendMessage("§6IP地址：abovebedrock.com（19132）");
        player.sendMessage("§。§e§l2018-2024 ABS!");
        return true;
    }
});