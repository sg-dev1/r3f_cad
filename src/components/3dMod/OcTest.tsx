//
// This is just a test component to test opencascade.js functionality,
// mainly if it is installed correctly and a test object can be created and displayed correctly.
//
// Currently there are performance issues with initOpenCascade() function which is very slow (took 3-5 minutes to load the model).
// Need to find out how to improve this.
//
'use client';

import React, { useEffect, useState } from 'react';
import initOpenCascade, { OpenCascadeInstance, TopoDS_Shape, TDocStd_Document } from 'opencascade.js';
import log from '../../utils/log_utils';

console.log = log;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
  src: string;
  poster?: string;
  class?: string;
  // ... others
}

// Takes a TDocStd_Document, creates a GLB file from it and returns a ObjectURL
export function visualizeDoc(oc: OpenCascadeInstance, doc: TDocStd_Document) {
  // Export a GLB file (this will also perform the meshing)
  const cafWriter = new oc.RWGltf_CafWriter(new oc.TCollection_AsciiString_2('./file.glb'), true);
  cafWriter.Perform_2(
    new oc.Handle_TDocStd_Document_2(doc),
    new oc.TColStd_IndexedDataMapOfStringString_1(),
    new oc.Message_ProgressRange_1()
  );

  // Read the GLB file from the virtual file system
  const glbFile = oc.FS.readFile('./file.glb', { encoding: 'binary' });
  return URL.createObjectURL(new Blob([glbFile.buffer], { type: 'model/gltf-binary' }));
}

// Takes TopoDS_Shape, add to document, create GLB file from it and returns a ObjectURL
export function visualizeShapes(oc: OpenCascadeInstance, shapes_: TopoDS_Shape | TopoDS_Shape[]) {
  const shapes = Array.isArray(shapes_) ? shapes_ : [shapes_];

  // Create a document add our shapes
  const doc = new oc.TDocStd_Document(new oc.TCollection_ExtendedString_1());
  const shapeTool = oc.XCAFDoc_DocumentTool.ShapeTool(doc.Main()).get();
  for (const s of shapes) {
    shapeTool.SetShape(shapeTool.NewShape(), s);
    // Tell OpenCascade that we want our shape to get meshed
    new oc.BRepMesh_IncrementalMesh_2(s, 0.1, false, 0.1, false);
  }

  // Return our visualized document
  return visualizeDoc(oc, doc);
}

const OcTest = () => {
  // https://github.com/google/model-viewer/discussions/2877
  useEffect(() => {
    console.log('Before import model-viewer');
    import('@google/model-viewer').catch(console.error);
    console.log('After import model-viewer');
  }, []);

  const [modelUrl, setModelUrl] = useState<string | null>(null);

  useEffect(() => {
    console.log('Before initOpenCascade() call');
    initOpenCascade().then((oc) => {
      console.log('Starting Processing after initOpenCascade() call');
      const sphere = new oc.BRepPrimAPI_MakeSphere_1(1);

      // Take shape and subtract a translated and scaled sphere from it
      const makeCut = (shape: TopoDS_Shape, translation: [number, number, number], scale: number) => {
        const tf = new oc.gp_Trsf_1();
        tf.SetTranslation_1(new oc.gp_Vec_4(translation[0], translation[1], translation[2]));
        tf.SetScaleFactor(scale);
        const loc = new oc.TopLoc_Location_2(tf);

        const cut = new oc.BRepAlgoAPI_Cut_3(shape, sphere.Shape().Moved(loc, false), new oc.Message_ProgressRange_1());
        cut.Build(new oc.Message_ProgressRange_1());

        return cut.Shape();
      };

      // Let's make some cuts
      const cut1 = makeCut(sphere.Shape(), [0, 0, 0.7], 1);
      const cut2 = makeCut(cut1, [0, 0, -0.7], 1);
      const cut3 = makeCut(cut2, [0, 0.25, 1.75], 1.825);
      const cut4 = makeCut(cut3, [4.8, 0, 0], 5);

      // Rotate around the Z axis
      const makeRotation = (rotation: number) => {
        const tf = new oc.gp_Trsf_1();
        tf.SetRotation_1(new oc.gp_Ax1_2(new oc.gp_Pnt_1(), new oc.gp_Dir_4(0, 0, 1)), rotation);
        const loc = new oc.TopLoc_Location_2(tf);
        return loc;
      };

      // Combine the result
      const fuse = new oc.BRepAlgoAPI_Fuse_3(
        cut4,
        cut4.Moved(makeRotation(Math.PI), false),
        new oc.Message_ProgressRange_1()
      );
      fuse.Build(new oc.Message_ProgressRange_1());
      const result = fuse.Shape().Moved(makeRotation((-30 * Math.PI) / 180), false);

      setModelUrl(visualizeShapes(oc, result));
      console.log('Model Url set');
    });
  }, []);

  useEffect(() => {
    console.log('Model URL = ' + modelUrl);
  }, [modelUrl]);

  return modelUrl === null ? 'Loading...' : <model-viewer class="viewport" src={modelUrl} camera-controls />;
};

export default OcTest;
