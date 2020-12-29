// 
// Main
// 
// (85)
//
// $Id: index.ts 3729 2020-12-28 22:12:00Z zwo $


import 'pepjs'
import { gameClient } from './client'

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { GameState } from './types/GameState'
import { createWorld } from './world'


// Import stylesheets
// import './index.css';

const canvas: HTMLCanvasElement = document.getElementById('root') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
makeMaterials(scene);
var world = createWorld(scene)

// main function that is async so we can call the scene manager with await
const main = async () => {

  // Start the scene
  engine.runRenderLoop(() => {
    scene.render()
  })

}

// start game client
gameClient.subscribe((state) => {
  if (state)
    world.unpack(state.G)
}
);
gameClient.start();
let x = gameClient.getState();
if (x) {
  // console.log("erfddfsdfsdf");
  world.unpack(x.G);
}

// start the GUI
main()
