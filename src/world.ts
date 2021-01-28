// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3795 2021-01-28 07:55:26Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, SpotLight, SubMesh, Vector3, Animation, ArcRotateCamera, CubicEase, EasingFunction, IAnimationKey } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, scene, floatingPiece } from "./functions";
import { gridPos, has, set } from "./types/Field";
import { easeV, PieceMesh } from "./PieceMesh";
import { emptyGrid, getFreeHandSlot, getGridSize, GridBound, isValidMove, placePiece, unplace, updateGridSize } from "./logic";
import { GameState, identify2, PieceInGame } from "./types/GameState";
import { debug, flatfield, gameClient, hideopp, chosenShapeSet } from ".";
import { configureOrthographicCamera, configurePerspectiveCamera, createCamera } from "./cameras";
import { drawShape } from "./make_materials";
import { colors } from "./types/Materials";

// y positions of pieces
export const piece_y_lie = 0.31;
export const piece_y_stand = 1;
export const piece_size = 2.0;

export let world: World;

export function createWorld(scene: Scene, hud: HTMLDivElement) {
  world = new World(scene, hud);
  return world;
}

interface gridCube {
  // mainly need this because babylon uses the wrong (LH) coordinate system with y pointing up
  tl: Vector3;
  br: Vector3;
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
  private currPlayerMesh: Mesh; // used to indicate current player
  private camera: ArcRotateCamera;
  private cameraIsOrtho: boolean;
  private hud: HTMLDivElement;

  constructor(scene: Scene, hud: HTMLDivElement) {

    // add camera and sky
    createPBRSkybox();
    this.camera = createCamera();
    this.cameraIsOrtho = true;
    this.toggleCameraMode();

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

    // add glow
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

    // add indicator for current player
    this.currPlayerMesh = MeshBuilder.CreateSphere("currPlayer", { diameter: 3 });
    this.currPlayerMesh.visibility = 0;
    this.currPlayerMesh.material = new PBRMetallicRoughnessMaterial('currPlayer-material', scene);
    this.currPlayerMesh.receiveShadows = true;
    (this.currPlayerMesh.material as PBRMetallicRoughnessMaterial).baseColor = new Color3(0.1, 0.1, 0.2);
    this.addShadow(this.currPlayerMesh);

    // init grid
    this.grid = emptyGrid()
    this.hands = [];

    // remember hud
    this.hud = hud;

  }

  toggleCameraMode() {
    this.cameraIsOrtho = !this.cameraIsOrtho;
    if (this.cameraIsOrtho)
      configureOrthographicCamera(this.camera);
    else
      configurePerspectiveCamera(this.camera);
  }

  addShadow(mesh: Mesh) {
    this.shadowGenerator.addShadowCaster(mesh);
  }

  getPlayerID(): number {
    // my player ID (numeric)
    if (gameClient)
      return parseInt(gameClient.playerID);
    return 0;
  }

  isMe(player_idx: number): boolean {
    // true if this is me
    return player_idx === this.getPlayerID();
  }

  isMyTurn(): boolean {
    // true if my turn
    return this.isMe(this.curr_player);
  }

  playerToAngle(player_idx: number) {
    // returns angle on field pointing to player
    return Math.PI / 4 + Math.PI / 2 * player_idx;
  }

  computeHomeCenterXY(player_idx: number, offset: number = 14): gridPos {
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
    return { x: refpoint.x + offset * Math.cos(angle1), y: refpoint.y + offset * Math.sin(angle1) };
  }

  computeHomeCenter(player_idx: number, offset: number = 0, y: number = 0): Vector3 {
    // compute 3-D home position center
    let angle1 = this.playerToAngle(player_idx);
    let refpoint = this.computeHomeCenterXY(player_idx, offset);
    let homepos3d = new Vector3(
      refpoint.x + offset * Math.cos(angle1),
      y,
      refpoint.y + offset * Math.sin(angle1)
    );
    return homepos3d;
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
    // same view for everybody
    let fs = this.getFieldSize(5);
    let distance = fs.br.subtract(fs.tl).length();
    this.camera.target = this.fieldMesh.position.clone(); // fs.tl.add(fs.br.subtract(fs.tl).scale(0.5));
    this.camera.alpha = Math.PI / 2;
    this.camera.beta = this.camera.lowerBetaLimit;
    this.camera.target.z += distance * Math.sin(this.camera.beta) / 10;
    if (flatfield) {
      // zoom a bit further out to include homes
      this.camera.target.z = this.camera.target.z + 4;
      this.camera.radius = distance * 1;
    } else
      this.camera.radius = distance * 0.9;
    if (this.cameraIsOrtho)
      configureOrthographicCamera(this.camera, distance * 1.25);
  }

