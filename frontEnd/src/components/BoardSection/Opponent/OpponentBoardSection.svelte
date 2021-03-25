<script>
	import { flip } from "svelte/animate";
	import { dndzone, TRIGGERS } from "svelte-dnd-action";
	import Card from "../../Card/Card.svelte";
	import { opponentBoard } from "../../../store/BoardStore/boardStore";
	import {
		gameState,
		setAttackingMinion,
	} from "../../../store/GameStore/gameStore";
	import { resolveBattle,calcPositions } from "../../../store/gameMechanics/utils";
	import { userGraveyard } from "../../../store/GraveyardStore/graveyardStore";

	export let emitBattleResult;

	const flipDurationMs = 400;
	let type = "user";
	let dropFromOthersDisabled = true;
	let items = [];
	let dragDisabled = true;

	opponentBoard.subscribe((board) => (items = board));

	function handleClick(e) {
		console.log(e.currentTarget.getBoundingClientRect())
		if ($gameState.attackingMinion.clickActive && $gameState.usersTurn) {
			let defID = e.currentTarget.firstChild.getAttribute("cardID");
			let atkID = $gameState.attackingMinion.selectedMinionID;
			resolveBattle(atkID, defID);
			emitBattleResult();
		}
		setAttackingMinion("", false);
	}

	function onClickBoard() {
		items = [...items];
	}

	function handleSort(e) {
		items = e.detail.items;
	}

	function handleFinalize(e) {
		items = e.detail.items;
	}

	function transformDraggedElement(draggedEl, data, index) {
		const msg = `My index is ${index}`;
		draggedEl.innerHTML = msg;
	}
</script>

<style>
	.boardSection {
		flex: 0.4;
		width: 100%;
		/* border: 1px solid black; */
		display: flex;
		justify-content: center;
		border: 1px solid black;
		background: rgb(90, 89, 89);
	}

	.card {
		z-index: 10;
	}

	.in {
		animation: fadeIn 900ms ease;
	}

	@keyframes fadeIn {
		0% {
			opacity: 0;
		}
		100% {
			opacity: 1;
		}
	}
</style>

<div
	use:dndzone={{ items, flipDurationMs, transformDraggedElement, dragDisabled, type, dropFromOthersDisabled }}
	on:consider={handleSort}
	on:finalize={handleFinalize}
	on:click={onClickBoard}
	class="boardSection">
	{#if items}
		{#each items as card (card.id)}
			<div
				on:click={handleClick}
				animate:flip={{ duration: flipDurationMs }}
				class="card {card.in ? 'in' : ''}">
				<Card {card} cardPapa={'board'} />
			</div>
		{/each}
	{/if}
</div>
