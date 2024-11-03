import { system } from "@minecraft/server";
import { registerCommand } from "./commandBase";
import { HttpRequest, HttpRequestMethod, http } from "@minecraft/server-net";

export function performanceInit(){}

registerCommand({
    names: ["p", "performance", "xn", "ping", "yc", "mspt", "tps"],
    description: "显示服务器TPS等性能数据，需要等待一段时间来测量。",
    args: [],
    callback: async (_name, player)=>{
        player.sendMessage("请稍候，正在测量……");
        const str = await getPerformanceString("b");
        player.sendMessage(str);
        return true;
    }
});

/**抽提出来给其他地方用的东西
 * @param {string | undefined} [textColor] 除了关键数据外，其他文本的颜色，为单个字符。字符串最后面存在一个§r。
 * @returns {Promise<string>}
 */
export async function getPerformanceString(textColor){
    const [tps, mspt] = await getTPS(), ping = await getPing();
    return `§${textColor ?? "f"}TPS： §e${tps.toFixed(1)}§${textColor ?? "f"}， MSPT： §e${mspt.toFixed(2)}§${textColor ?? "f"}， ${ping !== undefined ? `Ping： §e${ping.toFixed(0)}ms§${textColor ?? "f"}` : "Ping暂时无法测量"}。§r`;
}

/**使用两秒获得服务器 `[TPS, MSPT]`。
 * @returns {Promise<[number, number]>}
 */
async function getTPS(){
    return new Promise(resolve=>{
        const preTime = Date.now();
        system.runTimeout(()=>{
            const tps = 40 / (Date.now() - preTime) * 1000;
            resolve([tps, 1000 / tps]);
        }, 40);
    });
}

/**获得服务器ping，默认执行5次。
 * @param {number | undefined} [time]
 * @returns {Promise<number | undefined>}
 */
async function getPing(time){
    return new Promise(async resolve=>{
        let totalPing = 0;
        for(let i = 0; i < (time ?? 5); i++){
            const preTime = Date.now(), request = new HttpRequest("http://frp-mix.top");
            request.method = HttpRequestMethod.Head;
            request.addHeader("cache", "no-cache");
            const response = http.request(request), uselessVarForAsyncNeed = await response;
            response.catch(()=>resolve(undefined));
            totalPing += Date.now() - preTime;
        }
        resolve(totalPing / 10);
    });
}