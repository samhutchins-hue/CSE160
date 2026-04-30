function makeBird(x, y, z) {
  return {
    rootM: new Matrix4().setIdentity().translate(x, y, z),
    tilt: 0,
    side: 0,
    shoulderL: 0,
    elbowL: 0,
    wristL: 0,
    shoulderR: 0,
    elbowR: 0,
    wristR: 0,
  };
}

const bird1 = makeBird(0, 0, 0);
const bird2 = makeBird(0, 0, 0);

function drawWing(rootM, shoulderRot, elbowRot, wristRot) {
  // upper wing
  g_jointM.set(rootM).translate(-0.25, 0.3, 0.25).rotate(shoulderRot, 0, 0, 1);
  g_scratchM.set(g_jointM).scale(0.1, 0.4, 0.4).translate(-0.5, -1, -0.5);
  drawCube(g_scratchM, blue);

  //forearm
  g_jointM.translate(0, -0.4, 0).rotate(elbowRot, 0, 0, 1);
  g_scratchM.set(g_jointM).scale(0.1, 0.3, 0.4).translate(-0.5, -1, -0.5);
  drawCube(g_scratchM, blue);

  // hand/tip
  g_jointM.translate(0, -0.3, 0).rotate(wristRot, 0, 0, 1);
  g_scratchM.set(g_jointM).scale(0.12, 0.15, 0.4).translate(-0.5, -1, -0.5);
  drawCube(g_scratchM, blue);
}

function drawBird(
  rootM,
  tilt,
  side,
  shoulderL,
  elbowL,
  wristL,
  shoulderR,
  elbowR,
  wristR,
) {
  g_bodyM
    .set(rootM)
    .translate(0, -0.6, 0)
    .rotate(tilt, 1, 0, 0)
    .rotate(side, 0, 0, 1)
    .translate(0, 0.6, 0);

  // main body
  g_scratchM.set(g_bodyM).translate(-0.25, -0.5, 0.0).scale(0.5, 0.8, 0.5);
  drawCube(g_scratchM, blue);

  // head
  g_scratchM.set(g_bodyM).translate(-0.25, 0.1, 0).scale(0.5, 0.5, 0.5);
  drawCube(g_scratchM, blue);

  // front detail
  g_scratchM.set(g_bodyM).translate(-0.2, -0.55, -0.1).scale(0.4, 0.9, 0.15);
  drawCube(g_scratchM, white);

  // face
  g_scratchM.set(g_bodyM).translate(-0.15, 0.1, -0.08).scale(0.3, 0.38, 0.12);
  drawCube(g_scratchM, white);

  // left eye
  g_scratchM.set(g_bodyM).translate(-0.14, 0.3, -0.12).scale(0.1, 0.1, 0.03);
  drawCube(g_scratchM, darkEye);

  // left eye pupil
  g_scratchM.set(g_bodyM).translate(-0.14, 0.35, -0.13).scale(0.04, 0.04, 0.02);
  drawCube(g_scratchM, white);

  // right eye
  g_scratchM.set(g_bodyM).translate(0.04, 0.3, -0.12).scale(0.1, 0.1, 0.03);
  drawCube(g_scratchM, darkEye);

  // right eye pupil
  g_scratchM.set(g_bodyM).translate(0.04, 0.35, -0.13).scale(0.04, 0.04, 0.02);
  drawCube(g_scratchM, white);

  // beak
  drawCone(
    g_scratchM
      .set(g_bodyM)
      .translate(0, 0.3, -0.08)
      .rotate(-90, 1, 0, 0)
      .scale(0.1, 0.25, 0.05)
      .translate(-0.5, 0, -0.5),
    yellow,
  );

  drawWing(g_bodyM, shoulderL, elbowL, wristL);
  g_rightWingRootM.set(g_bodyM).scale(-1, 1, 1);
  drawWing(g_rightWingRootM, -shoulderR, -elbowR, -wristR);

  // left foot
  g_scratchM
    .set(g_bodyM)
    .rotate(g_globalRot / 10, 1, 0, 0)
    .translate(-0.2, -0.6, -0.2)
    .scale(0.15, 0.08, 0.25);
  drawCube(g_scratchM, yellow);

  // right foot
  g_scratchM
    .set(g_bodyM)
    .rotate(g_globalRot / 10, 1, 0, 0)
    .translate(0.05, -0.6, -0.2)
    .scale(0.15, 0.08, 0.25);
  drawCube(g_scratchM, yellow);
}
