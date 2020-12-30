# SixPieces

SixPieces is based on [`babylon.js`](https://www.babylonjs.com/) and uses [this starter package](https://github.com/leon/starter-babylonjs) for the basic config.

# Getting started
Installation requires `npm`, the Node.js package manager. To run do
```
npm install
npm start
```
If the installation (first step) is succesful, the second step will open a web browser and the `localhost:3000`.
Both take some time.

Note that npm7 takes offense with some dependencies. npm6 doesn't.

# Setting up a server 
(not yet implemented)
```
npm install --save esm
npm run serve
```

# TODO
* add display for scores
* add remote server for multiplayer
  * disentangle dependencies so that server.ts compiles
  * allow using standalone server without gui
  * add option to rename players
  * add lobby
* remove / replace react
* add levitating arrow pointing at current player
