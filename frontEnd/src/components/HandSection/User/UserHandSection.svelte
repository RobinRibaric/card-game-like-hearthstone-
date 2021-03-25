<script>
	import Hand from "./Hand/Hand.svelte";
	export let emitPlayedSpell;
	export let emitUpdateHand;
</script>

<style>
	.handSection {
		flex: 0.15;
		display: flex;
		width: 100%;
		justify-content: center;
		z-index: 10;
		position: absolute;
		bottom: 0%;
		margin: 0 auto;
	}
</style>

<div class="handSection">
	<Hand {emitPlayedSpell} {emitUpdateHand}/>
</div>
