import { BiomeTypes, Block, Dimension, Player, system, world } from "@minecraft/server";

export function commonInit(){}

//#region 元数据
/**@type {{
 *     updateTime: "2024.10.2",
 *     version: "1.21.30",
 *     season: "八",
 *     seasonNum: 8
 * }}*/
export const meta = {
    updateTime: "2024.10.2",
    version: "1.21.30",
    season: "八",
    seasonNum: 8
};

/**@type {[
 *     "LJM12914",
 *     "DK6666Orange",
 *     "Cyttong0222",
 *     "TJJ456",
 *     "Lyzyx99",
 *     "wjlfish",
 *     "gaobaisixi",
 *     "Cr3st_39"
 * ]}*/
export const absPlayerNames = [
    "LJM12914",
    "DK6666Orange",
    "Cyttong0222",
    "TJJ456",
    "Lyzyx99",
    "wjlfish",
    "gaobaisixi",
    "Cr3st_39"
];
//#endregion

//#region 距离度量
/**获得水平面上的欧几里得距离**绝对值**。
 * @param {import("@minecraft/server").Vector3} location1
 * @param {import("@minecraft/server").Vector3} location2
 * @returns {number}
 */
export function getHorizontalDistance(location1, location2){
    return Math.sqrt(Math.pow(location1.x - location2.x, 2) + Math.pow(location1.z - location2.z, 2));
}

/**获得完整欧几里得距离**绝对值**。
 * @param {import("@minecraft/server").Vector3} location1
 * @param {import("@minecraft/server").Vector3} location2
 * @returns {number}
 */
export function getDistance(location1, location2){
    return Math.sqrt(Math.pow(location1.x - location2.x, 2) + Math.pow(location1.y - location2.y, 2) + Math.pow(location1.z - location2.z, 2));
}

/**获得曼哈顿距离的**绝对值**。`[x, y, z]`
 * @param {import("@minecraft/server").Vector3} location1
 * @param {import("@minecraft/server").Vector3} location2
 * @returns {import("@minecraft/server").Vector3}
 */
export function getManhattanDistance(location1, location2){
    return {
        x: Math.abs(location1.x - location2.x),
        y: Math.abs(location1.y - location2.y),
        z: Math.abs(location1.z - location2.z)
    };
}
//#endregion

//#region 分隔符
export const separator = {
    get value(){
        if(this.cache === undefined) this.cache = /**@type {string}*/ (world.getDynamicProperty("separator"));
        return this.cache;
    },
    /**@type {string | undefined}*/
    cache: undefined
};

/**更新分隔符，在生产端尽可能不要用！
 * @param {string} newStr
 */
export function updateSeparator(newStr){
    const oldStr = separator.value, wps = world.getDynamicPropertyIds();
    for(let i = 0; i < wps.length; i++) if(wps[i].includes(oldStr)){
        world.setDynamicProperty(wps[i].replaceAll(oldStr, newStr), /**@type {string}*/ (world.getDynamicProperty(wps[i])).replaceAll(oldStr, newStr));
        world.setDynamicProperty(wps[i], undefined);
    }
    world.setDynamicProperty("separator", newStr);
    separator.cache = undefined;
}
//#endregion

//#region 坐标和维度
export const dimensionIds = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

/**获得整数坐标（符合玩家屏幕标准），`[location, dimension]`。
 * @param {Player} player
 * @returns {[import("@minecraft/server").Vector3, Dimension]}
 */
export function getCoordinate(player){
    return [
        {
            x: Math.floor(player.location.x),
            y: Math.floor(player.location.y),
            z: Math.floor(player.location.z),
        },
        player.dimension
    ]
}

/**获取下界坐标，**仅限整数，不会检查维度！**
 * @param {import("@minecraft/server").Vector3} coord
 * @returns {import("@minecraft/server").Vector3}
 */
export function getNetherCoordinate(coord){
    return {
        x: Math.floor(coord.x / 8),
        y: coord.y >= 128 ? 128 : coord.y <= 0 ? 0 : coord.y,
        z: Math.floor(coord.z / 8)
    };
}

/**获取主世界坐标，**仅限整数，不会检查维度！**
 * @param {import("@minecraft/server").Vector3} coord
 * @returns {import("@minecraft/server").Vector3}
 */
export function getOverworldCoordinate(coord){
    return {
        x: coord.x * 8,
        y: coord.y,
        z: coord.z * 8
    };
}

/**获取子区块坐标和子区块内坐标。`Math.floor` 非整数。`[subChunkCoord, coordInchunk]`
 * @param {import("@minecraft/server").Vector3} coord
 * @returns {[import("@minecraft/server").Vector3, import("@minecraft/server").Vector3]}
 */
