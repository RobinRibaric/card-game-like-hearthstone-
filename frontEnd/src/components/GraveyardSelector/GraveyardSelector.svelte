<script>
    import { gameState } from "../../store/GameStore/gameStore";
    import RingOfFire from "./RingOfDoom/RingOfDoom.svelte";
    import GraveyardList from "./GraveyardList/GraveyardList.svelte";

    let closing = false;

    const close = () => {
        closing = true;
        setTimeout(() => {
            closing = false;
            gameState.update((game) => ({ ...game, showUserGraveyard: false }));
        }, 1800);
    };
</script>

<style>
    .graveyard {
        position: absolute;
        z-index: 20;
        margin: 0;
        padding: 0;
        display: none;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 80%;
        overflow: hidden;
    }

    .show__graveyard {
        display: flex;
    }

    .closing {
        -webkit-animation: fadeout 2s; /* Safari, Chrome and Opera > 12.1 */
        -moz-animation: fadeout 2s; /* Firefox < 16 */
        -ms-animation: fadeout 2s; /* Internet Explorer */
        -o-animation: fadeout 2s; /* Opera < 12.1 */
        animation: fadeout 2s;
    }

    .closeButton {
        position: absolute;
        color: white;
        width: 5vh;
        height: 3vh;
        z-index: 105;
        top: 80%;
        left: 50%;
    }

    .closeButton:hover {
        cursor: pointer;
    }

    @keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Firefox < 16 */
    @-moz-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-moz-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Safari, Chrome and Opera > 12.1 */
    @-webkit-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-webkit-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Internet Explorer */
    @-ms-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-ms-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }

    /* Opera < 12.1 */
    @-o-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @-o-keyframes fadeout {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
</style>

<div
    class="graveyard {closing ? 'closing' : ''} {$gameState.showUserGraveyard ? 'show__graveyard' : ''} ">
    <GraveyardList />
    <RingOfFire {closing} />
    <div class="closeButton" on:click={close}>Close</div>
</div>
