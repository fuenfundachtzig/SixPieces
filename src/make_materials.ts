// 
// Creates the materials for the upper facets of the pieces.
// 
// (85)
//
// $Id: make_materials.ts 3714 2020-12-25 23:28:53Z zwo $

import { DynamicTexture, Scene, StandardMaterial } from "@babylonjs/core";

const colors = [
    "green",
    "blue",
    "red",
    "yellow",
    "violet",
    "orange"
];

const texture_x = 256;
const texture_y = 256;


function drawStar(ctx: CanvasRenderingContext2D, radius: number, symmetry: number, inner: number, rotate: number = 0) {
    // draws a star onto a HTML5 canvas
    ctx.beginPath();
    ctx.translate(texture_x / 2, texture_y / 2);
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


function drawShape(ctx: CanvasRenderingContext2D, shape_idx: number) {
    // draws one of 6 shapes

    switch (shape_idx) {
        case 0:
            // square
            ctx.rect(48, 48, 160, 160);
            break;
        case 1:
            // circle
            ctx.beginPath();
            ctx.arc(texture_x / 2, texture_y / 2, texture_x * 0.36, 0, 2 * Math.PI, true);
            break;
        case 2:
            // 8-fold star
            drawStar(ctx, texture_x * 0.35, 8, 0.45);
            break;
        case 3:
            // 4-fold star
            drawStar(ctx, texture_x * 0.45, 4, 0.38, Math.PI / 4);
            break;
        case 4:
            // rotated square
            ctx.beginPath();
            ctx.translate(texture_x/2, texture_y/2);
            ctx.rotate(Math.PI / 4);
            const r = 64;
            ctx.rect(-r, -r, r*2, r*2);
            break;
        case 5:
            // clover leaf
            ctx.beginPath();
            var open = 0.3;
            ctx.translate(texture_x / 2, texture_y / 2);
            for (var i = 0; i < 4; i++) {
                ctx.rotate(Math.PI / 2);
              	// ctx.lineTo(Math.cos(Math.PI*open)*(texture_x)/5-texture_x/4,
                //            Math.sin(Math.PI*open)*(texture_x)/5,
                //            0);
                ctx.arc(-texture_x/4.8, 0, texture_x*0.14, Math.PI*open, Math.PI*(2-open))
            }
            ctx.closePath();
            break;
    }
    ctx.fill();

}


export function makeMaterials(scene: Scene) {
    // prepare a 6x6 matrix of materials

    const materials = Array();

    for (let shape_idx = 0; shape_idx < 6; ++shape_idx) {
        const materials_colors = Array();
        colors.forEach(color => {
            var material = new StandardMaterial("mat_" + color, scene);
            var texture = new DynamicTexture("dyn_texture", { width: texture_x, height: texture_y }, scene, true);
            var ctx = texture.getContext();
            ctx.fillStyle = color;
            drawShape(ctx, shape_idx);
            texture.update();
            material.diffuseTexture = texture;
            material.roughness = 0.6
            materials_colors.push(material);
        });
        materials.push(materials_colors);
    }
    return materials;

}
