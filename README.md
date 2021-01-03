# SixPieces

SixPieces is a multiplayer game written in TypeScript. Its graphical user interface is rendered in 3-D using [`babylon.js`](https://www.babylonjs.com/) with HTML5 and WebGL. In server/client mode, it uses [`boardgame.io`](https://boardgame.io/), an open-source engine for turn-based games, to synchronize the game state between server and clients.

## Getting started
Installation requires `npm`, the Node.js package manager, to be installed. To run do
```
npm install
npm start
```
If the installation (first step) was successful, the second step will open a web browser and navigate to `localhost:3000`.
Both take some time.

Note that npm7 takes offense with some dependencies. npm6 doesn't.

A standalone version that can run in (hopefully) any recent web browser can be be created with
```
npm build
```

## How to play
Enter a new match ID to create a new game. 
Other players can join (and rejoin) the game by using the same match ID. (No authentication is done.)

Players take turns. 
There are 6 colors and 6 shapes.
Each piece exists 3 times.
Each player starts with a deck of 6 pieces on their hand, and draws new pieces to again have 6 at the end of the turn.
In each turn you can either place one to six pieces on the board or swap one to six pieces from your deck with the bag.
Pan, move and zoom the field by using the mouse.
Place your pieces by clicking them and then clicking on the board.
When you have placed all pieces you want to play, press `p` to end your turn.
If pieces are highlighted in red, they cannot be placed here (allowed are straight lines, mix colors or shapes). 
To return pieces to the bag (swap), place them anywhere on the field as before and press `s`.

For each piece in a valid row or column you get one point for each piece in that row or column. 
If you complete a row or column you get 6 bonus points. 
Also if the bag is empty and you place the last piece from your deck, you get a final 6 bonus points.
This ends the game.
The player with the most points wins.
The current scores are shown in the document title.


### Keyboard shortcuts
* `e`: place pieces on field
* `s`: swap pieces on field
* `c`: toggle between orthographic and perspective camera view
* `[space]`: move camera to view field
* `[return]`: move camera to view own pieces
* arrow keys or left-click: rotate and tilt view
* ctrl + arrow keys or right-click: pan view
* alt + up/down or wheel: zoom

For debugging:
* `[ctrl]+[shift]+x`: open babylon inspector to debug GUI

### Playing in local mode
Not tested much. `multiplayer: Local()` does not yet work. Running without `multiplayer` works for debugging.

### Playing in server/client mode
This requires a server to be setup with [`SixPiecesServer`](https://github.com/fuenfundachtzig/SixPiecesServer/) that can be accessed from the web. 
Alternatively, server and clients can also be run on the same machine for testing. The server address is currently configured in `public/index.html`.  

## TODO
* setup screen, add more options:
  * configure server address (server_url)
  * rename players (Player.name -- keep playerID numeric strings from 0..3)
  * (choose size of bag, limitBag)
  * add authentication for players
* keyboard shortcuts:
  * select pieces from hand by pressing 1..6
* GUI:
  * improve display of scores and number of pieces left in bag
  * display player names
  * add simpler shapes that are better visible (e.g. circle with hole or triangle to replace star)
  * improve camera positions (viewHomeCenter, viewCameraCenter)
  * add "?" on pieces on hand of opponents (instead of leaving blank) (drawShape for Shape.Hidden)
  * improve animation for sphere or add levitating arrow pointing at current player (could replace current sphere)
  * add effect for 6-in-a-row bonus
  * add sound
  * improve animations (cf. Animation in several places)
* features
  * remove / replace react
  * add license information
  * increase max. number of players
  * cleanup structure of code
  * make linter happy
  * add favicon
  * use [lobby API](https://github.com/boardgameio/boardgame.io/blob/master/docs/documentation/api/Lobby.md) for match making

### Technical remarks
* 2-D grid needed for isValidMove and isEmpty
* 1-D list of pieces needed for updating meshes
