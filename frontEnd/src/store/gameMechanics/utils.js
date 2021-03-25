import { userDeck } from '../DeckStore/deckStore';
import { userHand, addCardToUserHand, removeCardInOpponentHand, removeCardInUserHand, addCardsToUserHand } from '../HandStore/handStore';
import { addCardToOpponentGraveyard, addCardToUserGraveyard, opponentGraveyard } from '../GraveyardStore/graveyardStore';
import { userBoard, opponentBoard, damageOpponentMinion, damageUserMinion, checkOpponentBoardForDeadMinions, checkUserBoardForDeadMinions, updateOpponentMinionOnBoard, updateUserMinionOnBoard, reduceUserMinionAtkPoints } from '../BoardStore/boardStore';
import { gameState, dealDamageToOpponentHero } from '../GameStore/gameStore';

import { get } from 'svelte/store';


/* DRAW CARDS FROM DECK */
export const drawCard = () => {
    let card;
    userDeck.update(deck => {
        card = deck.pop();

        return deck;
    });
    addCardToUserHand(card);
    console.log(get(userHand), 'draw card');
    return card;
}

export const drawCards = (amount) => {
    let cards = [];
    userDeck.update(deck => {
        for (let i = 0; i < amount; i++) {
            let card = deck.pop();
            cards.push(card);
        }
        return deck;
    });
    console.log(cards, 'drawiing')
    addCardsToUserHand(cards);
    return cards;
}


/* BATTLE BETWEEN MINIONS */
export const resolveBattle = (atkID, defID) => {
    let user = get(userBoard);
    let opponent = get(opponentBoard);
    let cardUser = user.find(card => card.id === atkID);
    let cardOpp = opponent.find(card => card.id === defID);
    console.log(typeof cardOpp.tempStats.atk, typeof cardUser.tempStats.health)

    if (cardUser.tempStats.atkPoints < 1) return;
    cardUser.tempStats.health = cardUser.tempStats.health - cardOpp.tempStats.atk;
    cardUser.tempStats.atkPoints -= 1;
    cardOpp.tempStats.health -= cardUser.tempStats.atk;

    updateOpponentMinionOnBoard(cardOpp);
    updateUserMinionOnBoard(cardUser);


    checkUserBoardForDeadMinions();
    checkOpponentBoardForDeadMinions();

}


/* UNUSED/ OLD FUNCTION */
export const checkMinionsCost = (id) => {
    let hand = get(userHand);
    let card = hand.find(card => card.id === id);
    let minionCostsToMuch;
    console.log(id, 'checking')
    console.log($gameState.userTempStats)
    if (card && card.tempStats.cost > $gameState.userTempStats.mana) {
        minionCostsToMuch = true;
    } else {
        minionCostsToMuch = false;
    }
    gameState.update(game => ({ ...game, minionCostsToMuch }));
}


/* HAND TO GRAVE */

export const sendOpponentCardFromHandToGrave = (cardID) => {
    let card = removeCardInOpponentHand(cardID);
    addCardToOpponentGraveyard(card);
    return card;
}

export const sendUserCardFromHandToGrave = (cardID) => {
    let card = removeCardInUserHand(cardID);
    addCardToUserGraveyard(card);
    return card;
}


/* ATTACK OPPONENT HERO FUNCTIONS*/
export const handleAttackHero = (damage, id, atkPoints) => {
    dealDamageToOpponentHero(damage);
    reduceUserMinionAtkPoints(id, atkPoints);
}



/* TEST/EXPERIMENTAL */
export const calcPositions = (rectUser, rectOpponent) => {
    let x = rectOpponent.x - rectUser.x;
    let y = rectUser.y - rectOpponent.y;

    gameState.update(game => ({ ...game, atkMoveCoordinates: { x, y } }));

    return { x, y };
}



