let g_coneBuffer = null;
let g_coneVertexCount = 0;

function initConeBuffer(slices = 30) {
  const verts = generateConeVertices(slices);
  g_coneVertexCount = verts.length / 3;

  g_coneBuffer = gl.createBuffer();
  if (!g_coneBuffer) {
    console.log("Failed to create the cone buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, g_coneBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
}

function generateConeVertices(slices) {
  const v = [];
  const r = 0.5;
  const apex = [0.5, 1.0, 0.5];
  const center = [0.5, 0.0, 0.5];
  const step = (2 * Math.PI) / slices;

  for (let i = 0; i < slices; i++) {
    const a1 = i * step;
    const a2 = (i + 1) * step;
    const b1 = [0.5 + Math.cos(a1) * r, 0, 0.5 + Math.sin(a1) * r];
    const b2 = [0.5 + Math.cos(a2) * r, 0, 0.5 + Math.sin(a2) * r];

    // side
    v.push(...apex, ...b1, ...b2);
    // bottom
    v.push(...center, ...b2, ...b1);
  }
  return v;
}

function drawCone(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, g_coneBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.uniform4fv(u_FragColor, color);
  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.drawArrays(gl.TRIANGLES, 0, g_coneVertexCount);
}
