//
// GameState
//
// Store as little as possible information here because boardgame.io will make it immutable aka useless. 
//
// (85)
// 
// $Id: GameState.ts 3729 2020-12-28 22:12:00Z zwo $

import { gridPos } from "./Field";
import { Piece } from "../piece";
import { Bag } from "./Bag";

export interface Player {
    id: string;
    name: string;
    score: number;
    hand: Piece[];
}

export interface PieceOnGrid {
    piece: Piece;
    pos: gridPos;
}

export interface GameState {

    players: Player[];
    bag: Bag;
    pog: PieceOnGrid[];

}

