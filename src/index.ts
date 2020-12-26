// 
// Main
// 
// (85)
//
// $Id: index.ts 3715 2020-12-26 15:31:46Z zwo $


import 'pepjs'

import { createEngine, createScene } from './functions'
import { World } from './world'

// Import stylesheets
// import './index.css';

const canvas: HTMLCanvasElement = document.getElementById('root') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
const world = new World(scene)

// main function that is async so we can call the scene manager with await
const main = async () => {

  // Start the scene
  engine.runRenderLoop(() => {
    scene.render()
  })
}

// start the program
main()
