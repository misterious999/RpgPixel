import { CharacterCostume, RoleType, Skill } from '../types/GameTypes.ts';

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
    description: 'Menguasai manipulasi elemen alam: Api, Es, Petir, serta sihir ruang Teleportasi.',
    color: '#8b5cf6',
    skills: [
      {
        id: 'fireball',
        name: 'Blazing Fireball',
        description: 'Meluncurkan bola api membara yang meledak saat mengenai target.',
        role: 'MAGICIAN',
        unlockLevel: 1,
        manaCost: 15,
        cooldown: 2.0,
        currentCooldown: 0,
        iconSymbol: '🔥',
        color: '#ef4444'
      },
      {
        id: 'frost_nova',
        name: 'Frost Nova',
        description: 'Ledakan es membekukan seluruh area sekitar penyihir.',
        role: 'MAGICIAN',
        unlockLevel: 3,
        manaCost: 22,
        cooldown: 5.0,
        currentCooldown: 0,
        iconSymbol: '❄️',
        color: '#38bdf8'
      },
      {
        id: 'chain_lightning',
        name: 'Chain Lightning',
        description: 'Kilatan petir berantai menyambar melompat di udara dengan cepat.',
        role: 'MAGICIAN',
        unlockLevel: 6,
        manaCost: 30,
        cooldown: 6.5,
        currentCooldown: 0,
        iconSymbol: '⚡',
        color: '#facc15'
      },
      {
        id: 'teleport',
        name: 'Blink / Teleport',
        description: 'Menerobos dimensi ruang seketika 120 pixel ke arah hadapan.',
        role: 'MAGICIAN',
        unlockLevel: 10,
        manaCost: 25,
        cooldown: 4.5,
        currentCooldown: 0,
        iconSymbol: '🌀',
        color: '#a855f7'
      },
      {
        id: 'time_dilation',
        name: 'Abnormal: Time Dilation',
        description: 'Bakat Abnormal Anime: Memperlambat aliran waktu dunia dan cooldown mantra seketika reset!',
        role: 'MAGICIAN',
        unlockLevel: 12,
        manaCost: 50,
        cooldown: 20.0,
        currentCooldown: 0,
        iconSymbol: '⏳',
        color: '#ec4899',
        isAbnormal: true
      }
    ]
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
        description: 'Bakat Abnormal Anime (Killua/Solo Leveling): Kecepatan cahaya, auto-dodge semua serangan!',
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
