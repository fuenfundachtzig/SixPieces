


export interface gridPos {
  x: number;
  y: number;
}
export function translate(xy: gridPos, dx: number = 0, dy: number = 0): gridPos {
  return { x: xy.x + dx, y: xy.y + dy };
}
export class Field<T> {

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
export const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1]];
