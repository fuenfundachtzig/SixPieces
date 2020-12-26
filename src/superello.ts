//
// This creates a rounded cube to babylon.js as a mesh.
// Note that this is not a cube with bevel but a "superellipsoid" -- which means that it doesn't have flat surfaces, but they are slightly curved.
// 
// Original idea ("superello1") taken from https://www.babylonjs-playground.com/#14VFYX#37
// Improved by reducing number of vertices and removing overlaps (basically rewriting the creating of the UV sphere).
// Also added uv maps for textures.
//
// (85)
// 
// $Id: superello.ts 3715 2020-12-26 15:31:46Z zwo $

import { Vector3 } from "@babylonjs/core";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

function sampleSuperEllipsoid(phi: number, beta: number, n1: number, n2: number, scaleX: number, scaleY: number, scaleZ: number) {
    // computes coordinates on "super ellipsoid" from angles
    // setting exponents = 1 gives a sphere, exponents smaller than 1 exaggerate cos/sin shape towards a quadratic shape
    var cosPhi  = Math.cos(phi);
    var cosBeta = Math.cos(beta);
    var sinPhi  = Math.sin(phi);
    var sinBeta = Math.sin(beta);
    var vertex = new Vector3();
    vertex.x = scaleX * Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), n1) * Math.sign(cosBeta) * Math.pow(Math.abs(cosBeta), n2);
    vertex.z = scaleZ * Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), n1) * Math.sign(sinBeta) * Math.pow(Math.abs(sinBeta), n2);
    vertex.y = scaleY * Math.sign(sinPhi) * Math.pow(Math.abs(sinPhi), n1);
    return vertex;
}

function calculateNormal(phi: number, beta: number, n1: number, n2: number, scaleX: number, scaleY: number, scaleZ: number) {
    // compute normal vectors on triangles specified above
    var normal = new Vector3();
    var cosPhi = Math.cos(phi);
    var cosBeta = Math.cos(beta);
    var sinPhi = Math.sin(phi);
    var sinBeta = Math.sin(beta);
    normal.x = Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), 2 - n1) * Math.sign(cosBeta) * Math.pow(Math.abs(cosBeta), 2 - n2) / scaleX;
    normal.z = Math.sign(cosPhi) * Math.pow(Math.abs(cosPhi), 2 - n1) * Math.sign(sinBeta) * Math.pow(Math.abs(sinBeta), 2 - n2) / scaleZ;
    normal.y = Math.sign(sinPhi) * Math.pow(Math.abs(sinPhi), 2 - n1) / scaleY;
    //normal=normal.normalize();
    normal.normalize();
    return normal;
}


export function createSuperEllipsoid1(samples: number, exp1: any, exp2: any, scalex: any, scaley: any, scalez: any, scene: any) {
    // old function -- use createSuperEllipsoid instead

    var dB = Math.PI * 2.0 /  samples; 
    var dP = Math.PI       / (samples/2.0); // polar angle
    var vertices = [];
    var normals = [];
    // two loops, outer for phi, inner for beta
    var phi = -Math.PI / 2;
    for (var j = 0; j <= samples / 2; j++) { 
        var beta = -Math.PI;
        for (var i = 0; i <= samples; i++) {
            // triangle #1
            vertices.push(sampleSuperEllipsoid(phi     , beta     , exp1, exp2, scalex, scaley, scalez));
            normals.push(calculateNormal      (phi     , beta     , exp1, exp2, scalex, scaley, scalez));
            vertices.push(sampleSuperEllipsoid(phi + dP, beta     , exp1, exp2, scalex, scaley, scalez));
            normals.push(calculateNormal      (phi + dP, beta     , exp1, exp2, scalex, scaley, scalez));
            vertices.push(sampleSuperEllipsoid(phi + dP, beta + dB, exp1, exp2, scalex, scaley, scalez));
            normals.push(calculateNormal      (phi + dP, beta + dB, exp1, exp2, scalex, scaley, scalez));
            // triangle #2
            vertices.push(sampleSuperEllipsoid(phi     , beta     , exp1, exp2, scalex, scaley, scalez));
            normals.push(calculateNormal      (phi     , beta     , exp1, exp2, scalex, scaley, scalez));
            vertices.push(sampleSuperEllipsoid(phi + dP, beta + dB, exp1, exp2, scalex, scaley, scalez));
            normals.push(calculateNormal      (phi + dP, beta + dB, exp1, exp2, scalex, scaley, scalez));
            vertices.push(sampleSuperEllipsoid(phi     , beta + dB, exp1, exp2, scalex, scaley, scalez));
            normals.push(calculateNormal      (phi     , beta + dB, exp1, exp2, scalex, scaley, scalez));
            beta += dB;
        }
        phi += dP;
    }


    var shapeReturned = new VertexData();
    shapeReturned.positions = [];
    shapeReturned.normals = [];
    shapeReturned.indices = [];
    shapeReturned.uvs = [];
    var indice = 0;

    for (var i = 0; i < vertices.length; i++) {
        shapeReturned.indices.push(indice++);
        shapeReturned.positions.push(vertices[i].x);
        shapeReturned.positions.push(vertices[i].y);
        shapeReturned.positions.push(vertices[i].z);
        shapeReturned.normals.push(normals[i].x);
        shapeReturned.normals.push(normals[i].y);
        shapeReturned.normals.push(normals[i].z);
        shapeReturned.uvs.push(0);
        shapeReturned.uvs.push(1);
        shapeReturned.uvs.push(0);
        shapeReturned.uvs.push(0);
        shapeReturned.uvs.push(1);
        shapeReturned.uvs.push(0);
    }
    var superello = new Mesh('superello', scene);
    shapeReturned.applyToMesh(superello);
    return superello;
}


