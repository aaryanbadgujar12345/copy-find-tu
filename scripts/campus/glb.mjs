import { Document, NodeIO } from "@gltf-transform/core";
import { meshopt, quantize, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

/** Write named meshes as one compressed GLB. Each mesh is a node of the same name. */
export async function writeGlb(meshes, file) {
  const doc = new Document();
  doc.createBuffer();
  const scene = doc.createScene("campus");
  const buffer = doc.getRoot().listBuffers()[0];
  for (const { name, mesh } of meshes) {
    if (!mesh.indices.length) continue;
    const accessor = (type, array) =>
      doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
    const prim = doc
      .createPrimitive()
      .setAttribute(
        "POSITION",
        accessor("VEC3", new Float32Array(mesh.positions)),
      )
      .setAttribute("NORMAL", accessor("VEC3", new Float32Array(mesh.normals)))
      .setIndices(accessor("SCALAR", new Uint32Array(mesh.indices)));
    const material = doc.createMaterial(name);
    prim.setMaterial(material);
    scene.addChild(
      doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(prim)),
    );
  }
  await MeshoptEncoder.ready;
  await doc.transform(
    weld(),
    quantize({ quantizePosition: 16, quantizeNormal: 8 }),
    meshopt({ encoder: MeshoptEncoder, level: "medium" }),
  );
  const io = new NodeIO()
    .registerExtensions(
      doc
        .getRoot()
        .listExtensionsUsed()
        .map((ext) => ext.constructor),
    )
    .registerDependencies({ "meshopt.encoder": MeshoptEncoder });
  await io.write(file, doc);
}
