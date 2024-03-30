# SixPieces

SixPieces is a multiplayer online game based on the boardgame ["Qwirkle"](https://en.wikipedia.org/wiki/Qwirkle) by Susan McKinley Ross.

It is written in [TypeScript](https://www.typescriptlang.org/). Its graphical user interface is rendered in 3-D using [`babylon.js`](https://www.babylonjs.com/) with HTML5 and WebGL. It uses [`boardgame.io`](https://boardgame.io/), an open-source engine for turn-based games, to synchronize the game state between server and clients. 
Most of the coding was done end of 2020 to be able to play Qwirkle online. (There is another free implementation called [Pont](https://github.com/mkeeter/pont) by Matthew Keeter.)

There currently is no AI, i.e. the game can only be played human vs. human. 

## Start playing
[A demo server is running here.](https://zwo.uber.space/SixPieces/) Read below how to setup and play the game.

[![Play now!](figures/playnow.svg)](https://zwo.uber.space/SixPieces/)

![Screenshot](figures/screenshot.png)

The screenshot above shows the board in the middle to which pieces can be added, your pieces at the bottom left, your opponent's pieces (you don't see which these are, of course), and a green ball that indicates that it is your turn.

## How to play
### Starting / joining a new game
Open the link to the [demo server](https://zwo.uber.space/SixPieces/) (or run your own as described below) and enter a new unique *match ID* to create a new game in the field that looks like this:

![screenshot of form](figures/form_gameid.png)

Other players can join (and rejoin) the game by using the same *match ID*. (No authentication is done. You can send a link to others including the *match ID* by using the suffix `?matchID=`*match ID* in the URL, e.g. [https://zwo.uber.space/SixPieces/?matchID=20210604](https://zwo.uber.space/SixPieces/?matchID=20210604). This will prefill the *match ID* in the game setup screen so that others know which is the right game to join.)

### Actions in the game
Players take turns. 
There are 6 colors and 6 shapes.
Each piece exists 3 times.
Each player starts with 6 pieces on their hand, and draws new pieces to again have 6 at the end of the turn.
In each turn you can either place one to six pieces on the board or exchange one or more pieces from your hand with the bag.
Pan, move and zoom the field by using the mouse.
Place your pieces by clicking them and then clicking on the board.
When you have placed all pieces you want to play, press `e` to end your turn.
If pieces are highlighted in red, they cannot be placed here. **You can only place pieces in one row or column, and mix either colors or shapes.**
To return pieces to the bag (swap), place them anywhere on the field as before and press `s`.
(For ending the turn or swapping pieces, there are also icons in the bottom right corner of the screen. This is particularly useful when playing on a screen-only device without a keyboard.)

For each piece in a valid row or column you get one point for each piece in that row or column. 
If you complete a row or column you get 6 bonus points. 
Also, if the bag is empty and you place the last piece from your hand, you get a final 6 bonus points.
This ends the game.
The player with the most points wins.
The current scores are shown in the document title.

### Keyboard shortcuts
* `e`: end your turn (place pieces on field)
* `s`: swap pieces (exchange pieces with bag)
* `c`: toggle between orthographic and perspective camera view
* `[space]`: move camera to view whole field
* `[return]`: move camera to view own pieces
* arrow keys or left-click: rotate and tilt view
* ctrl + arrow keys or right-click: pan view
* alt + up/down or wheel: zoom

### Mouse navigation
* wheel: zoom in + out
* left click + drag: rotate view
* right click + drag: pan view

This means that **to move a piece on the board click to select it and click again to place it**, do not try to drag the piece, that won't work :)

### Alternative pieces
Two different set of shapes are available, the original and an alternative which is meant to have simpler shapes that are easier to distinguish:

![original shapes](figures/Shapes1small.png)
![alternative shapes](figures/Shapes2small.png)

Which set should be displayed can be chosen under "Display options" when joining a game.

## Installation 
To run your own server or contribute to the development, follow these instructions.

Installation requires `npm`, the [Node.js package manager](https://en.wikipedia.org/wiki/Npm), to be installed. First, create a local copy of the repository
```
git clone https://github.com/fuenfundachtzig/SixPieces.git
cd SixPieces/
```

Then, install 
```
npm install
npm start
```
If the installation (first step) was successful, the second step will open a web browser and navigate to `localhost:3000`. 
The "start" step may take a minute or so.

A standalone version that can run in (hopefully) any recent web browser can be created with
```
npm run build
```

### Debugging
* `[ctrl]+[shift]+x`: open babylon inspector to debug GUI

### Playing in local mode
Not tested much. `multiplayer: Local()` does not yet work? Running without `multiplayer` works for debugging.

### Playing in server/client mode
This requires a server to be setup with that can be accessed from the web. 
Alternatively, server and clients can also be run on the same machine for testing. The server address is currently configured in `public/index.html`.  

Installation of the server requires `npm`, the Node.js package manager, to be installed. To install the packages required for the server do
```
npm install
```
Then build and run the server with:
```
npm run buildserver
npm run serve
```

For local testing, run the server locally and set the server address (`server_url`) in [`index.html`](public/index.html) and the argument of `SocketIO` in [`index.ts`](src/index.ts).

The number of the port the server listens on can be set in `src/server.js` (or `src/server.ts` before compilation).

### Contribute
Feel invited to improve the code and take a look at the [to-do list](TODO.md).

### License
[GNU General Public License version 3](https://opensource.org/licenses/GPL-3.0)
