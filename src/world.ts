// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3715 2020-12-26 15:31:46Z zwo $

import { Color3, ColorSplitterBlock, DirectionalLight, HemisphericLight, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, shuffleArray } from "./functions";
import { makeMaterials } from "./make_materials";
import { createSuperEllipsoid, createSuperEllipsoid1 } from './superello'

const piece_y_lie   = 0.31;
const piece_y_stand = 1;


export class Piece {

  constructor(
    // type
    public color: number = 0,
    public shape: number = 0,
    // grid position
    public grid_x: Nullable<number> = null,
    public grid_y: Nullable<number> = null,
    // home position
    public home_x: Nullable<number> = null
  ) {};

  setPosition(m: Mesh) {
    // set mesh to piece in home position 
    if (this.home_x != null) {
      let angle = Math.PI * this.home_x / 10;
      let x = -35 + 10 * Math.cos(angle);
      let y = -35 + 10 * Math.sin(angle);
      m.position.set(x, piece_y_stand, y);
      m.rotation.set(-Math.PI/2, -angle+Math.PI/2, 0)
    }
  }

}


class Bag {

  private bag: Array<Piece> = [];

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


export class World {

  field: Array<Piece> = []; // pieces in the game
  bag = new Bag;

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

    const materials = makeMaterials(scene);

    // cubeMesh.material = mat

    // more cubes
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

    // home
    for (let i = 0; i < 6; ++i) {
      var p = this.bag.draw() as Piece;
      p.home_x = i;

      const cubeMesh = createSuperEllipsoid(8, 0.2, 0.2, 1, 0.3, 1, scene);
      cubeMesh.material = materials[p.shape][p.color];
      p.setPosition(cubeMesh);
      cubeMesh.checkCollisions = true;
      cubeMesh.ellipsoid = new Vector3(0.99, 100, 0.99)
      shadowGenerator.addShadowCaster(cubeMesh);

      cubeMesh.metadata = p;
    }

    // TODO: group pieces:
    // let parent = new BABYLON.Mesh("parent", scene);
    // or var root = new TransformNode();

  }
}


