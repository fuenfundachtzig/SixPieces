// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3752 2021-01-02 10:14:55Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, SpotLight, SubMesh, Vector3, Animation, ArcRotateCamera } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, scene, floatingPiece } from "./functions";
import { gridCube, gridPos, has, set } from "./types/Field";
import { PieceMesh } from "./PieceMesh";
import { emptyGrid, getFreeHandSlot, getGridSize, GridBound, isValidMove, placePiece, unplace, updateGridSize } from "./logic";
import { GameState, identify2, PieceInGame } from "./types/GameState";
import { debug, gameClient, hideopp } from ".";

// y positions of pieces
export const piece_y_lie = 0.31;
export const piece_y_stand = 1;
export const piece_size = 2.0;

export let world: World;

export function createWorld(scene: Scene) {
  world = new World(scene);
  return world;
}

function downgrade(arr: PieceMesh[]): PieceInGame[] {
  // don't know why
  let res: PieceInGame[] = [];
  for (let p of arr) {
    // NOTE: this will blow up -- need to make a copy to avoid "uncaught error undefined too much recursion"
    // let x: PieceInGame = {...p}; 
    // arr.push(x);
    res.push({ gridxy: p.gridxy, isHand: p.isHand, home_x: p.home_x, invalid: p.invalid, fix: p.fix, id: p.id, color: p.color, shape: p.shape });
  }
  return res;
}

function fieldBox(from = Vector3.Zero(), to = Vector3.One()) {
  // return a box from to (instead of center and scale / size as babalon.js uses)
  let size = to.subtract(from);
  // console.log("fieldBox: size " + size.x +" " +  size.y + " " + size.z)
  let box = MeshBuilder.CreateBox("fieldMesh", { width: size.x, height: size.y, depth: size.z });
  let center = from.add(size.scale(0.5));
  center.y = 0.5;
  box.position = center;
  // style
  box.showBoundingBox = true;
  box.isPickable = false;
  box.visibility = 0.01;
  return box;
}


class World {

  private pieces = new Map<number, PieceMesh>(); // pieces for which meshes have been created in scene
  private sel_piece: Nullable<PieceMesh> = null; // currently selected piece (by player, for moving)
  private shadowGenerator: ShadowGenerator;
  private grid: GridBound; // cache of grid
  private hands: Array<Array<PieceMesh>>; // cache of hands
  private curr_player = 0; // cache of current player
  private light_player: SpotLight; // spotlight showing hand of current player
  private fieldMesh: Mesh; // used to indicate field size
  private camera: ArcRotateCamera;

