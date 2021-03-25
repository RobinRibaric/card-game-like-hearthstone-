import { writable } from 'svelte/store';

export const userGraveyard = writable([]);
export const opponentGraveyard = writable([]);

export const addCardToUserGraveyard = (card) => {
    userGraveyard.update(grave => [...grave, card]);
};

export const addCardToOpponentGraveyard = (card) => {
    opponentGraveyard.update(grave => [...grave, card]);
};

export const setUserGraveyard = (newGrave) => {
    userGraveyard.update(grave => [...newGrave]);
}
export const setOpponentGraveyard = (newGrave) => {
    opponentGraveyard.update(grave => [...newGrave]);
}