// 
// Main
// 
// (85)
//
// $Id: index.ts 3714 2020-12-25 23:28:53Z zwo $


import 'pepjs'

import { HemisphericLight, Vector3, MeshBuilder, PBRMetallicRoughnessMaterial, Color3, SceneLoader, DirectionalLight, ShadowGenerator, SpotLight, Texture, DynamicTexture } from '@babylonjs/core'
import { createEngine, createScene, createPBRSkybox, createArcRotateCamera } from './functions'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { createSuperEllipsoid, createSuperEllipsoid1 } from './superello'
import { makeMaterials } from './make_materials'

// Import stylesheets
// import './index.css';

const canvas: HTMLCanvasElement = document.getElementById('root') as HTMLCanvasElement
const engine = createEngine(canvas)
const scene = createScene()
const piece_y = 0.31;


// main function that is async so we can call the scene manager with await
const main = async () => {

  createPBRSkybox()
  createArcRotateCamera()

  const light     = new HemisphericLight('light', Vector3.Zero(), scene)
  light.intensity = 0.5

	// light1
	var light_dir = new DirectionalLight("dir01", new Vector3(-1, -2, -1), scene);
	light_dir.position = new Vector3(20, 40, 20);
	light_dir.intensity = 0.5;

  // add shadow
  var shadowGenerator = new ShadowGenerator(1024, light_dir);
	shadowGenerator.useExponentialShadowMap = true;
  
  // add ground
  const groundMesh = MeshBuilder.CreatePlane('ground', { size: 100 }, scene)
  const groundMat = new PBRMetallicRoughnessMaterial('ground-material', scene)
  groundMat.baseColor = new Color3(0.1, 0.1, 0.1)
  groundMat.metallic = 0
  groundMat.roughness = 0.6
  groundMat.backFaceCulling = false
  groundMat.freeze() // freeze the ground material for better performance

  groundMesh.material = groundMat
  groundMesh.rotation = new Vector3(Math.PI / 2, 0, 0)
  groundMesh.freezeWorldMatrix() // since we are not going to be moving the ground, we freeze it for better performance
  groundMesh.receiveShadows = true;

  // add cube
  const cubeMat = new PBRMetallicRoughnessMaterial('cube-material', scene)
  cubeMat.baseColor = Color3.FromHexString('#ffcc44')
  // cubeMat.baseColor = Color3.FromHexString('#222222')
  cubeMat.metallic = 0.4
  cubeMat.roughness = 0.6
  cubeMat.backFaceCulling = false
  
  // const cubeMesh = MeshBuilder.CreateBox('cube', { size: 2 }, scene)
  // cubeMesh.position = new Vector3(5, 5, 5)
	// shadowGenerator.addShadowCaster(cubeMesh);
  // cubeMesh.material = cubeMat
  
  // var mat = new StandardMaterial("mat", scene);
  // var texture = new Texture("http://jerome.bousquie.fr/BJS/images/spriteAtlas.png", scene);
  // mat.diffuseTexture = texture;
  // // mat.color = Color3.FromHexString('#222222')
  // mat.roughness = 0.6

  const materials = makeMaterials(scene);

  // cubeMesh.material = mat

  // more cubes
  // var root = new TransformNode();
  // meshes.forEach(mesh => {
  //   // leave meshes already parented to maintain model hierarchy:
  //   if (!mesh.parent) {
  //     mesh.parent = root
  //   }
  // })
  for (let i = 0; i < 6; ++i) {
    for (let j = 0; j < 6; ++j) {
      // const cubeMesh = MeshBuilder.CreateBox('cube', { size: 2 }, scene)
      const cubeMesh = createSuperEllipsoid(8, 0.2, 0.2, 1, 0.3, 1, scene);
      cubeMesh.material = materials[i][j];
      cubeMesh.position = new Vector3(i*2, piece_y, j*2);
      cubeMesh.checkCollisions = true;
      // cubeMesh.showBoundingBox = true;
      cubeMesh.ellipsoid = new Vector3(0.99, 100, 0.99)
      shadowGenerator.addShadowCaster(cubeMesh);
      // cubeMesh.enableEdgesRendering();
    }
  }

  
  // load a gltf model
  // const container = await SceneLoader.LoadAssetContainerAsync('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/', 'MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb', scene)
  // container.addAllToScene()
  // container.meshes[0].position.x = 10

  // Start the scene
  engine.runRenderLoop(() => {
    scene.render()
  })
}

// start the program
main()
