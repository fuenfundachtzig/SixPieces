//
// GameState
//
// Store as little as possible information here because boardgame.io will make it immutable aka useless. 
//
// (85)
// 
// $Id: GameState.ts 3752 2021-01-02 10:14:55Z zwo $

import { gridPos } from "./Field";
import { Bag } from "./Bag";
import { colors, Shape } from "../make_materials";

export interface Player {
    id: string;
    name: string;
    score: number;
    hand: Piece[];
}

export interface Piece {
    // a basic piece that can be serialized
    id: number; // unique ID
    // type
    color: number;
    shape: number;
}

export interface PieceInGame extends Piece {
    gridxy: gridPos;    // position on field  / grid
    isHand: boolean;    // true = is on hand, false = is on field
    home_x: number;     // slot on hand         
    invalid: boolean;   // if placement invalid (evaluated by isValid)
    fix: boolean;       // cannot be moved (= !isPickable)
}


// well, overloading apparently does not work in TypeScript
// export function identify(p: Piece): string;
// export function identify(p: PieceInGame): string;
// export function identify(p: Piece | PieceInGame): string {
// if (typeof p == "Piece") {
// return "";
// } else {
// }
export function identify1(p: Piece): string {
    return `${p.id} (${colors[p.color]} ${Shape[p.shape]})`;
}

export function identify2(p: PieceInGame): string {
    if (p.isHand)
        return `${p.id} (${colors[p.color]} ${Shape[p.shape]}) on ${p.home_x}${p.fix ? ", fix" : ""}`;
    else
        return `${p.id} (${colors[p.color]} ${Shape[p.shape]}) on (${p.gridxy.x}, ${p.gridxy.y}${p.fix ? ", fix" : ""})`;
}

export interface GameState {
    players: Player[];
    bag: Bag;
    pog: PieceInGame[];
}

