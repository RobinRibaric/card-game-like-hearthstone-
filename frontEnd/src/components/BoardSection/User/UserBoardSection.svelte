<script>
	import { flip } from "svelte/animate";
	import { dndzone, TRIGGERS } from "svelte-dnd-action";
	import Card from "../../Card/Card.svelte";
	import {
		userBoard,
		setUserBoard,
	} from "../../../store/BoardStore/boardStore";
	import {
		gameState,
		setAttackingMinion,
		reduceUserTempMana
	} from "../../../store/GameStore/gameStore";
	import {userHand} from '../../../store/HandStore/handStore';
	import {evalBattlecry} from '../../../store/gameMechanics/Battlecry';
	import {drawCard} from '../../../store/gameMechanics/utils';
	import {get} from 'svelte/store';
	export let emitPlayedMinion;

	const flipDurationMs = 400;
	let items = [];

	let dropFromOthersDisabled = false;
	let dragDisabled = true;
	let target;

	dropFromOthersDisabled = false;

	userBoard.subscribe((board) => (items = board));

	$: if (
		$gameState.usersTurn &&
		!$gameState.disableUserBoard &&
		!$gameState.minionCostsToMuch
	) {
		dropFromOthersDisabled = false;
	} else {
		dropFromOthersDisabled = true;
	}

	function transformDraggedElement(draggedEl, data, i) {}

	function handleSort(e) {
		e.preventDefault();
		setUserBoard(e.detail.items);
	}

	function handleFinalize(e) {
		e.preventDefault();
		let item = e.detail.items.find(item => item.id === e.detail.info.id);
		setUserBoard(e.detail.items);
		//only triggers if dropped
		if (e.detail.info.trigger === TRIGGERS.DROPPED_INTO_ZONE) {
			emitPlayedMinion(e.detail.info.id);
			userHand.update(hand => {
				hand.pop();
				return hand;
			});
			
			//decrease user mana here
			console.log(item.tempStats, 'item')
			reduceUserTempMana(item.tempStats.cost);
		}
	}

	function handleClick(e) {
		// e.preventDefault();
		//if (dropFromOthersDisabled) return;
		let id = e.currentTarget.firstChild.getAttribute("cardID");
		e.currentTarget
		if ($gameState.usersTurn) setAttackingMinion(id, true);
		 
	}
	function handleDragEnd(e) {
		e.preventDefault();
	}
</script>

<style>
	.boardSection {
		flex: 0.4;
		width: 100%;

		border: 1px solid black;
		display: flex;
		justify-content: center;
		align-items: center;

		background: rgb(90, 89, 89);
	

	}

	.card.attacking {
		/* transform: translateY(-5vh); */
	}

	.disabledClick {
		pointer-events: none;
	}

	.img-dragon {
		max-height: 10vh;
		z-index: 2;
		position: absolute;
	}
</style>

<div
	use:dndzone={{ items, flipDurationMs, transformDraggedElement, dropFromOthersDisabled, dragDisabled }}
	on:consider={handleSort}
	on:finalize={handleFinalize}
	class="boardSection">
	{#if items}
		{#each items as card (card.id)}
			<div
			class="card {$gameState.attackingMinion.selectedMinionID === card.id ? 'attacking' : ''}"
				draggable="true"
				on:click={handleClick}
				animate:flip={{ duration: flipDurationMs }}>
				<Card {card} cardPapa={'board'} />
			</div>
		{/each}
	{/if}
</div>
