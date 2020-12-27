// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3717 2020-12-27 00:04:41Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, StandardMaterial, SubMesh, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, shuffleArray, scene } from "./functions";
import { materials } from "./make_materials";
import { createSuperEllipsoid } from './superello'

// y positions of pieces
const piece_y_lie = 0.31;
const piece_y_stand = 1;
export let world: World;

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
    // flags
    public glows = false,
    private isSelected = false,
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

  click() {
    world.click(this);
    return this.isSelected;
  }

  select() {
    if (this.mesh) {
      this.mesh.visibility = 0.5;
      this.isSelected = true;
    }
  }

  unselect() {
    if (this.mesh)
      this.mesh.visibility = 1.0;
    this.isSelected = false;
  }

  updatePos(newPosition: Vector3) {
    if (!this.mesh)
      return;
    let newPosAndRot = world.field.snap(newPosition); // TODO: use TransformNode?
    this.mesh.position = newPosAndRot.position;
    this.mesh.rotation = newPosAndRot.rotation;
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

interface posAndRot {
  position: Vector3,
  rotation: Vector3
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

  snap(position: Vector3): posAndRot {
    // snap tile position based on ground position
    if (position.length() < 10) {
      position.x = Math.round(position.x);
      position.y = piece_y_lie;
      position.z = Math.round(position.z);
    }
    let rotation = new Vector3();
    return {position, rotation}
  }

}


export function createWorld(scene: Scene) {
  world = new World(scene);
}


export class World {

  bag = new Bag;
  field = new Field;
  hand: Piece[] = [];
  sel_piece: Nullable<Piece> = null;

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

    // add glow
    var glow_layer = new GlowLayer("glow", scene);
    // glow_layer.customEmissiveColorSelector = function (mesh, _subMesh, _material, result) {
    //   if (mesh.metadata && mesh.metadata.glows) {
    //     result.set(0.2, 0.5, 0.2, 0.5);
    //   } else {
    //     result.set(0, 0, 0, 0);
    //   }
    // }
    glow_layer.customEmissiveColorSelector = (function () {
      var x = 0;
      return function (mesh: Mesh, _subMesh: SubMesh, _material: Material, result: Color4) {
        if (mesh.metadata && mesh.metadata.glows) {
          if (++x == 100)
            x = 0;
          result.set(0.2, 0.5, 0.2, x / 100);
        } else {
          result.set(0, 0, 0, 0);
        }
      }
    }
    )();

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
      this.hand.push(p);
    }

    // TODO: group pieces:
    // let parent = new BABYLON.Mesh("parent", scene);
    // or var root = new TransformNode();

    scene.onKeyboardObservable.add(({ event }) => {
      if (event.code === 'KeyM') {
        this.hand.forEach(p => {
          // if (p.mesh) 
          // p.mesh.visibility = 0.5;
          p.glows = !p.glows;
        });
        event.stopImmediatePropagation();
      }
    })


  }

  click(p: Piece) {
    if (this.sel_piece) {
      this.sel_piece.unselect();
      if (this.sel_piece == p) {
        // unselect selected piece
        this.sel_piece = null;
        return;
      }
    }
    // select new piece
    this.sel_piece = p;
    p.select();
  }

}


