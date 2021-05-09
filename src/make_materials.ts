// 
// Creates the materials for the upper facets of the pieces.
// 
// (85)
//
// $Id: make_materials.ts 3846 2021-05-09 10:24:08Z zwo $

import { DynamicTexture, Scene, StandardMaterial } from "@babylonjs/core";
import { colors, Shape } from "./types/Materials";

export var materials: StandardMaterial[][];

// https://github.com/tranvansang/enum-for
var getAllEnumKeys = (enumType: any) => Object.keys(enumType).filter(key => isNaN(Number(key)));
var getAllEnumValues = (enumType: any) => getAllEnumKeys(enumType).map(key => enumType[key]);
// var getAllEnumEntries = (enumType: any) => getAllEnumKeys(enumType).map(key => [key, enumType[key]]);

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
  // normalize
  ctx.rotate(-rotate);
  ctx.translate(-texture_w / 2, -texture_h / 2);
}


export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  // draws one of 6 (regular or simplified) shapes

  ctx.beginPath();
  switch (shape) {
    case Shape.Square:
      // square
      ctx.rect(48, 48, 160, 160);
      break;
    case Shape.Circle:
      // circle
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
      ctx.translate(texture_w / 2, texture_h / 2);
      ctx.rotate(Math.PI / 4);
      const r = 64;
      ctx.rect(-r, -r, r * 2, r * 2);
      // normalize
      ctx.rotate(-Math.PI / 4);
      ctx.translate(-texture_w / 2, -texture_h / 2);
      break;
    case Shape.Clover:
      // clover leaf
      let open = 0.3;
      ctx.translate(texture_w / 2, texture_h / 2);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        // ctx.lineTo(Math.cos(Math.PI*open)*(texture_x)/5-texture_x/4,
        //            Math.sin(Math.PI*open)*(texture_x)/5,
        //            0);
        ctx.arc(-texture_w / 4.8, 0, texture_w * 0.14, Math.PI * open, Math.PI * (2 - open))
      }
      ctx.closePath();
      // normalize
      ctx.translate(-texture_w / 2, -texture_h / 2);
      break;
    case Shape.Hidden:
      // for pieces that player should not see
      break;
    case Shape.SmallCircle:
      ctx.arc(texture_w / 2, texture_h / 2, texture_w * 0.24, 0, 2 * Math.PI, true);
      break;
    case Shape.Ring:
      ctx.arc(texture_w / 2, texture_h / 2, texture_w * 0.36, 0, 2 * Math.PI, true);
      ctx.arc(texture_w / 2, texture_h / 2, texture_w * 0.18, 0, 2 * Math.PI, false);
      break;
    case Shape.Triangle:
      ctx.moveTo(texture_w * 0.5, texture_h * 0.14);
      ctx.lineTo(texture_w * 0.86, texture_h * 0.86);
      ctx.lineTo(texture_w * 0.14, texture_h * 0.86);
      break;
    case Shape.Times:
      const wid = texture_w / 6;
      const len = texture_w / 4;
      ctx.beginPath();
      ctx.translate(128, 128);
      for (let i = 0; i < 4; ++i) {
        ctx.rotate(i * Math.PI / 2);
        ctx.lineTo(wid, 0);
        ctx.lineTo(wid + len, len);
        ctx.lineTo(len, len + wid);
        ctx.lineTo(0, wid);
      }
      ctx.translate(-128, -128); // don't forget to move back
      ctx.closePath();
      break;
    case Shape.Checker:
      ctx.fillRect(texture_w * 0.14, texture_h * 0.14, texture_w * 0.36, texture_h * 0.36);
      ctx.fillRect(texture_w * 0.50, texture_h * 0.50, texture_w * 0.36, texture_h * 0.36);
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
