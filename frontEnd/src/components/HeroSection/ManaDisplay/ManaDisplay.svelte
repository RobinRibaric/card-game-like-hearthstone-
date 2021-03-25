<script>
    import { gameState } from "../../../store/GameStore/gameStore";
    export let user;
</script>

<style>
    .manaDisplay {
        position: absolute;
        right: 30%;
        height: 90%;
        width: 15vh;
        align-self: center;
        display: flex;
        align-items: center;
    }
    .glow {
        font-size: 40px;
        color: #fff;
        position: absolute;
        margin-left: 3.5vh;
        text-align: center;
        -webkit-animation: glow 1s ease-in-out infinite alternate;
        -moz-animation: glow 1s ease-in-out infinite alternate;
        animation: glow 1s ease-in-out infinite alternate;
    }

    .coin {
		max-width: 10vh;
		max-height: 10vh;
		align-self: center;
		
	}

    @-webkit-keyframes glow {
        from {
            text-shadow: 0 0 10px #fff, 0 0 20px #fff, 0 0 30px #e60073,
                0 0 40px #e60073, 0 0 50px #e60073, 0 0 60px #e60073,
                0 0 70px #e60073;
        }
        to {
            text-shadow: 0 0 20px #fff, 0 0 30px #ff4da6, 0 0 40px #ff4da6,
                0 0 50px #ff4da6, 0 0 60px #ff4da6, 0 0 70px #ff4da6,
                0 0 80px #ff4da6;
        }
    }
</style>

<div class="manaDisplay">
    <img class="coin" src="images/nuevo-sol.svg" alt="nuevo sol"/>
    <p class="glow">
        {#if user === 'user'}
            {$gameState.userTempStats.mana}
        {:else}
            {$gameState.opponentTempStats.mana}
         {/if}
    </p>
</div>
