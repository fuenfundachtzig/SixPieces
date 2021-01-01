// 
// Main entry point.
//
// (85)
//
// $Id: index.ts 3744 2021-01-01 18:01:23Z zwo $

// import 'pepjs'

import { Client } from 'boardgame.io/client';
// import { Local } from 'boardgame.io/multiplayer'
import { SocketIO } from 'boardgame.io/multiplayer'

// for headless mode:
// var engine = new BABYLON.NullEngine();
// var scene = new BABYLON.Scene(engine);

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { GameDefinition } from './game';
import { PieceInGame } from './types/GameState';

// Import stylesheets
// import './index.css';

// configuration
const numberOfPlayers = 2;
export const debug = true; // NOTE: press ctrl+shift+X for debugging webGL objects
export const playerID = "0"; // this player's ID (TODO: let client pick)
export const hideopp = true; // hide other players' pieces on hand (not for debugging)
export const limitBag = 18; // less pieces in bag (for debugging)
export const ngeneration = 3; // how often each piece exists, normally 3

// setup objects
const canvas: HTMLCanvasElement = document.getElementById('root') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
makeMaterials(scene)
const world = createWorld(scene)

// main function that is async so we can call the scene manager with await
const main = async () => {

  // Start the scene
  engine.runRenderLoop(() => {
    scene.render()
  })

}

// construct and start game client and overlay debug panel
export const gameClient = Client({ 
  game: GameDefinition,
  numPlayers: numberOfPlayers,
  // multiplayer: Local(),
  multiplayer: SocketIO({ server: 'localhost:8000'}),
  playerID,
  debug
});
gameClient.subscribe((state) => {
  if (state) {
    world.setCurrPlayer(state.ctx.currentPlayer);
    world.unpack(state.G);
  }
});
gameClient.start();


// start the GUI
main()
