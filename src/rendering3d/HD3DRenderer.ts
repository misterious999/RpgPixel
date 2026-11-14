import * as THREE from 'three';
import { RenderMode, DEFAULT_HD3D_SETTINGS, HD3DSettings } from './HD3DTypes.ts';
import { Camera3D } from './Camera3D.ts';
import { Lighting3D } from './Lighting3D.ts';
import { Terrain3D } from './Terrain3D.ts';
import { Billboard3D } from './Billboard3D.ts';
import { Player } from '../entities/Player.ts';
import { Monster } from '../entities/Monster.ts';
import { Chest } from '../world/Chest.ts';
import { WorldItem } from '../world/WorldItem.ts';
import { TileMap } from '../world/TileMap.ts';
import { ContinentValoria } from '../world/ContinentValoria.ts';
import { TimeWeatherEngine } from '../world/TimeWeatherEngine.ts';

export class HD3DRenderer {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera3D: Camera3D;
  public lighting3D: Lighting3D;
  public terrain3D: Terrain3D;
  public billboard3D: Billboard3D;
  public settings: HD3DSettings;

  private isInitialized: boolean = false;
  private currentMap: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.settings = { ...DEFAULT_HD3D_SETTINGS };

    // Selalu pastikan game membuka mode 2D Klasik secara default agar seluruh bangunan, pintu & skill tampil utuh
    this.settings.mode = '2D';
    localStorage.setItem('rpg2d_render_mode', '2D');

    // 1. Inisialisasi WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false, // Pertahankan estetika pixel-art otentik
      powerPreference: 'high-performance',
      alpha: false,
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Aktifkan bayangan PCF lembut real-time
    this.renderer.shadowMap.enabled = this.settings.shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // 2. Inisialisasi Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x1e293b, 0.012);

    // 3. Sub-sistem Kamera, Pencahayaan, Terrain & Billboard
    this.camera3D = new Camera3D(window.innerWidth, window.innerHeight);
    this.lighting3D = new Lighting3D(this.scene);
    this.terrain3D = new Terrain3D(this.scene);
    this.billboard3D = new Billboard3D(this.scene);

    this.isInitialized = true;
    this.applyCanvasVisibility();
  }

  public setMode(mode: RenderMode): void {
    this.settings.mode = mode;
    localStorage.setItem('rpg2d_render_mode', mode);
    this.applyCanvasVisibility();
  }

  public toggleMode(): RenderMode {
    const nextMode = this.settings.mode === 'HD3D' ? '2D' : 'HD3D';
    this.setMode(nextMode);
    return nextMode;
  }

  public isHD3D(): boolean {
    return this.settings.mode === 'HD3D';
  }

  private applyCanvasVisibility(): void {
    if (this.settings.mode === 'HD3D') {
      this.canvas.style.display = 'block';
    } else {
      this.canvas.style.display = 'none';
    }
  }

  public resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.camera3D.resize(width, height);
  }

  /**
   * Render frame 3D
   */
  public render(
    player: Player,
    currentMap: string,
    tileMap: TileMap,
    valoria: ContinentValoria,
    timeWeather: TimeWeatherEngine,
    monsters: Monster[],
    chests: Chest[],
    items: WorldItem[],
    npcs: any[] = [],
    dungeonLayout?: number[][],
    dungeonTheme?: string
  ): void {
    if (!this.isInitialized || this.settings.mode !== 'HD3D') return;

    const playerTileX = (player.x + player.width / 2) / 32;
    const playerTileZ = (player.y + player.height / 2) / 32;

    // 1. Periksa apakah map berganti, bangun ulang terrain jika perlu
    if (this.currentMap !== currentMap) {
      this.currentMap = currentMap;
      this.billboard3D.clearAll();

      if (currentMap === 'OVERWORLD') {
        this.terrain3D.buildOverworld(tileMap);
      } else if (currentMap === 'CONTINENT_VALORIA') {
        this.terrain3D.buildValoria(valoria);
      } else if (dungeonLayout && dungeonTheme) {
        this.terrain3D.buildDungeon(dungeonLayout, dungeonTheme);
      }

      this.camera3D.updatePositionImmediate(playerTileX, playerTileZ);
    }

    const isDungeon = currentMap.startsWith('DUNGEON');

    // 2. Update Kamera 3D
    this.camera3D.update(playerTileX, playerTileZ);

    // 3. Update Pencahayaan 3D (Matahari, Ambient, Bayangan dinamis)
    this.lighting3D.update(
      timeWeather,
      playerTileX,
      playerTileZ,
      isDungeon,
      timeWeather.currentWeather
    );

    // 4. Update Warna Kabut Atmosfer
    if (isDungeon) {
      (this.scene.fog as THREE.FogExp2).density = 0.025;
      (this.scene.fog as THREE.FogExp2).color.setHex(0x0a0e17);
    } else if (timeWeather.currentWeather === 'FOG') {
      (this.scene.fog as THREE.FogExp2).density = 0.035;
      (this.scene.fog as THREE.FogExp2).color.setHex(0xcbd5e1);
    } else if (timeWeather.currentWeather === 'RAIN') {
      (this.scene.fog as THREE.FogExp2).density = 0.018;
      (this.scene.fog as THREE.FogExp2).color.setHex(0x334155);
    } else {
      (this.scene.fog as THREE.FogExp2).density = 0.008;
      (this.scene.fog as THREE.FogExp2).color.setHex(0x0f172a);
    }

    // 5. Update Entity Billboard (Player, Monster, Peti, Drop Item)
    this.billboard3D.updatePlayer(player, this.camera3D.camera);
    this.billboard3D.updateMonsters(monsters, this.camera3D.camera);
    this.billboard3D.updateChests(chests, this.camera3D.camera);
    this.billboard3D.updateItems(items, this.camera3D.camera);
    this.billboard3D.updateNPCs(npcs, this.camera3D.camera);

    // 6. Gambar frame 3D ke WebGL canvas
    this.renderer.render(this.scene, this.camera3D.camera);
  }
}
