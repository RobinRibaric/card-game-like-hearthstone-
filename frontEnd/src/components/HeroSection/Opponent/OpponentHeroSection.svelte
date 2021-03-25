<script>
	import Hero from "./Hero/Hero.svelte";
		import ManaDisplay from "../ManaDisplay/ManaDisplay.svelte";
	export let emitHeroDamaged;
	export let emitGameOver;
</script>

<style>
	.sectionContainer {
		flex: 0.15;
		width: 100%;
		border: 1px solid black;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		position: relative;
		background: rgb(75, 0, 75);
		margin: 2vh 0 0 0;
	}
</style>

<div class="sectionContainer">
	<Hero {emitHeroDamaged} {emitGameOver} />
	<ManaDisplay user="opponent" />
</div>
