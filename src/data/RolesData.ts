import { CharacterCostume, RoleType, Skill, MagicElement, MagicianAffinities } from '../types/GameTypes.ts';

export const CHARACTER_COSTUMES: CharacterCostume[] = [
  {
    id: 0,
    name: 'Pengelana Biru',
    hairColor: '#92400e',
    outfitColor: '#2563eb',
    accentColor: '#facc15',
    hairStyle: 'short'
  },
  {
    id: 1,
    name: 'Ksatria Crimson',
    hairColor: '#451a03',
    outfitColor: '#dc2626',
    accentColor: '#991b1b',
    hairStyle: 'spiky'
  },
  {
    id: 2,
    name: 'Penyihir Violet',
    hairColor: '#6b21a8',
    outfitColor: '#7c3aed',
    accentColor: '#c084fc',
    hairStyle: 'hood',
    hatColor: '#581c87'
  },
  {
    id: 3,
    name: 'Rogue Bayangan',
    hairColor: '#1e293b',
    outfitColor: '#0f172a',
    accentColor: '#06b6d4',
    hairStyle: 'hood',
    hatColor: '#1e293b'
  },
  {
    id: 4,
    name: 'Ranger Hutan',
    hairColor: '#ca8a04',
    outfitColor: '#15803d',
    accentColor: '#86efac',
    hairStyle: 'long'
  },
  {
    id: 5,
    name: 'Paladin Emas',
    hairColor: '#fbbf24',
    outfitColor: '#eab308',
    accentColor: '#ffffff',
    hairStyle: 'short'
  },
  {
    id: 6,
    name: 'Pendeta Suci',
    hairColor: '#fde047',
    outfitColor: '#f8fafc',
    accentColor: '#38bdf8',
    hairStyle: 'long'
  },
  {
    id: 7,
    name: 'Necromancer Kematian',
    hairColor: '#64748b',
    outfitColor: '#18181b',
    accentColor: '#a855f7',
    hairStyle: 'hood',
    hatColor: '#27272a'
  }
];

export const ELEMENT_INFO: Record<MagicElement, { name: string; icon: string; color: string; description: string }> = {
  FIRE: {
    name: 'Api (Fire)',
    icon: '🔥',
    color: '#ef4444',
    description: 'Daya hancur ledakan dahsyat, membakar target dengan burst damage tinggi.'
  },
  ICE: {
    name: 'Es / Air (Ice)',
    icon: '❄️',
    color: '#38bdf8',
    description: 'Sihir pembekuan & kontrol area, memperlambat dan melumpuhkan target.'
  },
  LIGHTNING: {
    name: 'Petir (Lightning)',
    icon: '⚡',
    color: '#facc15',
    description: 'Kecepatan sambaran luar biasa, melompat antar target dengan sengatan listrik.'
  },
  WIND: {
    name: 'Angin (Wind)',
    icon: '🌪️',
    color: '#4ade80',
    description: 'Bilah udara membelah badai, menolak mundur lawan dan mobilitas tinggi.'
  },
  EARTH: {
    name: 'Bumi (Earth)',
    icon: '🪨',
    color: '#a16207',
    description: 'Mengendalikan bebatuan dan lempeng bumi, perisai batu dan gempa retak.'
  }
};

