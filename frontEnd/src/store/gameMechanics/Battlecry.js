import { drawCards } from './utils';
import { userDeck, drawCardsFromDeck } from '../DeckStore/deckStore';
import { userHand, addCardsToUserHand } from '../HandStore/handStore';
import { draw } from 'svelte/types/runtime/transition';
import { v4 as uuidv4 } from 'uuid';


export const evalBattlecry = (card) => {
    let stateToUpdate = '';
    if (card.effect.primary.draw) {

        stateToUpdate = 'hand';

        if (card.effect.draw.buff) {

        } else if (card.effect.draw.duplicate) {
            duplicateOnDraw(card.effect.drawData.drawAmount);

        } else if (card.effect.draw.duplicateAndBuff) {
        } else {
            drawCards(card.effect.drawData.drawAmount);
        }
    }
    return stateToUpdate;
}


const duplicateOnDraw = (drawAmount) => {
    let cards = drawCardsFromDeck(drawAmount);
    let dupCards = [];
    cards.forEach(card => {
        let dupCard = { ...card, id: uuidv4() }
        dupCards.push(dupCard);
    });

    addCardsToUserHand([...cards, ...dupCards]);

}