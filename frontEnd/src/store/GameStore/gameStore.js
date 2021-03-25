import { writable, get } from 'svelte/store';


export const gameState = writable({
    usersTurn: null,
    turnEnding: false,
    gameOn: false,
    gameOver: false,
    myTurn: true,

    attackingMinion: {
        clickActive: false,
        selectedMinionID: '',
    },

    showUserGraveyard: false,
    userWins: false,

    userHealth: 30,
    userMana: 0,
    userTempStats: {
        mana: 0,
        health: 30,
    },

    opponentTempStats: {
        mana: 0,
        health: 30,
    },

    opponentHealth: 30,
    opponentMana: 0,

    attacked: false,
    disableUserBoard: false,

    minionCostsToMuch: false,
});

export const setUsersTurn = (state) => {
    gameState.update(game => ({ ...game, usersTurn: state }))
}

export const setTurnEnding = (state) => {
    gameState.update(game => ({ ...game, turnEnding: state }));
}

export const setAttackingMinion = (id, clickActive) => {
    gameState.update(game => ({ ...game, attackingMinion: { clickActive: clickActive, selectedMinionID: id } }))
}

export const dealDamageToOpponentHero = (damage) => {
    gameState.update(game => {
        game.opponentTempStats.health -= damage;
        if (game.opponentTempStats.health <= 0) {
            game.gameOver = true;
            game.userWins = true;
        }
        return game;
    });
}

/* export const dealDamageToUserHero = (damage) => {
    gameState.update(game => ({ ...game, userHealth: game.userHealth -= damage }));
} */

export const setUserHeroHealth = (newHealth) => {
    gameState.update(game => {
        game.userTempStats.health = newHealth;
        return game;
    });
}

export const incrementUserMana = () => {
    gameState.update(game => {
        if (game.userMana === 10) return game;
        game.userMana += 1;
        game.userTempStats.mana += 1;
        return game;
    });
}
export const incrementOpponentMana = () => {

    gameState.update(game => {
        if (game.opponentMana === 10) return game;
        game.opponentMana += 1;
        game.opponentTempStats.mana += 1;
        return game;
    });
}

export const reduceUserTempMana = (reduction) => {
    gameState.update(game => ({ ...game, userTempStats: { mana: game.userTempStats.mana -= reduction, ...game.userTempStats } }))
}

export const reduceOpponentTempMana = (reduction) => {
    gameState.update(game => ({ ...game, opponentTempStats: { ...game.opponentTempStats, mana: game.opponentTempStats.mana -= reduction } }));
}

export const resetUserMana = () => {
    gameState.update(game => ({ ...game, userTempStats: { ...game.userTempStats, mana: game.userMana } }))
}
export const resetOpponentMana = () => {
    gameState.update(game => ({ ...game, opponentTempStats: { ...game.opponentTempStats, mana: game.opponentMana } }))
}

export const setDisableUserBoard = (disableUserBoard) => {
    gameState.update(game => ({ ...game, disableUserBoard }));
}


