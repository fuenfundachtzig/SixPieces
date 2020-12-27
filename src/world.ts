// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3720 2020-12-27 11:28:55Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, StandardMaterial, SubMesh, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, shuffleArray, scene } from "./functions";
import { materials } from "./make_materials";
import { createSuperEllipsoid } from './superello'

// y positions of pieces
const piece_y_lie = 0.31;
const piece_y_stand = 1;
const piece_size = 2.0;
export let world: World;

// interface IPiece {
//   color: number = 0,
//   shape: number = 0,
//  // grid position
//   grid_x: Nullable<number> = null,
//   grid_y: Nullable<number> = null,
//  // home position
//   home_x: Nullable<number> = null,

// }


export class Piece {
  constructor(
    // type
    public color: number = 0,
    public shape: number = 0,
    // home position
    public home_x: Nullable<number> = null,
  ) { };

}


export class PieceMesh extends Piece {
  // a piece in the scene
  public mesh: Mesh;
  constructor(
    scene: Scene,
    p: Piece,
    // flags
    public glows = false,
    private isSelected = false,
  ) {
    super();
    Object.assign(this, p)

    // init mesh
    this.mesh = createSuperEllipsoid(8, 0.2, 0.2, piece_size / 2, 0.3, piece_size / 2, scene);
    this.mesh.material = materials[this.shape][this.color];
    this.mesh.checkCollisions = true;
    this.mesh.ellipsoid = new Vector3(0.99, 100, 0.99)
    this.mesh.metadata = this;
  }

  setGrid(xy: gridPos) {
      // set mesh on field
      this.mesh.position = world.toGroundCoord(xy)
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
      this.mesh.rotation.set(-Math.PI / 2, -angle + Math.PI / 2, 0)
      this.mesh.isPickable = true;
      this.home_x = i;
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
      let xy = world.snap(newPosition); // TODO: use TransformNode?
      if (world.field.isEmpty(xy)) {
        this.mesh.position = world.toGroundCoord(xy);
        this.mesh.rotation = new Vector3();
      }
    } else {
      this.mesh.position = newPosition;
    }

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


interface posAndRot {
  position: Vector3,
  rotation: Vector3
}

interface gridPos {
  x: number,
  y: number
}

class Field {

  private field = new Map<number, Piece>();
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

  getIndex(xy: gridPos): number {
    return xy.x * 1000 + xy.y;
  }

  placePiece(p: Piece, xy: gridPos) {
    this.field.set(this.getIndex(xy), p);
    (this.field_minx < xy.x) || (this.field_minx = xy.x); // TODO
  }

  unplace(xy: gridPos) {
    this.field.delete(this.getIndex(xy));
  }

  isEmpty(xy: gridPos): boolean {
    return !this.field.has(this.getIndex(xy));
  }

}


export function createWorld(scene: Scene) {
  world = new World(scene);
  return world;
}


export class World {

  bag = new Bag;
  field = new Field;
  hand: PieceMesh[] = [];
  sel_piece: Nullable<PieceMesh> = null;
  shadowGenerator: ShadowGenerator;

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
    this.shadowGenerator = new ShadowGenerator(1024, light_dir1);
    this.shadowGenerator.useExponentialShadowMap = true;

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

  click(p: PieceMesh) {
    // handle when piece has been clicked on
    if (this.sel_piece) {
      this.sel_piece.unselect();
      // handle unselect
      if (this.withinField(this.sel_piece.mesh.position)) {
        // check 
        this.field.placePiece(this.sel_piece, this.snap(this.sel_piece.mesh.position));
      } else {
        this.sel_piece.setHome();
      }
      if (this.sel_piece == p) {
        // clicked on selected piece -> don't select again
        this.sel_piece = null;
        return;
      }
    }
    // select clicked piece
    this.sel_piece = p;
    p.select();
    this.field.unplace(this.snap(p.mesh.position));
  }

  init() {
    // test pieces
    for (let i = 0; i < 3; ++i) {
      var p = new PieceMesh(scene, this.bag.draw() as Piece);
      p.setGrid({x:i, y:i});
      this.field.placePiece(p, { x: i, y: i })
      this.shadowGenerator.addShadowCaster(p.mesh);
      p.mesh.isPickable = false;
    }

    // home
    for (let i = 0; i < 6; ++i) {
      let p = new PieceMesh(scene, this.bag.draw() as Piece);
      p.setHome(i);
      this.shadowGenerator.addShadowCaster(p.mesh);
      this.hand.push(p);
    }

  }

  withinField(coord: Vector3): boolean {
    return (coord.length() < 10);
  }

  snap(position: Vector3): gridPos {
    // compute tile position from ground position
    return {
      x: Math.round(position.x / piece_size),
      y: Math.round(position.z / piece_size)
    }
  }

  toGroundCoord(xy: gridPos): Vector3 {
    return new Vector3(xy.x * piece_size, piece_y_lie, xy.y * piece_size);
  }

}


