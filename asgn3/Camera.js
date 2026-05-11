"use strict";

class Camera {
    constructor() {
        this.fov = 90;
        this.eye = new Vector3([0, 0, 0]);
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);

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

    moveForward(speed = 0.1) {
        this._f.set(this.at).sub(this.eye).normalize().mul(speed);
        this.eye.add(this._f);
        this.at.add(this._f);
        this.updateViewMatrix();
    }

    moveBackward(speed = 0.1) {
        this._f.set(this.eye).sub(this.at).normalize().mul(speed);
        this.eye.add(this._f);
        this.at.add(this._f);
        this.updateViewMatrix();
    }

    moveLeft(speed = 0.1) {
        this._f.set(this.at).sub(this.eye).normalize();
        // TODO: maybe avoid memory
        this._s = Vector3.cross(this.up, this._f);
        this._s.normalize().mul(speed);
        this.eye.add(this._s);
        this.at.add(this._s);
        this.updateViewMatrix();
    }

    moveRight(speed = 0.1) {
        this._f.set(this.at).sub(this.eye).normalize();
        // TODO: maybe avoid memory
        this._s = Vector3.cross(this._f, this.up);
        this._s.normalize().mul(speed);
        this.eye.add(this._s);
        this.at.add(this._s);
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
}
