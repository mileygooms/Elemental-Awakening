export async function getShopItems(client) {
    return await client.db.get('shopItems', []);
}

export async function saveShopItems(client, items) {
    await client.db.set('shopItems', items);
}
