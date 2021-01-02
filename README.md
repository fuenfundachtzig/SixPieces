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

## Additional information
### Keyboard shortcuts
* `p`: place pieces on field
* `s`: swap pieces on field
* `[space]`: move camera to view field
* `[return]`: move camera to view own pieces

For debugging:
* `[ctrl]+[shift]+x`: open babylon inspector to debug GUI

### Play in local mode
Not tested much. `multiplayer: Local()` does not yet work. Running without `multiplayer` works for debugging.

### Play in server/client mode
This requires a server to be setup with [`SixPiecesServer`](https://github.com/fuenfundachtzig/SixPiecesServer/) that can be accessed from the web.

## TODO
* setup screen, add more options:
  * configure server address
  * choose number of players (numberOfPlayers)
  * choose matchID
  * rename players (Player.name -- keep playerID numeric strings from 0..3)
  * (choose size of bag)
  * add lobby
* keyboard shortcuts:
  * select pieces from hand by pressing 1..6
* GUI:
  * display scores while playing
  * display player names
  * display / show number of pieces left in bag
  * improve camera positions ()
  * add "?" on pieces on hand of opponents (instead of leaving blank) (drawShape for Shape.Hidden)
  * add levitating arrow pointing at current player
  * add effect for 6-in-a-row bonus
  * add sound
  * improve animations
* features
  * remove / replace react
  * add license information
  * increase max. number of players
  * cleanup structure of code
  * make linter happy

### Technical remarks
* 2-D grid needed for isValidMove and isEmpty
* 1-D list of pieces needed for updating meshes
