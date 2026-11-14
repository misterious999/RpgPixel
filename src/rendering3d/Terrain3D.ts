import * as THREE from 'three';
import { TileMap, TileType } from '../world/TileMap.ts';
import { ContinentValoria, ValoriaTileType } from '../world/ContinentValoria.ts';
import { TextureAtlas3D } from './TextureAtlas3D.ts';

export class Terrain3D {
  public group: THREE.Group = new THREE.Group();
  private instancedMeshes: THREE.InstancedMesh[] = [];
  private propGroup: THREE.Group = new THREE.Group();
  private currentMapKey: string = '';

  constructor(scene: THREE.Scene) {
    this.group.add(this.propGroup);
    scene.add(this.group);
  }

  public clear(): void {
    for (const mesh of this.instancedMeshes) {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
    this.instancedMeshes = [];

    // Clear props (pohon, bangunan, dll.)
    while (this.propGroup.children.length > 0) {
      const child = this.propGroup.children[0] as THREE.Mesh;
      this.propGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    this.currentMapKey = '';
  }

  /**
   * Membangun dunia 3D untuk Benua Aethelgard (Overworld Utama)
   */
  public buildOverworld(tileMap: TileMap): void {
    if (this.currentMapKey === 'OVERWORLD') return;
    this.clear();
    this.currentMapKey = 'OVERWORLD';

    const width = tileMap.width;
    const height = tileMap.height;

    // Hitung jumlah tile per tipe untuk ukuran InstancedMesh
    const counts = new Map<number, number>();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = tileMap.getTileAt(x, y);
        counts.set(type, (counts.get(type) || 0) + 1);
      }
    }

    // Geometri tile datar (Lantai) dan Balok (Tebing/Dinding)
    const planeGeo = new THREE.BoxGeometry(1, 0.2, 1);
    const cliffGeo = new THREE.BoxGeometry(1, 1.2, 1);

    // Siapkan instanced mesh per tipe
    const meshes = new Map<number, { mesh: THREE.InstancedMesh; idx: number }>();
    const dummy = new THREE.Object3D();

    const getMaterialForTile = (type: TileType): THREE.MeshStandardMaterial => {
      let texName = 'GRASS';
      let roughness = 0.85;
      let metalness = 0.05;

      switch (type) {
        case TileType.GRASS:
        case TileType.GRASS_FLOWERS:
          texName = 'GRASS';
          break;
        case TileType.DIRT_PATH:
          texName = 'DIRT_PATH';
          break;
        case TileType.SAND:
          texName = 'SAND';
          break;
        case TileType.WATER:
          texName = 'WATER';
          roughness = 0.15;
          metalness = 0.3;
          break;
        case TileType.COBBLESTONE:
          texName = 'COBBLESTONE';
          roughness = 0.7;
          break;
        case TileType.WOODEN_DOCK:
          texName = 'WOOD';
          roughness = 0.8;
          break;
        case TileType.CLIFF:
        case TileType.ROCK:
          texName = 'CLIFF';
          roughness = 0.9;
          break;
      }

      const mat = new THREE.MeshStandardMaterial({
        map: TextureAtlas3D.getTexture(texName),
        roughness,
        metalness,
      });

      if (type === TileType.WATER) {
        mat.transparent = true;
        mat.opacity = 0.88;
      }

      return mat;
    };

    // Buat InstancedMesh untuk setiap jenis tile yang ada di peta
    counts.forEach((count, type) => {
      const isBlock = type === TileType.CLIFF || type === TileType.ROCK;
      const geo = isBlock ? cliffGeo : planeGeo;
      const mat = getMaterialForTile(type);
      const instMesh = new THREE.InstancedMesh(geo, mat, count);
      instMesh.castShadow = isBlock;
      instMesh.receiveShadow = true;
      this.group.add(instMesh);
      this.instancedMeshes.push(instMesh);
      meshes.set(type, { mesh: instMesh, idx: 0 });
    });

    // Letakkan setiap tile pada koordinat 3D
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = tileMap.getTileAt(x, y);

        // Jika pohon, taruh tanah rumput di bawahnya dan buat pohon 3D di atasnya
        const actualType = type === TileType.TREE ? TileType.GRASS : type;
        const entry = meshes.get(actualType);

        if (entry) {
          let elevation = 0;
          if (actualType === TileType.WATER) {
            elevation = -0.15;
          } else if (actualType === TileType.CLIFF || actualType === TileType.ROCK) {
            elevation = 0.5;
          } else if (actualType === TileType.COBBLESTONE || actualType === TileType.WOODEN_DOCK) {
            elevation = 0.05;
          }

          dummy.position.set(x, elevation, y);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();

          entry.mesh.setMatrixAt(entry.idx++, dummy.matrix);
        }

        // Buat Pohon 3D jika tile adalah TREE
        if (type === TileType.TREE) {
          this.create3DTree(x, y);
        }
      }
    }

    // Refresh transform buffer GPU
    meshes.forEach((entry) => {
      entry.mesh.instanceMatrix.needsUpdate = true;
    });

    // Tambahkan Landmark Desa Oakhaven (Balai Guild, Bengkel, Air Mancur)
    this.buildOakhavenLandmarks();
  }

  /**
   * Membuat Model Pohon Stylized 3D (Batang kayu + Daun berlapis bayangan)
   */
  private create3DTree(x: number, z: number): void {
    const treeGroup = new THREE.Group();

    // Batang Kayu (Trunk)
    const trunkGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    const trunkMat = new THREE.MeshStandardMaterial({
      map: TextureAtlas3D.getTexture('WOOD'),
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(0, 0.6, 0);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Dedaunan Berlapis (Canopy Layer 1)
    const leafGeo1 = new THREE.BoxGeometry(1.4, 0.9, 1.4);
    const leafMat1 = new THREE.MeshStandardMaterial({
      map: TextureAtlas3D.getTexture('GRASS'),
      color: 0x2e6b27,
      roughness: 0.8,
    });
    const foliage1 = new THREE.Mesh(leafGeo1, leafMat1);
    foliage1.position.set(0, 1.4, 0);
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    treeGroup.add(foliage1);

    // Dedaunan Puncak (Canopy Layer 2)
    const leafGeo2 = new THREE.BoxGeometry(0.9, 0.7, 0.9);
    const foliage2 = new THREE.Mesh(leafGeo2, leafMat1);
    foliage2.position.set(0, 2.0, 0);
    foliage2.castShadow = true;
    treeGroup.add(foliage2);

    treeGroup.position.set(x, 0, z);
    this.propGroup.add(treeGroup);
  }

  /**
   * Membangun Landmark Desa Oakhaven dalam 3D
   */
  private buildOakhavenLandmarks(): void {
    // 1. Air Mancur Alun-Alun Pusat Oakhaven (x: 50, z: 50)
    const fountainBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.5, 12),
      new THREE.MeshStandardMaterial({ map: TextureAtlas3D.getTexture('COBBLESTONE'), roughness: 0.7 })
    );
    fountainBase.position.set(50, 0.25, 50);
    fountainBase.castShadow = true;
    fountainBase.receiveShadow = true;
    this.propGroup.add(fountainBase);

    // Air di dalam kolam
    const fountainWater = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.1, 12),
      new THREE.MeshStandardMaterial({ map: TextureAtlas3D.getTexture('WATER'), roughness: 0.2, transparent: true, opacity: 0.9 })
    );
    fountainWater.position.set(50, 0.45, 50);
    this.propGroup.add(fountainWater);

    // Pilar Tengah Air Mancur
    const fountainPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.4, 8),
      new THREE.MeshStandardMaterial({ map: TextureAtlas3D.getTexture('COBBLESTONE'), roughness: 0.6 })
    );
    fountainPillar.position.set(50, 0.9, 50);
    fountainPillar.castShadow = true;
    this.propGroup.add(fountainPillar);
  }

  /**
   * Membangun Benua Valoria dalam 3D
   */
  public buildValoria(valoria: ContinentValoria): void {
    if (this.currentMapKey === 'CONTINENT_VALORIA') return;
    this.clear();
    this.currentMapKey = 'CONTINENT_VALORIA';

    const width = valoria.width;
    const height = valoria.height;

    const planeGeo = new THREE.BoxGeometry(1, 0.2, 1);
    const cliffGeo = new THREE.BoxGeometry(1, 1.4, 1);

    const counts = new Map<number, number>();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = valoria.getTileAt(x, y);
        counts.set(type, (counts.get(type) || 0) + 1);
      }
    }

    const meshes = new Map<number, { mesh: THREE.InstancedMesh; idx: number }>();
    const dummy = new THREE.Object3D();

    const getValoriaMaterial = (type: ValoriaTileType): THREE.MeshStandardMaterial => {
      let texName = 'SAVANNA';
      let roughness = 0.8;
      let metalness = 0.05;

      switch (type) {
        case ValoriaTileType.SAVANNA:
          texName = 'SAVANNA';
          break;
        case ValoriaTileType.DESERT_SAND:
        case ValoriaTileType.DUNES:
          texName = 'SAND';
          break;
        case ValoriaTileType.SNOW:
          texName = 'SNOW';
          break;
        case ValoriaTileType.ICE:
          texName = 'ICE';
          roughness = 0.2;
          metalness = 0.2;
          break;
        case ValoriaTileType.CRYSTAL_SOIL:
          texName = 'CRYSTAL_SOIL';
          break;
        case ValoriaTileType.COBBLESTONE:
        case ValoriaTileType.DIRT_PATH:
          texName = 'COBBLESTONE';
          break;
        case ValoriaTileType.CLIFF:
          texName = 'CLIFF';
          break;
        case ValoriaTileType.WATER:
          texName = 'WATER';
          roughness = 0.15;
          metalness = 0.3;
          break;
      }

      const mat = new THREE.MeshStandardMaterial({
        map: TextureAtlas3D.getTexture(texName),
        roughness,
        metalness,
      });

      if (type === ValoriaTileType.WATER) {
        mat.transparent = true;
        mat.opacity = 0.88;
      }

      return mat;
    };

    counts.forEach((count, type) => {
      const isBlock = type === ValoriaTileType.CLIFF;
      const geo = isBlock ? cliffGeo : planeGeo;
      const mat = getValoriaMaterial(type);
      const instMesh = new THREE.InstancedMesh(geo, mat, count);
      instMesh.castShadow = isBlock;
      instMesh.receiveShadow = true;
      this.group.add(instMesh);
      this.instancedMeshes.push(instMesh);
      meshes.set(type, { mesh: instMesh, idx: 0 });
    });

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const type = valoria.getTileAt(x, y);
        const entry = meshes.get(type);

        if (entry) {
          let elevation = 0;
          if (type === ValoriaTileType.WATER) {
            elevation = -0.15;
          } else if (type === ValoriaTileType.CLIFF) {
            elevation = 0.6;
          } else if (type === ValoriaTileType.COBBLESTONE) {
            elevation = 0.05;
          }

          dummy.position.set(x, elevation, y);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();

          entry.mesh.setMatrixAt(entry.idx++, dummy.matrix);
        }
      }
    }

    meshes.forEach((entry) => {
      entry.mesh.instanceMatrix.needsUpdate = true;
    });
  }

  /**
   * Membangun Dungeon dalam 3D (Dinding balok 3D + Lantai batu)
   */
  public buildDungeon(layout: number[][], themeName: string): void {
    const key = `DUNGEON_${themeName}`;
    if (this.currentMapKey === key) return;
    this.clear();
    this.currentMapKey = key;

    const height = layout.length;
    const width = layout[0]?.length || 0;

    const floorGeo = new THREE.BoxGeometry(1, 0.2, 1);
    const wallGeo = new THREE.BoxGeometry(1, 1.8, 1);

    const floorMat = new THREE.MeshStandardMaterial({
      map: TextureAtlas3D.getTexture('DUNGEON_FLOOR'),
      roughness: 0.85,
    });

    const wallMat = new THREE.MeshStandardMaterial({
      map: TextureAtlas3D.getTexture('DUNGEON_WALL'),
      roughness: 0.9,
    });

    let wallCount = 0;
    let floorCount = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (layout[y][x] === 1) wallCount++;
        else floorCount++;
      }
    }

    const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, floorCount);
    floorMesh.receiveShadow = true;
    this.group.add(floorMesh);
    this.instancedMeshes.push(floorMesh);

    const wallMesh = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    this.group.add(wallMesh);
    this.instancedMeshes.push(wallMesh);

    const dummy = new THREE.Object3D();
    let fIdx = 0;
    let wIdx = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const isWall = layout[y][x] === 1;
        if (isWall) {
          dummy.position.set(x, 0.8, y);
          dummy.updateMatrix();
          wallMesh.setMatrixAt(wIdx++, dummy.matrix);
        } else {
          dummy.position.set(x, 0, y);
          dummy.updateMatrix();
          floorMesh.setMatrixAt(fIdx++, dummy.matrix);
        }
      }
    }

    floorMesh.instanceMatrix.needsUpdate = true;
    wallMesh.instanceMatrix.needsUpdate = true;
  }
}
