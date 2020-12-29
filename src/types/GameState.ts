//
// GameState
//
// Store as little as possible information here because boardgame.io will make it immutable aka useless. 
//
// (85)
// 
// $Id: GameState.ts 3731 2020-12-29 13:43:23Z zwo $

import { gridPos } from "./Field";
import { Bag } from "./Bag";
import { Piece } from "../PieceMesh";

export interface Player {
    id: string;
    name: string;
    score: number;
    hand: Piece[];
}

export interface PieceOnGrid extends Piece {
    gridxy: gridPos;
}

export interface GameState {

    players: Player[];
    bag: Bag;
    pog: PieceOnGrid[];

}

