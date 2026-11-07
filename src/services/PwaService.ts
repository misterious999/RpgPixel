export class PwaService {
  private static deferredPrompt: any = null;
  public static isInstallable: boolean = false;
  public static isInstalled: boolean = false;
  private static listeners: (() => void)[] = [];

  public static init(): void {
    // Check if already running in standalone PWA mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      this.isInstalled = true;
    }

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            console.log('✅ ServiceWorker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('⚠️ ServiceWorker registration failed:', err);
          });
      });
    }

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
      this.notifyListeners();
      console.log('📱 PWA is ready to install!');
    });

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstallable = false;
      this.isInstalled = true;
      this.notifyListeners();
      console.log('🎉 PWA successfully installed to home screen!');
    });
  }

  public static async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      // If deferredPrompt is not yet available, provide clear instructions
      alert(
        'Untuk memasang sebagai Web App di HP:\n\n' +
        '1. Klik menu titik tiga (⋮) di pojok kanan atas browser Chrome.\n' +
        '2. Pilih "Tambahkan ke Layar Utama" (Add to Home screen) atau "Install Aplikasi".\n' +
        '3. Buka game dari icon di Layar Utama HP Anda untuk bermain fullscreen tanpa address bar!'
      );
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      this.isInstallable = false;
      this.notifyListeners();
      return choiceResult.outcome === 'accepted';
    } catch (e) {
      console.warn('Install prompt error:', e);
      return false;
    }
  }

  public static isFullscreen(): boolean {
    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  public static async toggleFullscreen(): Promise<void> {
    try {
      if (this.isFullscreen()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } else {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen();
        }
        // Lock screen orientation to landscape if supported
        if (screen.orientation && (screen.orientation as any).lock) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            // Orientation lock might fail on some browsers if not permitted
          }
        }
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
    }
  }

  public static subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private static notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
