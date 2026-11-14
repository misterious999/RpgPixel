import * as THREE from 'three';
import { Player } from '../entities/Player.ts';
import { Monster } from '../entities/Monster.ts';
import { Chest } from '../world/Chest.ts';
import { WorldItem } from '../world/WorldItem.ts';

export class Billboard3D {
  public group: THREE.Group = new THREE.Group();

  // Player Billboard
  private playerMesh: THREE.Mesh;
  private playerCanvas: HTMLCanvasElement;
  private playerCtx: CanvasRenderingContext2D;
  private playerTexture: THREE.CanvasTexture;

  // Monster Pool
  private monsterMeshes: Map<Monster, { mesh: THREE.Mesh; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture }> = new Map();

  // Chest Pool
  private chestMeshes: Map<Chest, { mesh: THREE.Mesh; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture }> = new Map();

  // Item Pool
  private itemMeshes: Map<WorldItem, { mesh: THREE.Mesh; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture }> = new Map();

  // NPC Pool
  private npcMeshes: Map<any, { mesh: THREE.Mesh; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: THREE.CanvasTexture }> = new Map();

  constructor(scene: THREE.Scene) {
    // Siapkan Canvas Offscreen untuk Pemain
    this.playerCanvas = document.createElement('canvas');
    this.playerCanvas.width = 64;
    this.playerCanvas.height = 64;
    this.playerCtx = this.playerCanvas.getContext('2d')!;

    this.playerTexture = new THREE.CanvasTexture(this.playerCanvas);
    this.playerTexture.magFilter = THREE.NearestFilter;
    this.playerTexture.minFilter = THREE.NearestFilter;

    // Plane tegak lurus vertikal
    const playerGeo = new THREE.PlaneGeometry(1.3, 1.3);
    const playerMat = new THREE.MeshStandardMaterial({
      map: this.playerTexture,
      transparent: true,
      alphaTest: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    this.playerMesh = new THREE.Mesh(playerGeo, playerMat);
    this.playerMesh.castShadow = true;
    this.playerMesh.receiveShadow = false;
    this.playerMesh.position.set(0, 0.65, 0);

    this.group.add(this.playerMesh);
    scene.add(this.group);
  }

  /**
   * Update Player Billboard
   */
  public updatePlayer(player: Player, camera: THREE.Camera): void {
    const tileX = (player.x + player.width / 2) / 32;
    const tileZ = (player.y + player.height / 2) / 32;

    this.playerMesh.position.set(tileX, 0.65, tileZ);

    // Hadapkan billboard ke arah sudut pandang kamera horizontal
    this.playerMesh.quaternion.copy(camera.quaternion);

    // Render animasi player ke canvas offscreen
    const ctx = this.playerCtx;
    ctx.clearRect(0, 0, 64, 64);

    ctx.save();
    // Simpan posisi asli pemain, render pada posisi pusat (16, 16)
    const originalX = player.x;
    const originalY = player.y;
    player.x = 16;
    player.y = 16;

    player.render(ctx);

    player.x = originalX;
    player.y = originalY;
    ctx.restore();

    this.playerTexture.needsUpdate = true;
  }

  /**
   * Update Monster Billboards
   */
  public updateMonsters(monsters: Monster[], camera: THREE.Camera): void {
    const activeMonsters = new Set(monsters);

    // Hapus monster yang sudah mati/hilang
    this.monsterMeshes.forEach((data, monster) => {
      if (!activeMonsters.has(monster) || monster.isDead) {
        this.group.remove(data.mesh);
        data.mesh.geometry.dispose();
        if (Array.isArray(data.mesh.material)) {
          data.mesh.material.forEach((m) => m.dispose());
        } else {
          data.mesh.material.dispose();
        }
        data.texture.dispose();
        this.monsterMeshes.delete(monster);
      }
    });

    // Update atau buat mesh monster baru
    for (const monster of monsters) {
      if (monster.isDead) continue;

      let entry = this.monsterMeshes.get(monster);
      if (!entry) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const isBoss = monster.tier === 'BOSS';
        const size = isBoss ? 2.2 : 1.3;
        const geo = new THREE.PlaneGeometry(size, size);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.8,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.group.add(mesh);

        entry = { mesh, canvas, ctx, texture };
        this.monsterMeshes.set(monster, entry);
      }

      const tileX = (monster.x + monster.width / 2) / 32;
      const tileZ = (monster.y + monster.height / 2) / 32;
      const heightOffset = monster.tier === 'BOSS' ? 1.1 : 0.65;

      entry.mesh.position.set(tileX, heightOffset, tileZ);
      entry.mesh.quaternion.copy(camera.quaternion);

      // Render monster sprite ke canvas offscreen
      const ctx = entry.ctx;
      ctx.clearRect(0, 0, 64, 64);
      ctx.save();
      const origX = monster.x;
      const origY = monster.y;
      monster.x = 16;
      monster.y = 16;

      monster.render(ctx);

      monster.x = origX;
      monster.y = origY;
      ctx.restore();

      entry.texture.needsUpdate = true;
    }
  }

  /**
   * Update Chest Billboards
   */
  public updateChests(chests: Chest[], camera: THREE.Camera): void {
    const activeChests = new Set(chests);

    this.chestMeshes.forEach((data, chest) => {
      if (!activeChests.has(chest)) {
        this.group.remove(data.mesh);
        data.mesh.geometry.dispose();
        if (Array.isArray(data.mesh.material)) {
          data.mesh.material.forEach((m) => m.dispose());
        } else {
          data.mesh.material.dispose();
        }
        data.texture.dispose();
        this.chestMeshes.delete(chest);
      }
    });

    for (const chest of chests) {
      let entry = this.chestMeshes.get(chest);
      if (!entry) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d')!;

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const geo = new THREE.PlaneGeometry(1.0, 1.0);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.8,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.group.add(mesh);

        entry = { mesh, canvas, ctx, texture };
        this.chestMeshes.set(chest, entry);
      }

      const tileX = (chest.x + chest.width / 2) / 32;
      const tileZ = (chest.y + chest.height / 2) / 32;
      entry.mesh.position.set(tileX, 0.45, tileZ);
      entry.mesh.quaternion.copy(camera.quaternion);

      const ctx = entry.ctx;
      ctx.clearRect(0, 0, 48, 48);
      ctx.save();
      const origX = chest.x;
      const origY = chest.y;
      chest.x = 8;
      chest.y = 8;
      chest.render(ctx, false, false);
      chest.x = origX;
      chest.y = origY;
      ctx.restore();

      entry.texture.needsUpdate = true;
    }
  }

