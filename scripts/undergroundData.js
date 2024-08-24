//@ts-check

/**@enum {string}
 * @readonly*/
const statusTypes = {
   operational: "已建成", 
   planning: "规划中",
   planned: "准备建设",
   constructing: "建设中"
};

/**
 * @typedef {{
 *     name :string;
 *     status? :statusTypes;
 *     coordinate? :import("@minecraft/server").Vector3;
 *     netherStatus? :statusTypes;
 *     netherCoordinate? :import("@minecraft/server").Vector3;
 *     interchange :boolean;
 * }} Station
 * @type {{
 *     updateTime :string;
 *     lines: number[][];
 *     lineColors :string[];
 *     additionalInfo :string;
 *     stations: Station[];
 * }}
 * @readonly*/
const undergroundData = {
    updateTime: "2024.8.24",
    lines: [
        [28, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [10, 5, 11, 12, 13, 14, 15, 16],
        [17, 18, 19, 10, 7, 14],
        [],
        [-20, -21, -10, -11, -22, -23, -24],
        [-19, -21, -25, -26, -27]
    ],
    lineColors: ["e", "9", "6", "", "c", "d"],
    additionalInfo: "3号线未开通。",
    stations: [
        {
            name: "雪山",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "东山",
            interchange: false,
            status: statusTypes.planned,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "樱花岭",
            interchange: false,
            status: statusTypes.operational,
            coordinate: {
                x: 207,
                y: 80,
                z: -563
            }
        },
        {
            name: "北村",
            interchange: false,
            status: statusTypes.operational,
            coordinate: {
                x: 81,
                y: 62,
                z: -482
            }
        },
        {
            name: "中坪",
            interchange: true,
            status: statusTypes.operational,
            coordinate: {
                x: 81,
                y: 58,
                z: -387
            }
        },
        {
            name: "喉口",
            interchange: false,
            status: statusTypes.operational,
            coordinate: {
                x: 81,
                y: 55,
                z: -282
            }
        },
        {
            name: "出生点",
            interchange: true,
            status: statusTypes.operational,
            coordinate: {
                x: -4,
                y: 101,
                z: -13
            }
        },
        {
            name: "北岸",
            interchange: false,
            status: statusTypes.planned,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "蘑菇岛",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "河西",
            interchange: true,
            status: statusTypes.operational,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: -42,
                y: 51,
                z: -396
            }
        },
        {
            name: "传送门",
            interchange: true,
            status: statusTypes.operational,
            netherStatus: statusTypes.constructing,
            coordinate: {
                x: 210,
                y: 60,
                z: -383
            }
        },
        {
            name: "四季滩",
            interchange: false,
            status: statusTypes.operational,
            coordinate: {
                x: 300,
                y: 60,
                z: -383
            }
        },
        {
            name: "大学",
            interchange: false,
            status: statusTypes.operational,
            coordinate: {
                x: 325,
                y: 66,
                z: -339
            }
        },
        {
            name: "东新",
            interchange: true,
            status: statusTypes.operational,
            coordinate: {
                x: 284,
                y: 57,
                z: -185
            }
        },
        {
            name: "带湾",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "砂场",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "重庆村",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "四川村",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "四川",
            interchange: true,
            status: statusTypes.planning,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "沙漠恶地",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "丛林",
            interchange: true,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "西海底神殿",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "中途岛",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "雪地",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "红沼",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "南坪前哨站",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "沼泽",
            interchange: false,
            netherStatus: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        },
        {
            name: "东北平原",
            interchange: false,
            status: statusTypes.planning,
            coordinate: {
                x: 0,
                y: 0,
                z: 0
            }
        }
    ]
};

export{
    undergroundData,
    statusTypes
};