export function getSubchunkCoordinate(coord){
    const
        /**@type {import("@minecraft/server").Vector3}*/
        flooredCoord = {
            x: Math.floor(coord.x),
            y: Math.floor(coord.y),
            z: Math.floor(coord.z)
        },
        /**@type {import("@minecraft/server").Vector3}*/
        subChunkCoord = {
            x: Math.floor(flooredCoord.x / 16),
            y: Math.floor(flooredCoord.y / 16),
            z: Math.floor(flooredCoord.z / 16)
        };
    return [subChunkCoord, {
        x: flooredCoord.x - subChunkCoord.x * 16,
        y: flooredCoord.y - subChunkCoord.y * 16,
        z: flooredCoord.z - subChunkCoord.z * 16
    }];
}

/**@type {Readonly<Map<string, string>>}*/
export const dimensionLocalezhCN = new Map([
    [dimensionIds[0], "主世界"],
    [dimensionIds[1], "下界"],
    [dimensionIds[2], "末地"]
]);

/**获取维度魔数。
 * @param {Dimension} dimension
 * @returns {"o" | "n" | "e"}
 */
export function getDimensionML(dimension){
    return dimension.id === dimensionIds[0] ? "o" : dimension.id === dimensionIds[1] ? "n" : "e";
}

/**从维度魔数还原维度对象。
 * @param {"o" | "n" | "e"} ml 魔数。
 * @returns {Dimension}
 */
export function retrieveDimension(ml){
    switch(ml){
        case "o": return world.getDimension(dimensionIds[0]);
        case "n": return world.getDimension(dimensionIds[1]);
        case "e": return world.getDimension(dimensionIds[2]);
    }
}
//#endregion

//#region 生物群系
const biomeLocalezhCN = new Map([
    ["ocean", "海洋"], ["plains", "平原"], ["desert", "沙漠"], ["extreme_hills", "风袭丘陵"],
    ["forest", "森林"], ["taiga", "针叶林"], ["swampland", "沼泽"], ["river", "河流"],
    ["hell", "下界荒地"], ["the_end", "末地"], ["legacy_frozen_ocean", "冻洋（旧版）"], ["frozen_river", "冻河"],
    ["ice_plains", "雪原"], ["ice_mountains", "雪山"], ["mushroom_island", "蘑菇岛"], ["mushroom_island_shore", "蘑菇岛岸"],
    ["beach", "沙滩"], ["desert_hills", "沙漠丘陵"], ["forest_hills", "繁茂的丘陵"], ["taiga_hills", "针叶林丘陵"],
    ["extreme_hills_edge", "山地边缘"], ["jungle", "丛林"], ["jungle_hills", "丛林丘陵"], ["jungle_edge", "稀疏丛林"],
    ["deep_ocean", "深海"], ["stone_beach", "石岸"], ["cold_beach", "积雪沙滩"], ["birch_forest", "桦木森林"],
    ["birch_forest_hills", "桦木森林丘陵"], ["roofed_forest", "黑森林"], ["cold_taiga", "积雪针叶林"], ["cold_taiga_hills", "积雪的针叶林丘陵"],
    ["mega_taiga", "原始松木针叶林"], ["mega_taiga_hills", "巨型针叶林丘陵"], ["extreme_hills_plus_trees", "风袭森林"], ["savanna", "热带草原"],
    ["savanna_plateau", "热带高原"], ["mesa", "恶地"], ["mesa_plateau_stone", "繁茂的恶地高原"], ["mesa_plateau", "恶地高原"],
    ["warm_ocean", "暖水海洋"], ["deep_warm_ocean", "暖水深海"], ["lukewarm_ocean", "温水海洋"], ["deep_lukewarm_ocean", "温水深海"],
    ["cold_ocean", "冷水海洋"], ["deep_cold_ocean", "冷水深海"], ["frozen_ocean", "冻洋"], ["deep_frozen_ocean", "冰冻深海"],
    ["bamboo_jungle", "竹林"], ["bamboo_jungle_hills", "竹林丘陵"], ["sunflower_plains", "向日葵平原"], ["desert_mutated", "沙漠湖泊"],
    ["extreme_hills_mutated", "风袭沙砾丘陵"], ["flower_forest", "繁花森林"], ["taiga_mutated", "针叶林山地"], ["swampland_mutated", "沼泽丘陵"],
    ["ice_plains_spikes", "冰刺之地"], ["jungle_mutated", "丛林变种"], ["jungle_edge_mutated", "丛林边缘变种"], ["birch_forest_mutated", "原始桦木森林"],
    ["birch_forest_hills_mutated", "高大桦木丘陵"], ["roofed_forest_mutated", "黑森林丘陵"], ["cold_taiga_mutated", "积雪的针叶林山地"], ["redwood_taiga_mutated", "原始云杉针叶林"],
    ["redwood_taiga_hills_mutated", "巨型云杉针叶林丘陵"], ["extreme_hills_plus_trees_mutated", "沙砾山地+"], ["savanna_mutated", "风袭热带草原"], ["savanna_plateau_mutated", "破碎的热带高原"],
    ["mesa_bryce", "风蚀恶地"], ["mesa_plateau_stone_mutated", "繁茂的恶地高原变种"], ["mesa_plateau_mutated", "恶地高原变种"], ["soulsand_valley", "灵魂沙峡谷"],
    ["crimson_forest", "绯红森林"], ["warped_forest", "诡异森林"], ["basalt_deltas", "玄武岩三角洲"], ["jagged_peaks", "尖峭山峰"],
    ["frozen_peaks", "冰封山峰"], ["snowy_slopes", "积雪山坡"], ["grove", "雪林"], ["meadow", "草甸"],
    ["lush_caves", "繁茂洞穴"], ["dripstone_caves", "溶洞"], ["stony_peaks", "裸岩山峰"], ["deep_dark", "深暗之域"],
    ["mangrove_swamp", "红树林沼泽"], ["cherry_grove", "樱花树林"]
]);

