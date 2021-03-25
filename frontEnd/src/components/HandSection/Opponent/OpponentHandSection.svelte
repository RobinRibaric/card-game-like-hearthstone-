<script>
	import Hand from "./Hand/Hand.svelte";
</script>

<style>
	.handSection {
		flex: 0.05;
		display: flex;
		width: 100%;
		/* border: 1px solid black; */
		/* background: lightblue; */
		justify-content: center;
		z-index: 10;
		position: absolute;
		top: 0%;
		left: 0;
	}
</style>

<div class="handSection">
	<Hand />
</div>
