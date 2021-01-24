//
// Makes two types of cameras.
//
// (85)
//
// $Id: cameras.ts 3759 2021-01-03 19:22:00Z zwo $

import { ArcRotateCamera, Camera, Vector3 } from "@babylonjs/core";
import { scene, canvas } from "./functions";

export function createCamera(): ArcRotateCamera {

  let camera: ArcRotateCamera;

  const startAlpha = 45 / 180 * Math.PI
  const startBeta = 60 / 180 * Math.PI
  const startRadius = 20
  const startPosition = new Vector3(15, 8, 15)

  camera = new ArcRotateCamera('camera', startAlpha, startBeta, startRadius, startPosition, scene, true)
  camera.attachControl(canvas, false)

  // common camera presets
  camera.minZ = 1;
  camera.angularSensibilityX = 1000;
  camera.angularSensibilityY = 1000;  
  camera.checkCollisions = true // make the camera collide with meshes
  camera.collisionRadius = new Vector3(2, 2, 2) // how close can the camera go to other meshes
  camera.allowUpsideDown = false // don't allow zooming inverted
  // camera.inertia = 0.2;
  // camera.panningInertia = 0.2;

  return camera;
  
}


export const configurePerspectiveCamera = (camera: ArcRotateCamera) => {
  // configure perspective view

  camera.mode = Camera.PERSPECTIVE_CAMERA;

  camera.panningAxis = new Vector3(1, 0, 1) // pan along ground
  camera.panningSensibility = 50 // how fast do you pan, set to 0 if you don't want to allow panning (smaller value = faster)
  camera.panningOriginTarget = Vector3.Zero() // where does the panning distance limit originate from
  camera.panningDistanceLimit = 100 // how far can you pan from the origin

  camera.lowerRadiusLimit = 5 // how close can you zoom
  camera.upperRadiusLimit = 100 // how far out can you zoom
  camera.lowerBetaLimit = 0.3 // how high can you move the camera
  camera.upperBetaLimit = 1.3 // how low down can you move the camera

}


export function configureOrthographicCamera(camera: ArcRotateCamera, distance: number = 50) {
  // configure orthographic camera

  camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

  var aspect = canvas.height / canvas.width; 
  camera.orthoLeft = -distance/2;
  camera.orthoRight = distance / 2;
  camera.orthoBottom = camera.orthoLeft * aspect;
  camera.orthoTop = camera.orthoRight * aspect;

  // fix radius -- TODO: enable zooming by making mousewheel change ortho*
  camera.lowerRadiusLimit = 250;
  camera.upperRadiusLimit = 250;

  // using this property you can choose which axis to be use for panning
  camera.panningAxis = new Vector3(1, 1, 0);
  camera.lowerBetaLimit = 0.2;
  camera.upperBetaLimit = 5*Math.PI / 12;
  camera.panningSensibility = 80;


}