export function createSuperEllipsoid(samples: number, exp1: any, exp2: any, scalex: any, scaley: any, scalez: any, scene: any, flat: boolean = false) {

    // samplings of UV sphere
    var ni = samples;
    var nj = samples*2;

    // create table with vertex positions (size: (ni-1)*nj)
    var vertices = [];
    var normals  = [];
    for (let i = 1; i < ni; ++i) {
        for (let j = 0; j < nj; ++j) {
            let phi  = Math.PI/ni*i - Math.PI / 2;  // i runs from "bottom" to "top" (polar coordinate)
            let beta = 2*Math.PI*j/nj;              // j runs "around" (azimuthal coordinate) 
            vertices.push(sampleSuperEllipsoid(phi, beta, exp1, exp2, scalex, scaley, scalez))
            normals .push(calculateNormal     (phi, beta, exp1, exp2, scalex, scaley, scalez));
        }
    }
    vertices.push(sampleSuperEllipsoid(-Math.PI/2, 0, exp1, exp2, scalex, scaley, scalez)); // bottom vertex: (ni-1)*nj
    vertices.push(sampleSuperEllipsoid( Math.PI/2, 0, exp1, exp2, scalex, scaley, scalez)); // top vertex:    (ni-1)*nj+1
    normals .push(calculateNormal     (-Math.PI/2, 0, exp1, exp2, scalex, scaley, scalez));
    normals .push(calculateNormal     ( Math.PI/2, 0, exp1, exp2, scalex, scaley, scalez));

    function getV(i: number, j: number) {
        // look up index in array of vertices
        return (i-1)*nj + j%nj;
    }

    // add triangles
    var indices = [];
    for (let j = 0; j < nj; ++j) {
        // bottom row
        indices.push((ni-1)*nj);
        indices.push(getV(1, j+1));
        indices.push(getV(1, j));
    }
    for (let i = 1; i < ni-1; ++i) {
        // intermediate rows
        for (let j = 0; j < nj; ++j) {
            indices.push(getV(i  , j));
            indices.push(getV(i  , j+1));
            indices.push(getV(i+1, j));
            indices.push(getV(i  , j+1));
            indices.push(getV(i+1, j+1));
            indices.push(getV(i+1, j));
        }
    }
    if (flat) {
        // flat top made of two triangles (only works for nj % 8 == 0)
        indices.push(getV(ni-1, nj/8*1));
        indices.push(getV(ni-1, nj/8*3));
        indices.push(getV(ni-1, nj/8*5));
        indices.push(getV(ni-1, nj/8*1));
        indices.push(getV(ni-1, nj/8*5));
        indices.push(getV(ni-1, nj/8*7));
        // FIXME: need to fill gaps
    } else {
        for (let j = 0; j < nj; ++j) {
            // top row
            indices.push(getV(ni-1, j));
            indices.push(getV(ni-1, j+1));
            indices.push((ni-1)*nj+1);
        }
    }

    // copy triangle data to return data structure
    var shapeReturned = new VertexData();
    shapeReturned.indices   = indices;
    shapeReturned.positions = [];
    shapeReturned.normals   = [];
    for (let i = 0; i < vertices.length; ++i) {
        shapeReturned.positions.push(vertices[i].x);
        shapeReturned.positions.push(vertices[i].y);
        shapeReturned.positions.push(vertices[i].z);
        shapeReturned.normals.push(normals[i].x);
        shapeReturned.normals.push(normals[i].y);
        shapeReturned.normals.push(normals[i].z);
    }

    // compute texture coordinates for [num_rows] rows of top facets
    shapeReturned.uvs = new Array(vertices.length * 2);
    const num_rows = 2;
    for (var j = 0; j < nj*num_rows+2; ++j) { // nj top facets + the top + the bottom vertex
        if (j == nj*num_rows)
            continue; // skip bottom vertex (which has index vertices.length-2)
        let idx_u = vertices.length - 2 - nj*num_rows + j;
        shapeReturned.uvs[idx_u*2  ] = vertices[idx_u].x/scalex/2+0.5;
        shapeReturned.uvs[idx_u*2+1] = vertices[idx_u].z/scalez/2+0.5;
    }

    var superello = new Mesh('superellov2', scene);
    shapeReturned.applyToMesh(superello);

    return superello;
}

