import { writable, get } from 'svelte/store';


export const userHand = writable([]);
export const opponentHand = writable([]);

/* SETTERS */
export const setOpponentHand = (newHand) => {
    opponentHand.update(hand => [...newHand]);
}

export const setUserHand = (newHand) => {
    userHand.update(hand => [...newHand]);
}

/* ADD ONE */
export const addCardToUserHand = (card) => {
    userHand.update(hand => [...hand, card]);
}

export const addCardToOpponentHand = (card) => {
    opponentHand.update(hand => [...hand, card]);
}
/* ADD MULTIPLE */
export const addCardsToUserHand = (cards) => {
    userHand.update(hand => [...hand, ...cards]);
}

export const addCardsToOpponentHand = (cards) => {
    opponentHand.update(hand => [...hand, ...cards]);
}

export const getMinionFromUserHand = (id) => {
    let hand = get(userHand);
    let card = hand.find(card => card.id === id);
    console.log(id, hand)
    return card;
}

export const removeCardInUserHand = (id) => {
    let card = get(userHand).find(card => card.id === id);
    userHand.update(hand => hand.filter(card => card.id !== id));
    return card;
}

export const removeCardInOpponentHand = (cardID) => {
    let card = get(opponentHand).find(card => card.id === cardID);
    opponentHand.update(hand => hand.filter(card => card.id !== cardID));
    return card;
}


export const buffUserHand = (buffData) => {
    userHand.update(hand => {
        hand.forEach(card => {
            if (card.type === 'minion') {
                card.tempStats.atk += buffData.atkBuff;
                card.tempStats.health += buffData.healthBuff;
            }
        });
        return hand;
    });
}
