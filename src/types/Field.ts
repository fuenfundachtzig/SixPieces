//
// Container for 2-D field  (grid).
//
// (85)
//
// $Id: Field.ts 3741 2020-12-30 10:17:07Z zwo $
//

import { Vector3 } from "@babylonjs/core";


export interface gridPos {
  x: number;
  y: number;
}

export interface gridRect {
  tl: gridPos; // top left
  br: gridPos; // bottom right
}

export interface gridCube {
  // mainly need this because babylon uses the wrong (LH) coordinate system with y pointing up
  tl: Vector3;
  br: Vector3;
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

export function create<T>(): Grid<T> {
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


