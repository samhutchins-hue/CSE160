"use strict";

class Camera {
    constructor() {
        this.fov = 90;
        // TODO: remove
        this.eye = new Vector3([1.5, 1.8, 1.5]);
        this.at = new Vector3([1.5, 1.8, 2.5]);
        this.up = new Vector3([0, 1, 0]);
        this.collisionOn = true;
        this.noclipOn = false;

        this.viewMatrix = new Matrix4();
        this.viewMatrix.setLookAt(
            this.eye.elements[0],
            this.eye.elements[1],
            this.eye.elements[2],
            this.at.elements[0],
            this.at.elements[1],
            this.at.elements[2],
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2],
        );

        this.projectionMatrix = new Matrix4();
        this.projectionMatrix.setPerspective(
            this.fov,
            canvas.width / canvas.height,
            0.1,
            1000,
        );

        this._f = new Vector3();
        this._s = new Vector3();
        this._rotM = new Matrix4();

        this.updateViewMatrix();
    }

    updateEye(x, y, z) {
        this.eye.elements[0] = x;
        this.eye.elements[1] = y;
        this.eye.elements[2] = z;
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(
            this.eye.elements[0],
            this.eye.elements[1],
            this.eye.elements[2],
            this.at.elements[0],
            this.at.elements[1],
            this.at.elements[2],
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2],
        );
        gl.uniformMatrix4fv(u_ViewMatrix, false, this.viewMatrix.elements);
    }

    calculatePlayerBox() {
        const playerMin = new Vector3([
            this.eye.elements[0] - 0.3,
            this.eye.elements[1] - 1.8,
            this.eye.elements[2] - 0.3,
        ]);
        const playerMax = new Vector3([
            this.eye.elements[0] + 0.3,
            this.eye.elements[1] + 0.1,
            this.eye.elements[2] + 0.3,
        ]);
        return [playerMin, playerMax];
    }

    collidesWithWorld() {
        const [playerMin, playerMax] = this.calculatePlayerBox();
        for (let i = 0; i < g_map.length; ++i) {
            for (let j = 0; j < g_map.length; ++j) {
                const height = g_map[i][j];
                if (height > 0) {
                    const overlapsX =
                        playerMax.elements[0] > i &&
                        playerMin.elements[0] < i + 1;
                    const overlapsY =
                        playerMax.elements[1] > 0 &&
                        playerMin.elements[1] < height;
                    const overlapsZ =
                        playerMax.elements[2] > j &&
                        playerMin.elements[2] < j + 1;
                    if (
                        overlapsX &&
                        overlapsY &&
                        overlapsZ &&
                        this.collisionOn
                    ) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    moveForward(speed = 0.1) {
        // this._f.set(this.at).sub(this.eye).normalize().mul(speed);
        // zero out y component
        if (!this.noclipOn) {
            // not possible to extract becaues of this?
            this._f.set(this.at).sub(this.eye);
            this._f.elements[1] = 0;
            this._f.normalize().mul(speed);
            // check for collision in x
            this.eye.elements[0] += this._f.elements[0];
            this.at.elements[0] += this._f.elements[0];
            if (this.collidesWithWorld()) {
                debugLog("collision x");
                this.eye.elements[0] -= this._f.elements[0];
                this.at.elements[0] -= this._f.elements[0];
            }

            // check for collision in z
            this.eye.elements[2] += this._f.elements[2];
            this.at.elements[2] += this._f.elements[2];
            if (this.collidesWithWorld()) {
                debugLog("collision z");
                this.eye.elements[2] -= this._f.elements[2];
                this.at.elements[2] -= this._f.elements[2];
            }
        } else {
            this._f.set(this.at).sub(this.eye).normalize().mul(speed);
            this.eye.add(this._f);
            this.at.add(this._f);
        }

        this.updateViewMatrix();
    }

    moveBackward(speed = 0.1) {
        // this._f.set(this.eye).sub(this.at).normalize().mul(speed);

        // zero out y component
        if (!this.noclipOn) {
            this._f.set(this.eye).sub(this.at);
            this._f.elements[1] = 0;
            this._f.normalize().mul(speed);
            // check for collision in x
            this.eye.elements[0] += this._f.elements[0];
            this.at.elements[0] += this._f.elements[0];
            if (this.collidesWithWorld()) {
                this.eye.elements[0] -= this._f.elements[0];
                this.at.elements[0] -= this._f.elements[0];
            }
            // check for collision in z
            this.eye.elements[2] += this._f.elements[2];
            this.at.elements[2] += this._f.elements[2];
            if (this.collidesWithWorld()) {
                this.eye.elements[2] -= this._f.elements[2];
                this.at.elements[2] -= this._f.elements[2];
            }
        } else {
            this._f.set(this.eye).sub(this.at).normalize().mul(speed);
            this.eye.add(this._f);
            this.at.add(this._f);
        }

        this.updateViewMatrix();
    }

    moveLeft(speed = 0.1) {
        this._f.set(this.at).sub(this.eye).normalize();
        // TODO: maybe avoid memory
        this._s = Vector3.cross(this.up, this._f);
        this._s.normalize().mul(speed);

        // check for collision in x
        this.eye.elements[0] += this._s.elements[0];
        this.at.elements[0] += this._s.elements[0];
        if (this.collidesWithWorld()) {
            this.eye.elements[0] -= this._s.elements[0];
            this.at.elements[0] -= this._s.elements[0];
        }
        // check for collision in z
        this.eye.elements[2] += this._s.elements[2];
        this.at.elements[2] += this._s.elements[2];
        if (this.collidesWithWorld()) {
            this.eye.elements[2] -= this._s.elements[2];
            this.at.elements[2] -= this._s.elements[2];
        }

        // this.eye.add(this._s);
        // this.at.add(this._s);
        this.updateViewMatrix();
    }

    moveRight(speed = 0.1) {
        this._f.set(this.at).sub(this.eye).normalize();
        // TODO: maybe avoid memory
        this._s = Vector3.cross(this._f, this.up);
        this._s.normalize().mul(speed);

        // check for collision in x
        this.eye.elements[0] += this._s.elements[0];
        this.at.elements[0] += this._s.elements[0];
        if (this.collidesWithWorld()) {
            this.eye.elements[0] -= this._s.elements[0];
            this.at.elements[0] -= this._s.elements[0];
        }
        // check for collision in z
        this.eye.elements[2] += this._s.elements[2];
        this.at.elements[2] += this._s.elements[2];
        if (this.collidesWithWorld()) {
            this.eye.elements[2] -= this._s.elements[2];
            this.at.elements[2] -= this._s.elements[2];
        }

        // this.eye.add(this._s);
        // this.at.add(this._s);
        this.updateViewMatrix();
    }

    panLeft(alpha = 5) {
        this._f.set(this.at).sub(this.eye);
        this._rotM.setRotate(
            alpha,
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2],
        );
        let f_prime = this._rotM.multiplyVector3(this._f);
        this.at.set(this.eye).add(f_prime);
        this.updateViewMatrix();
    }

    panRight(alpha = 5) {
        this._f.set(this.at).sub(this.eye);
        this._rotM.setRotate(
            -alpha,
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2],
        );
        let f_prime = this._rotM.multiplyVector3(this._f);
        this.at.set(this.eye).add(f_prime);
        this.updateViewMatrix();
    }

    panBy(alpha) {
        this._f.set(this.at).sub(this.eye);
        this._rotM.setRotate(
            alpha,
            this.up.elements[0],
            this.up.elements[1],
            this.up.elements[2],
        );
        let f_prime = this._rotM.multiplyVector3(this._f);
        this.at.set(this.eye).add(f_prime);
        this.updateViewMatrix();
    }
    pitchBy(alpha) {
        this._f.set(this.at).sub(this.eye);
        this._s = Vector3.cross(this._f, this.up);
        this._rotM.setRotate(
            alpha,
            this._s.elements[0],
            this._s.elements[1],
            this._s.elements[2],
        );
        let f_prime = this._rotM.multiplyVector3(this._f);
        this.at.set(this.eye).add(f_prime);
        this.updateViewMatrix();
    }
}
