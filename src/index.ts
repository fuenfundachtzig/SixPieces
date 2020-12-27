// 
// Main
// 
// (85)
//
// $Id: index.ts 3716 2020-12-26 23:07:54Z zwo $


import 'pepjs'

import { createEngine, createScene } from './functions'
import { makeMaterials } from './make_materials'
import { createWorld } from './world'

// Import stylesheets
// import './index.css';

const canvas: HTMLCanvasElement = document.getElementById('root') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
makeMaterials(scene);
createWorld(scene)

// main function that is async so we can call the scene manager with await
const main = async () => {

  // Start the scene
  engine.runRenderLoop(() => {
    scene.render()
  })
}

// start the program
main()
