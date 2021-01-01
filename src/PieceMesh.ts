//
// Class to describe a piece in the game.
//
// (85)
//
// $Id: PieceMesh.ts 3742 2020-12-30 11:56:18Z zwo $
//

import { Scene, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { materials, Shape } from "./make_materials";
import { createSuperEllipsoid } from './superello';
import { piece_size, world, piece_y_stand } from "./world";
import { gridPos } from "./types/Field";
import { Piece, PieceInGame } from "./types/GameState";

// areas where piece cannot be dropped / will return to home
const InnerRing = 5;
const OuterRing = 6;


export class PieceMesh implements PieceInGame {
  // a piece in the scene with an associated mesh

  public mesh: Mesh;
  public id: number;
  public color: number;
  public shape: number;
  private unveil: boolean = false; // show shape and color
  public invalid: boolean = false;

  constructor(
    p: Piece,
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
    // this.mesh.checkCollisions = true; -- manual now
  }

  setGrid(xy: gridPos) {
    // set mesh on field
    this.mesh.position = world.toGroundCoord(xy);
    this.mesh.rotation = new Vector3();
  }

  moveHome() {
    // compute home position for meshes
    this.mesh.position.set(this.homexy.x, piece_y_stand, this.homexy.y);
    this.mesh.rotation = this.homerot;
    this.isHand = true;
  }

  click() {
    world.click(this);
    return this.isSelected;
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
    if (world.withinField(newPosition, InnerRing)) { // TODO global offset that moves ground, lights and homes (but not pieces and camera)
      // is within field: check if can snap to empty field
      let xy = world.snap(newPosition);
      if (world.isEmpty(xy)) {
        this.gridxy = xy;
        this.mesh.position = world.toGroundCoord(xy);
        this.mesh.rotation = Vector3.Zero();
        // console.log("set gridxy " + xy.x + ","+ xy.y)
        this.isHand = false;
      }
    } else if (world.withinField(newPosition, OuterRing)) {
      this.mesh.rotation = Vector3.Zero();
      this.mesh.position = newPosition;
      this.isHand = true;
    } else {
      this.moveHome();
    }
  }

  setUnveil(unveil: boolean) {
    if (unveil)
      this.mesh.material = materials[this.shape][this.color];
    else
      this.mesh.material = materials[Shape.Hidden][0];
    this.unveil = unveil;
  }

}
