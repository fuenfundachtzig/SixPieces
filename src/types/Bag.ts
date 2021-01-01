//
// The bag with pieces.
//
// (85)
//
// $Id: Bag.ts 3742 2020-12-30 11:56:18Z zwo $
//

import { ngeneration } from "..";
import { shuffleArray } from "../functions";
import { Piece } from "./GameState";

export type Bag = Array<Piece>;

let count_id = 0;      // ID counter for creating pieces

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
