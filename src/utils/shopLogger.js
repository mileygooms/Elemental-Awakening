export function logPurchase(user, item, qty, total) {

    console.log(
        `[SHOP] ${user.tag} purchased ${qty}x ${item.name} ($${total})`
    );
}
