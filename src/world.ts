// 
// Container for objects.
// 
// (85)
//
// $Id: world.ts 3731 2020-12-29 13:43:23Z zwo $

import { Color3, Color4, DirectionalLight, GlowLayer, HemisphericLight, Material, MeshBuilder, Nullable, PBRMetallicRoughnessMaterial, Scene, ShadowGenerator, SpotLight, SubMesh, Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { createPBRSkybox, createArcRotateCamera, scene, floatingPiece } from "./functions";
import { gridCube, gridPos, has, set } from "./types/Field";
import { identify, PieceMesh } from "./PieceMesh";
import { emptyGrid, getFreeHandSlot, getGridSize, GridBound, isValidMove, placePiece, unplace, updateGridSize } from "./logic";
import { GameState } from "./types/GameState";

// y positions of pieces
// const piece_y_lie = 0.31;
export const piece_y_stand = 1;
export const piece_size = 2.0;
export let world: World;

export function createWorld(scene: Scene) {
  world = new World(scene);
  return world;
}


class World {

  private pieces = new Map<number, PieceMesh>();
  private sel_piece: Nullable<PieceMesh> = null;
  private shadowGenerator: ShadowGenerator;
  private grid: GridBound;
  // private grid: Grid<PieceMesh>;
  private hands: Array<Array<PieceMesh>>;
  private curr_player = 0;
  private light_player: SpotLight;

  constructor(scene: Scene) {

    // add camera and sky
    createPBRSkybox()
    createArcRotateCamera()

    // add lights
    const light = new HemisphericLight('light', Vector3.Zero(), scene);
    light.intensity = 0.8;

    var light_dir1 = new DirectionalLight("lightd1", new Vector3(-1, -2, -1), scene);
    light_dir1.position = new Vector3(0, 40, 0);
    light_dir1.intensity = 0.4;

    // this.light_player = new DirectionalLight("light_player", new Vector3(50, 2, 50), scene);
    this.light_player = new SpotLight("light_player", Vector3.Zero(), Vector3.Zero(), Math.PI/4, 20, scene);
    this.light_player.intensity = 0.5;

    // add shadow
    this.shadowGenerator = new ShadowGenerator(1024, light_dir1);
    this.shadowGenerator.useExponentialShadowMap = true;

    // add glow (not used (much))
    var glow_layer = new GlowLayer("glow", scene);
    glow_layer.customEmissiveColorSelector = (function () {
      var x = 0;
      return function (mesh: Mesh, _subMesh: SubMesh, _material: Material, result: Color4) {
        if (mesh.metadata && mesh.metadata.glows) {
          if (++x === 100)
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

    // scene.onKeyboardObservable.add((kbinfo) => {
    //   if ((kbinfo.type == KeyboardEventTypes.KEYDOWN) && (kbinfo.event.code === 'KeyM')) {
    //     this.hands[curr_player].forEach(p => {
    //       // if (p.mesh) 
    //       // p.mesh.visibility = 0.5;
    //       p.glows = !p.glows;
    //     });
    //   }
    // })

    // init grid
    this.grid = emptyGrid()
    this.hands = [];

  }

  playerToAngle(player_idx: number) {
    // returns angle on field pointing to player
    return Math.PI / 4 + Math.PI / 2 * player_idx;
  }

  setCurrPlayer(p: string) {
    console.log("Active player now is " + p);
    this.curr_player = parseInt(p);
    // // move spotlight...
    // const frameRate = 10;

    // const xSlide = new BABYLON.Animation("xSlide", "position.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    // const keyFrames = []; 

    // keyFrames.push({
    //     frame: 0,
    //     value: 2
    // });

    // keyFrames.push({
    //     frame: frameRate,
    //     value: -2
    // });

    // keyFrames.push({
    //     frame: 2 * frameRate,
    //     value: 2
    // });

    // xSlide.setKeys(keyFrames);

    // box.animations.push(xSlide);

    // scene.beginAnimation(box, 0, 2 * frameRate, true);
    this.light_player.position = new Vector3(
      Math.cos(this.playerToAngle(this.curr_player)) * 50,
      5,
      Math.sin(this.playerToAngle(this.curr_player)) * 50
      )
    this.light_player.direction = this.light_player.position.scale(-1);
  }

  recomputeHandPos() {
    // (re-)compute home position for meshes and show hand
    let fieldsize = Math.max( // TODO: use getFieldSize
      this.grid.grid_maxx - this.grid.grid_minx,
      this.grid.grid_maxy - this.grid.grid_miny
    )
    for (let player_idx = 0; player_idx < this.hands.length; ++player_idx) {
      let angle1 = this.playerToAngle(player_idx)
      this.hands[player_idx].forEach(p => {
        console.log(`hand ${player_idx} has ${identify(p)}`)
        let angle2 = angle1 + Math.PI + Math.PI * (p.home_x - 2.5) / 10;
        let angle3 = -angle2 + Math.PI / 2;
        let x = Math.cos(angle1) * (fieldsize + 28) + 10 * Math.cos(angle2);
        let y = Math.sin(angle1) * (fieldsize + 28) + 10 * Math.sin(angle2);
        p.homexy = { x: x, y: y };
        if (p.isHand) {
          p.homerot = new Vector3(-Math.PI / 2, angle3, 0);
          p.moveHome();
        }
        // make visible and clickable
        let canmove = this.curr_player === player_idx;
        p.fix = !canmove;
        p.mesh.isVisible = true;
        p.mesh.isPickable = canmove;
      });
    };
  }

  unpack(state: GameState) {
    // unpack game state to useful data

    let added = 0;
    for (let p of state.pog) {
      if (!this.pieces.has(p.id)) {
        // create new mesh
        let pm = new PieceMesh(p, scene); //, isHand: false, gridxy: p.pos, home_x: -1, fix: true, homexy: {x: 0, y: 0} );
        pm.mesh.isVisible = true;
        set(this.grid, p.gridxy, pm)
        this.pieces.set(p.id, pm);
        ++added;
        updateGridSize(this.grid, p.gridxy)
      } else {
        set<PieceMesh>(this.grid, p.gridxy, this.pieces.get(p.id));
      }
    }
    console.log(`unpack: added ${added} new pieces in field, grid size = ${this.grid.grid_minx}-${this.grid.grid_maxx}, ${this.grid.grid_miny}-${this.grid.grid_maxy}`);

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
          this.pieces.set(p.id, pm);
          ++added;
          this.hands[pidx].push(pm);
        } else {
          this.hands[pidx].push(this.pieces.get(p.id) as PieceMesh);
        }
      }
    }
    this.recomputeHandPos();
    console.log(`updateWorld: added ${added} new pieces in hands`);

    // change perspective TODO
    // const xSlide = new BABYLON.Animation("xSlide", "position.x", frameRate, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);


  }

  click(p: PieceMesh) {
    // handle when piece has been clicked on
    if (this.sel_piece) {
      this.sel_piece.unselect();
      // handle unselect
      if (this.withinField(this.sel_piece.mesh.position)) {
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
  }

  toGroundCoord(xy: gridPos): Vector3 {
    return new Vector3(xy.x * piece_size, 0, xy.y * piece_size);
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

  endTurn(): PieceMesh[] | false {
    // check if move is valid
    if (floatingPiece)
      return false;
    let played = this.hands[this.curr_player].filter(p => !p.isHand);
    if (!isValidMove(this.grid, played))
      return false;
    // move is valid => move pieces from hands array to field
    played.forEach((p) => {
      p.isHand = false;
      p.mesh.isPickable = false;
      p.fix = true;
      updateGridSize(this.grid, p.gridxy);
    });
    this.hands[this.curr_player] = this.hands[this.curr_player].filter(p => p.isHand);
    // disable hand
    this.hands[this.curr_player].forEach(p => {
      p.mesh.isPickable = false;
    });
    return played;
  }



}


