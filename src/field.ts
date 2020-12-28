//
// Container for 2-D field  (grid).
//
// (85)
//
// $Id$
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


export const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];


export class Grid<T> {
  // the field (a 2-D array)

  readonly maxsize = 100;

  constructor(
    private field: Array<Array<T | undefined>> = [],
    private count = 0
  ) {
    for (let i = 0; i < this.maxsize; ++i)
      this.field.push(new Array(this.maxsize));
  }

  X(x: number): number {
    while (x < 0)
      x += this.maxsize;
    return x;
  }

  Y(y: number): number {
    while (y < 0)
      y += this.maxsize;
    return y;
  }

  set(xy: gridPos, p: T | undefined) {
    if ((p !== undefined) && !this.has(xy))
      ++this.count;
    this.field[this.X(xy.x)][this.Y(xy.y)] = p;
  }

  get(xy: gridPos): T | undefined {
    return this.field[this.X(xy.x)][this.Y(xy.y)];
  }

  remove(xy: gridPos): T | undefined {
    let res = this.get(xy);
    this.set(xy, undefined);
    if (res !== undefined)
      --this.count;
    return res;
  }

  has(xy: gridPos): boolean {
    return this.get(xy) !== undefined;
  }

  empty(): boolean {
    return (this.count == 0);
  }

  getN(): number {
    return this.count;
  }
}

