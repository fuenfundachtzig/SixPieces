// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3725 2020-12-28 12:26:21Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, KeyboardEventTypes, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, ShapeBuilder, SubMesh, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, shuffleArray, scene } from "./functions";
import { Grid, gridCube, gridPos, gridRect, neighbors, translate } from "./field";
import { Piece, PieceMesh } from "./piece";

// y positions of pieces
const piece_y_lie = 0.31;
export const piece_y_stand = 1;
export const piece_size = 2.0;
export let world: World;

// temporary test
const n_players = 4;
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



class FieldLogic {

  constructor(
    private grid = new Grid<PieceMesh>(),
    public grid_minx = 0, // size of fixed pieces
    public grid_miny = 0,
    public grid_maxx = 0,
    public grid_maxy = 0,
  ) {
  }

  placePiece(p: PieceMesh, xy: gridPos) {
    console.log("place " + p.identify() + " on " + xy.x + "," + xy.y)
    this.grid.set(xy, p);
  }

  unplace(xy: gridPos) {
    console.log("unplace on " + xy.x + "," + xy.y)
    this.grid.remove(xy);
  }

  isEmpty(xy: gridPos): boolean {
    return !this.grid.has(xy);
  }

  updateGridSize(xy: gridPos) {
    // when piece is fixed (not placed!) 
    this.grid_minx = Math.min(this.grid_minx, xy.x);
    this.grid_maxx = Math.max(this.grid_maxx, xy.x);
    this.grid_miny = Math.min(this.grid_miny, xy.y);
    this.grid_maxy = Math.max(this.grid_maxy, xy.y);
  }

  getGridSize(margin: number): gridRect {
    let tl = { x: this.grid_minx - margin, y: this.grid_miny - margin };
    let br = { x: this.grid_maxx + margin, y: this.grid_maxy + margin };
    return {tl: tl, br: br}
  }

  isValidMove(played: PieceMesh[]): boolean {
    // check if move valid

    // no piece played
    if (played.length == 0)
      return false;

    // check all new pieces are in one row or column... ergo need to get x, y arrays back
    let xyarray: gridPos[] = played.map(p => p.gridxy);
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

    // every new piece must have a neighbor (and one must be old)
    if (this.grid.getN() > 1) {
      let old = false;
      for (let p of played) {
        if (!neighbors.some(disp => this.grid.has(translate(p.gridxy, ...disp)))) {
          console.log("disconnected " + p.identify());
          return false;
        }
        for (let disp of neighbors) {
          let op = this.grid.get(translate(p.gridxy, ...disp));
          if (op && op.fix) {
            old = true;
            break;
          }
        }
      }
      if ((this.grid.getN() > played.length) && !old) {
        console.log("disconnected from prev. ");
        return false;
      }
    }

    // every new piece must have a neighbor
    if (this.grid.getN() > 1) {
      for (let p of played) {
        if (!neighbors.some(disp => this.grid.has(translate(p.gridxy, ...disp)))) {
          console.log("disconnected " + p.identify());
          return false;
        }
      }
    }

    // no new piece must differ in both (or neither) color and shape from any neighbor
    function mismatch(p1: Piece | undefined, p2: Piece | undefined) {
      if ((p1 === undefined) || (p2 === undefined))
        return false;
      return (p1.shape != p2.shape) == (p1.color != p2.color);
    }
    for (var p of played) {
      for (var disp of neighbors) {
        if (mismatch(p, this.grid.get(translate(p.gridxy, ...disp)))) {
          console.log("does not match " + p.identify() + " " + this.grid.get(translate(p.gridxy, ...disp))!.identify());
          return false;
        }
      }
    }

    // finally check rows and cols make sense
    for (let p of played) {
      for (let dir of [[1, 0], [0, 1]]) {
        let shapes = [p.shape];
        let colors = [p.color];
        for (let sgn of [1, -1]) {
          dir[0] = dir[0] * sgn;
          dir[1] = dir[1] * sgn;
          let xy = translate(p.gridxy, ...dir);
          while (this.grid.has(xy)) {
            shapes.push(this.grid.get(xy)!.shape);
            colors.push(this.grid.get(xy)!.color);
            xy = translate(xy, ...dir);
          }
        }
        let ushapes = new Set(shapes);
        let ucolors = new Set(colors);
        if (((ushapes.size < shapes.length) && (ushapes.size > 1)) ||
          ((ucolors.size < colors.length) && (ucolors.size > 1))) {
          console.log("wrong row for " + p.identify());
          console.log("shapes " + shapes);
          console.log("colors " + colors);
          return false;
        }
      }
    }
    
    return true;
  }

