export type RenderMode = '2D' | 'HD3D';

export interface HD3DSettings {
  mode: RenderMode;
  cameraFov: number;
  cameraAngle: number; // Pitch in degrees (e.g., 52)
  cameraDistance: number;
  shadowsEnabled: boolean;
  waterWaveSpeed: number;
  tiltShiftEnabled: boolean;
}

export const DEFAULT_HD3D_SETTINGS: HD3DSettings = {
  mode: '2D', // Default to rock-solid 2D Klasik mode
  cameraFov: 45,
  cameraAngle: 50,
  cameraDistance: 17,
  shadowsEnabled: true,
  waterWaveSpeed: 1.5,
  tiltShiftEnabled: true,
};
