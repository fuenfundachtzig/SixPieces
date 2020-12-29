//
// Class to describe a piece in the scene with an associated mesh.
//
// (85)
//
// $Id: PieceMesh.ts 3732 2020-12-29 15:31:10Z zwo $
//

import { Scene, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { colors, materials, Shape } from "./make_materials";
import { createSuperEllipsoid } from './superello';
import { piece_size, world, piece_y_stand } from "./world";
import { gridPos } from "./types/Field";
import { Piece } from "./piece";

// areas where piece cannot be dropped / will return to home
const InnerRing = 5;
const OuterRing = 6;

export function identify(p: PieceMesh): string {
  if (p.isHand)
    return `${p.id} (${colors[p.color]} ${Shape[p.shape]}) on ${p.home_x}`;
  else
    return `${p.id} (${colors[p.color]} ${Shape[p.shape]}) on (${p.gridxy.x}, ${p.gridxy.y})`;
}


export class PieceMesh implements Piece {
  // a piece in the scene with an associated mesh

  public mesh : Mesh;
  public id   : number;
  public color: number;
  public shape: number;

  constructor(
    p: Piece,
    // graphics info
    scene: Scene,
    // position
    public isHand: boolean = true,           // true = is on hand, false = is on field
    public gridxy: gridPos = { x: 0, y: 0 }, // position on field  / grid
    public home_x: number = -1,              // index on hand
    public homexy: gridPos = { x: 0, y: 0 }, // cache: home position computed from home_x, size of field and direction of player
    public homerot: Vector3 = new Vector3(), // cache: rotation in home position
    public fix: boolean = false,             // cannot be moved (= !isPickable)
    // flags
    public glows = false,
    private isSelected = false // is selected
  ) {

    this.id    = p.id;
    this.color = p.color;
    this.shape = p.shape;

    // init mesh
    this.mesh = createSuperEllipsoid(8, 0.2, 0.2, piece_size / 2, 0.3, piece_size / 2, scene);
    this.mesh.material = materials[this.shape][this.color];
    this.mesh.ellipsoid = new Vector3(0.99, 100, 0.99);
    this.mesh.metadata = this;
    this.mesh.isPickable = false;
    this.mesh.isVisible = false;
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
    if (world.withinField(newPosition, InnerRing)) { // TODO: use actual field size in all directions, TODO global offset that moves ground, lights and homes (but not pieces and camera)
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

}
