//
// Container for 2-D board (grid).
//
// (85)
//
// $Id: Field.ts 4033 2022-03-22 17:03:35Z zwo $
//

import { identify1, Piece, PieceInGame } from "./GameState";

export interface gridPos {
  x: number;
  y: number;
}

export interface gridRect {
  tl: gridPos; // top left
  br: gridPos; // bottom right
}

export function translate(xy: gridPos, dx: number = 0, dy: number = 0): gridPos {
  return { x: xy.x + dx, y: xy.y + dy };
}

const maxsize = 128;

export const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export interface Grid<T> {
  grid: Array<Array<T | undefined>>;
  count: number;
}

function makeGrid<T>(): Grid<T> {
  let g: Grid<T> = {grid: [[]], count: 0};
  for (let i = 0; i < maxsize; ++i)
    g.grid.push(new Array<T>(maxsize));
  return g;
}

export function* iterate<T>(g: Grid<T>): Iterator<T> {
  // iterates over all defined values in grid
  // this is O(maxsize²) but I don't intend to call it often, so no need to optimize
  for (let i = 0; i < maxsize; ++i)
    for (let j = 0; j < maxsize; ++j)
      if (g.grid[i][j] === undefined)
        continue;
      else
        yield g.grid[i][j] as T;
}

function X(x: number): number {
  while (x < 0)
    x += maxsize;
  return x;
}

function Y(y: number): number {
  while (y < 0)
    y += maxsize;
  return y;
}

export function set<T>(g: Grid<T>, xy: gridPos, p: T | undefined) {
  if ((p !== undefined) && !has(g, xy))
    ++g.count;
  g.grid[X(xy.x)][Y(xy.y)] = p;
}

export function get<T>(g: Grid<T>, xy: gridPos): T | undefined {
  return g.grid[X(xy.x)][Y(xy.y)];
}

export function remove<T>(g: Grid<T>, xy: gridPos): T | undefined {
  let res = get(g, xy);
  set(g, xy, undefined);
  if (res !== undefined)
    --g.count;
  return res;
}

export function has<T>(g: Grid<T>, xy: gridPos): boolean {
  return get(g, xy) !== undefined;
}

export function empty<T>(g: Grid<T>): boolean {
  return g.count === 0;
}

export function getN<T>(g: Grid<T>): number {
  return g.count;
}

export interface GridWithBounds extends Grid<PieceInGame> {
  inited: boolean; // whether sizes are valid
  grid_minx: number; // size of fixed pieces
  grid_miny: number;
  grid_maxx: number;
  grid_maxy: number;
}

export function emptyGrid(): GridWithBounds {
  let grid: Grid<PieceInGame> = makeGrid();
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

export function placePiece(g: GridWithBounds, p: PieceInGame, xy: gridPos) {
  console.log("place " + identify1(p) + " on " + xy.x + "," + xy.y)
  set(g, xy, p);
}

export function unplace(g: GridWithBounds, xy: gridPos): void {
  console.log("unplace on " + xy.x + "," + xy.y)
  remove(g, xy);
}



