<script>
	import UserBoardSection from "./components/BoardSection/User/UserBoardSection.svelte";
	import OpponentBoardSection from "./components/BoardSection/Opponent/OpponentBoardSection.svelte";
	import UserHandSection from "./components/HandSection/User/UserHandSection.svelte";
	import OpponentHandSection from "./components/HandSection/Opponent/OpponentHandSection.svelte";
	import UserHeroSection from "./components/HeroSection/User/UserHeroSection.svelte";
	import OpponentHeroSection from "./components/HeroSection/Opponent/OpponentHeroSection.svelte";
	import Seperator from "./components/MidboardSeperator/Seperator.svelte";
	import EndTurnButton from "./components/EndTurnButton/EndTurnButton.svelte";
	import GraveyardSelector from "./components/GraveyardSelector/GraveyardSelector.svelte";
	import GameOverModal from './components/GameOverModal/GameOver.svelte';
	import CastSpell from './components/Card/CastSpell.svelte';

	import { get } from "svelte/store";
	import {
		gameState,
		setUsersTurn,
		setTurnEnding,
		setUserHeroHealth,
		incrementUserMana,
		resetUserMana,
		incrementOpponentMana,
		reduceOpponentTempMana,
resetOpponentMana,
	} from "./store/GameStore/gameStore";

	import {
		setOpponentHand,
		setUserHand,
		userHand,
		addCardsToOpponentHand,
		
	} from "./store/HandStore/handStore";
	import { setUserDeck } from "./store/DeckStore/deckStore";
	import {
		setOpponentBoard,
		userBoard,
		opponentBoard,
		setUserBoard,
		resetAtkPoints,
	} from "./store/BoardStore/boardStore";
	import { drawCard, sendOpponentCardFromHandToGrave } from "./store/gameMechanics/utils";
	import {
		userGraveyard,
		opponentGraveyard,
		setOpponentGraveyard,
		setUserGraveyard,
	} from "./store/GraveyardStore/graveyardStore";

	import io from "socket.io-client";

	import { onMount, onDestroy } from "svelte";
	import Graveyard from "./components/HeroSection/Graveyard/Graveyard.svelte";

	let spellPlayedID;

	//https://cardgamev1.herokuapp.com/

	let socket = io("localhost:5002");

	

	onMount(async () => {
		socket.emit("join");

		socket.on('gameOver', ({winner}) => {
			gameState.update(game => ({...game, gameOver: true, userWins: winner}));
		});

		socket.on("startGame", ({ start, user, opponentHand }) => {
			setOpponentHand(opponentHand);
			setUserHand(user.hand);
			setUserDeck(user.deck);
			console.log("game start", user.hand);

			//refactor
			if (start === "yes") {
				gameState.update((game) => ({ ...game, usersTurn: true }));
				incrementUserMana();
			} else {
				gameState.update((game) => ({ ...game, usersTurn: false }));
				incrementOpponentMana();
			}
		});


		socket.on("startTurn", () => {
			console.log("turn start");
			let card = drawCard();
			socket.emit("cardDraw", { cards: [card] });
			resetAtkPoints();
			resetUserMana();
			setUsersTurn(true);
			incrementUserMana();
		});

		socket.on("turnEnding", () => {
			setTurnEnding(true);
		});

		socket.on("endTurn", () => {
			setTurnEnding(false);
			setUsersTurn(false);

			//make master for opponent mana handling
			incrementOpponentMana();
			resetOpponentMana();
		});

		socket.on("opponentPlaysMinion", ({ board, hand, cardID }) => {
			setOpponentHand(hand);
			setOpponentBoard(board);
			let playedCard = get(opponentBoard).find(card => card.id === cardID);
			console.log(playedCard, 'played card');
			reduceOpponentTempMana(playedCard.tempStats.cost);
			console.log(hand, board, "opponent played card");
		});

		socket.on('opponentPlaysSpell', ({cardID}) => {
			//do something here
			console.log('spell played', cardID)
			spellPlayedID  = cardID;
			setTimeout(() => {
				spellPlayedID = undefined;
			}, 1060);
			let card = sendOpponentCardFromHandToGrave(cardID);
			reduceOpponentTempMana(card.tempStats.cost);
		});

		socket.on("cardDraw", ({ cards }) => {
			console.log(cards, "card draw");
			addCardsToOpponentHand(cards);
		});

		socket.on(
			"battleResult",
			({ atkBoard, defBoard, atkGrave, defGrave }) => {
				setOpponentBoard(atkBoard);
				setUserBoard(defBoard);
				setUserGraveyard(defGrave);
				setOpponentGraveyard(atkGrave);
			}
		);

		socket.on("heroDamaged", ({ newHeroHealth }) => {
			console.log(newHeroHealth)
			setUserHeroHealth(newHeroHealth);
			console.log($gameState.userTempStats.health)
		});

		socket.on('updateOpponentHand', ({hand}) =>  {
			setOpponentHand(hand);
		});
	});

	/*ON DESTROY  */

	onDestroy(() => {
		socket.disconnect();
		socket.off();
	});


	/* EMITS */

	const emitEndTurn = () => {
		if ($gameState.usersTurn) {
			socket.emit("endTurn");
			setUsersTurn(false);
			setTurnEnding(false);

			//maybe make a master function for handling opponent mana
			incrementOpponentMana();
			resetOpponentMana();
		}
	};

	const emitPlayedMinion = (cardID) => {
		let hand = get(userHand);
		let board = get(userBoard);
		socket.emit("minionPlayed", { board, hand, cardID });
	};

	const emitPlayedSpell = (cardID) => {
		
		socket.emit('spellPlayed', {cardID});
	}	

	const emitBattleResult = () => {
		let atkBoard = get(userBoard);
		let defBoard = get(opponentBoard);
		let atkGrave = get(userGraveyard);
		let defGrave = get(opponentGraveyard);
		socket.emit("battleResult", { atkBoard, defBoard, atkGrave, defGrave });
	};

	const emitHeroDamaged = () => {
		let newHeroHealth = get(gameState).opponentTempStats.health;
		socket.emit("heroDamaged", { newHeroHealth });
	};
	
	const emitUpdateHand = () => {
		let hand = get(userHand);
		socket.emit('updateHand', {hand});
	}

	export const emitGameOver = (opponentWon) => {
		socket.emit('gameOver', {opponentWon});
	}	



	/* BACKDROP */

	const removeBackdrop = () => {
		gameState.update((game) => ({
			...game,
			attackingMinion: { clickActive: false, selectedMinionID: "" },
		}));
	};




	


