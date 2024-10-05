/**判断是否为添加的物品。
 * @param {string} typeId 方块 ID。
 * @returns {boolean}
 */
export function isModItem(typeId){
    return typeId.includes("abs:");
}

/**获取命名空间，不包含冒号 `:`。
 * @param {string} typeId 方块 ID。
 * @returns {string}
 */
export function getNamespace(typeId){
    return typeId.substring(0, typeId.indexOf(":"));
}