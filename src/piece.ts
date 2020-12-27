

import { Nullable, Scene, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { materials } from "./make_materials";
import { createSuperEllipsoid } from './superello';
import { piece_size, gridPos, world, piece_y_stand } from "./world";


export class Piece {
  constructor(
    // type
    public color: number = 0,
    public shape: number = 0,
  ) { };

}


export class PieceMesh extends Piece {
  // a piece in the scene
  public mesh: Mesh;
  constructor(
    scene: Scene,
    p: Piece,
    // position
    public gridxy: gridPos = {x: 0, y: 0},
    public isHand: boolean = true, // true = is on hand, false = is on field
    public home_x: number  = -1,
    // flags
    public fix         = false, // can no longer be moved
    public glows       = false, // glows
    private isSelected = false  // is selected
  ) {
    super();
    Object.assign(this, p);

    // init mesh
    this.mesh = createSuperEllipsoid(8, 0.2, 0.2, piece_size / 2, 0.3, piece_size / 2, scene);
    this.mesh.material   = materials[this.shape][this.color];
    this.mesh.ellipsoid  = new Vector3(0.99, 100, 0.99);
    this.mesh.metadata   = this;
    this.mesh.isPickable = false;
    // this.mesh.checkCollisions = true; -- manual now
  }

  setGrid(xy: gridPos) {
    // set mesh on field
    this.mesh.position = world.toGroundCoord(xy);
    this.mesh.rotation = new Vector3;
  }

  setHome(i: number = -1, field_size = 0) {
    // set mesh in home position 
    if (i < 0)
      i = this.home_x as number;
    let angle = Math.PI * i / 10;
    let x = -field_size - 10 + 10 * Math.cos(angle);
    let y = -field_size - 10 + 10 * Math.sin(angle);
    this.mesh.position.set(x, piece_y_stand, y);
    this.mesh.rotation.set(-Math.PI / 2, -angle + Math.PI / 2, 0);
    this.home_x = i;
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
    if (world.withinField(newPosition)) {
      // is within field: check if can snap to empty field
      this.gridxy = world.snap(newPosition); // TODO: use TransformNode?
      if (world.field.isEmpty(this.gridxy)) {
        this.mesh.position = world.toGroundCoord(this.gridxy);
        this.mesh.rotation = new Vector3();
      }
      this.isHand = false;
    } else {
      this.mesh.position = newPosition;
    }

  }
}
