import { RoleType } from '../types/GameTypes.ts';

/**
 * AudioEngine - Web Audio API Synthesizer untuk SFX & BGM Retro 2D RPG
 * Bebas aset eksternal, 100% offline, latensi nol, bekerja sempurna di PWA Mobile & Desktop.
 */
export class AudioEngine {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static sfxGain: GainNode | null = null;
  private static bgmGain: GainNode | null = null;

  public static isSoundEnabled: boolean = true;
  public static isMusicEnabled: boolean = true;
  public static volume: number = 0.8;

  private static bgmInterval: number | null = null;
  private static currentMapBgm: 'OVERWORLD' | 'DUNGEON' | 'DUNGEON_FLOOR_2' | 'DUNGEON_FLOOR_3' | 'DUNGEON_ELDORIA' | 'DUNGEON_STONEWATCH' | null = null;

  /**
   * Inisialisasi AudioContext saat interaksi pengguna pertama kali
   */
  public static init(): void {
    // Muat konfigurasi dari localStorage jika ada
    try {
      const savedSound = localStorage.getItem('rpg2d_sound_enabled');
      if (savedSound !== null) this.isSoundEnabled = savedSound === 'true';
      const savedMusic = localStorage.getItem('rpg2d_music_enabled');
      if (savedMusic !== null) this.isMusicEnabled = savedMusic === 'true';
      const savedVol = localStorage.getItem('rpg2d_audio_volume');
      if (savedVol !== null) this.volume = parseFloat(savedVol);
    } catch (e) {
      // ignore
    }

    const unlockAudio = () => {
      this.ensureContext();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.currentMapBgm && this.isMusicEnabled && !this.bgmInterval) {
        this.playBgm(this.currentMapBgm);
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
  }

  private static ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.isSoundEnabled ? 1.0 : 0.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isMusicEnabled ? 0.35 : 0.0, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);
    }
    return this.ctx;
  }

  public static setSoundEnabled(enabled: boolean): void {
    this.isSoundEnabled = enabled;
    try {
      localStorage.setItem('rpg2d_sound_enabled', enabled ? 'true' : 'false');
    } catch (e) {}
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? 1.0 : 0.0, this.ctx.currentTime);
    }
  }

  public static setMusicEnabled(enabled: boolean): void {
    this.isMusicEnabled = enabled;
    try {
      localStorage.setItem('rpg2d_music_enabled', enabled ? 'true' : 'false');
    } catch (e) {}
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(enabled ? 0.35 : 0.0, this.ctx.currentTime);
    }
    if (!enabled) {
      this.stopBgm();
    } else if (this.currentMapBgm) {
      this.playBgm(this.currentMapBgm);
    }
  }

  public static setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('rpg2d_audio_volume', this.volume.toString());
    } catch (e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  // ===============================================================
  // SOUND EFFECTS (SFX)
  // ===============================================================

  /**
   * Suara pukulan / ayunan senjata
   */
  public static playAttackSwing(role?: RoleType): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (role === 'KNIGHT') {
      // Ayunan pedang tajam (pitch sweep ke bawah + filter bandpass)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
      gain.gain.setValueAtTime(0, t + 0.13);
    } else if (role === 'ASSASSIN') {
      // Suara tebasan cepat belati / pisau pembunuh
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.09);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.09);
      gain.gain.setValueAtTime(0, t + 0.1);
    } else if (role === 'MAGICIAN' || role === 'HEALER' || role === 'NECROMANCER') {
      // Suara ayunan tongkat sihir magis
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.1);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
      gain.gain.setValueAtTime(0, t + 0.11);
    } else {
      // Tinju tangan kosong Novice
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.1);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
      gain.gain.setValueAtTime(0, t + 0.11);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);
  }

  /**
   * Suara benturan saat monster terkena serangan
   */
  public static playHit(isCrit: boolean = false): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCrit ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 360 : 220, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);

    gain.gain.setValueAtTime(isCrit ? 0.45 : 0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
    gain.gain.setValueAtTime(0, t + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.14);

    if (isCrit) {
      // Tambahan bunyi crunch tajam untuk Critical Hit
      const noise = ctx.createOscillator();
      const nGain = ctx.createGain();
      noise.type = 'sawtooth';
      noise.frequency.setValueAtTime(900, t);
      noise.frequency.exponentialRampToValueAtTime(180, t + 0.15);
      nGain.gain.setValueAtTime(0.3, t);
      nGain.gain.linearRampToValueAtTime(0.01, t + 0.15);
      noise.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(t);
      noise.stop(t + 0.16);
    }
  }

  /**
   * Suara saat monster dikalahkan
   */
  public static playMonsterDefeated(isBoss: boolean = false): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    if (isBoss) {
      // Fanfare Kemenangan Bos (Akord Megah)
      const freqs = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.3, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8 + idx * 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t + idx * 0.08);
        osc.stop(t + 0.9 + idx * 0.08);
      });
    } else {
      // Monster biasa meledak / lenyap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }

  /**
   * Efek Suara Berdasarkan Elemen Sihir / Skill Role
   */
  public static playSpell(spellType: string): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;

    switch (spellType) {
      case 'fire': {
        // Gemuruh ledakan api
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.35);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.36);
        break;
      }
      case 'ice': {
        // Dentang es kristal menusuk
        [880, 1174.66, 1760].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.05);

          gain.gain.setValueAtTime(0.22, t + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25 + i * 0.05);

          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t + i * 0.05);
          osc.stop(t + 0.3 + i * 0.05);
        });
        break;
      }
      case 'lightning': {
        // Sambaran petir tajam berkilau
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, t);
        osc.frequency.setValueAtTime(280, t + 0.04);
        osc.frequency.setValueAtTime(920, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

        gain.gain.setValueAtTime(0.35, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.26);
        break;
      }
      case 'heal': {
        // Lonceng suci pemulihan HP (C5 -> E5 -> G5 -> C6)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + i * 0.06);

          gain.gain.setValueAtTime(0.25, t + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35 + i * 0.06);

          osc.connect(gain);
          gain.connect(this.sfxGain!);
          osc.start(t + i * 0.06);
          osc.stop(t + 0.4 + i * 0.06);
        });
        break;
      }
      case 'wind': {
        // Desir angin tajam berputar
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, t);
        osc.frequency.linearRampToValueAtTime(680, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.24);

        gain.gain.setValueAtTime(0.28, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.25);
        break;
      }
      case 'earth': {
        // Hantaman gempa bumi keras
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.3);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + 0.32);
        break;
      }
      default: {
        // Suara skill fisik / slash
        this.playAttackSwing('KNIGHT');
        break;
      }
    }
  }

  /**
   * Suara meminum ramuan (HP / Mana Potion)
   */
  public static playPotionDrink(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    [300, 420, 560].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + 0.08 + idx * 0.06);

      gain.gain.setValueAtTime(0.2, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.08 + idx * 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.06);
      osc.stop(t + 0.09 + idx * 0.06);
    });
  }

  /**
   * Suara membuka peti harta karun
   */
  public static playChestOpen(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // Derit kayu
    const creak = ctx.createOscillator();
    const creakGain = ctx.createGain();
    creak.type = 'sawtooth';
    creak.frequency.setValueAtTime(120, t);
    creak.frequency.linearRampToValueAtTime(260, t + 0.12);
    creakGain.gain.setValueAtTime(0.2, t);
    creakGain.gain.linearRampToValueAtTime(0.01, t + 0.12);
    creak.connect(creakGain);
    creakGain.connect(this.sfxGain);
    creak.start(t);
    creak.stop(t + 0.13);

    // Gemerincing emas (Arpeggio riang)
    [587.33, 739.99, 880, 1174.66].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + 0.1 + i * 0.06);

      gain.gain.setValueAtTime(0.22, t + 0.1 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35 + i * 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + 0.1 + i * 0.06);
      osc.stop(t + 0.4 + i * 0.06);
    });
  }

  /**
   * Suara mengambil item atau koin di tanah
   */
  public static playItemPickup(isGold: boolean = false): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    if (isGold) {
      osc.frequency.setValueAtTime(987.77, t);
      osc.frequency.setValueAtTime(1318.51, t + 0.05);
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
    } else {
      osc.frequency.setValueAtTime(659.25, t);
      osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Suara naik level (Fanfare Jaya!)
   */
  public static playLevelUp(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // C5, E5, G5, C6 panjang
    const notes = [
      { f: 523.25, d: 0.1 },
      { f: 659.25, d: 0.1 },
      { f: 783.99, d: 0.12 },
      { f: 1046.5, d: 0.45 }
    ];

    let offset = 0;
    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t + offset);

      gain.gain.setValueAtTime(0.35, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, t + offset + note.d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + offset);
      osc.stop(t + offset + note.d + 0.02);

      offset += note.d * 0.85;
    });
  }

  /**
   * Suara Misi Selesai / Quest Turn-in
   */
  public static playQuestComplete(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const freqs = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t + i * 0.08);

      gain.gain.setValueAtTime(0.28, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4 + i * 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + 0.45 + i * 0.08);
    });
  }

  /**
   * Pemain terkena damage
   */
  public static playPlayerHurt(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.14);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * Pemain gugur / mati
   */
  public static playPlayerDeath(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    // Nada sedih menurun perlahan (E4 -> C4 -> A3)
    const tones = [329.63, 261.63, 220.0];
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.18);

      gain.gain.setValueAtTime(0.32, t + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35 + idx * 0.18);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t + idx * 0.18);
      osc.stop(t + 0.4 + idx * 0.18);
    });
  }

  /**
   * Suara Transisi Peta (Masuk / Keluar Dungeon)
   */
  public static playMapTransition(toDungeon: boolean): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    if (toDungeon) {
      // Masuk ke kegelapan gua (pitch turun bergema)
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.4);
    } else {
      // Keluar ke alam bebas yang cerah (pitch naik sepoi)
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.4);
    }

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  /**
   * Klik tombol UI
   */
  public static playButtonClick(): void {
    if (!this.isSoundEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // ===============================================================
  // BACKGROUND AMBIENT THEME (BGM RETRO)
  // ===============================================================

  public static playBgm(map: 'OVERWORLD' | 'DUNGEON' | 'DUNGEON_FLOOR_2' | 'DUNGEON_FLOOR_3' | 'DUNGEON_ELDORIA' | 'DUNGEON_STONEWATCH'): void {
    this.currentMapBgm = map;
    if (!this.isMusicEnabled) return;

    this.stopBgm();

    const ctx = this.ensureContext();
    if (!ctx || !this.bgmGain) return;

    let step = 0;
    // Overworld: Melodi pastoral ceria & menenangkan (Pentatonik C mayor rileks)
    const overworldNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 392.0, 329.63, 293.66];
    // Dungeon Lt.1: Arpeggio gelap misterius (D minor / Phrygian)
    const dungeonNotes = [146.83, 155.56, 174.61, 220.0, 196.0, 155.56];
    // Dungeon Lt.2 (Crypt): Resonant subterranean pulse
    const floor2Notes = [110.0, 130.81, 146.83, 164.81, 130.81, 123.47];
    // Dungeon Lt.3 (Infernal Sanctum): Tritone dark infernal theme
    const floor3Notes = [98.0, 103.83, 123.47, 138.59, 116.54, 98.0];
    // Dungeon Eldoria (Sylvan Temple): Mystical fairy forest chime
    const eldoriaNotes = [329.63, 392.0, 493.88, 587.33, 523.25, 440.0];
    // Dungeon Stonewatch (Cursed Mine): Deep dwarven rhythmic bass
    const stonewatchNotes = [123.47, 130.81, 146.83, 110.0, 98.0, 123.47];

    let notes = overworldNotes;
    let speed = 450;
    let oscType: OscillatorType = 'triangle';

    if (map === 'DUNGEON') {
      notes = dungeonNotes;
      speed = 600;
      oscType = 'sine';
    } else if (map === 'DUNGEON_FLOOR_2') {
      notes = floor2Notes;
      speed = 650;
      oscType = 'sine';
    } else if (map === 'DUNGEON_FLOOR_3') {
      notes = floor3Notes;
      speed = 520;
      oscType = 'sawtooth';
    } else if (map === 'DUNGEON_ELDORIA') {
      notes = eldoriaNotes;
      speed = 420;
      oscType = 'triangle';
    } else if (map === 'DUNGEON_STONEWATCH') {
      notes = stonewatchNotes;
      speed = 500;
      oscType = 'triangle';
    }

    this.bgmInterval = window.setInterval(() => {
      if (!this.isMusicEnabled || !this.ctx || !this.bgmGain) return;
      const t = this.ctx.currentTime;
      const freq = notes[step % notes.length];
      step++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, t);

      const noteVol = oscType === 'sawtooth' ? 0.04 : 0.08;
      gain.gain.setValueAtTime(noteVol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (speed / 1000) * 0.9);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(t);
      osc.stop(t + (speed / 1000) * 0.95);
    }, speed);
  }

  public static stopBgm(): void {
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}
