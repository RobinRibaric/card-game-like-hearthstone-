const { v4: uuidv4 } = require('uuid');

const bubaDeck = [
    {
        name: 'Buba-mara',
        cardID: 'id-1',
        type: 'minion',
        atk: 2,
        health: 3,
        cost: 2,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 2,
            health: 3,
            cost: 2,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-stara',
        cardID: 'id-2',
        type: 'minion',
        atk: 4,
        health: 1,
        cost: 2,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 4,
            health: 1,
            cost: 2,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-Kukunka',
        cardID: 'id-3',
        type: 'minion',
        atk: 4,
        health: 7,
        cost: 5,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 4,
            health: 7,
            cost: 5,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-Taranta',
        cardID: 'id-4',
        type: 'minion',
        atk: 6,
        health: 5,
        cost: 5,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 6,
            health: 5,
            cost: 5,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-cmar',
        cardID: 'id-5',
        type: 'minion',
        atk: 0,
        health: 2,
        cost: 1,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 0,
            health: 2,
            cost: 1,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-mala',
        cardID: 'id-6',
        type: 'minion',
        atk: 1,
        health: 1,
        cost: 0,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 1,
            health: 1,
            cost: 0,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-mazo',
        cardID: 'id-7',
        type: 'minion',
        atk: 2,
        health: 4,
        cost: 3,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 2,
            health: 4,
            cost: 3,
            atkPoints: 1,
        }
    },
    {
        name: 'Buba-mraz',
        cardID: 'id-8',
        type: 'minion',
        atk: 4,
        health: 8,
        cost: 6,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 4,
            health: 8,
            cost: 6,
            atkPoints: 1,
        }

    },
    {
        name: 'Buba-burker-burazer',
        cardID: 'id-9',
        type: 'minion',
        atk: 3,
        health: 2,
        cost: 2,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 3,
            health: 2,
            cost: 2,
            atkPoints: 1,
        }
    },
    {
        name: 'Maaa-Buba',
        cardID: 'id-10',
        type: 'minion',
        atk: 5,
        health: 3,
        cost: 4,
        atkPoints: 1,
        imgPath: '',
        index: null,
        tempStats: {
            atk: 5,
            health: 3,
            cost: 4,
            atkPoints: 1,
        }
    },
    {
        name: 'Spell',
        cardID: 'id-11',
        type: 'spell',
        effect: 'handBuff',
        atk: 0,
        health: 5,
        cost: 4,
        atkPoints: 1,
        imgPath: '',
        index: null,
        effectData: {
            atkBuff: 2,
            healthBuff: 1,
        },
        tempStats: {
            atk: 0,
            health: 3,
            cost: 4,
            atkPoints: 1,
        }
    },
]

const createDeck = () => {
    let cards = [];
    for (let x = 0; x < 11; x++) {
        bubaDeck[x].id = uuidv4();
        cards.push(bubaDeck[x]);
        let dupl = { ...bubaDeck[x] };
        dupl.id = uuidv4();
        cards.push(dupl);
    }
    return cards;
}

const startPackage = () => {
    let deck = createDeck();
    let deck2 = createDeck();

    let hand = [];
    let hand2 = [];

    for (let x = 0; x < 4; x++) {
        hand.push(deck.pop());
        hand2.push(deck2.pop());
    }

    return { user1: { deck, hand }, user2: { deck: deck2, hand: hand2 } };
}

module.exports = {
    startPackage,
}