//
// Class to describe a piece in the scene with an associated mesh.
//
// (85)
//
// $Id: PieceMesh.ts 3728 2020-12-28 20:36:28Z zwo $
//

import { Scene, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { materials } from "./make_materials";
import { createSuperEllipsoid } from './superello';
import { piece_size, world, piece_y_stand } from "./world";
import { gridPos } from "./types/Field";
import { PieceGame } from "./piece";


export class PieceMesh {
  // a piece in the scene with an associated mesh
  public mesh: Mesh;

  constructor(
    scene: Scene,
    public p: PieceGame,
    // position
    public homerot: Vector3 = new Vector3,


    // public field_size: number = 0,            // cache field size
    // flags
    public glows = false,
    private isSelected = false // is selected
  ) {

    // init mesh
    this.mesh = createSuperEllipsoid(8, 0.2, 0.2, piece_size / 2, 0.3, piece_size / 2, scene);
    this.mesh.material = materials[this.p.shape][this.p.color];
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
    this.mesh.position.set(this.p.homexy.x, piece_y_stand, this.p.homexy.y);
    this.mesh.rotation = this.homerot;
    this.p.isHand = true;
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
    if (world.withinField(newPosition, 5)) {
      // is within field: check if can snap to empty field
      let xy = world.snap(newPosition); // TODO: use TransformNode?
      if (world.isEmpty(xy)) {
        this.p.gridxy = xy;
        this.mesh.position = world.toGroundCoord(xy);
        this.mesh.rotation = new Vector3();
        // console.log("set gridxy " + xy.x + ","+ xy.y)
      }
      this.p.isHand = false;
    } else if (world.withinField(newPosition, 8)) {
      this.mesh.rotation = new Vector3();
      this.mesh.position = newPosition;
    } else {
      this.moveHome();
    }
  }

}