  endTurn(played: PieceMesh[]) {
    if (!this.isValidMove(played)) {
      console.warn("Should never happen 33324");
      return false;
    }
    // adds pieces from field_turn to field, updates field boundaries
    played.forEach((p) => {
      p.mesh.isPickable = false;
      p.fix = true;
      this.updateGridSize(p.gridxy);
    });
    return true;
  }

}


export function createWorld(scene: Scene) {
  world = new World(scene);
  return world;
}


export class World {

  bag = new Bag();
  field = new FieldLogic();
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
        this.field.placePiece(this.sel_piece, this.sel_piece.gridxy);
      } else {
        this.sel_piece.moveHome();
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
    if (!p.isHand)
      this.field.unplace(p.gridxy);
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
    }

    this.beginTurn();

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
      this.shadowGenerator.addShadowCaster(p.mesh); // therefore, we need to be in World...
      this.hands[player_idx].push(p);
      p.home_x = this.getFreeHandSlot(this.hands[player_idx]);
    }
  }

  toGroundCoord(xy: gridPos): Vector3 {
    return new Vector3(xy.x * piece_size, 0, xy.y * piece_size);
  }

  getFieldSize(margin: number): gridCube {
    let r = this.field.getGridSize(margin);
    return {tl: this.toGroundCoord(r.tl), br: this.toGroundCoord(r.br) };
  }
  
  withinField(coord: Vector3, margin: number = 5): boolean {
    let fieldsize = this.getFieldSize(margin);
    return (coord.x > fieldsize.tl.x) && (coord.x < fieldsize.br.x) &&
      (coord.z > fieldsize.tl.z) && (coord.z < fieldsize.br.z);
  }

  snap(position: Vector3): gridPos {
    // compute tile position from ground position
    return {
      x: Math.round(position.x / piece_size),
      y: Math.round(position.z / piece_size)
    }
  }

  endTurn(): boolean {
    let played = this.hands[curr_player].filter(p => !p.isHand);
    if (!this.field.isValidMove(played))
      return false;
    // move pieces from hands array to field
    this.field.endTurn(played);
    this.hands[curr_player] = this.hands[curr_player].filter(p => p.isHand);
    // disable hand
    this.hands[curr_player].forEach(p => {
      p.mesh.isVisible = false;
      p.mesh.isPickable = false;
    });
    // next player
    if (++curr_player == n_players)
      curr_player = 0;
    // enable hand
    this.beginTurn();
    return true;
  }

  private beginTurn() {
    // init next turn

    // fill up
    this.fillHand(curr_player);

    // (re-)compute home position for meshes and show hand
    let fieldsize = Math.max( // TODO: use getFieldSize
      this.field.grid_maxx - this.field.grid_minx,
      this.field.grid_maxy - this.field.grid_miny
    )
    let angle1 = Math.PI / 4 + Math.PI / 2 * (curr_player - curr_player - 2); // would include rotation of field for multiplayer
    this.hands[curr_player].forEach(p => {
      let angle2 = angle1 + Math.PI + Math.PI * (p.home_x - 2.5) / 10;
      let angle3 = -angle2 + Math.PI / 2;
      let x = Math.cos(angle1) * (fieldsize + 28) + 10 * Math.cos(angle2);
      let y = Math.sin(angle1) * (fieldsize + 28) + 10 * Math.sin(angle2);
      p.homexy = { x: x, y: y }
      p.homerot = new Vector3(-Math.PI / 2, angle3, 0);
      p.moveHome();
      // make visible and clickable
      p.mesh.isVisible = true;
      p.mesh.isPickable = true;
    });
  }

}


