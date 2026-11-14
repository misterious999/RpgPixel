import * as THREE from 'three';

export class Camera3D {
  public camera: THREE.PerspectiveCamera;
  public targetPosition: THREE.Vector3 = new THREE.Vector3();
  public pitchAngle: number = 52; // Sudut kemiringan kamera dalam derajat
  public distance: number = 18; // Jarak kamera dari target
  private lookAtTarget: THREE.Vector3 = new THREE.Vector3();

  constructor(width: number, height: number) {
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    this.updatePositionImmediate(50, 50);
  }

  public resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public update(targetX: number, targetZ: number, lerpFactor: number = 0.12): void {
    this.targetPosition.set(targetX, 0.4, targetZ);

    // Hitung posisi kamera berdasarkan sudut kemiringan (pitch)
    const pitchRad = (this.pitchAngle * Math.PI) / 180;
    const offsetY = Math.sin(pitchRad) * this.distance;
    const offsetZ = Math.cos(pitchRad) * this.distance;

    const desiredCamX = this.targetPosition.x;
    const desiredCamY = this.targetPosition.y + offsetY;
    const desiredCamZ = this.targetPosition.z + offsetZ;

    // Smooth Lerp tracking agar transisi kamera halus
    this.camera.position.x += (desiredCamX - this.camera.position.x) * lerpFactor;
    this.camera.position.y += (desiredCamY - this.camera.position.y) * lerpFactor;
    this.camera.position.z += (desiredCamZ - this.camera.position.z) * lerpFactor;

    this.lookAtTarget.x += (this.targetPosition.x - this.lookAtTarget.x) * lerpFactor;
    this.lookAtTarget.y += (this.targetPosition.y - this.lookAtTarget.y) * lerpFactor;
    this.lookAtTarget.z += (this.targetPosition.z - this.lookAtTarget.z) * lerpFactor;

    this.camera.lookAt(this.lookAtTarget);
  }

  public updatePositionImmediate(targetX: number, targetZ: number): void {
    this.targetPosition.set(targetX, 0.4, targetZ);
    this.lookAtTarget.copy(this.targetPosition);

    const pitchRad = (this.pitchAngle * Math.PI) / 180;
    const offsetY = Math.sin(pitchRad) * this.distance;
    const offsetZ = Math.cos(pitchRad) * this.distance;

    this.camera.position.set(targetX, offsetY, targetZ + offsetZ);
    this.camera.lookAt(this.lookAtTarget);
  }
}
