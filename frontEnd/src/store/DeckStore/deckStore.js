import { writable } from 'svelte/store';

import { v4 as uuidv4 } from 'uuid';

export const userDeck = writable([]);
export const opponentDeck = writable([]);

export const setUserDeck = (newDeck) => {
    userDeck.update(deck => [...newDeck]);
}

export const drawCardsFromDeck = (amount) => {
    let cards = [];

    userDeck.update(deck => {
        for (let i = 0; i < amount; i++) {
            let card = deck.pop();
            cards.push(card);
        }
        return deck;
    });
    return cards;
}