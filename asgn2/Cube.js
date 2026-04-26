// Create a cube buffer object
let g_cubeBuffer = null;

function initCubeBuffer() {
  g_cubeBuffer = gl.createBuffer();
  if (!g_cubeBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }
  // TODO trying to improve performance while maintaining useability
  // need to rebind the vertexAttribPointer, and buffer in cube render() function
  // to allow custom buffers if necessary through drawTriangle3D
  gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1,
      0, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1,
      0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0,
      0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0,
      0, 0, 0, 0, 1, 1, 0, 1,
    ]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
}

class Cube {
  constructor() {
    this.type = "cube";
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.matrix = new Matrix4();
  }
  render() {
    let rgba = this.color;

    gl.bindBuffer(gl.ARRAY_BUFFER, g_cubeBuffer);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // // front of cube
    // // 000 110 100
    // // 000 010 110
    // drawTriangle3D([0, 0, 0, 1, 1, 0, 1, 0, 0])
    // drawTriangle3D([0, 0, 0, 0, 1, 0, 1, 1, 0])
    //
    // // back of cube
    // // 001 111 101
    // // 001 011 111
    // drawTriangle3D([0, 0, 1, 1, 1, 1, 1, 0, 1])
    // drawTriangle3D([0, 0, 1, 0, 1, 1, 1, 1, 1])
    //
    // gl.uniform4f(
    //   u_FragColor,
    //   rgba[0] * 0.6,
    //   rgba[1] * 0.6,
    //   rgba[2] * 0.6,
    //   rgba[3],
    // )
    // // left side of cube
    // drawTriangle3D([0, 0, 0, 0, 1, 1, 0, 0, 1])
    // drawTriangle3D([0, 0, 0, 0, 1, 0, 0, 1, 1])
    //
    // // right side of cube
    // drawTriangle3D([1, 0, 0, 1, 0, 1, 1, 1, 1])
    // drawTriangle3D([1, 0, 0, 1, 1, 0, 1, 1, 1])
    //
    // gl.uniform4f(
    //   u_FragColor,
    //   rgba[0] * 0.9,
    //   rgba[1] * 0.9,
    //   rgba[2] * 0.9,
    //   rgba[3],
    // )
    //
    // // top of cube
    // // 000 110 100
    // // 000 010 110
    // drawTriangle3D([0, 1, 0, 0, 1, 1, 1, 1, 1])
    // drawTriangle3D([0, 1, 0, 1, 1, 1, 1, 1, 0])
    //
    // gl.uniform4f(
    //   u_FragColor,
    //   rgba[0] * 0.7,
    //   rgba[1] * 0.7,
    //   rgba[2] * 0.7,
    //   rgba[3],
    // )
    // // bottom of cube
    // // 000 100 101
    // // 000 001 101
    // drawTriangle3D([0, 0, 0, 1, 0, 0, 1, 0, 1])
    // drawTriangle3D([0, 0, 0, 0, 0, 1, 1, 0, 1])
  }
}
