import { Engine, Scene, CubeTexture, Color4, Nullable, KeyboardEventTypes } from '@babylonjs/core'
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents'
import '@babylonjs/inspector' // for ctrl+alt+X
import { PieceMesh } from "./PieceMesh"
import { world } from './world'

export let canvas: HTMLCanvasElement
export let engine: Engine
export let scene: Scene
let handleResize: any

export const createEngine = (hostCanvas: HTMLCanvasElement) => {
  canvas = hostCanvas
  engine = new Engine(canvas, true, {}, true)

  handleResize = () => engine.resize()
  window.addEventListener('resize', handleResize)

  return engine
}

export let floatingPiece: Nullable<PieceMesh> = null

// functions for picking and moving objects: https://playground.babylonjs.com/#7CBW04
function getGroundPosition() {
  // TODO: faster if only checking ground with intersectsMesh?
  var pickinfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh.name === "ground"; });
  if (pickinfo && pickinfo.hit) {
    return pickinfo.pickedPoint;
  }
  return null;
}

/*
let startingPoint: any
let currentMesh: any

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
  if (!currentMesh)
    return;
  if (!startingPoint)
    return;
  var currentGPos = getGroundPosition();
  if (!currentGPos)
    return;

  var diff = currentGPos.subtract(startingPoint);
  startingPoint = currentGPos;
  // currentMesh.position.addInPlace(diff);
  var p = currentMesh.metadata as PieceMesh;
  // console.log(currentMesh.position.length())
  if (currentGPos.length() > 30) {
    if (currentGPos.length() > 33) {
      // add back to home
      p.moveHome();
    } else {
      // 
      let f = (currentGPos.length() - 30) / 3;
      // move and rotate
      currentMesh.position.addInPlace(diff);
      let angle = Math.PI * p.home_x! / 10;
      let rotv = new Vector3(-Math.PI / 2, -angle + Math.PI / 2, 0);
      currentMesh.position.y = 0.31 + (1 - 0.31) * f;
      currentMesh.rotation = rotv.scale(f);
    }
  } else {
    currentMesh.rotation = new Vector3(0, 0, 0);
    diff.y = 0; // don't allow to move up or down 
    currentMesh.moveWithCollisions(diff);
    currentMesh.position.y = 0.31;
  }

}
*/

function pointerMovePiece() {
  if (!floatingPiece)
    return;
  var currentGPos = getGroundPosition();
  if (!currentGPos)
    return;
  floatingPiece.updatePos(currentGPos);
}

// export const createScene = () => {
export function createScene() {
  scene = new Scene(engine)

  scene.clearColor = new Color4(0.8, 0.8, 0.8, 1)

  // optimize scene for opaque background
  scene.autoClear = false
  scene.autoClearDepthAndStencil = false

  // show the inspector when pressing shift + alt + I
  scene.onKeyboardObservable.add((kbinfo) => {
    if (kbinfo.event.ctrlKey && kbinfo.event.shiftKey && kbinfo.event.code === 'KeyX') {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide()
      } else {
        scene.debugLayer.show()
      }
    }
    if (kbinfo.type === KeyboardEventTypes.KEYDOWN) {
      switch (kbinfo.event.code) {
        case 'KeyC':
          // change camera mode
          world.toggleCameraMode();
          break;
        case 'KeyE':
          // end turn
          if (floatingPiece != null)
            // TODO: notify player that piece needs to be set
            return;
          world.placeCommand();
          break;
        case 'KeyS':
          // end turn
          if (floatingPiece != null)
            // TODO: notify player that piece needs to be set
            return;
          world.swapCommand();
          break;
        case 'Space':
          world.viewCameraCenter();
          break;
        case 'Enter':
          world.viewHomeCenter();
          break;
        default:
      }
    }
  }
  );

  scene.onPointerObservable.add((pointerInfo) => {
    /*   		
    // TODO: this allows to drag tiles -- re-enable for a future version with more animations?
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
    */
    switch (pointerInfo.type) {
      case PointerEventTypes.POINTERPICK:
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.pickedMesh.metadata) {
          // click on piece to select (or place)
          let p = pointerInfo.pickInfo.pickedMesh.metadata as PieceMesh;
          if (p.click())
            floatingPiece = p;
          else
            floatingPiece = null;
        } else {
          // when clicking on empty space, drop piece
          if (floatingPiece) {
            if (!floatingPiece.click()) // do this by virtually clicking on piece so that world can handle it
              floatingPiece = null;
          }
        }
        break
      case PointerEventTypes.POINTERMOVE:
        pointerMovePiece();
        break;
    }
  });

  return scene
}

export const createPBRSkybox = () => {
  const environmentTexture = CubeTexture.CreateFromPrefilteredData(
    'https://assets.babylonjs.com/environments/environmentSpecular.env',
    scene,
  )

  const skyboxMesh = scene.createDefaultSkybox(environmentTexture, true, 1000, 0.5, true)

  return skyboxMesh
}

export function shuffleArray<T>(array: Array<T>) {
  // Durstenfeld shuffle, from https://stackoverflow.com/a/12646864/143931
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