  /**
   * Update World Item Billboards (Loot drop)
   */
  public updateItems(items: WorldItem[], camera: THREE.Camera): void {
    const activeItems = new Set(items);

    this.itemMeshes.forEach((data, item) => {
      if (!activeItems.has(item)) {
        this.group.remove(data.mesh);
        data.mesh.geometry.dispose();
        if (Array.isArray(data.mesh.material)) {
          data.mesh.material.forEach((m) => m.dispose());
        } else {
          data.mesh.material.dispose();
        }
        data.texture.dispose();
        this.itemMeshes.delete(item);
      }
    });

    for (const item of items) {
      let entry = this.itemMeshes.get(item);
      if (!entry) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const geo = new THREE.PlaneGeometry(0.7, 0.7);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.6,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.group.add(mesh);

        entry = { mesh, canvas, ctx, texture };
        this.itemMeshes.set(item, entry);
      }

      const tileX = (item.x + item.width / 2) / 32;
      const tileZ = (item.y + item.height / 2) / 32;
      entry.mesh.position.set(tileX, 0.35, tileZ);
      entry.mesh.quaternion.copy(camera.quaternion);

      const ctx = entry.ctx;
      ctx.clearRect(0, 0, 32, 32);
      ctx.save();
      const origX = item.x;
      const origY = item.y;
      item.x = 4;
      item.y = 4;
      item.render(ctx);
      item.x = origX;
      item.y = origY;
      ctx.restore();

      entry.texture.needsUpdate = true;
    }
  }

  /**
   * Update NPC Billboards (Warga desa, guild master, pandai besi, badui gurun)
   */
  public updateNPCs(npcs: any[], camera: THREE.Camera): void {
    const active = new Set(npcs);

    this.npcMeshes.forEach((data, npc) => {
      if (!active.has(npc)) {
        this.group.remove(data.mesh);
        data.mesh.geometry.dispose();
        data.texture.dispose();
        this.npcMeshes.delete(npc);
      }
    });

    for (const npc of npcs) {
      let entry = this.npcMeshes.get(npc);
      if (!entry) {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d')!;

        const texture = new THREE.CanvasTexture(canvas);
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;

        const geo = new THREE.PlaneGeometry(1.2, 1.2);
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.1,
          roughness: 0.8,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        this.group.add(mesh);

        // Gambar sprite NPC
        ctx.clearRect(0, 0, 48, 48);
        if (npc.isCat) {
          ctx.fillStyle = npc.hairColor || '#f97316';
          ctx.fillRect(16, 24, 14, 8);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(18, 26, 8, 5);
          ctx.fillStyle = npc.hairColor || '#f97316';
          ctx.fillRect(26, 20, 8, 8);
          ctx.fillRect(26, 18, 3, 3);
          ctx.fillRect(31, 18, 3, 3);
        } else {
          // Kaki
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(18, 34, 4, 6);
          ctx.fillRect(26, 34, 4, 6);
          // Badan
          ctx.fillStyle = npc.outfitColor || '#3b82f6';
          ctx.fillRect(16, 20, 16, 14);
          // Kepala
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(18, 12, 12, 10);
          // Rambut
          ctx.fillStyle = npc.hairColor || '#78350f';
          ctx.fillRect(17, 10, 14, 6);
        }
        texture.needsUpdate = true;

        entry = { mesh, canvas, ctx, texture };
        this.npcMeshes.set(npc, entry);
      }

      const tileX = (npc.x + 16) / 32;
      const tileZ = (npc.y + 16) / 32;
      entry.mesh.position.set(tileX, 0.6, tileZ);
      entry.mesh.quaternion.copy(camera.quaternion);
    }
  }

  public clearAll(): void {
    this.npcMeshes.forEach((data) => {
      this.group.remove(data.mesh);
      data.mesh.geometry.dispose();
      data.texture.dispose();
    });
    this.npcMeshes.clear();

    this.monsterMeshes.forEach((data) => {
      this.group.remove(data.mesh);
      data.mesh.geometry.dispose();
      data.texture.dispose();
    });
    this.monsterMeshes.clear();

    this.chestMeshes.forEach((data) => {
      this.group.remove(data.mesh);
      data.mesh.geometry.dispose();
      data.texture.dispose();
    });
    this.chestMeshes.clear();

    this.itemMeshes.forEach((data) => {
      this.group.remove(data.mesh);
      data.mesh.geometry.dispose();
      data.texture.dispose();
    });
    this.itemMeshes.clear();
  }
}
