import { Engine, Scene, ArcRotateCamera, Vector3, CubeTexture, Color4, PickingInfo } from '@babylonjs/core'
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents'
import { Nullable } from '@babylonjs/core/types'
import '@babylonjs/inspector'

export let canvas: HTMLCanvasElement
export let engine: Engine
export let scene: Scene
export let camera: ArcRotateCamera
let handleResize: any

export const createEngine = (hostCanvas: HTMLCanvasElement) => {
  canvas = hostCanvas
  engine = new Engine(canvas, true, {}, true)

  handleResize = () => engine.resize()
  window.addEventListener('resize', handleResize)

  return engine
}

let startingPoint: any
let currentMesh: any

// functions for picking and moving objects: https://playground.babylonjs.com/#7CBW04
function getGroundPosition() {
  var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh.name == "ground"; });
  if (pickinfo && pickinfo.hit) {
      return pickinfo.pickedPoint;
  }
  return null;
}

function pointerDown(mesh: any) {
  currentMesh = mesh
  startingPoint = getGroundPosition()
  if (startingPoint) { // we need to disconnect camera from canvas
    setTimeout(function () {
      camera.detachControl(canvas)
    }, 0)
  }
}

function pointerUp() {
  if (startingPoint) {
    camera.attachControl(canvas, true);
    startingPoint = null;
    return;
  }
}

function pointerMove() {
  if (!startingPoint) {
      return;
  }
  var current = getGroundPosition();
  if (!current) {
      return;
  }

  var diff = current.subtract(startingPoint);
  startingPoint = current;
  diff.y = 0; // don't allow to move up or down 
  // currentMesh.position.addInPlace(diff);
  currentMesh.moveWithCollisions(diff);
  currentMesh.position.y = 0.31;
}

export const createScene = () => {
  scene = new Scene(engine)

  scene.clearColor = new Color4(0.8, 0.8, 0.8, 1)

  // optimize scene for opaque background
  scene.autoClear = false
  scene.autoClearDepthAndStencil = false

  // show the inspector when pressing shift + alt + I
  scene.onKeyboardObservable.add(({ event }) => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyI') {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide()
      } else {
        scene.debugLayer.show()
      }
    }
  })

  scene.onPointerObservable.add((pointerInfo) => {      		
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERDOWN:
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.hit && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.pickedMesh.name != "ground") {
          pointerDown(pointerInfo.pickInfo.pickedMesh)
        }
        break;
      case PointerEventTypes.POINTERUP:
        pointerUp();
        break;
      case PointerEventTypes.POINTERMOVE:
        pointerMove();
        break;
    }
  });

  return scene
}

export const createArcRotateCamera = () => {
    const startAlpha  = 230/180*Math.PI
    const startBeta   =  50/180*Math.PI
    const startRadius = 30
    const startPosition = new Vector3(0, 8, 0)

    camera = new ArcRotateCamera('camera', startAlpha, startBeta, startRadius, startPosition, scene, true)
    camera.attachControl(canvas, false)

    // Set some basic camera settings
    camera.minZ = 1 // clip at 1 meter

    camera.panningAxis = new Vector3(1, 0, 1) // pan along ground
    camera.panningSensibility = 100 // how fast do you pan, set to 0 if you don't want to allow panning (smaller value = faster)
    camera.panningOriginTarget = Vector3.Zero() // where does the panning distance limit originate from
    camera.panningDistanceLimit = 100 // how far can you pan from the origin
    
    camera.allowUpsideDown = false // don't allow zooming inverted
    camera.lowerRadiusLimit = 2 // how close can you zoom
    camera.upperRadiusLimit = 100 // how far out can you zoom
    camera.lowerBetaLimit = 0.5 // how high can you move the camera
    camera.upperBetaLimit = 1.4 // how low down can you move the camera
    
    camera.checkCollisions = true // make the camera collide with meshes
    camera.collisionRadius = new Vector3(2, 2, 2) // how close can the camera go to other meshes

    return camera
}

export const createPBRSkybox = () => {
  const environmentTexture = CubeTexture.CreateFromPrefilteredData(
    'https://assets.babylonjs.com/environments/environmentSpecular.env',
    scene,
  )
  
  const skyboxMesh = scene.createDefaultSkybox(environmentTexture, true, 1000, 0.5, true)
  
  return skyboxMesh
}