  setCurrPlayer(p: string) {
    // receive update on current player
    console.log("Active player now is " + p);
    this.curr_player = parseInt(p);

    // move indicator sphere...
    const frameRate = 15;
    const frames = 30;
    const steps = 20;
    const targetPos = this.computeHomeCenter(this.curr_player, flatfield ? 5 : 10);
    // compute keys
    let keysPos: IAnimationKey[] = [];
    for (var x = 0; x <= steps; ++x) {
      let f = x / steps; // fraction of animation time
      let pos = easeV(this.currPlayerMesh.position, targetPos, x, steps); // compute interpolated position for frame no. (f*frames)
      pos.y = pos.y + (1 - 4 * (f - 0.5) * (f - 0.5)) * 3; // add parabola in z-direction
      keysPos.push({ frame: f * frames, value: pos });
    }
    // create animation
    const posSlide = new Animation("posSlideInd", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    posSlide.setKeys(keysPos);
    scene.beginDirectAnimation(this.currPlayerMesh, [posSlide], 0, frames, false, undefined, () => {
      //  make visible at end of animation (so it doesn't look weird on init when it comes out of nowhere) and switch color
      this.currPlayerMesh.visibility = 1;
      if (this.isMyTurn())
        (this.currPlayerMesh.material as PBRMetallicRoughnessMaterial).baseColor = new Color3(0.1, 0.5, 0.1);
      else
        (this.currPlayerMesh.material as PBRMetallicRoughnessMaterial).baseColor = new Color3(0.1, 0.1, 0.2);
    });
    if (!this.isMyTurn())
      // switch off immediately at end of turn (i.e. before animation starts)
      (this.currPlayerMesh.material as PBRMetallicRoughnessMaterial).baseColor = new Color3(0.1, 0.1, 0.2);

    // move spotlight...
    let homepos3 = this.computeHomeCenter(this.curr_player, 40, 3);
    let dirpos3 = new Vector3(
      -Math.cos(this.playerToAngle(this.curr_player)),
      0,
      -Math.sin(this.playerToAngle(this.curr_player))
    );
    const posSlideSpot = new Animation("posSlideSpot", "position", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    const dirSlideSpot = new Animation("dirSlideSpot", "direction", frameRate, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
    posSlideSpot.setKeys([{ frame: 0, value: this.light_player.position }, { frame: frames, value: homepos3 }]);
    dirSlideSpot.setKeys([{ frame: 0, value: this.light_player.direction }, { frame: frames, value: dirpos3 }]);
    const easingFunction = new CubicEase();
    easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    posSlideSpot.setEasingFunction(easingFunction);
    dirSlideSpot.setEasingFunction(easingFunction);
    scene.beginDirectAnimation(this.light_player, [posSlideSpot, dirSlideSpot], 0, frames, false);
  }

  updateHandMeshes() {
    // (re-)compute home position for meshes and show hand
    for (let player_idx = 0; player_idx < this.hands.length; ++player_idx) {
      this.hands[player_idx].forEach(p => {
        let isMine = this.isMe(player_idx);
        let isCurr: boolean = player_idx === this.curr_player;
        if (isMine || !hideopp)
          console.log(`hand ${player_idx} has ${identify2(p)}`)
        else
          console.log(`hand ${player_idx} has a piece on ${p.home_x}`)
        let angle2 = this.playerToAngle(player_idx) + Math.PI + Math.PI * (p.home_x - 2.5) / 10;
        let angle3 = -angle2 + Math.PI / 2;
        let x = 0;
        let y = 0;
        if (flatfield) {
          let refpoint = this.computeHomeCenterXY(player_idx, -5);
          x = refpoint.x - 10 * Math.cos(angle2);
          y = refpoint.y - 10 * Math.sin(angle2);
        } else {
          let refpoint = this.computeHomeCenterXY(player_idx);
          x = refpoint.x + 10 * Math.cos(angle2);
          y = refpoint.y + 10 * Math.sin(angle2);
        }
        if (p.isHand) {
          if (!flatfield)
            p.homerot = new Vector3(-Math.PI / 2, angle3, 0);
          else
            p.homerot = Vector3.Zero();
          if (p.homexy.x === 0) {
            p.homexy = { x, y };
            p.moveHome(true, true);
          } else {
            // move without drop (e.g. when home center was adjusted because field got larger)
            p.homexy = { x, y };
            p.moveHome(true, false);
          }
        }
        // make visible and clickable
        p.setUnveil(isMine || !hideopp);
        p.mesh.isVisible = true;
        p.mesh.isPickable = !p.fix && isCurr && (isMine || debug);
      });
    };

    // draw hud
    let myhand = this.hands[this.getPlayerID()];
    for (let i = 0; i < myhand.length; ++i) {
      let p = myhand[i];
      let canvas: HTMLCanvasElement | null = this.hud.querySelector(`#canvashand${p.home_x}`);
      if (canvas) {
        let ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 256, 256);
          ctx.fillStyle = colors[p.color];
          drawShape(canvas.getContext("2d") as CanvasRenderingContext2D, chosenShapeSet[p.shape]);
        }
      }
    }

  }

  unpack(state: GameState) {
    // unpack game state to useful data

    for (let p of state.removed) {
      if (this.pieces.has(p.id)) {
        let pm = this.pieces.get(p.id) as PieceMesh;
        console.log("remove mesh for " + identify2(pm));
        pm.mesh.visibility = 0; // we might otherwise be leaving shadows behind??
        scene.removeMesh(pm.mesh);
        this.pieces.delete(pm.id);
        unplace(this.grid, pm.gridxy);
      }
    }


    let added = 0;
    for (let p of state.pog) {
      let pm: PieceMesh;
      if (!this.pieces.has(p.id)) {
        // create new mesh
        pm = new PieceMesh(p, scene); //, isHand: false, gridxy: p.pos, home_x: -1, fix: true, homexy: {x: 0, y: 0} );
        this.pieces.set(p.id, pm);
        ++added;
        console.log("add field mesh for " + identify2(pm));
      } else {
        pm = this.pieces.get(p.id) as PieceMesh;
      }
      Object.assign(pm, p);
      console.log(`...add to grid: ${identify2(pm)} at ${JSON.stringify(pm.gridxy)}`);
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
          let pm = new PieceMesh(p, scene); //, true, undefined, home_x); //{...p, isHand: true, gridxy: {x: 0, y: 0}, home_x: i, fix: false, homexy: {x: 0, y: 0} });
          Object.assign(pm, p);
          pm.home_x = getFreeHandSlot(this.hands[pidx]);
          this.pieces.set(p.id, pm);
          ++added;
          this.hands[pidx].push(pm);
          console.log("add hand mesh for " + identify2(pm));
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
    if (toreturn.length === 0) {
      // cannot skip move
      console.log("Illegal move in world.swap: have to swap at least one piece (by placing it anywhere in the field).")
      return false;
    }

    // move is valid => disable pieces on hand
    this.hands[this.curr_player].forEach(p => {
      p.mesh.isPickable = false;
    });
    // remove meshes for pieces on field (i.e. to be returned to bag) -- boardgame.io will immediately give us an outdated update where we would restore the mesh, so better leave it for now and introduce a mechanism to remove meshes in unpack
    /*
    toreturn.forEach(p => {
      console.log("remove mesh for " + identify2(p));
      scene.removeMesh(p.mesh);
      this.pieces.delete(p.id);
      unplace(this.grid, p.gridxy);
    });
    */
    this.hands[this.curr_player] = this.hands[this.curr_player].filter(p => p.isHand);
    // end turn
    gameClient.moves.swap(downgrade(toreturn));
  }


}


