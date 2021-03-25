<script>
	import Card from "../../../Card/Card.svelte";

	import { flip } from "svelte/animate";
	import { dndzone } from "svelte-dnd-action";
	import { get } from "svelte/store";
	import {
		opponentHand,
		setOpponentHand,
	} from "../../../../store/HandStore/handStore";

	let items = [];
	const flipDurationMs = 200;
	let dropFromOthersDisabled = true;
	let dragDisabled = true;
	let castSpellId = "";

	opponentHand.subscribe((hand) => {
		
		items = [...hand];
	});

	function handleConsider(e) {
		setOpponentHand(e.detail.items);
	}

	function handleFinalize(e) {
		setOpponentHand(e.detail.items);
	}
</script>

<style>
	.hand {
		height: 100%;
		width: 100%;
		display: flex;
		justify-content: center;
		outline: none;
	}
</style>

<div
	class="hand"
	use:dndzone={{ items, flipDurationMs, dropFromOthersDisabled, dragDisabled }}
	on:consider={handleConsider}
	on:finalize={handleFinalize}>
	{#if items}
		{#each items as card (card.id)}
			<div animate:flip={{ duration: flipDurationMs }}>
				<Card {card} cardPapa={'hand2'} {castSpellId} />
			</div>
		{/each}
	{/if}
</div>
