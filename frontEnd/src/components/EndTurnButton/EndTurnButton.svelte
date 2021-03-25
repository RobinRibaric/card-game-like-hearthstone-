<script>
    import { gameState } from "../../store/GameStore/gameStore";
    export let emitEndTurn;

    let usersTurn = false;

    gameState.subscribe((game) => (usersTurn = game.usersTurn));
</script>

<style>
    .outer {
        background: #111;
        position: absolute;
        top: 40%;
        right: 1.5%;
        transform: scale(0.9);
        z-index: 10;
    }

    .outer.myTurn:hover {
        cursor: pointer;
    }

    .button {
        height: 70px;
        width: 200px;
        border-radius: 20px;
    }

    .outer button,
    .outer span {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .outer button {
        background: #111;
        color: gray;
        outline: none;
        border: none;
        font-size: 20px;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
    }

    .button button {
        height: 60px;
        width: 190px;
        border-radius: 20px;
    }

    .outer span {
        height: 100%;
        width: 100%;
    }

    .button span {
        border-radius: 50px;
    }

    .outer.myTurn button {
        color: #f2f2f2;
    }

    .outer.myTurn span:nth-child(1) {
        filter: blur(7px);
    }

    .outer.myTurn span:nth-child(2) {
        filter: blur(14px);
    }

    .outer.myTurn {
        transform: scale(0.9);
        background: linear-gradient(
            90deg,
            rgba(238, 219, 32, 1) 27%,
            rgba(193, 141, 20, 0.927608543417367) 40%,
            rgba(213, 126, 25, 1) 50%,
            rgba(213, 78, 25, 1) 64%,
            rgba(240, 43, 13, 1) 85%
        );
        animation: rotate 1.5s linear infinite;
    }

    @keyframes rotate {
        0% {
            filter: hue-rotate(0deg);
        }
        100% {
            filter: hue-rotate(360deg);
        }
    }

    .buttonText {
        font-size: 2vh;
    }
    /* .button {
        width: 15vh;
        height: 8vh;
        position: absolute;
        top: 40%;
        right: 5%;
        border: 1px solid black;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;

        background: rgb(95, 94, 94);
    }

    .outer {
        background: #111;
        position: absolute;
        top: 40%;
        right: 1.5%;
        transform: scale(0.9);
        z-index: 10;
    }

    .button {
        height: 70px;
        width: 200px;
        border-radius: 20px;
        font-size: 5px;
    }

    .outer button,
    .outer span {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .outer button {
        background: #111;
        color: gray;
        outline: none;
        border: none;
        font-size: 20px;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
    }

    .button button {
        height: 60px;
        width: 190px;
        border-radius: 20px;
    }

    .outer span {
        height: 100%;
        width: 100%;
    }

    .button span {
        border-radius: 50px;
    }

    .outer.myTurn button {
        color: #f2f2f2;
    }

    .outer.myTurn span:nth-child(1) {
        filter: blur(7px);
    }

    .outer.myTurn span:nth-child(2) {
        filter: blur(14px);
    }

    .outer.myTurn {
        cursor: pointer;

        background: linear-gradient(
            90deg,
            rgba(238, 219, 32, 1) 27%,
            rgba(193, 141, 20, 0.927608543417367) 40%,
            rgba(213, 126, 25, 1) 50%,
            rgba(213, 78, 25, 1) 64%,
            rgba(240, 43, 13, 1) 85%
        );
        animation: rotate 1.5s linear infinite;
    }

    @keyframes rotate {
        0% {
            filter: hue-rotate(0deg);
        }
        100% {
            filter: hue-rotate(360deg);
        }
    } */
</style>

<div
    class="outer button {$gameState.usersTurn ? 'myTurn' : ''}"
    on:click={emitEndTurn}>
    <button>
        {#if $gameState.usersTurn}
            <p class="buttonText">End Turn</p>
        {:else}
            <p class="buttonText">Opponents Turn</p>
        {/if}
    </button>
    <span />
    <span />
</div>
<div
    class="outer button {$gameState.usersTurn ? 'myTurn' : ''}"
    on:click={emitEndTurn}>
    <button>
        {#if $gameState.usersTurn}
            <p class="buttonText">End Turn</p>
        {:else}
            <p class="buttonText">Opponents Turn</p>
        {/if}
    </button>
    <span />
    <span />
</div>
