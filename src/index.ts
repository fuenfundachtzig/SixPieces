// 
// Main
// 
// (85)
//
// $Id: index.ts 3731 2020-12-29 13:43:23Z zwo $


import 'pepjs'

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'
import { Client } from 'boardgame.io/client';
import { GameLogic } from './game';


// Import stylesheets
// import './index.css';

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
export const gameClient = Client({ game: GameLogic });
gameClient.subscribe((state) => {
  if (state) {
    world.setCurrPlayer(state.ctx.currentPlayer);
    world.unpack(state.G)
  }
});
gameClient.start();

// start the GUI
main()
