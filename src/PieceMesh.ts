//
// Class to describe a tile (piece) in the game including its graphical representation as a mesh.
//
// (85)
//
// $Id: PieceMesh.ts 4033 2022-03-22 17:03:35Z zwo $
//

import { Scene, Vector3, Animation, CubicEase, EasingFunction, IAnimationKey } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Shape } from "./types/Materials";
import { createSuperEllipsoid } from './superello';
import { piece_size, world, piece_y_stand } from "./world";
import { gridPos } from "./types/Field";
import { PieceInGame } from "./types/GameState";
import { scene } from "./functions";
import { materials } from "./make_materials";
import { chosenShapeSet } from ".";

// areas where piece cannot be dropped / will return to home
const InnerRing = 5;
const OuterRing = 6;

function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeV(v1: Vector3, v2: Vector3, step: number, steps: number): Vector3 {
  let w = easeInOutCubic(step / steps);
  return v1.add(v2.subtract(v1).scale(w));
}

export class PieceMesh implements PieceInGame {
  // a piece in the scene with an associated mesh

  public mesh: Mesh;
  public id: number;
  public color: number;
  public shape: number;
  private unveil: boolean = false; // show shape and color
  public invalid: boolean = false;

  constructor(
    p: PieceInGame,
    // graphics info
    scene: Scene,
    // position
    public isHand: boolean = true,
    public gridxy: gridPos = { x: 0, y: 0 },
    public home_x: number = -1,
    public fix: boolean = false,
    // graphics-related stuff
    public homexy: gridPos = { x: 0, y: 0 },  // cache: home position computed from home_x, size of field and direction of player
    public homerot: Vector3 = Vector3.Zero(), // cache: rotation in home position
    // flags
    private isSelected = false // is selected
  ) {

    this.id = p.id;
    this.color = p.color;
    this.shape = p.shape;

    // init mesh
    this.mesh = createSuperEllipsoid(8, 0.2, 0.2, piece_size / 2, 0.3, piece_size / 2, scene);
    this.mesh.ellipsoid = new Vector3(0.99, 100, 0.99);
    this.mesh.metadata = this;
    this.mesh.isPickable = false;
    this.mesh.isVisible = false;
    this.setUnveil(false);
    world.addShadow(this.mesh);
    // this.mesh.checkCollisions = true; -- manual now
  }

  setGrid(xy: gridPos, animate: boolean = false) {
    // place mesh on board
    let targetPos = world.toGroundCoord(xy);
    let diff = targetPos.subtract(this.mesh.position);
    if ((diff.length() < 0.1) || !animate) {
      this.mesh.position = targetPos;
      this.mesh.rotation = Vector3.Zero();
    } else {
      const frameRate = 60;
      const frames = 60;
      const steps = 10;
      const posSlide = new Animation(`posSlide${xy.x}X${xy.y}`, "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
      const rotSlide = new Animation(`rotSlide${xy.x}X${xy.y}`, "rotation", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
      // compute keys
      let keysPos: IAnimationKey[] = [];
      let keysRot: IAnimationKey[] = [];
      for (var x = 0; x <= steps; ++x) {
        let f = x / steps; // fraction of animation time
        let pos = easeV(this.mesh.position, targetPos, x, steps); // compute interpolated position for frame no. (f*frames)
        pos.y = pos.y + (1 - 4 * (f - 0.5) * (f - 0.5)) * 3; // add parabola in z-direction
        keysPos.push({ frame: f * frames, value: pos });
        keysRot.push({ frame: f * frames, value: easeV(this.mesh.rotation, Vector3.Zero(), x, steps) });
      }
      // for (; x <= steps; ++x) {
      //   let f = x / steps;
      //   let pos = easeV(this.mesh.position, targetPos, x, steps);
      //   pos.y = pos.y + (1 - 4 * (f - 0.5) * (f - 0.5)) * 3;
      //   keysPos.push({ frame: f * frames, value: pos });
      //   keysRot.push({ frame: f * frames, value: easeV(this.mesh.rotation, Vector3.Zero(), x, steps) });
      // }
      posSlide.setKeys(keysPos);
      rotSlide.setKeys(keysRot);
      // posSlide.setKeys([{ frame: 0, value: this.mesh.position }, { frame: frameRate, value: targetPos }]);
      // rotSlide.setKeys([{ frame: 0, value: this.mesh.rotation }, { frame: frameRate, value: Vector3.Zero() }]);
      scene.beginDirectAnimation(this.mesh, [posSlide, rotSlide], 0, frames, false);
      // const easingFunction = new CubicEase();
      // easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEIN);
      // posSlide.setEasingFunction(easingFunction);
      // rotSlide.setEasingFunction(easingFunction);
    }
  }

  moveHome(animate: boolean = false, animate_drop: boolean = false) {
    // compute and set hand position for meshes 
    let homepos = new Vector3(this.homexy.x, piece_y_stand, this.homexy.y);
    if (!animate) {
      this.mesh.position = homepos;
      this.mesh.rotation = this.homerot;
    } else {
      // animation only used for new pieces that "drop from heaven"
      const easingFunction = new CubicEase();
      this.mesh.rotation = this.homerot;
      let homepos_start = this.mesh.position;
      if (animate_drop) {
        homepos_start = homepos.clone();
        homepos_start.y = 100;
        this.mesh.position = homepos_start;
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
      } else
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
      const frameRate = 60;
      const frames = 60;
      const posSlide = new Animation(`posSlide${this.id}`, "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
      posSlide.setKeys([{ frame: 0, value: homepos_start }, { frame: frames, value: homepos }]);
      posSlide.setEasingFunction(easingFunction);
      scene.beginDirectAnimation(this.mesh, [posSlide], 0, frames, false);
    }
    this.isHand = true;
  }

  select() {
    // mark piece as selected
    if (this.mesh) {
      this.mesh.visibility = 0.5;
      this.isSelected = true;
    }
  }

  unselect() {
    // mark piece as unselected
    if (this.mesh)
      this.mesh.visibility = 1.0;
    this.isSelected = false;
  }

  updatePos(newPosition: Vector3) {
    // move piece (mesh)
    if (!this.mesh)
      return;
    if (world.isWithinField(newPosition, InnerRing)) { // TODO global offset that moves ground, lights and homes (but not pieces and camera)
      // is within field: check if can snap to empty field
      let xy = world.snap(newPosition);
      if (world.isEmpty(xy)) {
        this.gridxy = xy;
        this.mesh.position = world.toGroundCoord(xy);
        this.mesh.rotation = Vector3.Zero();
        // console.log("set gridxy " + xy.x + ","+ xy.y)
        this.isHand = false;
      }
    } else if (world.isWithinField(newPosition, OuterRing)) {
      // freely float (don't snap) between field and outer ring
      this.mesh.rotation = Vector3.Zero();
      this.mesh.position = newPosition;
      this.isHand = true;
    } else {
      // if even further out: move piece back to hand
      this.moveHome();
    }
  }

  setUnveil(unveil: boolean) {
    if (unveil)
      this.mesh.material = materials[chosenShapeSet[this.shape]][this.color];
    else
      this.mesh.material = materials[Shape.Hidden][0];
    this.unveil = unveil;
  }

}
