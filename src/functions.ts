// 
// User interactions: click and move tiles
// 
// (85)
//
// $Id: functions.ts 4033 2022-03-22 17:03:35Z zwo $

import { Engine, Scene, CubeTexture, Color4, Nullable, KeyboardEventTypes } from '@babylonjs/core'
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents'
import '@babylonjs/inspector' // for ctrl+alt+X
import { thegrid } from '.'
import { PieceMesh } from "./PieceMesh"
import { Grid, gridPos, placePiece, remove, set, unplace } from './types/Field'
import { identify1 } from './types/GameState'
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

function dropFloatingPiece() {
  // drop floating piece
  if (floatingPiece) {
    if (floatingPiece.isHand) {
      floatingPiece.moveHome();
    } else {
      placePiece(thegrid, floatingPiece, floatingPiece.gridxy);
    }
    floatingPiece.unselect();
    floatingPiece = null;
  }
  world.enableCameraDrag();
}    

export function endAndPlace() {
  if (floatingPiece)
    // cannot end turn if any piece still floating
    // TODO: notify player that piece needs to be set
    return;
  world.placeCommand();
}

export function endAndSwap() {
  if (floatingPiece != null)
    // TODO: notify player that piece needs to be set
    return;
  world.swapCommand();
}

// export const createScene = () => {
export function createScene() {
  scene = new Scene(engine)

  scene.clearColor = new Color4(0.8, 0.8, 0.8, 1)

  // optimize scene for opaque background
  scene.autoClear = false
  scene.autoClearDepthAndStencil = false

  // show the inspector when pressing shift + alt + x
  scene.onKeyboardObservable.add((kbinfo) => {
    if (kbinfo.event.ctrlKey && kbinfo.event.shiftKey && kbinfo.event.code === 'KeyX') {
      if (scene.debugLayer.isVisible()) {
        scene.debugLayer.hide()
      } else {
        scene.debugLayer.show()
      }
    }
    if (kbinfo.type === KeyboardEventTypes.KEYDOWN) {
      console.log("key:" + kbinfo.event.code);
      world.unglow();
      if (kbinfo.event.code.startsWith("Digit")) {
        let num = parseInt(kbinfo.event.code.charAt(5));
        if (num <= 6) {
          let picked = world.getHand()[num-1];
          if (floatingPiece)
            if (floatingPiece !== picked) {
              dropFloatingPiece();
            }
          floatingPiece = picked;
          if (!picked.isHand) {
            unplace(thegrid, picked.gridxy);
          }
          floatingPiece.select();          
          console.log("picked: " + picked);
        }
      } else switch (kbinfo.event.code) {
        case 'KeyC':
          // change camera mode
          world.toggleCameraMode();
          break;
        case 'KeyE':
          // end turn
          endAndPlace();
          break;
        case 'KeyS':
          // end turn
          endAndSwap();
          break;
        case 'KeyR':
          // return piece
          if (floatingPiece) {
            floatingPiece.moveHome();
            dropFloatingPiece();
          }
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
    // handle mouse click
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
      case PointerEventTypes.POINTERDOWN:
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.pickedMesh.name !== "ground") {
          // do not drag camera
          world.disableCameraDrag();
        }
        break;
      case PointerEventTypes.POINTERUP:
        // reallow drag
        if (!floatingPiece)
          world.enableCameraDrag();
        break;
      case PointerEventTypes.POINTERPICK:
        if (pointerInfo.pickInfo && pointerInfo.pickInfo.pickedMesh && pointerInfo.pickInfo.pickedMesh.metadata) {
          // click on piece to select (or place)
          world.unglow();
          let p = pointerInfo.pickInfo.pickedMesh.metadata as PieceMesh;
          if (floatingPiece) {
            dropFloatingPiece();
          } else {
            floatingPiece = p;
            if (!p.isHand) {
              unplace(thegrid, p.gridxy);
            }
            p.select();
          }
        } else {
          // when clicking on empty space, drop piece
          if (floatingPiece) 
            dropFloatingPiece();
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
  // global background
  const environmentTexture = CubeTexture.CreateFromPrefilteredData(
    'https://assets.babylonjs.com/environments/environmentSpecular.env',
    scene,
  )

  const skyboxMesh = scene.createDefaultSkybox(environmentTexture, true, 1000, 0.5, true)

  return skyboxMesh
}

