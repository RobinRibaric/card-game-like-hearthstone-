<script>
    import { gameState } from "../../store/GameStore/gameStore";
</script>

<style>
    .separator {
        width: 100%;
        height: 10px;
        z-index: 1;
        box-shadow: 0 0 30px #462574, inset 0 0 30px#462574;
        background: linear-gradient(270deg, #462574, #6628bd, #9e61f3);
        background-size: 600% 600%;

        -webkit-animation: AnimationName 6s ease infinite;
        -moz-animation: AnimationName 6s ease infinite;
        animation: AnimationName 6s ease infinite;
        animation: animate 5s linear;

        transition: width 30s;
        animation-timing-function: linear infinite;
        text-align: right;
        margin-left: auto;
    }

    .endTurn {
        width: 10%;
    }

    @keyframes animate {
        0% {
            box-shadow: 0 0 30px#462574, inset 0 0 30px#462574;
            filter: hue-rotate(0deg);
        }
        20% {
            box-shadow: 0 0 30px#462574, inset 0 0 30px #462574;
        }
        40% {
            box-shadow: 0 0 30pxv#462574, inset 0 0 30px#462574;
        }
        60% {
            box-shadow: 0 0 30px#462574, inset 0 0 30px #462574;
        }
        80% {
            box-shadow: 0 0 30px #462574, inset 0 0 30px #462574;
        }
        100% {
            box-shadow: 0 0 50px #462574, inset 0 0 50px #462574;
            filter: hue-rotate(360deg);
        }
    }

    @-webkit-keyframes AnimationName {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
        }
    }
    @-moz-keyframes AnimationName {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
        }
    }
    @keyframes AnimationName {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
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

<div class="separator {$gameState.turnEnding ? 'endTurn' : ''}" />
