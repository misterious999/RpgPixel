import * as THREE from 'three';
import { TimeWeatherEngine, WeatherType } from '../world/TimeWeatherEngine.ts';

export class Lighting3D {
  public dirLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  private pointLights: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene) {
    // 1. Directional Light (Matahari / Bulan)
    this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.3);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 70;

    const d = 22;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;

    scene.add(this.dirLight);
    scene.add(this.dirLight.target);

    // 2. Ambient Light (Pencahayaan dasar lembut)
    this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.55);
    scene.add(this.ambientLight);

    // 3. Hemisphere Light (Warna langit vs pantulan tanah)
    this.hemiLight = new THREE.HemisphereLight(0xebf8ff, 0x475569, 0.35);
    scene.add(this.hemiLight);
  }

  public update(
    timeWeather: TimeWeatherEngine,
    playerX: number,
    playerZ: number,
    isDungeon: boolean,
    weather: WeatherType
  ): void {
    // Pusat bayangan mengikuti pemain
    this.dirLight.target.position.set(playerX, 0, playerZ);

    if (isDungeon) {
      // Suasana dungeon redup & misterius
      this.dirLight.intensity = 0.15;
      this.dirLight.color.setHex(0x475569);
      this.ambientLight.intensity = 0.25;
      this.ambientLight.color.setHex(0x1e293b);
      this.hemiLight.intensity = 0.1;
      this.dirLight.position.set(playerX + 5, 15, playerZ + 5);
      return;
    }

    // Hitung posisi matahari berdasarkan jam in-game (0..24)
    const hour = timeWeather.timeOfDay;
    // Pukul 6 = terbit (timur), 12 = atas, 18 = terbenam (barat), malam = bulan
    const sunAngle = ((hour - 6) / 24) * Math.PI * 2;
    const sunDistance = 25;

    const sunX = playerX + Math.cos(sunAngle) * sunDistance;
    const sunY = Math.max(3, Math.sin(sunAngle) * sunDistance + 12);
    const sunZ = playerZ + Math.sin(sunAngle * 0.5) * 12 + 10;

    this.dirLight.position.set(sunX, sunY, sunZ);

    // Penyesuaian warna dan intensitas berdasarkan fase waktu
    if (hour >= 5.5 && hour < 7.5) {
      // Subuh / Fajar: Golden orange sunrise
      this.dirLight.intensity = 0.9;
      this.dirLight.color.setHex(0xffaa55);
      this.ambientLight.intensity = 0.45;
      this.ambientLight.color.setHex(0xffd1b3);
      this.hemiLight.color.setHex(0xffaa77);
    } else if (hour >= 7.5 && hour < 16.5) {
      // Siang Terang: Cahaya putih hangat cerah
      let dayIntensity = 1.35;
      if (weather === 'RAIN') dayIntensity = 0.7;
      if (weather === 'FOG') dayIntensity = 0.85;

      this.dirLight.intensity = dayIntensity;
      this.dirLight.color.setHex(0xfffbf0);
      this.ambientLight.intensity = 0.65;
      this.ambientLight.color.setHex(0xe2e8f0);
      this.hemiLight.color.setHex(0xbae6fd);
    } else if (hour >= 16.5 && hour < 19.0) {
      // Senja / Sunset: Merah lembayung eksotis
      this.dirLight.intensity = 1.0;
      this.dirLight.color.setHex(0xff6622);
      this.ambientLight.intensity = 0.45;
      this.ambientLight.color.setHex(0xfb923c);
      this.hemiLight.color.setHex(0xf472b6);
    } else {
      // Malam / Night: Rembulan biru dingin
      this.dirLight.intensity = 0.45;
      this.dirLight.color.setHex(0x60a5fa);
      this.ambientLight.intensity = 0.35;
      this.ambientLight.color.setHex(0x1e293b);
      this.hemiLight.color.setHex(0x0f172a);
    }
  }

  public addPointLight(scene: THREE.Scene, x: number, y: number, z: number, color: number = 0xffaa33, intensity: number = 2.0, distance: number = 6): THREE.PointLight {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(x, y, z);
    scene.add(light);
    this.pointLights.push(light);
    return light;
  }

  public clearPointLights(scene: THREE.Scene): void {
    for (const light of this.pointLights) {
      scene.remove(light);
      light.dispose();
    }
    this.pointLights = [];
  }
}
