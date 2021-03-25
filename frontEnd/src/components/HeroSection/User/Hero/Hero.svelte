<script>
	import { gameState } from "../../../../store/GameStore/gameStore";

	const flipDurationMs = 200;
	let items = [];
	let health = 30;

	function onHeroClick() {}

	function handleSort(e) {}

	function handleFinalize(e) {}
</script>

<style>
	.hero {
		z-index: 2;
		/* height: 20vh; */
		width: 15vh;
		height: 15vh;
		position: relative;
		padding: 4px;
		margin: auto 0;
		/* background-color: hsl(54, 100%, 55%); */
		border: 1px solid black;
		border-top-left-radius: 50%;
		border-top-right-radius: 50%;
		background-image: url("../images/firstHero.jpg");
		background-repeat: no-repeat;
		background-size: auto;
		background-size: cover;
	}

	img {
		max-width: 100%;
		height: 15vh;
		margin: auto;
		display: block;
		object-fit: cover;
		border-top-left-radius: 50%;
		border-top-right-radius: 50%;
	}

	.healthContainer {
		z-index: 1;
		position: absolute;
		bottom: 0%;
		left: 50%;
		height: 26px;
		width: 26px;

		display: flex;
		justify-content: center;
		align-content: center;
		color: white;
		background: rgb(139, 0, 0);
		box-shadow: 0px -1px 20px 4px red;
		border: 1px solid rgb(63, 0, 0);
		border-radius: 0 50% 50% 50%;
		transform: translateX(-13px) rotate(45deg);
	}

	.health {
		transform: rotate(-45deg);
		font-size: 24px;
		font-weight: 900;
		text-shadow: 2px 2px black;
		margin: auto;
	}
</style>

<div class="hero" on:click={onHeroClick}>
	<div class="img">
		<!-- <img src="images/firstHero.jpg" alt="hero background" /> -->
	</div>
	<div class="healthContainer">
		<p class="health">{$gameState.userTempStats.health}</p>
	</div>
</div>
