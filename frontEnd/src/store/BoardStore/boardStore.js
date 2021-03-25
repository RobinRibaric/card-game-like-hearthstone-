import { writable, get } from 'svelte/store';
import { addCardToUserGraveyard, addCardToOpponentGraveyard, userGraveyard } from '../GraveyardStore/graveyardStore';

export const userBoard = writable([]);
export const opponentBoard = writable([]);

export const getMinionFromBoard = (id) => {
    let board = get(userBoard);
    let minion = board.find(card => card.id === id);
    return { ...minion };
}

export const addToUserBoard = (card) => {
    userBoard.update(board => {
        board = [...board, cards];
        board.forEach((card, i) => card.index = i);
        return board;
    });
}

export const setUserBoard = (cards) => {
    userBoard.update(board => {
        board = [...cards];
        board.forEach((card, i) => card.index = i);
        return board;
    });
}

export const setOpponentBoard = (newBoard) => {
    opponentBoard.update(board => [...newBoard]);
}

export const damageUserMinion = (id, damage) => {

    userBoard.update(board => {
        board.forEach((card, i, arr) => {
            if (card.id === id) {
                card.tempStats.health -= damage;
            }
        });
        return board;
    })


}
export const damageOpponentMinion = (id, damage) => {

    opponentBoard.update(board => {
        board.forEach((card, i, arr) => {
            if (card.id === id) {
                card.tempStats.health -= damage;
            }
        });
        return board;
    });


}


export const checkUserBoardForDeadMinions = () => {
    userBoard.update(board => {
        board.forEach((card, i, arr) => {
            if (card.tempStats.health <= 0) {
                addCardToUserGraveyard(card);
                arr.splice(i, 1);
            }
        });
        return board;
    });
}

export const checkOpponentBoardForDeadMinions = () => {
    opponentBoard.update(board => {
        board.forEach((card, i, arr) => {
            if (card.tempStats.health <= 0) {
                addCardToOpponentGraveyard(card);
                arr.splice(i, 1);
            }
        });
        return board;
    });
}


export const updateUserMinionOnBoard = (minion) => {
    userBoard.update(board => {
        board.forEach(card => {
            if (card.id === minion.id) card = { ...minion };
        });
        return board;
    });
}

export const updateOpponentMinionOnBoard = (minion) => {
    opponentBoard.update(board => {
        board.forEach(card => {
            if (card.id === minion.id) card = { ...minion };
        });
        return board;
    });
}


export const resetAtkPoints = () => {
    userBoard.update(board => {
        board.forEach(card => card.tempStats.atkPoints = card.atkPoints);
        return board;
    });
}

export const reduceUserMinionAtkPoints = (id, amount) => {
    userBoard.update(board => {
        board.forEach(card => {
            console.log('heree', card);
            if (card.id === id) {
                card.tempStats.atkPoints -= amount;
            }
        });
        return board;
    });
}
