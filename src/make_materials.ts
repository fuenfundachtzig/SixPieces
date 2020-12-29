// 
// Creates the materials for the upper facets of the pieces.
// 
// (85)
//
// $Id: make_materials.ts 3732 2020-12-29 15:31:10Z zwo $

import { DynamicTexture, Scene, StandardMaterial } from "@babylonjs/core";

export var materials: StandardMaterial[][];

export const colors = [
    "green",
    "#3040ff", // or RoyalBlue?
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
    Square,
    Circle,
    Star,
    Cross,
    Rhombus,
    Clover
}

// https://github.com/tranvansang/enum-for
var getAllEnumKeys = (enumType: any) => Object.keys(enumType).filter(key => isNaN(Number(key)));
var getAllEnumValues = (enumType: any) => getAllEnumKeys(enumType).map(key => enumType[key]);

const texture_w = 256;
const texture_h = 256;


function drawStar(ctx: CanvasRenderingContext2D, radius: number, symmetry: number, inner: number, rotate: number = 0) {
    // draws a star onto a HTML5 canvas
    ctx.beginPath();
    ctx.translate(texture_w / 2, texture_h / 2);
    ctx.rotate(rotate);
    ctx.moveTo(0, radius);
    for (var i = 0; i < symmetry; i++) {
        ctx.rotate(Math.PI / symmetry);
        ctx.lineTo(0, 0 + (radius * inner));
        ctx.rotate(Math.PI / symmetry);
        ctx.lineTo(0, 0 + radius);
    }
    ctx.closePath();
}


function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
    // draws one of 6 shapes

    switch (shape) {
        case Shape.Square:
            // square
            ctx.rect(48, 48, 160, 160);
            break;
        case Shape.Circle:
            // circle
            ctx.beginPath();
            ctx.arc(texture_w / 2, texture_h / 2, texture_w * 0.36, 0, 2 * Math.PI, true);
            break;
        case Shape.Star:
            // 8-fold star
            drawStar(ctx, texture_w * 0.35, 8, 0.45);
            break;
        case Shape.Cross:
            // 4-fold star
            drawStar(ctx, texture_w * 0.45, 4, 0.38, Math.PI / 4);
            break;
        case Shape.Rhombus:
            // rotated square
            ctx.beginPath();
            ctx.translate(texture_w / 2, texture_h / 2);
            ctx.rotate(Math.PI / 4);
            const r = 64;
            ctx.rect(-r, -r, r * 2, r * 2);
            break;
        case Shape.Clover:
            // clover leaf
            ctx.beginPath();
            var open = 0.3;
            ctx.translate(texture_w / 2, texture_h / 2);
            for (var i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
                // ctx.lineTo(Math.cos(Math.PI*open)*(texture_x)/5-texture_x/4,
                //            Math.sin(Math.PI*open)*(texture_x)/5,
                //            0);
                ctx.arc(-texture_w / 4.8, 0, texture_w * 0.14, Math.PI * open, Math.PI * (2 - open))
            }
            ctx.closePath();
            break;
    }
    ctx.fill();

}


export function makeMaterials(scene: Scene) {
    // prepare a 6x6 matrix of materials

    materials = [];

    for (let shape of getAllEnumValues(Shape)) {
        const materials_colors: StandardMaterial[] = [];
        colors.forEach(color => {
            var material = new StandardMaterial("mat_" + color + "_" + shape, scene);
            var texture = new DynamicTexture("dyn_texture", { width: texture_w, height: texture_h }, scene, true);
            var ctx = texture.getContext();
            ctx.fillStyle = "#202020";
            ctx.fillRect(0, 0, texture_w, texture_h);
            ctx.fillStyle = color;
            drawShape(ctx, shape);
            texture.update();
            material.diffuseTexture = texture;
            material.roughness = 0.6
            material.freeze();
            materials_colors.push(material);
        });
        materials.push(materials_colors);
    }
    return materials;

}