export function getMagicianSkills(affinities: MagicianAffinities): Skill[] {
  const skills: Skill[] = [];
  const pElem = affinities.primary;
  const pInfo = ELEMENT_INFO[pElem];

  // 1. PRIMARY SIGNATURE SKILL (Lv. 1) - 100% Full Power
  switch (pElem) {
    case 'FIRE':
      skills.push({
        id: 'fire_primary',
        name: '🔥 Blazing Inferno (Utama)',
        description: 'Sihir Utama: Bola api raksasa berdaya ledak 100% penuh.',
        role: 'MAGICIAN',
        element: 'FIRE',
        isPrimaryElement: true,
        unlockLevel: 1,
        manaCost: 15,
        cooldown: 2.0,
        currentCooldown: 0,
        iconSymbol: '🔥',
        color: '#ef4444'
      });
      break;
    case 'ICE':
      skills.push({
        id: 'ice_primary',
        name: '❄️ Glacial Frost Nova (Utama)',
        description: 'Sihir Utama: Gelombang es mutlak yang membekukan sekeliling penyihir.',
        role: 'MAGICIAN',
        element: 'ICE',
        isPrimaryElement: true,
        unlockLevel: 1,
        manaCost: 16,
        cooldown: 2.5,
        currentCooldown: 0,
        iconSymbol: '❄️',
        color: '#38bdf8'
      });
      break;
    case 'LIGHTNING':
      skills.push({
        id: 'lightning_primary',
        name: '⚡ Thunder Chain Strike (Utama)',
        description: 'Sihir Utama: Sambaran halilintar beruntun berkecepatan tinggi.',
        role: 'MAGICIAN',
        element: 'LIGHTNING',
        isPrimaryElement: true,
        unlockLevel: 1,
        manaCost: 18,
        cooldown: 2.2,
        currentCooldown: 0,
        iconSymbol: '⚡',
        color: '#facc15'
      });
      break;
    case 'WIND':
      skills.push({
        id: 'wind_primary',
        name: '🌪️ Gale Vortex Blade (Utama)',
        description: 'Sihir Utama: Tornado angin memutar yang menghempaskan dan menebas musuh.',
        role: 'MAGICIAN',
        element: 'WIND',
        isPrimaryElement: true,
        unlockLevel: 1,
        manaCost: 14,
        cooldown: 2.0,
        currentCooldown: 0,
        iconSymbol: '🌪️',
        color: '#4ade80'
      });
      break;
    case 'EARTH':
      skills.push({
        id: 'earth_primary',
        name: '🪨 Terra Spikes Rupture (Utama)',
        description: 'Sihir Utama: Duri batu besar meletus dari bumi menghancurkan pertahanan.',
        role: 'MAGICIAN',
        element: 'EARTH',
        isPrimaryElement: true,
        unlockLevel: 1,
        manaCost: 18,
        cooldown: 2.6,
        currentCooldown: 0,
        iconSymbol: '🪨',
        color: '#a16207'
      });
      break;
  }

  // Helper for secondary spell creation (Sihir Sampingan)
  const createSecondarySkill = (elem: MagicElement, unlockLvl: number, slotNum: number): Skill => {
    switch (elem) {
      case 'FIRE':
        return {
          id: `fire_sec_${slotNum}`,
          name: '🔥 Flame Spark (Sampingan)',
          description: 'Sihir Sampingan: Letupan api kecil untuk mengganggu lawan.',
          role: 'MAGICIAN',
          element: 'FIRE',
          isPrimaryElement: false,
          unlockLevel: unlockLvl,
          manaCost: 12,
          cooldown: 3.5,
          currentCooldown: 0,
          iconSymbol: '🔥',
          color: '#f87171'
        };
      case 'ICE':
        return {
          id: `ice_sec_${slotNum}`,
          name: '❄️ Chilling Shard (Sampingan)',
          description: 'Sihir Sampingan: Serpihan es untuk memperlambat langkah target.',
          role: 'MAGICIAN',
          element: 'ICE',
          isPrimaryElement: false,
          unlockLevel: unlockLvl,
          manaCost: 12,
          cooldown: 3.5,
          currentCooldown: 0,
          iconSymbol: '❄️',
          color: '#7dd3fc'
        };
      case 'LIGHTNING':
        return {
          id: `lightning_sec_${slotNum}`,
          name: '⚡ Static Shock (Sampingan)',
          description: 'Sihir Sampingan: Sengatan listrik kejut singkat.',
          role: 'MAGICIAN',
          element: 'LIGHTNING',
          isPrimaryElement: false,
          unlockLevel: unlockLvl,
          manaCost: 14,
          cooldown: 3.8,
          currentCooldown: 0,
          iconSymbol: '⚡',
          color: '#fde047'
        };
      case 'WIND':
        return {
          id: `wind_sec_${slotNum}`,
          name: '🌪️ Gust Push (Sampingan)',
          description: 'Sihir Sampingan: Hembusan angin mendorong mundur.',
          role: 'MAGICIAN',
          element: 'WIND',
          isPrimaryElement: false,
          unlockLevel: unlockLvl,
          manaCost: 10,
          cooldown: 3.0,
          currentCooldown: 0,
          iconSymbol: '🍃',
          color: '#86efac'
        };
      case 'EARTH':
        return {
          id: `earth_sec_${slotNum}`,
          name: '🪨 Stone Shell (Sampingan)',
          description: 'Sihir Sampingan: Lapisan batu pelindung menyerap damage kecil.',
          role: 'MAGICIAN',
          element: 'EARTH',
          isPrimaryElement: false,
          unlockLevel: unlockLvl,
          manaCost: 15,
          cooldown: 4.5,
          currentCooldown: 0,
          iconSymbol: '🪨',
          color: '#ca8a04'
        };
    }
  };

  // 2. SECONDARY SKILL 1 (Lv. 3)
  if (affinities.secondaries.length > 0) {
    skills.push(createSecondarySkill(affinities.secondaries[0], 3, 1));
  } else {
    // If no secondary chosen, give primary element reinforcement
    skills.push({
      id: `${pElem.toLowerCase()}_empower`,
      name: `✨ ${pInfo.name.split(' ')[0]} Focus Amp`,
      description: 'Konsentrasi murni elemen utama: meningkatkan damage elemen 30%.',
      role: 'MAGICIAN',
      element: pElem,
      isPrimaryElement: true,
      unlockLevel: 3,
      manaCost: 20,
      cooldown: 6.0,
      currentCooldown: 0,
      iconSymbol: pInfo.icon,
      color: pInfo.color
    });
  }

  // 3. SECONDARY SKILL 2 (Lv. 6) OR ELEMENTAL FIELD
  if (affinities.secondaries.length > 1) {
    skills.push(createSecondarySkill(affinities.secondaries[1], 6, 2));
  } else {
    // Secondary Slot 2 is Primary Elemental Wave
    skills.push({
      id: `${pElem.toLowerCase()}_wave`,
      name: `🌊 ${pInfo.name.split(' ')[0]} Elemental Burst`,
      description: `Ledakan gelombang ${pInfo.name.split(' ')[0]} ke seluruh arah.`,
      role: 'MAGICIAN',
      element: pElem,
      isPrimaryElement: true,
      unlockLevel: 6,
      manaCost: 28,
      cooldown: 5.5,
      currentCooldown: 0,
      iconSymbol: pInfo.icon,
      color: pInfo.color
    });
  }

  // 4. SPATIAL TELEPORT / BLINK (Lv. 10) - Universal Magician spell
  skills.push({
    id: 'teleport',
    name: '🌀 Blink / Teleportasi',
    description: 'Sihir Ruang Spasial: Berpindah seketika 100px ke arah pandang.',
    role: 'MAGICIAN',
    unlockLevel: 10,
    manaCost: 25,
    cooldown: 4.5,
    currentCooldown: 0,
    iconSymbol: '🌀',
    color: '#a855f7'
  });

  // 5. UNIQUE ANIME ABNORMAL SKILL (Lv. 12) Based on Primary Element!
  switch (pElem) {
    case 'FIRE':
      skills.push({
        id: 'abnormal_fire',
        name: '💥 Abnormal: Megumin Explosion Magic',
        description: 'Bakat Anime (Konosuba): Ledakan terdahsyat meluluhlantakkan seluruh layar!',
        role: 'MAGICIAN',
        element: 'FIRE',
        isPrimaryElement: true,
        unlockLevel: 12,
        manaCost: 55,
        cooldown: 25.0,
        currentCooldown: 0,
        iconSymbol: '💥',
        color: '#dc2626',
        isAbnormal: true
      });
      break;
    case 'ICE':
      skills.push({
        id: 'abnormal_ice',
        name: '❄️ Abnormal: Absolute Zero Domain',
        description: 'Bakat Anime (Bleach Hitsugaya): Membekukan waktu dan partikel molekul secara absolut.',
        role: 'MAGICIAN',
        element: 'ICE',
        isPrimaryElement: true,
        unlockLevel: 12,
        manaCost: 50,
        cooldown: 22.0,
        currentCooldown: 0,
        iconSymbol: '❄️',
        color: '#0284c7',
        isAbnormal: true
      });
      break;
    case 'LIGHTNING':
      skills.push({
        id: 'abnormal_lightning',
        name: '⚡ Abnormal: Kirin Lightning God',
        description: 'Bakat Anime (Naruto/Sasuke): Memanggil naga petir murni dari langit dengan kecepatan kilat!',
        role: 'MAGICIAN',
        element: 'LIGHTNING',
        isPrimaryElement: true,
        unlockLevel: 12,
        manaCost: 50,
        cooldown: 20.0,
        currentCooldown: 0,
        iconSymbol: '⚡',
        color: '#eab308',
        isAbnormal: true
      });
      break;
    case 'WIND':
      skills.push({
        id: 'abnormal_wind',
        name: '🌪️ Abnormal: Kamaitachi Void Typhoon',
        description: 'Bakat Anime: Ribuan bilah angin hampa udara merobek dimensi ruang.',
        role: 'MAGICIAN',
        element: 'WIND',
        isPrimaryElement: true,
        unlockLevel: 12,
        manaCost: 45,
        cooldown: 20.0,
        currentCooldown: 0,
        iconSymbol: '🌪️',
        color: '#16a34a',
        isAbnormal: true
      });
      break;
    case 'EARTH':
      skills.push({
        id: 'abnormal_earth',
        name: '🪨 Abnormal: Gaia Cataclysm Meteor',
        description: 'Bakat Anime (Madara Tengai Shinsei): Menjatuhkan meteorit batu raksasa dari orbit!',
        role: 'MAGICIAN',
        element: 'EARTH',
        isPrimaryElement: true,
        unlockLevel: 12,
        manaCost: 55,
        cooldown: 25.0,
        currentCooldown: 0,
        iconSymbol: '☄️',
        color: '#854d0e',
        isAbnormal: true
      });
      break;
  }

  return skills;
}

