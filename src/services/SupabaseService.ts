import { createClient, User } from '@supabase/supabase-js';
import { NotificationModal } from '../ui/NotificationModal.ts';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ortqafpygytnebsgupdq.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_sRL486t-wxLbeD1IdEbQCg_mooHTXGQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface GameSaveData {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  costume_id?: number;
  role?: string;
  magician_affinities?: any;
  level?: number;
  exp?: number;
  max_exp?: number;
  hp: number;
  max_hp: number;
  mp?: number;
  max_mp?: number;
  world_x: number;
  world_y: number;
  inventory: any[];
  opened_chests: number[];
  equipped_weapon_id?: string;
  unlocked_weapons?: string[];
  quests?: any[];
}

export class SupabaseService {
  public static currentUser: User | null = null;
  private static onAuthChangeCallbacks: ((user: User | null) => void)[] = [];

  public static async init(): Promise<void> {
    try {
      // Check active session
      const { data } = await supabase.auth.getSession();
      this.currentUser = (data.session?.user as User) || null;

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event: any, session: any) => {
        this.currentUser = (session?.user as User) || null;
        for (const cb of this.onAuthChangeCallbacks) {
          cb(this.currentUser);
        }
      });
    } catch (err) {
      console.warn('Supabase session check failed:', err);
    }
  }

  public static onAuthChange(cb: (user: User | null) => void): void {
    this.onAuthChangeCallbacks.push(cb);
    if (this.currentUser) {
      cb(this.currentUser);
    }
  }

  public static async loginWithGoogle(): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      if (error) {
        console.error('Error logging in with Google:', error.message);
        NotificationModal.alert({
          title: 'GAGAL LOGIN GOOGLE',
          message: 'Terjadi kendala saat login Google: ' + error.message,
          icon: '⚠️',
          variant: 'warning',
          confirmText: 'Tutup'
        });
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  }

  public static async logout(): Promise<void> {
    try {
      try {
        localStorage.removeItem('rpg2d_session_save');
        localStorage.removeItem('rpg2d_guest_id');
      } catch (e) {
        console.warn('Could not clear local storage save:', e);
      }
      await supabase.auth.signOut();
      this.currentUser = null;
      for (const cb of this.onAuthChangeCallbacks) {
        cb(null);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  public static async loadGameSave(userId: string): Promise<GameSaveData | null> {
    try {
      const { data, error } = await supabase
        .from('game_saves')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Could not load game save:', error.message);
        return null;
      }
      return data as GameSaveData | null;
    } catch (err) {
      console.error('Error loading game save:', err);
      return null;
    }
  }

  public static async saveGame(userId: string, saveData: Partial<GameSaveData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('game_saves')
        .upsert({
          user_id: userId,
          ...saveData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving game:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error in saveGame:', err);
      return false;
    }
  }
}
