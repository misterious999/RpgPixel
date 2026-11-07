export interface ControlConfig {
  bottomOffset: number; // Pixels from bottom screen edge (in landscape)
  sideMargin: number;   // Pixels from left/right screen edge (in landscape)
  buttonScale: number;  // 0.85, 1.0, 1.2
  opacity: number;      // 0.4 to 1.0
}

const STORAGE_KEY = 'rpg_control_config_landscape_v2';

export const DEFAULT_CONTROL_CONFIG: ControlConfig = {
  bottomOffset: 58,   // Perfect ergonomic height in mobile landscape!
  sideMargin: 58,     // Perfect thumb reach from bezel
  buttonScale: 1.0,
  opacity: 0.85
};

export class ControlSettingsManager {
  private static instance: ControlConfig = { ...DEFAULT_CONTROL_CONFIG };

  public static get(): ControlConfig {
    return this.instance;
  }

  public static load(): ControlConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.instance = { ...DEFAULT_CONTROL_CONFIG, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load control config:', e);
    }
    return this.instance;
  }

  public static save(config: Partial<ControlConfig>): void {
    this.instance = { ...this.instance, ...config };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.instance));
    } catch (e) {
      console.warn('Could not save control config:', e);
    }
  }

  public static reset(): ControlConfig {
    this.instance = { ...DEFAULT_CONTROL_CONFIG };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
    return this.instance;
  }
}
