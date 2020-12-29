// 
// Main
// 
// (85)
//
// $Id: index.ts 3730 2020-12-29 11:01:25Z zwo $


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
makeMaterials(scene)
const world = createWorld(scene)

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


// start the GUI
main()