export const ROLE_INFO: Record<RoleType, { name: string; tag: string; description: string; color: string; skills: Skill[] }> = {
  NOVICE: {
    name: 'Petualang Pemula',
    tag: 'Novice',
    description: 'Belum diperiksa oleh Guild. Temui Resepsionis Guild untuk membangkitkan role sejatimu!',
    color: '#94a3b8',
    skills: []
  },
  KNIGHT: {
    name: 'Knight (Ksatria)',
    tag: 'Knight',
    description: 'Fokus pertempuran jarak dekat, pertahanan kokoh, perisai, dan serangan tebasan mematikan.',
    color: '#f97316',
    skills: [
      {
        id: 'slash',
        name: 'Heavy Slash',
        description: 'Tebasan pedang berenergi ke depan dengan radius tebasan luas.',
        role: 'KNIGHT',
        unlockLevel: 1,
        manaCost: 10,
        cooldown: 1.5,
        currentCooldown: 0,
        iconSymbol: '⚔️',
        color: '#f97316'
      },
      {
        id: 'shield_bash',
        name: 'Shield Bash',
        description: 'Menghantam perisai ke depan, memukul mundur musuh dan memberikan stun.',
        role: 'KNIGHT',
        unlockLevel: 3,
        manaCost: 18,
        cooldown: 4.0,
        currentCooldown: 0,
        iconSymbol: '🛡️',
        color: '#fb923c'
      },
      {
        id: 'parrying',
        name: 'Parrying Counter',
        description: 'Memasuki postur tangkis. Menahan serangan lalu membalas dengan tebasan kritis.',
        role: 'KNIGHT',
        unlockLevel: 6,
        manaCost: 25,
        cooldown: 6.0,
        currentCooldown: 0,
        iconSymbol: '⚡',
        color: '#fde047'
      },
      {
        id: 'leap_attack',
        name: 'Earth Leap Attack',
        description: 'Melompat ke depan dan menghantam tanah menciptakan gempa shockwave.',
        role: 'KNIGHT',
        unlockLevel: 10,
        manaCost: 35,
        cooldown: 8.0,
        currentCooldown: 0,
        iconSymbol: '💥',
        color: '#ef4444'
      },
      {
        id: 'berserk_overdrive',
        name: 'Abnormal: Berserk Overdrive',
        description: 'Bakat Abnormal Anime: Melepaskan batasan tubuh! Kecepatan +150% & tebasan ganda!',
        role: 'KNIGHT',
        unlockLevel: 12,
        manaCost: 40,
        cooldown: 15.0,
        currentCooldown: 0,
        iconSymbol: '🔥',
        color: '#dc2626',
        isAbnormal: true
      }
    ]
  },
  MAGICIAN: {
    name: 'Magician (Penyihir Elemen)',
    tag: 'Magician',
    description: 'Penypesialisasi elemen sihir pilihan (Api, Es, Petir, Angin, Bumi). 1 Elemen Utama + maks 2 Sampingan.',
    color: '#8b5cf6',
    skills: [] // Dynamically generated per player via getMagicianSkills!
  },
  ASSASSIN: {
    name: 'Assassin (Pembunuh Senyap)',
    tag: 'Assassin',
    description: 'Ahli siluman, penyerangan titik vital dengan serangan kritis, dan racun mematikan.',
    color: '#06b6d4',
    skills: [
      {
        id: 'stealth',
        name: 'Shadow Cloak / Stealth',
        description: 'Menjadi transparan tak terlihat dan meningkatkan movement speed +60%.',
        role: 'ASSASSIN',
        unlockLevel: 1,
        manaCost: 15,
        cooldown: 6.0,
        currentCooldown: 0,
        iconSymbol: '👤',
        color: '#06b6d4'
      },
      {
        id: 'poison_blade',
        name: 'Toxic Dagger',
        description: 'Melumuri senjata dengan racun yang menguras HP target terus menerus.',
        role: 'ASSASSIN',
        unlockLevel: 3,
        manaCost: 18,
        cooldown: 4.0,
        currentCooldown: 0,
        iconSymbol: '🧪',
        color: '#22c55e'
      },
      {
        id: 'critical_strike',
        name: 'Assassinate (Critical)',
        description: 'Tusukan bayangan secepat kilat dengan 350% burst critical damage!',
        role: 'ASSASSIN',
        unlockLevel: 6,
        manaCost: 28,
        cooldown: 5.5,
        currentCooldown: 0,
        iconSymbol: '🗡️',
        color: '#f43f5e'
      },
      {
        id: 'shadow_clone',
        name: 'Shadow Decoy / Clone',
        description: 'Memunculkan klon bayangan yang mengelabui rintangan dan musuh.',
        role: 'ASSASSIN',
        unlockLevel: 10,
        manaCost: 35,
        cooldown: 9.0,
        currentCooldown: 0,
        iconSymbol: '👥',
        color: '#3b82f6'
      },
      {
        id: 'godspeed_reflexes',
        name: 'Abnormal: Godspeed Reflexes',
        description: 'Bakat Abnormal Anime (Solo Leveling): Kecepatan cahaya, auto-dodge semua serangan!',
        role: 'ASSASSIN',
        unlockLevel: 12,
        manaCost: 45,
        cooldown: 18.0,
        currentCooldown: 0,
        iconSymbol: '⚡',
        color: '#a855f7',
        isAbnormal: true
      }
    ]
  },
  HEALER: {
    name: 'Healer (Penyembuh Suci)',
    tag: 'Healer',
    description: 'Penyokong kehidupan, memulihkan luka, perisai suci pelindung, dan keajaiban kebangkitan.',
    color: '#10b981',
    skills: [
      {
        id: 'holy_heal',
        name: 'Holy Light Heal',
        description: 'Pancaran cahaya suci yang memulihkan 45 HP seketika.',
        role: 'HEALER',
        unlockLevel: 1,
        manaCost: 20,
        cooldown: 3.0,
        currentCooldown: 0,
        iconSymbol: '✨',
        color: '#10b981'
      },
      {
        id: 'purification',
        name: 'Sacred Cleanse',
        description: 'Menghilangkan semua efek negatif dan racun serta memulihkan kecepatan.',
        role: 'HEALER',
        unlockLevel: 3,
        manaCost: 15,
        cooldown: 5.0,
        currentCooldown: 0,
        iconSymbol: '🌿',
        color: '#34d399'
      },
      {
        id: 'divine_barrier',
        name: 'Divine Aegis Barrier',
        description: 'Menciptakan perisai kubah cahaya yang menahan serangan.',
        role: 'HEALER',
        unlockLevel: 6,
        manaCost: 30,
        cooldown: 8.0,
        currentCooldown: 0,
        iconSymbol: '🛡️',
        color: '#fde047'
      },
      {
        id: 'angel_blessing',
        name: 'Angel Blessing',
        description: 'Berkah malaikat: regenerasi HP + MP terus menerus selama 8 detik.',
        role: 'HEALER',
        unlockLevel: 10,
        manaCost: 40,
        cooldown: 12.0,
        currentCooldown: 0,
        iconSymbol: '🕊️',
        color: '#38bdf8'
      },
      {
        id: 'miracle_rebirth',
        name: 'Abnormal: Miracle Rebirth',
        description: 'Bakat Abnormal Anime: Jika HP menyentuh 0, tubuh otomatis pulih 100% HP & MP seketika!',
        role: 'HEALER',
        unlockLevel: 12,
        manaCost: 50,
        cooldown: 30.0,
        currentCooldown: 0,
        iconSymbol: '💖',
        color: '#f43f5e',
        isAbnormal: true
      }
    ]
  },
  NECROMANCER: {
    name: 'Necromancer (Penguasa Kematian)',
    tag: 'Necromancer',
    description: 'Membangkitkan prajurit kerangka, memanggil roh mistis pelindung, dan menyerap jiwa.',
    color: '#a855f7',
    skills: [
      {
        id: 'raise_skeleton',
        name: 'Raise Skeleton Warrior',
        description: 'Membangkitkan prajurit kerangka setia dari tanah yang berjalan mengawalmu!',
        role: 'NECROMANCER',
        unlockLevel: 1,
        manaCost: 25,
        cooldown: 5.0,
        currentCooldown: 0,
        iconSymbol: '💀',
        color: '#a855f7'
      },
      {
        id: 'ghostly_grasp',
        name: 'Ghostly Grasp',
        description: 'Tangan-tangan arwah muncul dari bumi mencengkeram dan memperlambat musuh.',
        role: 'NECROMANCER',
        unlockLevel: 3,
        manaCost: 20,
        cooldown: 5.5,
        currentCooldown: 0,
        iconSymbol: '✋',
        color: '#818cf8'
      },
      {
        id: 'soul_drain',
        name: 'Soul Life Drain',
        description: 'Menyedot energi vital sekitar untuk memulihkan HP penyihir.',
        role: 'NECROMANCER',
        unlockLevel: 6,
        manaCost: 28,
        cooldown: 7.0,
        currentCooldown: 0,
        iconSymbol: '🩸',
        color: '#c084fc'
      },
      {
        id: 'summon_bear',
        name: 'Summon Spirit Bear',
        description: 'Memanggil makhluk mistis beruang raksasa pelindung.',
        role: 'NECROMANCER',
        unlockLevel: 10,
        manaCost: 45,
        cooldown: 14.0,
        currentCooldown: 0,
        iconSymbol: '🐻',
        color: '#e879f9'
      },
      {
        id: 'predator_gluttony',
        name: 'Abnormal: Gluttony Soul Devour',
        description: 'Bakat Abnormal Anime (Rimuru Slime / Solo Leveling): Menyerap esensi jiwa lawan dan memperkuat status permanen!',
        role: 'NECROMANCER',
        unlockLevel: 12,
        manaCost: 60,
        cooldown: 25.0,
        currentCooldown: 0,
        iconSymbol: '👁️',
        color: '#9333ea',
        isAbnormal: true
      }
    ]
  }
};
