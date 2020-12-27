// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3721 2020-12-27 21:52:31Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, KeyboardEventTypes, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, SolidParticleSystem, StandardMaterial, SubMesh, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateGameReducer } from "boardgame.io/dist/types/src/core/reducer";
import { createPBRSkybox, createArcRotateCamera, shuffleArray, scene } from "./functions";
import { Piece, PieceMesh } from "./piece";

// y positions of pieces
const piece_y_lie = 0.31;
export const piece_y_stand = 1;
export const piece_size = 2.0;
export let world: World;

// temporary test
const n_players = 2;
var curr_player = 0;

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

export interface gridPos {
  x: number,
  y: number
}

class Field {

  private field      = new Map<number, PieceMesh>(); // placed
  private field_turn = new Map<number, PieceMesh>(); // current
  public field_minx = 0;
  public field_miny = 0;
  public field_maxx = 0;
  public field_maxy = 0;

  getIndex(xy: gridPos): number {
    // will fail once abs(y) >= 500
    return xy.x * 1000 + xy.y;
  }
  indexToXY(idx: number): gridPos {
    let x = Math.round(idx / 1000);
    let y = idx - x * 1000;
    return { x, y };
  }

  placePiece(p: PieceMesh, xy: gridPos) {
    this.field_turn.set(this.getIndex(xy), p);
  }

  unplace(xy: gridPos) {
    this.field_turn.delete(this.getIndex(xy));
  }

  isEmpty(xy: gridPos): boolean {
    let idx = this.getIndex(xy);
    return !(this.field.has(idx) || this.field_turn.has(idx));
  }

  isValidMove(): boolean {
    // check if move valid

    if (!this.field_turn.size)
      // no piece played
      return false;

    // check all new pieces are in one row or column... ergo need to get x, y arrays back
    let xyarray: gridPos[] = Array.from(this.field_turn.keys()).map(this.indexToXY);
    let xarray: number[] = xyarray.map((xy) => xy.x);
    let yarray: number[] = xyarray.map((xy) => xy.y);
    let minx = Math.min(...xarray);
    let maxx = Math.max(...xarray);
    let miny = Math.min(...yarray);
    let maxy = Math.max(...yarray);
    if ((minx != maxx) && (miny != maxy)) {
      console.log(`diagonal ${minx} ${maxx} ${miny} ${maxy}`);
      return false;
    }

    // every new piece must have a neighbor
    for (var key of Array.from(this.field_turn.keys())) {
      if (this.field.size + this.field_turn.size > 1) {
        if (![1, +1, -1000, 1000].some(disp => (this.field.has(key + disp) || this.field_turn.has(key + disp)))) {
          console.log("disconnected " + key);
          return false;
        }
        //   if (this.field.has(key+disp) || this.field_turn.has(key+disp)) {
        //     found = true;
        //     break;
        //   }
        // }
      }
    }

    // no new piece must differ in both color and shape from any neighbor
    function mismatch(p1: Piece | undefined, p2: Piece | undefined) {
      if ((p1 === undefined) || (p2 === undefined))
        return false;
      return (p1.shape != p2.shape) && (p1.color != p2.color);
    }
    for (var key of Array.from(this.field_turn.keys())) {
      for (var disp of [1, +1, -1000, 1000]) {
        let found = false;
        if (mismatch(this.field_turn.get(key), this.field.get(key + disp)) || mismatch(this.field_turn.get(key), this.field_turn.get(key + disp))) {
          console.log("does not match " + key + " " + (key + disp));
          return false;
        }
      }
    }

    return true;
  }

  endTurn() {
    if (!this.isValidMove()) // TODO: should never happen
      return false;
    // adds pieces from field_turn to field, updates field boundaries
    this.field_turn.forEach((p: PieceMesh, idx: number) => {
      p.mesh.isPickable = false;
      this.field.set(idx, p);
      let xy = this.indexToXY(idx);
      this.field_minx = Math.min(this.field_minx, xy.x);
      this.field_maxx = Math.max(this.field_maxx, xy.x);
      this.field_miny = Math.min(this.field_miny, xy.y);
      this.field_maxy = Math.max(this.field_maxy, xy.y);
    });
    this.field_turn.clear();
    return true;
  }

}


export function createWorld(scene: Scene) {
  world = new World(scene);
  return world;
}


export class World {

  bag = new Bag;
  field = new Field;
  hands: Array<Array<PieceMesh>> = [];
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

    scene.onKeyboardObservable.add((kbinfo) => {
      if ((kbinfo.type == KeyboardEventTypes.KEYDOWN) && (kbinfo.event.code === 'KeyM')) {
        this.hands[curr_player].forEach(p => {
          // if (p.mesh) 
          // p.mesh.visibility = 0.5;
          p.glows = !p.glows;
        });
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
    // // test pieces
    // for (let i = 0; i < 3; ++i) {
    //   var p = new PieceMesh(scene, this.bag.draw() as Piece);
    //   p.setGrid({ x: i, y: i });
    //   this.field.placePiece(p, { x: i, y: i })
    //   this.shadowGenerator.addShadowCaster(p.mesh);
    //   p.isHand = false;
    // }

    // home
    for (let n = 0; n < n_players; ++n) {
      this.hands.push([]);
      this.fillHand(n);
    }

    // FIXME: here used to init next turn
    this.hands[curr_player].forEach(p => {
      p.mesh.isVisible = true;
      p.mesh.isPickable = true;
    });


  }

  private getFreeHandSlot(hand: Array<PieceMesh>): number {
    // find empty slot on hand and return index
    for (let i = 0; i < 6; ++i) {
      for (var idx = 0; idx < hand.length; ++idx) {
        if (hand[idx].home_x == i)
          break;
      }
      if (idx == hand.length)
        return i;
    }
    return -1;
  }

  private fillHand(player_idx: number) {
    // fill hand
    while (this.hands[player_idx].length < 6) {
      let p = new PieceMesh(scene, this.bag.draw() as Piece);
      if (!p)
        break;
      this.shadowGenerator.addShadowCaster(p.mesh);
      this.hands[player_idx].push(p);
      p.setHome(this.getFreeHandSlot(this.hands[player_idx]));
    }
  }

  withinField(coord: Vector3): boolean {
    let topleft = this.toGroundCoord({ x: this.field.field_minx - 5, y: this.field.field_miny - 5 });
    let botright = this.toGroundCoord({ x: this.field.field_maxx + 5, y: this.field.field_maxy + 5 });
    return (coord.x > topleft.x) && (coord.x < botright.x) &&
      (coord.z > topleft.z) && (coord.z < botright.z);
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

  endTurn(): boolean {
    if (!this.field.isValidMove())
      return false;
    // move pieces from hands array to field
    this.hands[curr_player] = this.hands[curr_player].filter(p => p.isHand);
    this.field.endTurn();
    // fill up
    this.fillHand(curr_player);
    // disable hand
    this.hands[curr_player].forEach(p => {
      p.mesh.isVisible = false;
      p.mesh.isPickable = false;
    });
    // next player
    if (++curr_player == n_players)
      curr_player = 0;
    // enable hand
    this.hands[curr_player].forEach(p => {
      p.mesh.isVisible = true;
      p.mesh.isPickable = true;
    });
    return true;
  }

}


