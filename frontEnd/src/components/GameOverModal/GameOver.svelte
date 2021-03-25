<script>
    import { gameState } from "../../store/GameStore/gameStore";
</script>

<style>
    .gameOverModal {
        display: none;
        position: absolute;
        width: 100%;
        height: 100%;

        font-size: 30px;
        font-weight: 900;
        z-index: 200;
    }

    p {
        position: absolute;
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

    .gameover {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .glowing {
        position: relative;
        width: 750px;
        height: 750px;

        animation: colorChange 5s linear infinite;
    }

    @keyframes colorChange {
        0% {
            transform: rotate(0deg);
            filter: hue-rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
            filter: hue-rotate(360deg);
        }
    }

    .glowing span {
        position: absolute;
        top: calc(80px * var(--i));
        left: calc(80px * var(--i));
        right: calc(80px * var(--i));
        bottom: calc(80px * var(--i));
    }

    .glowing span:before {
        content: "";
        position: absolute;
        top: 50%;
        left: -8px;
        width: 15px;
        height: 15px;
        background: #f00;
        border-radius: 50%;
    }

    .glowing span:nth-child(3n + 1):before {
        background: rgba(134, 255, 0, 1);
        box-shadow: 0 0 20px rgba(134, 255, 0, 1), 0 0 40px rgba(134, 255, 0, 1),
            0 0 60px rgba(134, 255, 0, 1), 0 0 80px rgba(134, 255, 0, 1),
            0 0 0 8px rgba(134, 255, 0, 0.1);
    }
    .glowing span:nth-child(3n + 2):before {
        background: rgba(255, 214, 0, 1);
        box-shadow: 0 0 20px rgba(255, 214, 0, 1), 0 0 40px rgba(255, 214, 0, 1),
            0 0 60px rgba(255, 214, 0, 1), 0 0 80px rgba(255, 214, 0, 1),
            0 0 0 8px rgba(255, 214, 0, 0.1);
    }
    .glowing span:nth-child(3n + 3):before {
        background: rgba(0, 226, 255, 1);
        box-shadow: 0 0 20px rgba(0, 226, 255, 1), 0 0 40px rgba(0, 226, 255, 1),
            0 0 60px rgba(0, 226, 255, 1), 0 0 80px rgba(0, 226, 255, 1),
            0 0 0 8px rgba(0, 226, 255, 0.1);
    }
    .glowing span:nth-child(3n + 1) {
        animation: animate 10s alternate infinite;
    }
    .glowing span:nth-child(3n + 2) {
        animation: animate 4s alternate infinite;
    }
    .glowing span:nth-child(3n + 3) {
        animation: animate-reverse 3s alternate infinite;
    }

    @keyframes animate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    @keyframes animate-reverse {
        0% {
            transform: rotate(360deg);
        }
        100% {
            transform: rotate(0deg);
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
</style>

<div class="gameOverModal {$gameState.gameOver ? 'gameover' : ''} ">
    {#if $gameState.userWins}
        <p>You Win!</p>
    {:else}
        <p>You Lose!</p>
    {/if}
   <!--  <div class="glowing">
        <span style="--i:1;" />
        <span style="--i:2;" />
        <span style="--i:3;" />
    </div> -->
</div>
<!-- {$gameState.gameOver ? 'gameover' : ''} -->
