//
// Container that describes a piece in the game.
//
// (85)
//
// $Id: piece.ts 3730 2020-12-29 11:01:25Z zwo $
//




export interface Piece {
  // a piece that can be serialized
  id: number; // unique ID
  // type
  color: number;
  shape: number;
}




