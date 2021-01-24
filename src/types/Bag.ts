//
// The bag with pieces.
//
// (85)
//
// $Id: Bag.ts 3785 2021-01-24 09:50:20Z zwo $
//

import { Piece } from "./GameState";

// config
const ngeneration = 3; // how often each piece exists in game (default: 3)

export type Bag = Array<Piece>;
let count_id = 0;      // ID counter for creating pieces

export function shuffleArray<T>(array: Array<T>) {
  // Durstenfeld shuffle, from https://stackoverflow.com/a/12646864/143931
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

export function createBag() {

  // fill bag
  let bag: Bag = [];
  for (let i = 0; i < 6; ++i)
    for (let j = 0; j < 6; ++j)
      for (let k = 0; k < ngeneration; ++k) {
        let p = {
          id: ++count_id,
          color: i,
          shape: j,
          // isHand: true,
          // gridxy: { x: 0, y: 0 },
          // home_x: -1,
          // homexy: { x: 0, y: 0 },
          // fix   : false,
        };
        bag.push(p);
      }

  // shuffle
  shuffleArray(bag); // TODO: use ctx.random.Shuffle
  return bag;
}
