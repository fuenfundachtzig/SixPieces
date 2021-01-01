//
// Implement logic for (valid) moves on grid.
//
// (85)
//
// $Id: logic.ts 3742 2020-12-30 11:56:18Z zwo $
//

import { create, get, getN, Grid, gridPos, gridRect, has, neighbors, remove, set, translate } from "./types/Field"
import { Bag } from "./types/Bag";
import { identify1, identify2, Piece, PieceInGame, Player } from "./types/GameState";

type GridGame = Grid<PieceInGame>;

export interface GridBound extends GridGame {
  inited: boolean; // whether sizes are valid
  grid_minx: number; // size of fixed pieces
  grid_miny: number;
  grid_maxx: number;
  grid_maxy: number;
}

export function emptyGrid(): GridBound {
  let grid: Grid<PieceInGame> = create();
  return {
    inited: false,
    grid: grid.grid,
    count: grid.count,
    grid_minx: 0,
    grid_miny: 0,
    grid_maxx: 0,
    grid_maxy: 0,
  }
}

export function placePiece(g: GridGame, p: Piece, xy: gridPos) {
  console.log("place " + identify1(p) + " on " + xy.x + "," + xy.y)
  set(g, xy, p);
}

export function unplace(g: GridGame, xy: gridPos) {
  console.log("unplace on " + xy.x + "," + xy.y)
  remove(g, xy);
}

// function isEmpty(g: GridGame, xy: gridPos): boolean {
//   return !has(g, xy);
// }

export function updateGridSize(g: GridBound, xy: gridPos) {
  // updates the cached grid size with a xy position (note: there is no way to undo this)
  console.log("updateGridSize " + g.inited + " "+ g.count  + " " + xy.x + ","+xy.y)
  if (!g.inited) {
    /*
    // we could try to iterate over all pieces in grid as done below 
    // but the coordinates in the 2-D array are mapped to positive values whereas the grid size we want actually is defined also for negative values 
    // as we actually need the negative values instead of the wrapped values for the graphics, 
    //   we'll just rely on updateGridSize to be called for all pieces (as is done: in endTurn for our player's pieces and in unpack for other players' pieces)
    // which makes it simpler here
    for (let x = 0; x < g.grid.length; ++x) {
      for (let y = 0; y < g.grid.length; ++y) {
        if (has(g, { x, y })) {
          if (g.inited)
            updateGridSize(g, { x, y })
          else {
            g.grid_minx = x;
            g.grid_maxx = x;
            g.grid_miny = y;
            g.grid_maxy = y;
            g.inited = true;
          }
        }
      }
    }
    */
   g.inited = true;
   g.grid_minx = xy.x;
   g.grid_maxx = xy.x;
   g.grid_miny = xy.y;
   g.grid_maxy = xy.y;
} else {
    g.grid_minx = Math.min(g.grid_minx, xy.x);
    g.grid_maxx = Math.max(g.grid_maxx, xy.x);
    g.grid_miny = Math.min(g.grid_miny, xy.y);
    g.grid_maxy = Math.max(g.grid_maxy, xy.y);
  }
}

export function getGridSize(g: GridBound, margin: number): gridRect {
  let tl = { x: g.grid_minx - margin, y: g.grid_miny - margin };
  let br = { x: g.grid_maxx + margin, y: g.grid_maxy + margin };
  return { tl: tl, br: br }
}

export function isValidMove(g: GridGame, played: PieceInGame[]): boolean | number {
  // check if move valid

  // no piece played
  if (played.length === 0) {
    console.log("Illegal move: have to play at least one piece (by placing it correctly in the field).")
    return false;
  }

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
    played.forEach(p => { p.invalid = true });
    return false;
  }

  // every new piece must have a neighbor (and one must be old)
  if (getN(g) > 1) {
    let old = false;
    for (let p of played) {
      if (!neighbors.some(disp => has(g, translate(p.gridxy, ...disp)))) {
        console.log("disconnected " + identify2(p));
        p.invalid = true;
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
    if ((getN(g) > played.length) && !old) {
      console.log("disconnected from prev.");
      played.forEach(p => { p.invalid = true });
      return false;
    }
  }

  // no new piece must differ in both (or neither) color and shape from any neighbor -- this could be merged with next check but like this we can highlight individual pieces
  function mismatch(p1: Piece | undefined, p2: Piece | undefined) {
    if ((p1 === undefined) || (p2 === undefined))
      return false;
    return (p1.shape != p2.shape) == (p1.color != p2.color);
  }
  for (var p of played) {
    for (var disp of neighbors) {
      if (mismatch(p, get(g, translate(p.gridxy, ...disp)))) {
        console.log("does not match " + identify2(p) + " " + identify1(get(g, translate(p.gridxy, ...disp))!));
        p.invalid = true;
        return false;
      }
    }
  }

  // finally check rows and cols make sense
  let rows_counted: number[] = [];
  let cols_counted: number[] = [];
  let score = 0;
  for (let piece of played) { // loop over all pieces that have been played
    for (let dir of [[1, 0], [0, 1]]) {
      let shapes = [piece.shape];
      let colors = [piece.color];
      for (let sgn of [1, -1]) {
        dir[0] = dir[0] * sgn;
        dir[1] = dir[1] * sgn;
        let xy = translate(piece.gridxy, ...dir);
        while (has(g, xy)) {
          shapes.push(get(g, xy)!.shape);
          colors.push(get(g, xy)!.color);
          xy = translate(xy, ...dir);
        }
      }
      let isrow = dir[0] != 0;
      let ushapes = new Set(shapes); // if set is smaller than array, there's a duplicate -- which is fine as long as they are *all* the same (i.e. ushapes has onyly 1 entry)
      let ucolors = new Set(colors); // same rule here
      if (((ushapes.size < shapes.length) && (ushapes.size > 1)) ||
        ((ucolors.size < colors.length) && (ucolors.size > 1))) {
        console.log(`invalid ${isrow ? "row" : "column"} for ${identify2(piece)}`);
        console.log("shapes " + shapes);
        console.log("colors " + colors);
        piece.invalid = true;
        return false;
      }
      // piece is in valid row / column => get points!
      if (shapes.length > 1)
        if (isrow) {
          if (!rows_counted.includes(piece.gridxy.y)) {
            rows_counted.push(piece.gridxy.y);
            score += shapes.length;
            if (shapes.length == 6)
              score += 6;
            console.log(shapes.length);
          }
        } else {
          if (!cols_counted.includes(piece.gridxy.x)) {
            cols_counted.push(piece.gridxy.x);
            score += shapes.length;
            if (shapes.length == 6)
              score += 6;
            console.log(shapes.length);
          }
        }
    }
  }
  console.log("Scored " + score + " points");

  return score;
}

export function getFreeHandSlot(hand: PieceInGame[]): number {
  // find empty slot on hand and return index
  for (let i = 0; i < 6; ++i) {
    for (var idx = 0; idx < hand.length; ++idx) {
      if (hand[idx].home_x === i)
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
    let p = bag.pop();
    if (!p)
      break;
    player.hand.push(p);
  }
}

