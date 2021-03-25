<script>
	export let card;
	export let cardPapa;

	function downHandler(e) {
		e.preventDefault();
	}
</script>

<style>
	.card {
		height: 17vh;
		width: 13.5vh;
		border: 1px solid black;
		display: flex;
		flex-direction: column;
		margin: 5px 10px;
		position: relative;
		overflow: hidden;
		background: white;
	}

	.cardBack {
		background-color: royalblue;
		width: 100%;
		height: 100%;
	}
	.high-light {
		box-shadow: 0px 0px 20px 2px rgb(171, 231, 121),
			3px 3px 10px 1px rgb(255, 170, 42);
	}
	.red-light {
		box-shadow: 0px 0px 20px 1px rgb(182, 140, 140),
			2px 2px 30px 2px rgb(255, 42, 42);
	}
	.papa-board {
		border-radius: 50%;
		height: 13vh;
		width: 10.5vh;

		border-radius: 50px / 70px;
	}
	.papa-hand1 {
		width: 12vh;
	}
	.papa-hand2 {
		height: 8vh;
		width: 6vh;
	}
	.imgContainer {
		flex: 0.6;
		width: 100%;
		border-bottom: 1px solid black;
	}

	.infoContainer {
		flex: 0.4;
		display: flex;
	}

	.info__stats {
		width: 100%;
	}

	.stat {
		width: 3.4vh;
		height: 3.4vh;
		display: flex;
		justify-content: center;
		align-items: center;
		border-radius: 50%;
	}

	.card.attacked {
		animation-name: battle;
		animation-duration: 150ms;
		animation-timing-function: ease-out;
	}

	@keyframes battle {
		0% {
			box-shadow: 0px 0px 20px 1px rgb(182, 140, 140),
				2px 2px 30px 2px rgb(255, 42, 42);
		}

		25% {
			box-shadow: 0px 0px 20px 1px rgb(182, 140, 140),
				4px 4px 30px 4px rgb(255, 42, 42);
		}

		50% {
			box-shadow: 0px 0px 20px 1px rgb(182, 140, 140),
				10px 10px 30px 12px rgb(255, 42, 42);
		}

		75% {
			box-shadow: 0px 0px 20px 1px rgb(182, 140, 140),
				14px 14px 30px 14px rgb(255, 42, 42);
		}

		100% {
			box-shadow: 0px 0px 20px 1px rgb(182, 140, 140),
				14px 14px 30px 14px rgb(255, 42, 42);
		}
	}

	/* @-webkit-keyframes AnimationName {
		0% {
			background-position: 5% 0%;
		}
		50% {
			background-position: 96% 100%;
		}
		100% {
			background-position: 5% 0%;
		}
	}
	@-moz-keyframes AnimationName {
		0% {
			background-position: 5% 0%;
		}
		50% {
			background-position: 96% 100%;
		}
		100% {
			background-position: 5% 0%;
		}
	}
	@keyframes AnimationName {
		0% {
			background-position: 5% 0%;
		}
		50% {
			background-position: 96% 100%;
		}
		100% {
			background-position: 5% 0%;
		}
	}

	@keyframes rotate {
		0% {
			filter: hue-rotate(0deg);
		}
		100% {
			filter: hue-rotate(360deg);
		}
	}
 */
	.atk {
		z-index: 1;
		position: absolute;

		left: -0.3vw;
		bottom: -0.3vh;
		border: 1px solid black;
		background-color: rgb(252, 179, 44);
		/* margin-left: -4px;
		margin-bottom: -4px; */
	}

	.def {
		z-index: 4;
		width: 3.3vh;
		height: 3.6vh;
		position: absolute;
		right: -0.3vw;
		bottom: -0.3vh;
		border: 1px solid black;

		background: rgb(209, 19, 13);
		box-shadow: 0px -1px 20px 4px red;
		border: 1px solid rgb(63, 0, 0);
		border-radius: 0 50% 50% 50%;
		transform: rotate(45deg);
	}
	.def > .statItem {
		transform: rotate(-45deg);
	}
	.cost {
		z-index: 1;
		position: absolute;
		right: -2px;
		top: -2px;
		background-color: yellow;
		border-radius: 50%;
	}
	.statItem {
		color: white;
		text-shadow: 1px 1px black;
		font-size: 3vh;
		font-weight: 700;
		margin-top: 0.3vh;
	}

	.papa-board .atk {
		left: 7%;
		bottom: 7%;
	}
	.papa-board .def {
		right: 7%;
		bottom: 7%;
	}

	.papa-board .infoContainer {
		flex: 0;
		overflow: hidden;
	}

	.cardImg {
		height: 15.5vh;
		width: 100%;
		margin: 0 auto;
		object-fit: cover;
		height: 110%;
	}

	.cardText {
		border: 1px solid black;
		display: flex;
		flex: 0.4;
		box-sizing: border-box;
		padding: 1vh;
		font-size: 8px;
		z-index: 2;
	}
</style>

{#if card.type === 'minion'}
	<div
		class="card papa-{cardPapa} high-light"
		cardID={card.id}
		style="background-color:{card.imgPath}"
		on:mousedown={downHandler}>
		{#if cardPapa !== 'hand2'}
			<div class="imgContainer" style="background-color:{card.imgPath}">
				<!-- {#if card.imgPath === 'leonVagoroth'}
				
			{/if} -->
				<img class="cardImg" src={card.imgPath} alt="a eeeviiil card" />
			</div>

			<div class="infoContainer">
				<div class="info__stats">
					<div class="atk stat">
						<p class="statItem">{card.tempStats.atk}</p>
					</div>
					<div class="def stat">
						<p class="statItem">{card.tempStats.health}</p>
					</div>
					{#if cardPapa !== 'board'}
						<div class="cost stat">
							<p class="statItem">{card.tempStats.cost}</p>
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="cardBack-container">
				<div class="cardBack" />
			</div>
		{/if}
	</div>
{:else}
	<div
		class="spell card papa-{cardPapa} high-light"
		cardID={card.id}
		on:mousedown={downHandler}>
		{#if cardPapa !== 'hand2'}
			<div class="imgContainer" style="background-color:{card.imgPath}">
				<!-- {#if card.imgPath === 'leonVagoroth'}
				
			{/if} -->
				<img
					class="cardImg"
					src={'./images/nethergrasp.jpg'}
					alt="a eeeviiil card" />
			</div>

			<div class="cardText">lorem ipsum dolem forum marius saurisus.</div>
		{:else}
			<div class="cardBack-container">
				<div class="cardBack" />
			</div>
		{/if}
	</div>
{/if}
