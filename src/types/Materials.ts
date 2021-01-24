// 
// Definitions for materials (textures)
// 
// (85)
// 
// $Id: Materials.ts 3786 2021-01-24 11:39:32Z zwo $

export const colors = [
    "green",
    "#7070ff", // or blue or RoyalBlue?
    "red",
    "yellow",
    "violet",
    "orange"
];
// enum PieceColor {
//     Green,
//     Blue,
//     Red,
//     Yellow,
//     Violet,
//     Orange
// }
// TODO: type shape = "square" | "circle" | ...
export enum Shape {
    // default shapes
    Square,
    Circle,
    Star,
    Cross,
    Rhombus,
    Clover,
    // empty
    Hidden,
    // simplified shapes
    SmallCircle,
    Ring,
    Triangle,
    Times,
    Checker,
}

export const Shapes1 = [
    Shape.Square,
    Shape.Circle,
    Shape.Star,
    Shape.Cross,
    Shape.Rhombus,
    Shape.Clover,
]

export const Shapes2 = [
    Shape.Square,
    Shape.SmallCircle,
    Shape.Ring,
    Shape.Triangle,
    Shape.Times,
    Shape.Checker,
]