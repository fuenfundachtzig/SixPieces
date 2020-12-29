// 
// Main
// 
// (85)
//
// $Id: index.ts 3738 2020-12-29 22:09:00Z zwo $


import 'pepjs'

import { Client } from 'boardgame.io/client';
import { Local } from 'boardgame.io/multiplayer'

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { GameDefinition } from './game';



// Import stylesheets
// import './index.css';

const numberOfPlayers = 4;
const debug = true;

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
  multiplayer: Local(),
  debug
});
gameClient.subscribe((state) => {
  if (state) {
    world.setCurrPlayer(state.ctx.currentPlayer);
    world.unpack(state.G)
  }
});
gameClient.start();

// start the GUI
main()
