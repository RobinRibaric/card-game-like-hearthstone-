<script>
    import { userGraveyard } from "../../../store/GraveyardStore/graveyardStore";
    import Card from "../../Card/Card.svelte";
</script>

<style>
    .graveyardList {
        width: 60vh;
        height: 140vh;
        position: absolute;
        z-index: 20;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        overflow-y: scroll;

        transform: rotate(-90deg);
        z-index: 10;
        border-radius: 10%;
    }

    .graveyardList::-webkit-scrollbar {
        display: none;
    }
    .graveyardList {
        -webkit-animation: fadein 3.3s; /* Safari, Chrome and Opera > 12.1 */
        -moz-animation: fadein 3.3s; /* Firefox < 16 */
        -ms-animation: fadein 3.3s; /* Internet Explorer */
        -o-animation: fadein 3.3s; /* Opera < 12.1 */
        animation: fadein 3.3s;
        z-index: 100;
    }

    @keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
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

    /* Safari, Chrome and Opera > 12.1 */
    @-webkit-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
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

    /* Opera < 12.1 */
    @-o-keyframes fadein {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .cardContainer {
        transform: rotate(90deg);
    }
</style>

<div class="graveyardList">
    {#each $userGraveyard as card, i}
        <div class="cardContainer">
            <Card {card} />
        </div>
    {/each}
</div>