  constructor(scene: Scene) {

    // add camera and sky
    createPBRSkybox();
    this.camera = createArcRotateCamera();

    // add lights
    const light = new HemisphericLight('light', Vector3.Zero(), scene);
    light.intensity = 0.8;

    var light_dir1 = new DirectionalLight("lightd1", new Vector3(-1, -2, -1), scene);
    light_dir1.position = new Vector3(0, 40, 0);
    light_dir1.intensity = 0.4;

    // this.light_player = new DirectionalLight("light_player", new Vector3(50, 2, 50), scene);
    this.light_player = new SpotLight("light_player", Vector3.Zero(), Vector3.Zero(), Math.PI / 4, 20, scene);
    this.light_player.intensity = 0.8;

    // add shadow
    this.shadowGenerator = new ShadowGenerator(1024, light_dir1);
    this.shadowGenerator.useExponentialShadowMap = true;

    // add debug meshes
    this.fieldMesh = fieldBox();

    // add glow (not used (much))
    var glow_layer = new GlowLayer("glow", scene);
    glow_layer.customEmissiveColorSelector = (function () {
      var x = 20;
      var dx = 1;
      return function (mesh: Mesh, _subMesh: SubMesh, _material: Material, result: Color4) {
        if (mesh.metadata && (mesh.metadata as PieceInGame).invalid) {
          x += dx;
          if ((x === 20) || (x === 80))
            dx = -dx;
          result.set(0.5, 0.2, 0.2, x / 100);
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

    // init grid
    this.grid = emptyGrid()
    this.hands = [];

  }

  getPlayerID(): number {
    if (gameClient)
      return parseInt(gameClient.playerID);
    return 0;
  }

  viewHomeCenter(player_idx: number = -1) {
    // rotate camera to show pieces of player (note: only for start of game)
    if (player_idx < 0) {
      player_idx = this.getPlayerID();
    }
    this.camera.target = this.fieldMesh.position.clone(); // fs.tl.add(fs.br.subtract(fs.tl).scale(0.5));
    this.camera.alpha = this.playerToAngle(player_idx);
    let fs = this.getFieldSize(5);
    let distance = fs.br.subtract(fs.tl).length();
    this.camera.radius = distance + 5;
    this.camera.beta = 1.3;
  }

  viewCameraCenter() {
    let fs = this.getFieldSize(5);
    let distance = fs.br.subtract(fs.tl).length();
    this.camera.target = this.fieldMesh.position.clone(); // fs.tl.add(fs.br.subtract(fs.tl).scale(0.5));
    this.camera.alpha = Math.PI / 2;
    this.camera.beta = this.camera.lowerBetaLimit;
    this.camera.target.z += distance * Math.sin(this.camera.beta) / 10;
    this.camera.radius = distance;
  }

  setCurrPlayer(p: string) {
    // receive update on current player
    console.log("Active player now is " + p);
    this.curr_player = parseInt(p);
    // // move spotlight...
    let homeposxy = this.computeHomeCenter(this.curr_player);
    let homepos3 = new Vector3(
      homeposxy.x + 40*Math.cos(this.playerToAngle(this.curr_player)), 
      3, 
      homeposxy.y + 40*Math.sin(this.playerToAngle(this.curr_player)));
    let dirpos3 = new Vector3(
      -Math.cos(this.playerToAngle(this.curr_player)),
      0,
      -Math.sin(this.playerToAngle(this.curr_player))
    );
    const frameRate = 10;
    const posSlide = new Animation("posSlide", "position", 10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const dirSlide = new Animation("dirSlide", "direction", 10, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    posSlide.setKeys([{ frame: 0, value: this.light_player.position }, { frame: frameRate, value: homepos3 }]);
    dirSlide.setKeys([{ frame: 0, value: this.light_player.direction }, { frame: frameRate, value: dirpos3 }]);
    scene.beginDirectAnimation(this.light_player, [posSlide, dirSlide], 0, frameRate, false);
  }

  playerToAngle(player_idx: number) {
    // returns angle on field pointing to player
    return Math.PI / 4 + Math.PI / 2 * player_idx;
  }

  computeHomeCenter(player_idx: number): gridPos {
    // compute center of home position for player
    let angle1 = this.playerToAngle(player_idx);
    let fieldsize = this.getFieldSize(5);
    var refpoint: gridPos;
    switch (player_idx) {
      default:
      case 0:
        // fieldsizes = [this.grid.grid_maxx, this.grid.grid_maxy];
        refpoint = { x: fieldsize.br.x, y: fieldsize.br.z };
        break;
      case 1:
        // fieldsizes = [this.grid.grid_minx, this.grid.grid_maxy];
        refpoint = { x: fieldsize.tl.x, y: fieldsize.br.z };
        break;
      case 2:
        // fieldsizes = [this.grid.grid_minx, this.grid.grid_miny];
        refpoint = { x: fieldsize.tl.x, y: fieldsize.tl.z };
        break;
      case 3:
        // fieldsizes = [this.grid.grid_maxx, this.grid.grid_miny];
        refpoint = { x: fieldsize.br.x, y: fieldsize.tl.z };
        break;
    }
    let x = refpoint.x + Math.cos(angle1) * 14;
    let y = refpoint.y + Math.sin(angle1) * 14;
    return { x, y };
  }

  updateHandMeshes() {
    // (re-)compute home position for meshes and show hand
    for (let player_idx = 0; player_idx < this.hands.length; ++player_idx) {
      this.hands[player_idx].forEach(p => {
        let isMine: boolean = player_idx === this.getPlayerID();
        let isCurr: boolean = player_idx === this.curr_player;
        if (isMine || !hideopp)
          console.log(`hand ${player_idx} has ${identify2(p)}`)
        else
          console.log(`hand ${player_idx} has a piece on ${p.home_x}`)
        let angle2 = this.playerToAngle(player_idx) + Math.PI + Math.PI * (p.home_x - 2.5) / 10;
        let angle3 = -angle2 + Math.PI / 2;
        let refpoint = this.computeHomeCenter(player_idx);
        let x = refpoint.x + 10 * Math.cos(angle2);
        let y = refpoint.y + 10 * Math.sin(angle2);
        if (p.isHand) {
          p.homerot = new Vector3(-Math.PI / 2, angle3, 0);
          if (p.homexy.x == 0) {
            p.homexy = { x: x, y: y };
            p.moveHome(true, true);
          } else {
            // move without drop (e.g. when home center was adjusted because field got larger)
            p.homexy = { x: x, y: y };
            p.moveHome(true, false);
          }
        }
        // make visible and clickable
        p.setUnveil(isMine || !hideopp);
        p.mesh.isVisible = true;
        p.mesh.isPickable = !p.fix && isCurr && (isMine || debug);
      });
    };
  }

  unpack(state: GameState) {
    // unpack game state to useful data

    let added = 0;
    for (let p of state.pog) {
      let pm: PieceMesh;
      if (!this.pieces.has(p.id)) {
        // create new mesh
        pm = new PieceMesh(p, scene); //, isHand: false, gridxy: p.pos, home_x: -1, fix: true, homexy: {x: 0, y: 0} );
        Object.assign(pm, p);
        // console.log("add mesh for " + identify2(pm));
        this.pieces.set(p.id, pm);
        ++added;
      } else {
        pm = this.pieces.get(p.id) as PieceMesh;
        pm.gridxy = p.gridxy;
      }
      set(this.grid, pm.gridxy, pm);
      pm.setUnveil(true);
      pm.mesh.isVisible = true;
      pm.setGrid(pm.gridxy, true);
      updateGridSize(this.grid, p.gridxy);
    }

    // draw field box
    scene.removeMesh(this.fieldMesh);
    this.fieldMesh = fieldBox(
      this.toGroundCoord({ x: this.grid.grid_minx - 5.5, y: this.grid.grid_miny - 5.5 }),
      this.toGroundCoord({ x: this.grid.grid_maxx + 5.5, y: this.grid.grid_maxy + 5.5 })
    );

    console.log(`unpack: added meshes for ${added} new pieces in field, grid size = ${this.grid.grid_minx}-${this.grid.grid_maxx}, ${this.grid.grid_miny}-${this.grid.grid_maxy}`);

    // update hands
    added = 0;
    for (let pidx = 0; pidx < state.players.length; ++pidx) {
      let player = state.players[pidx];
      this.hands[pidx] = [];
      for (let i = 0; i < player.hand.length; ++i) {
        let p = player.hand[i];
        if (!this.pieces.has(p.id)) {
          // create new mesh
          let home_x = getFreeHandSlot(this.hands[pidx])
          let pm = new PieceMesh(p, scene, true, undefined, home_x); //{...p, isHand: true, gridxy: {x: 0, y: 0}, home_x: i, fix: false, homexy: {x: 0, y: 0} });
          Object.assign(pm, p);
          this.pieces.set(p.id, pm);
          ++added;
          this.hands[pidx].push(pm);
        } else {
          this.hands[pidx].push(this.pieces.get(p.id) as PieceMesh);
        }
      }
    }
    this.updateHandMeshes();
    console.log(`updateWorld: added meshes for ${added} new pieces in hands`);

  }

  click(p: PieceMesh) {
    // handle when piece has been clicked on
    if (this.sel_piece) {
      this.sel_piece.unselect();
      // handle unselect
      // if (this.withinField(this.sel_piece.mesh.position, InnerRing)) {
      if (!this.sel_piece.isHand) {
        // check
        placePiece(this.grid, this.sel_piece, this.sel_piece.gridxy);
      } else {
        this.sel_piece.moveHome();
      }
      if (this.sel_piece === p) {
        // clicked on selected piece -> don't select again
        this.sel_piece = null;
        return;
      }
    }
    // select clicked piece
    this.sel_piece = p;
    p.select();
    if (!p.isHand)
      unplace(this.grid, p.gridxy);
    // unset glow effect for all pieces
    this.hands[this.curr_player].forEach(p => { p.invalid = false });
  }

  toGroundCoord(xy: gridPos): Vector3 {
    return new Vector3(xy.x * piece_size, piece_y_lie, xy.y * piece_size);
  }

  getFieldSize(margin: number): gridCube {
    let r = getGridSize(this.grid, margin);
    return { tl: this.toGroundCoord(r.tl), br: this.toGroundCoord(r.br) };
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

  isEmpty(xy: gridPos): boolean {
    return !has(this.grid, xy);
  }

  placeCommand() {
    // check if move is valid
    if (floatingPiece)
      return;
    let played = this.hands[this.curr_player].filter(p => !p.isHand);
    let score = isValidMove(this.grid, played);
    if (score === false)
      return false;

    // move is valid => disable pieces on hand
    this.hands[this.curr_player].forEach(p => {
      p.mesh.isPickable = false;
    });
    // move meshes from hands array to field and update field size
    played.forEach((p) => {
      p.fix = true;
      p.isHand = false;
      // p.mesh.isPickable = false; // would be overwritten later
      // updateGridSize(this.grid, p.gridxy); NOTE: should not do this here because move could still be rejected (only if it's not our turn?)
    });
    this.hands[this.curr_player] = this.hands[this.curr_player].filter(p => p.isHand);
    // end turn
    gameClient.moves.place(downgrade(played));

    console.log("placeCommand ended")
  }

  swapCommand() {
    // returns false if not possible or the collection of pieces to be swapped
    if (floatingPiece)
      return false;
    // which pieces to swap
    let toreturn = this.hands[this.curr_player].filter(p => !p.isHand);
    if (toreturn.length == 0) {
      // cannot skip move
      console.log("Illegal move in world.swap: have to swap at least one piece (by placing it anywhere in the field).")
      return false;
    }

    // move is valid => disable pieces on hand
    this.hands[this.curr_player].forEach(p => {
      p.mesh.isPickable = false;
    });
    // remove meshes for pieces on field (i.e. to be returned to bag)
    toreturn.forEach(p => {
      console.log("remove mesh for " + identify2(p));
      scene.removeMesh(p.mesh);
      this.pieces.delete(p.id);
      unplace(this.grid, p.gridxy);
    });
    this.hands[this.curr_player] = this.hands[this.curr_player].filter(p => p.isHand);
    // end turn
    gameClient.moves.swap(downgrade(toreturn));
  }


}