/**获得玩家所在生物群系的 ID 和中文名。虚空为 undefined。`[id, name]`
 * @param {Player} player
 * @returns {Promise<[string, string]>}
 */
export async function getBiome(player){
    let shortestBiomeDistance = Infinity, shortestBiome = "";
    return new Promise(resolve=>{
        system.run(()=>{
            //world.sendMessage(`起始位置：${player.location.x} ${player.location.y} ${player.location.z}`);
            const biomes = BiomeTypes.getAll();
            for(let i = 0; i < biomes.length; i++){
                const result = player.dimension.findClosestBiome({
                    x: player.location.x + 32,
                    y: player.location.y,
                    z: player.location.z + 32 
                }, biomes[i], {boundingSize: {x: 64, y: 64, z: 64}});
                if(result){
                    const distance = getHorizontalDistance(result, player.location);
                    //world.sendMessage(`${biomes[i].id} ${result.x} ${result.y} ${result.z} ${distance.toFixed(1)}`);
                    if(distance < shortestBiomeDistance){
                        //world.sendMessage(`now ${biomes[i].id}`);
                        shortestBiomeDistance = distance;
                        shortestBiome = biomes[i].id;
                    }
                }
            }
            resolve([shortestBiome, /**@type {string}*/ (biomeLocalezhCN.get(shortestBiome.replace("minecraft:", "")))]);
        });
    });
}
//#endregion

//#region 时间
/**获得所有空格被_替代的时间字符串。
 * @returns {string}
 */