</script>

<style>
	.mainContainer {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}
	.gameContainer {
		height: 98%;
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		background-repeat: no-repeat;
		background-size: cover;
		background-position: center center;
	}
	.gameArena {
		flex: 0.8;
		width: 90%;
		background-image: linear-gradient(to right, #262626 0%, black 100%);
		display: flex;
		border: 1px solid black;
		justify-content: center;
		display: flex;
	}

	.wrapper {
		height: 90%;
		width: 90%;
		display: flex;
		flex-direction: column;

		/* justify-content: stretch; */
	}

	.backdrop {
		display: none;
		z-index: 10;
		position: absolute;
		top: 0;
		width: 100%;
		height: 100%;
		background: rgba(56, 56, 248, 0.26);
	}

	.backdrop.displayBackdrop {
		display: block;
	}

	/* .backdrop.disableGameplay {
		background-color: rgba(0, 0, 255, 0.254);
		z-index: 20;
		display: block;
	} */
</style>

<main class="mainContainer">
	<GameOverModal />
	<GraveyardSelector />
	{#if spellPlayedID}
		<CastSpell {spellPlayedID}/>
	{/if}
	<EndTurnButton {emitEndTurn} />
	<div
		class="backdrop {$gameState.attackingMinion.clickActive ? 'displayBackdrop' : ''} {$gameState.usersTurn ? '' : 'disableGameplay'}"
		on:click={removeBackdrop} />
	<div class="gameContainer">
		<OpponentHandSection />
		<div class="gameArena">
			<div class="wrapper">
				<OpponentHeroSection {emitHeroDamaged} {emitGameOver} />
				<OpponentBoardSection {emitBattleResult} />
				<Seperator />
				<UserBoardSection {emitPlayedMinion} />
				<UserHeroSection />
			</div>
		</div>
		<UserHandSection {emitPlayedSpell} {emitUpdateHand} />
	</div>
</main>
