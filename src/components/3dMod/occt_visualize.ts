import { BitByBitOCCT } from '@bitbybit-dev/occt-worker';
import { Inputs } from '@bitbybit-dev/occt';
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshNormalMaterial, Scene } from 'three';

const visualize = async (bitbybitOcct: BitByBitOCCT, shape: Inputs.OCCT.TopoDSShapePointer, precision: number) => {
  const geometries: BufferGeometry[] = [];
  const res: Inputs.OCCT.DecomposedMeshDto = await bitbybitOcct.occt.shapeToMesh({
    shape,
    adjustYtoZ: false,
    precision,
  });
  //console.log('[addShapeToScene] res=', res);
  let meshData = res.faceList.map((face) => {
    return {
      positions: face.vertex_coord,
      normals: face.normal_coord,
      indices: face.tri_indexes,
    };
  });

  meshData.forEach((mesh) => {
    let geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(Float32Array.from(mesh.positions), 3));
    geometry.setAttribute('normal', new BufferAttribute(Float32Array.from(mesh.normals), 3));
    geometry.setIndex(new BufferAttribute(Uint32Array.from(mesh.indices), 1));
    geometries.push(geometry);
  });

  return geometries;
};

export const faceToMeshData = async (bitbybitOcct: BitByBitOCCT, face: Inputs.OCCT.TopoDSFacePointer) => {
  const res: Inputs.OCCT.DecomposedMeshDto = await bitbybitOcct.occt.shapeToMesh({
    shape: face,
    adjustYtoZ: false,
    precision: 0.1,
  });
  console.log('[faceToMeshData] res=', res);
  if (res.faceList.length > 0) {
    if (res.faceList.length > 1) {
      console.warn('Facelist for given face had more than 1 entry. This is not expected', face, res);
    }
    return {
      positions: res.faceList[0].vertex_coord,
      normals: res.faceList[0].normal_coord,
      indices: res.faceList[0].tri_indexes,
    };
  } else {
    console.error('Facelist for given face was empty. This should not happend.', face, res);
    return {
      positions: [],
      normals: [],
      indices: [],
    };
  }
};

export const addShapeToScene = async (
  bitbybitOcct: BitByBitOCCT,
  shape: Inputs.OCCT.TopoDSShapePointer,
  scene: Scene,
  precision: number
): Promise<Group | null> => {
  //console.log('[addShapeToScene] shape=', shape);
  const material = new MeshNormalMaterial();
  let geometries = await visualize(bitbybitOcct, shape, precision);

  if (geometries.length === 0) {
    console.warn('Geometries length is 0. Cannot visualize shape.');
    return null;
  }

  let group = new Group();
  //console.log('[addShapeToScene]', 'Adding geometries', geometries, 'to group', group);
  geometries.forEach((geometry) => {
    group.add(new Mesh(geometry, material));
  });
  group.name = 'shape';
  scene.add(group);
  return group;
};