export function getTimeString(){
    const date = new Date();
    //东八区
    date.setHours(date.getHours() + 8);
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}_${date.getHours()}:${(date.getMinutes() + "").padStart(2, "0")}:${(date.getSeconds() + "").padStart(2, "0")}`;
}
//#endregion

//#region 锁公共方法
/**生成附加属性键名。
 * @param {Block} block
 * @param {boolean} isOminous
 * @param {boolean} isDoor
 * @returns {string}
 */
function generateKey(block, isOminous, isDoor){
    return `${isDoor ? "d" : ""}${isOminous === true ? "o" : ""}${block.location.x},${block.location.y},${block.location.z}${getDimensionML(block.dimension)}`;
}

/**设置坐标密码。
 * @param {Block} block
 * @param {string} password
 * @param {boolean} isOminous
 * @param {boolean} isDoor
 */
export function setPassword(block, password, isOminous, isDoor){
    world.setDynamicProperty(generateKey(block, isOminous, isDoor), password);
}

/**获取密码。
 * @param {Block} block
 * @param {boolean} isOminous
 * @param {boolean} isDoor
 * @returns {string | undefined}
 */
export function getPassword(block, isOminous, isDoor){
    return /**@type {string | undefined}*/ (world.getDynamicProperty(generateKey(block, isOminous, isDoor)));
}

/**重置坐标的全部密码。
 * @param {Block} block
 * @param {boolean} isDoor
 */
export function resetPassword(block, isDoor){
    //world.sendMessage(`reset ${generateKey(block, false)}`);
    world.setDynamicProperty(generateKey(block, false, isDoor), undefined);
    world.setDynamicProperty(generateKey(block, true, isDoor), undefined);
}
//#endregion

//#region 容器
const containerIds = [
    "chest",
    "trapped_chest",
    "barrel",
    "furnace",
    "smoker",
    "blast_furnace",
    "dispenser",
    "dropper",
    "hopper",
    "crafter",
    "brewing_stand",
    "ender_chest"
].map(value=>`minecraft:${value}`);

/**判断是否为可以锁上的容器方块。
 * @param {Block} block
 * @returns {boolean}
 */
export function isContainer(block){
    try {return containerIds.includes(block.typeId) || /minecraft:.+_shulker_box/.test(block.typeId);}
    catch(e) {return false;}
}
//#endregion

//#region 门、栅栏门和活板门
/**各种形态的半径盒。为了抵抗JS的number偏差，所有数值都比它应该的数值大0.00001。
 * @type{{
 *     door: {
 *         front: 0.09126,
 *         side: 0.50001,
 *         height: 1.00001
 *     },
 *     fenceGate: {
 *         front: 0.12501,
 *         height: 0.75001
 *     },
 *     trapdoor: {
 *         height: 0.50001
 *     }
 *     player: {
 *         horizontal: 0.3
 *     },
 *     error: 0.00001
 * }}
*/
export const radiusList = {
    door: {
        front: 0.09126,
        side: 0.50001,
        height: 1.00001
    },
    fenceGate: {
        front: 0.12501,
        height: 0.75001
    },
    trapdoor: {
        height: 0.50001
    },
    player: {
        horizontal: 0.3
    },
    error: 0.00001
};

/**各种形态的碰撞箱，用于计算方块中心，相比判定的半径盒减掉了误差。
 * @type{{
 *     door: {
 *         front: 0.09125,
 *         side: 0.5,
 *         height: 1,
 *         deltaKnob: 0.2
 *     },
 *     fenceGate: {
 *         front: 0.125,
 *         height: 0.75
 *     },
 *     trapdoor: {
 *         height: 0.5
 *     }
 * }}
*/
export const boxList = {
    door: {
        front: 0.09125,
        side: 0.5,
        height: 1,
        deltaKnob: 0.2
    },
    fenceGate: {
        front: 0.125,
        height: 0.75
    },
    trapdoor: {
        height: 0.5
    }
};

const
    woodIds = [
        "oak",
        "spruce",
        "birch",
        "jungle",
        "acacia",
        "dark_oak",
        "mangrove",
        "cherry",
        "bamboo",
        "crimson",
        "warped"
    ],
    copperIds = [
        "copper",
        "exposed_copper",
        "weathered_copper",
        "oxidized_copper",
        "waxed_copper",
        "waxed_exposed_copper",
        "waxed_weathered_copper",
        "waxed_oxidized_copper"
    ];

const _2BdoorIds = ["wooden", ...woodIds.slice(1), ...copperIds].map(value=>`minecraft:${value}_door`);

/**判断是否为可以锁上的门，除了铁门外任何门都可以。
 * @param {Block | string} blockOrId
 * @returns {boolean}
 */
export function is2BDoor(blockOrId){
    //???:这个try块有啥用？先给你注释
    //try {
        return _2BdoorIds.includes(typeof blockOrId === "string" ? blockOrId : blockOrId.typeId);
    //}
    //catch(e) {return false;}
}

const fenceGateIds = ["", ...woodIds.slice(1).map(value=>`${value}_`)].map(value=>`minecraft:${value}fence_gate`);

/**判断是否为栅栏门，所有栅栏门都可以被锁上。
 * @param {Block | string} blockOrId
 * @returns {boolean}
 */
export function isFenceGate(blockOrId){
    return fenceGateIds.includes(typeof blockOrId === "string" ? blockOrId : blockOrId.typeId);
}

const trapdoorIds = ["", ...woodIds.slice(1).map(value=>`${value}_`), ...copperIds.map(value=>`${value}_`)].map(value=>`minecraft:${value}trapdoor`);

/**判断是否为可以锁上的活板门，除了铁活板门外任何都可以。
 * @param {Block | string} blockOrId
 * @returns {boolean}
 */
export function isTrapdoor(blockOrId){
    return trapdoorIds.includes(typeof blockOrId === "string" ? blockOrId : blockOrId.typeId);
}
//#endregion

//#region 玩家相关
/**获取玩家全身高度。
 * @param {Player} player
 * @returns {number}
 */
export function getPlayerHeight(player){
    const playerEyeHeight = (player.getHeadLocation().y - player.location.y).toFixed(1);
    if(playerEyeHeight === "1.5") return 1.8;
    else if(playerEyeHeight === "1.2") return 1.49;
    else if(playerEyeHeight === "0.3") return 0.6;
    else{
        //玩家骑乘东西的时候就会这样，但是现在所有的可骑乘实体宽度都大于1b减去门的厚度，本来就进不去，也不用传送，直接0即可
        //console.warn(`Player ${player.name} eye height get ${playerEyeHeight}!`);
        //world.sendMessage("§e出现了一个 bug，请通知开发者查看日志！");
        return 0;
    }
}
//#endregion