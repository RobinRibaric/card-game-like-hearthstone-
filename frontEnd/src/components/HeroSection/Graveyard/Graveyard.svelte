<script>
    import { gameState } from "../../../store/GameStore/gameStore";
    const openGraveyard = () => {
        gameState.update((game) => ({ ...game, showUserGraveyard: true }));
    };
</script>

<style>
    .graveyard {
        position: absolute;
        right: 5%;
        height: 90%;
        width: 15vh;
        border: 1px solid black;
        align-self: center;
    }
    .graveyard:hover {
        cursor: pointer;
    }
</style>

<div class="graveyard" on:click={openGraveyard}>Grave</div>
