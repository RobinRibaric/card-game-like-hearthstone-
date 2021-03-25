<script>
    export let spellPlayedID;
    import {get} from 'svelte/store';
    import {opponentHand} from '../../store/HandStore/handStore';
    import {opponentGraveyard} from '../../store/GraveyardStore/graveyardStore';
    let card;
    $: if(spellPlayedID) {
        console.log(spellPlayedID, 'spell played')
            card = get(opponentHand).find(card => card.id === spellPlayedID);
        if(!card) {
            card = get(opponentGraveyard).find(card => card.id === spellPlayedID);
        }
        console.log(card);
    }
    
	function downHandler(e) {
		e.preventDefault();
	}
</script>

<style>
	.card {
		height: 20vh;
		width: 13.5vh;
		border: 1px solid black;
		display: flex;
		flex-direction: column;
		margin: 5px 10px;
		position: absolute;
		overflow: hidden;
		background: white;
        top: 24%;
        left: 25%;
        z-index: 100;
        animation: slideMe 1050ms linear;
        opacity: 0;
        /* animation: fadeOut 200ms ease-out
        animatio */
        /* transition-delay: 1s;
        transition: opacity 2s; */
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

    .imgContainer {
		flex: 0.6;
		width: 100%;
		border-bottom: 1px solid black;
	}


	/* .papa-hand1 {
		width: 12vh;
	} */
	@keyframes slideMe {
        0% {
            transform: translateY(-20vh) translateX(10vh);
            opacity: 0;
        }
        
        15% {
            opacity: 1;
            transform: translateY(0vh) translateX(0vh);
        }
        60% {
            opacity: 1;
        }
        100%{
            
        }
    }

    @keyframes fadeOut {
        0%{
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
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


	<div
		class="spell card papa-hand1 high-light"
		on:mousedown={downHandler}>
       
			<div class="imgContainer" style="background-color:{card.imgPath}">
				<!-- {#if card.imgPath === 'leonVagoroth'}
				
			{/if} -->
				<img
					class="cardImg"
					src={'./images/nethergrasp.jpg'}
					alt="a eeeviiil card" />
			</div>

			<div class="cardText">lorem ipsum dolem forum marius saurisus.</div>
		
	</div>

