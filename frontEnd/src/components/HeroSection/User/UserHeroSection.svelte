<script>
	import Hero from "./Hero/Hero.svelte";
	import Graveyard from "../Graveyard/Graveyard.svelte";
	import ManaDisplay from "../ManaDisplay/ManaDisplay.svelte";
</script>

<style>
	.sectionContainer {
		flex: 0.1;
		width: 100%;
		border: 1px solid black;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		position: relative;
		background: rgb(53, 32, 10);
	}

	
</style>

<div class="sectionContainer">
	
	<Hero />
	<ManaDisplay user="user" />
	<Graveyard />
</div>
