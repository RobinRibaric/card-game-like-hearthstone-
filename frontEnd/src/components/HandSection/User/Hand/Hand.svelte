<script>
	import Card from "../../../Card/Card.svelte";

	import { flip } from "svelte/animate";
	import { dndzone, TRIGGERS } from "svelte-dnd-action";

	import {
		userHand,
		setUserHand,
		getMinionFromUserHand,
		removeCardInUserHand,
		buffUserHand,
	} from "../../../../store/HandStore/handStore";
	import {
		gameState,
		setDisableUserBoard,
		reduceUserTempMana,
	} from "../../../../store/GameStore/gameStore";
	import {  sendUserCardFromHandToGrave } from "../../../../store/gameMechanics/utils";
	import {evalBattlecry} from '../../../../store/gameMechanics/Battlecry';
	import {userBoard} from '../../../../store/BoardStore/boardStore';
	import {drawCard} from '../../../../store/gameMechanics/utils';
	import {get} from 'svelte/store';
	export let emitPlayedSpell;
	export let emitUpdateHand;

	let items = [];
	let itemsCopy = [];
	let flipDurationMs = 200;
	let dropFromOthersDisabled = true;
	let dragDisabled = false;
	let card;

	let castSpellId = "";
	$: if($userHand) {
		console.log($userHand)
	}

	userHand.subscribe((hand) => {
		items = hand;
		console.log(hand, 'from subscirbe')
		hand.forEach((card) => {
			if (
				card.type === "spell" &&
				!itemsCopy.find((c) => c.id === card.id)
			)
				itemsCopy = [...itemsCopy, card];
		});
	});

	$: if ($gameState.usersTurn) {
		dragDisabled = false;
	} else {
		dragDisabled = true;
	}

	function handleConsider(e) {
		e.preventDefault();

		const item = e.detail.items.find(
			(item) => item.id === e.detail.info.id
		);

		setUserHand(e.detail.items);
		if (e.detail.info.trigger === TRIGGERS.DRAG_STARTED) {
			
		}
		if (e.detail.info.trigger === TRIGGERS.DRAGGED_LEFT) {
			
		}
		if (e.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
			
			e.preventDefault();
		}
		if (e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ANOTHER)
			
		if (e.detail.info.trigger === TRIGGERS.DRAG_STOPPED) {
			
		}
	}

	function handleFinalize(e) {
		setUserHand(e.detail.items);
		if (e.detail.info.trigger === TRIGGERS.DRAGGED_LEFT)
			console.log("drag left");
		if (e.detail.info.trigger === TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
			console.log("outside of any", items);
			if (card.type === "spell") {
				
				if(card.tempStats.cost > $gameState.userTempStats.mana) return;

				if (card.effect === "handBuff") {
					buffUserHand(card.effectData);
				}
				castSpellId = e.detail.info.id;
				//continue here
				reduceUserTempMana(card.tempStats.cost);
				emitPlayedSpell(e.detail.info.id);
				sendUserCardFromHandToGrave(e.detail.info.id);
			} 
		}
		if (e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ANOTHER) {
			let card = get(userBoard).find(card => card.id === e.detail.info.id);
			
			if( card.type === 'minion') {
				
				if(card.battlecry) {
					const stateToUpdate = evalBattlecry(card);
					if(stateToUpdate === 'hand') {
						emitUpdateHand();
					}
				}
			}
			console.log("dropped into another");
		}
		if (e.detail.info.trigger === TRIGGERS.DRAG_STOPPED)
			console.log("stopped");
	}

	function try1(e) {
		card = getMinionFromUserHand(
			e.currentTarget.firstChild.getAttribute("cardID")
		);
		//HERE you can check for all kinds of things before drag starts
	
		if(card.type === 'spell') flipDurationMs = 0;

		if (
			card.type === "spell" ||
			card.tempStats.cost > $gameState.userTempStats.mana
		) {
			
			setDisableUserBoard(true);
		} else {
			setDisableUserBoard(false);
			flipDurationMs = 200;
		}
	}
</script>

<style>
	.hand {
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		outline: none;
		/* position: absolute;
		bottom: 0;
		margin: 0 auto; */
	}

	.card:hover {
		transform: translateY(-20px) translateX(10px) scale(1.2);
		transition-duration: 300ms;
		transition-timing-function: ease-out;
		z-index: 8;
	}

	.card {
		transition-duration: 100ms;
		transition-timing-function: ease-out;
	}

	.spellActivation {
		display: none;
		width: 0px;
		height: 0px;
	}
</style>

<div
	class="hand"
	use:dndzone={{ items, flipDurationMs, dropFromOthersDisabled, dragDisabled }}
	on:consider={handleConsider}
	on:finalize={handleFinalize}>
	{#if items}
		{#each items as card (card.id)}
			<div
			animate:flip={{duration:flipDurationMs}}
				class="card"
				class:spellActivation={castSpellId === card.id}
				on:mousedown={try1}>
				
				<Card {card} cardPapa={'hand1'} />
			</div>
		{/each}
	{/if}
</div>
