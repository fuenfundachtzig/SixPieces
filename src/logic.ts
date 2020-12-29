//
// Implement logic for moves on grid.
//
// (85)
//
// $Id: logic.ts 3731 2020-12-29 13:43:23Z zwo $
//

import { create, get, getN, Grid, gridPos, gridRect, has, neighbors, remove, set, translate } from "./types/Field"
import { Piece } from "./piece";
import { Bag } from "./types/Bag";
import { Player } from "./types/GameState";
import { identify, PieceMesh } from "./PieceMesh";


type GridGame = Grid<PieceMesh>;

export interface GridBound extends GridGame {

    grid_minx: number; // size of fixed pieces
    grid_miny: number;
    grid_maxx: number;
    grid_maxy: number;

}

export function emptyGrid(): GridBound {
    let grid: Grid<PieceMesh> = create();
    return {
        grid: grid.grid,
        count: grid.count,
        grid_maxx: 0,
        grid_maxy: 0,
        grid_minx: 0,
        grid_miny: 0,
    }
}

export function placePiece(g: GridGame, p: PieceMesh, xy: gridPos) {
    console.log("place " + identify(p) + " on " + xy.x + "," + xy.y)
    set(g, xy, p);
}

export function unplace(g: GridGame, xy: gridPos) {
    console.log("unplace on " + xy.x + "," + xy.y)
    remove(g, xy);
}

function isEmpty(g: GridGame, xy: gridPos): boolean {
    return !has(g, xy);
}

export function updateGridSize(g: GridBound, xy: gridPos) {
    g.grid_minx = Math.min(g.grid_minx, xy.x);
    g.grid_maxx = Math.max(g.grid_maxx, xy.x);
    g.grid_miny = Math.min(g.grid_miny, xy.y);
    g.grid_maxy = Math.max(g.grid_maxy, xy.y);
}

export function getGridSize(g: GridBound, margin: number): gridRect {
    let tl = { x: g.grid_minx - margin, y: g.grid_miny - margin };
    let br = { x: g.grid_maxx + margin, y: g.grid_maxy + margin };
    return { tl: tl, br: br }
}

export function isValidMove(g: GridGame, played: PieceMesh[]): boolean {
    // check if move valid

    // no piece played
    if (played.length == 0)
        return false;

    // check all new pieces are in one row or column... ergo need to get x, y arrays back
    let xyarray: gridPos[] = played.map(p => p.gridxy);
    let xarray: number[] = xyarray.map((xy) => xy.x);
    let yarray: number[] = xyarray.map((xy) => xy.y);
    let minx = Math.min(...xarray);
    let maxx = Math.max(...xarray);
    let miny = Math.min(...yarray);
    let maxy = Math.max(...yarray);
    if ((minx != maxx) && (miny != maxy)) {
        console.log(`diagonal ${minx} ${maxx} ${miny} ${maxy}`);
        return false;
    }

    // every new piece must have a neighbor (and one must be old)
    if (getN(g) > 1) {
        let old = false;
        for (let p of played) {
            if (!neighbors.some(disp => has(g, translate(p.gridxy, ...disp)))) {
                console.log("disconnected " + identify(p));
                return false;
            }
            for (let disp of neighbors) {
                let op = get(g, translate(p.gridxy, ...disp));
                if (op && op.fix) {
                    old = true;
                    break;
                }
            }
        }
        if ((getN(g,) > played.length) && !old) {
            console.log("disconnected from prev. ");
            return false;
        }
    }

    // every new piece must have a neighbor
    if (getN(g) > 1) {
        for (let p of played) {
            if (!neighbors.some(disp => has(g, translate(p.gridxy, ...disp)))) {
                console.log("disconnected " + identify(p));
                return false;
            }
        }
    }

    // no new piece must differ in both (or neither) color and shape from any neighbor
    function mismatch(p1: Piece | undefined, p2: Piece | undefined) {
        if ((p1 === undefined) || (p2 === undefined))
            return false;
        return (p1.shape != p2.shape) == (p1.color != p2.color);
    }
    for (var p of played) {
        for (var disp of neighbors) {
            if (mismatch(p, get(g, translate(p.gridxy, ...disp)))) {
                console.log("does not match " + identify(p) + " " + identify(get(g, translate(p.gridxy, ...disp))!));
                return false;
            }
        }
    }

    // finally check rows and cols make sense
    for (let p of played) {
        for (let dir of [[1, 0], [0, 1]]) {
            let shapes = [p.shape];
            let colors = [p.color];
            for (let sgn of [1, -1]) {
                dir[0] = dir[0] * sgn;
                dir[1] = dir[1] * sgn;
                let xy = translate(p.gridxy, ...dir);
                while (has(g, xy)) {
                    shapes.push(get(g, xy)!.shape);
                    colors.push(get(g, xy)!.color);
                    xy = translate(xy, ...dir);
                }
            }
            let ushapes = new Set(shapes);
            let ucolors = new Set(colors);
            if (((ushapes.size < shapes.length) && (ushapes.size > 1)) ||
                ((ucolors.size < colors.length) && (ucolors.size > 1))) {
                console.log("wrong row for " + identify(p));
                console.log("shapes " + shapes);
                console.log("colors " + colors);
                return false;
            }
        }
    }

    return true;
}




export function getFreeHandSlot(hand: PieceMesh[]): number {
    // find empty slot on hand and return index
    for (let i = 0; i < 6; ++i) {
        for (var idx = 0; idx < hand.length; ++idx) {
            if (hand[idx].home_x == i)
                break;
        }
        if (idx == hand.length)
            return i;
    }
    console.log("getFreeHandSlot: couldn't find free slot??")
    return -1;
}

export function fillHand(player: Player, bag: Bag) {
    // fill hand
    while (player.hand.length < 6) {
        // TODO:  let p = new PieceMesh(scene, this.bag.draw() as Piece);
        //   if (!p)
        // break;
        //   this.shadowGenerator.addShadowCaster(p.mesh); // therefore, we need to be in World...
        let p = bag.pop();
        if (!p)
            break;
        // p.home_x = getFreeHandSlot(player); // TODO
        player.hand.push(p);
    }
}

