# card-game-like-hearthstone-

A card game like hearthstone. Just a try to see if it is doable in javascript. Not finished whatsoever. Code is messy but playable. 

To play:
1. Run server with nodemon index.js.
2. Run the fron end with npm run dev.
3. Open two tabs with localhost:5000 to try the game.
4. To play against someone on another screen, the server needs to be put on heroku (or something similar) and the adress pasted in the App.svelte file
5. 
Example:

//https://cardgamev1.herokuapp.com/

	let socket = io("localhost:5002");




Start of game:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/gameboard-first.png)

turn running out of time, middle line sliding to the end turn button:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/gameboard-turnRunningOutOfTime.png)

Casting a spell:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/castingSpell.png)

Graveyard:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/graveyard.png)

Attacking with minion:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/attackingWithMinion.png)

Attacking the 6/9 minion, before attack:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/beforeAttack69.png)

Attacking the 6/9 minion, after attack:
![](https://github.com/RobinRibaric/card-game-like-hearthstone-/blob/main/screenshots/afterAttack69.png)
