/**
 * UpdateService
 * Monitors for new app deployments / updated files in the background,
 * and automatically refreshes the game WITHOUT disrupting active gameplay.
 */
export class UpdateService {
  public static currentVersion: string = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'initial';
  public static isUpdateAvailable: boolean = false;
  public static lastActivityTime: number = Date.now();
  private static checkIntervalTimer: any = null;
  private static isReloading: boolean = false;

  // External hooks provided by Game engine
  public static isSafeToReload: () => boolean = () => true;
  public static saveGameBeforeReload: () => Promise<void> | void = () => {};
  public static onUpdateFound: (newVersion: string) => void = () => {};

  public static init(): void {
    console.log(`📦 [UpdateService] Active version: ${this.currentVersion}`);

    // Initial check after 3.5 seconds
    setTimeout(() => {
      this.checkForUpdates();
    }, 3500);

    // Periodic background check every 25 seconds
    this.checkIntervalTimer = setInterval(() => {
      this.checkForUpdates();
    }, 25000);

    // Check immediately when user switches back to this tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.reportActivity();
        this.checkForUpdates();
      } else if (document.visibilityState === 'hidden') {
        // Tab is hidden / user switched apps -> PERFECT safe time to refresh if update is waiting!
        if (this.isUpdateAvailable && !this.isReloading) {
          console.log('🔄 [UpdateService] Tab hidden with update pending. Executing seamless background refresh...');
          this.applyUpdateNow();
        }
      }
    });

    // Listen to Service Worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('⚡ [UpdateService] New ServiceWorker installed and waiting!');
                this.handleUpdateDiscovered('sw-new');
              }
            };
          }
        };
      });
    }

    // Check if we just refreshed from an update
    if (sessionStorage.getItem('rpg2d_just_updated') === 'true') {
      sessionStorage.removeItem('rpg2d_just_updated');
      console.log('🎉 [UpdateService] Game successfully updated to the latest version!');
    }
  }

  /**
   * Called by InputManager or Game loop on any touch/key interaction
   */
  public static reportActivity(): void {
    this.lastActivityTime = Date.now();
  }

  /**
   * Fetches the build version timestamp from /version.json bypassing all caches
   */
  public static async checkForUpdates(): Promise<void> {
    if (this.isReloading) return;

    try {
      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache'
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data && data.version) {
        if (this.currentVersion !== 'initial' && this.currentVersion !== 'dev') {
          if (data.version !== this.currentVersion) {
            console.log(`🚀 [UpdateService] New version detected! Local: ${this.currentVersion} -> Server: ${data.version}`);
            this.handleUpdateDiscovered(data.version);
          }
        } else {
          // Adopt the current server version on initial dev/first run
          this.currentVersion = data.version;
        }
      }
    } catch (err) {
      // Offline or network error; ignore silently
    }
  }

  private static handleUpdateDiscovered(newVersion: string): void {
    if (this.isUpdateAvailable) return;
    this.isUpdateAvailable = true;

    // Immediately trigger safe session backup so 0 progress is lost
    try {
      this.saveGameBeforeReload();
    } catch (e) {
      console.warn('Auto-save before reload error:', e);
    }

    this.onUpdateFound(newVersion);

    // If tab is currently hidden, refresh immediately
    if (document.visibilityState === 'hidden') {
      this.applyUpdateNow();
      return;
    }

    // Otherwise, start an idle monitor loop: if player is idle for 8s and in safe state, refresh smoothly
    this.startIdleRefreshMonitor();
  }

  private static startIdleRefreshMonitor(): void {
    const monitor = setInterval(() => {
      if (this.isReloading) {
        clearInterval(monitor);
        return;
      }

      const idleDuration = Date.now() - this.lastActivityTime;
      const isPlayerIdle = idleDuration >= 8000;
      const isSafe = this.isSafeToReload();

      if (isPlayerIdle && isSafe) {
        clearInterval(monitor);
        console.log('💤 [UpdateService] Player is idle & safe. Performing automatic seamless update...');
        this.applyUpdateNow();
      }
    }, 2000);
  }

  public static stop(): void {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer);
      this.checkIntervalTimer = null;
    }
  }

  /**
   * Executes the refresh, ensuring state is saved and ServiceWorker is updated
   */
  public static async applyUpdateNow(): Promise<void> {
    if (this.isReloading) return;
    this.isReloading = true;
    this.stop();

    try {
      // 1. Save game state
      await this.saveGameBeforeReload();
    } catch (e) {
      console.warn('Error saving game during update:', e);
    }

    // 2. Mark update flag for welcome message after reload
    try {
      sessionStorage.setItem('rpg2d_just_updated', 'true');
    } catch (e) {
      // Ignore sessionStorage errors
    }

    // 3. Skip waiting in ServiceWorker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }

    // 4. Force reload from server
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }
}
