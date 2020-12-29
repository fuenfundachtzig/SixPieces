//
// Container that describes a piece in the game.
//
// (85)
//
// $Id: piece.ts 3729 2020-12-28 22:12:00Z zwo $
//


import { colors, Shape } from "./make_materials";
import { gridPos } from "./types/Field";


export interface Piece {
  // a piece that can be serialized
  id: number; // unique ID
  // type
  color: number;
  shape: number;
}

export interface PieceGame extends Piece { // TODO: merge with PieceMesh
  // a piece that can be serialized with some extra info on its location
  isHand: boolean; // true = is on hand, false = is on field
  gridxy: gridPos; // position on field  / grid
  home_x: number;  // index on hand
  homexy: gridPos; // home position computed from home_x, size of field and direction of player
  fix: boolean; // can no longer be moved
}

export function identify(p: PieceGame): string {
  return `${colors[p.color]} ${Shape[p.shape]} on (${p.gridxy.x}, ${p.gridxy.y})`
}


