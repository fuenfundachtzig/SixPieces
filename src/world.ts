// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3716 2020-12-26 23:07:54Z zwo $

import { Color3, DirectionalLight, HemisphericLight, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, shuffleArray } from "./functions";
import { materials } from "./make_materials";
import { createSuperEllipsoid } from './superello'

// y positions of pieces
const piece_y_lie = 0.31;
const piece_y_stand = 1;

export class Piece {

  constructor(
    // type
    public color: number = 0,
    public shape: number = 0,
    public mesh: Nullable<Mesh> = null,
    // grid position
    public grid_x: Nullable<number> = null,
    public grid_y: Nullable<number> = null,
    // home position
    public home_x: Nullable<number> = null,
  ) { };

  setPosition(m: Mesh, field_size: number = 0) {
    // compute position for piece
    if (this.home_x != null) {
      // set mesh in home position 
      let angle = Math.PI * this.home_x / 10;
      let x = -field_size - 10 + 10 * Math.cos(angle);
      let y = -field_size - 10 + 10 * Math.sin(angle);
      m.position.set(x, piece_y_stand, y);
      m.rotation.set(-Math.PI / 2, -angle + Math.PI / 2, 0)
      m.isPickable = true;
    } else if ((this.grid_x != null) && (this.grid_y != null)) {
      // set mesh on field
      m.position.set(this.grid_x, piece_y_lie, this.grid_y);
      m.rotation = new Vector3;
    }
  }

  setGrid(x: number, y: number, scene: Scene) {
    this.grid_x = x;
    this.grid_y = y;
    this.mesh = this.makeMesh(scene);
    this.setPosition(this.mesh);
  }

  setHome(i: number, scene: Scene) {
    this.home_x = i;
    this.mesh = this.makeMesh(scene);
    this.setPosition(this.mesh);
  }

  makeMesh(scene: Scene) {
    const mesh = createSuperEllipsoid(8, 0.2, 0.2, 1, 0.3, 1, scene);
    mesh.material = materials[this.shape][this.color];
    mesh.checkCollisions = true;
    mesh.ellipsoid = new Vector3(0.99, 100, 0.99)
    mesh.metadata = this;
    return mesh;
  }

}


class Bag {

  private bag: Array<Piece> = []; // pieces in the bag

  constructor() {
    // fill bag
    for (let i = 0; i < 6; ++i)
      for (let j = 0; j < 6; ++j)
        for (let k = 0; k < 3; ++k)
          this.bag.push(new Piece(i, j));
    // shuffle
    shuffleArray(this.bag);
  }

  draw(): Piece | undefined {
    return this.bag.pop();
  }

}


interface placedPiece {
  piece: Piece;
  x: number;
  y: number;
}


class Field {

  // private field: Array<[Piece, number, number]> = []; // pieces in the game -- typescript cannot handle arrays of tuples, https://stackoverflow.com/a/63660413/143931
  private field: Array<placedPiece> = [];
  private field_minx = 0;
  private field_miny = 0;
  private field_maxx = 0;
  private field_maxy = 0;

  getFieldSizeX(): number {
    return this.field_maxx - this.field_minx + 1;
  }

  getFieldSizeY(): number {
    return this.field_maxy - this.field_miny + 1;
  }

  placePiece(p: Piece, x: number, y: number) {
    // this.field.push([p, x, y]);
    var n = { piece: p, x: x, y: y };
    this.field.push(n);
    (this.field_minx < x) || (this.field_minx = x);
  }


}


export class World {

  bag = new Bag;
  field = new Field;

  constructor(scene: Scene) {

    // add camera and sky
    createPBRSkybox()
    createArcRotateCamera()

    // add lights
    const light = new HemisphericLight('light', Vector3.Zero(), scene)
    light.intensity = 0.5

    var light_dir1 = new DirectionalLight("lightd1", new Vector3(-1, -2, -1), scene);
    light_dir1.position = new Vector3(20, 40, 20);
    light_dir1.intensity = 0.5;

    var light_dir2 = new DirectionalLight("lightd2", new Vector3(50, 2, 50), scene);
    light_dir2.position = new Vector3(50, 5, 50);
    light_dir2.intensity = 0.5;

    // add shadow
    var shadowGenerator = new ShadowGenerator(1024, light_dir1);
    shadowGenerator.useExponentialShadowMap = true;

    // add ground
    const groundMesh = MeshBuilder.CreatePlane('ground', { size: 100 }, scene)
    const groundMat = new PBRMetallicRoughnessMaterial('ground-material', scene)
    groundMat.baseColor = new Color3(0.1, 0.1, 0.1)
    groundMat.metallic = 0
    groundMat.roughness = 0.6
    groundMat.backFaceCulling = false
    groundMat.freeze() // freeze the ground material for better performance

    groundMesh.material = groundMat
    groundMesh.rotation = new Vector3(Math.PI / 2, 0, 0)
    groundMesh.freezeWorldMatrix() // since we are not going to be moving the ground, we freeze it for better performance
    groundMesh.receiveShadows = true;

    // cubeMesh.material = mat

    // more cubes
    /*
    for (let i = 0; i < 6; ++i) {
      for (let j = 0; j < 6; ++j) {
        // const cubeMesh = MeshBuilder.CreateBox('cube', { size: 2 }, scene)
        const cubeMesh = createSuperEllipsoid(8, 0.2, 0.2, 1, 0.3, 1, scene);
        cubeMesh.material = materials[i][j];
        cubeMesh.position = new Vector3(i * 2, piece_y_lie, j * 2);
        cubeMesh.checkCollisions = true;
        // cubeMesh.showBoundingBox = true;
        cubeMesh.ellipsoid = new Vector3(0.99, 100, 0.99)
        shadowGenerator.addShadowCaster(cubeMesh);
        // cubeMesh.enableEdgesRendering();
        cubeMesh.isPickable = false;
      }
    }
    */

    // test piece
    var p = this.bag.draw() as Piece;
    p.setGrid(0, 0, scene);
    shadowGenerator.addShadowCaster(p.mesh as Mesh);

    // home
    for (let i = 0; i < 6; ++i) {
      var p = this.bag.draw() as Piece;
      p.setHome(i, scene);
      shadowGenerator.addShadowCaster(p.mesh as Mesh);
    }

    // TODO: group pieces:
    // let parent = new BABYLON.Mesh("parent", scene);
    // or var root = new TransformNode();

  }



}


