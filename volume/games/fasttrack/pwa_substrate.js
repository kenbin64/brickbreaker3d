/**
 * pwa_substrate.js — PLATFORM Dimension
 *
 * Dimensional Level : PLATFORM (outermost substrate)
 * LWHX             : L=window.innerWidth, W=window.innerHeight, H=1, X=1 (this page)
 * Points (sub-dims) : { mobileDetector, serviceWorker, installBanner }
 * Parent Dimension  : Browser / OS
 * Peers             : board_renderer.js, camera_substrate.js (loaded after this)
 *
 * Physics enforced here:
 *   - Mobile CSS only manifests when the mobile condition is observed
 *   - Service worker registered once per scope; controller changes trigger clean reload
 *   - Install banner shown at most once per session (localStorage gate)
 *   - Already-installed players never see the banner (X=0 for that sub-dim)
 *
 * Synthesis: z = browser · pwa_substrate → installable, offline-capable game platform
 * Extraction: z = platform / mobileDetector → yields MOBILE_MODE boolean for other substrates
 */

'use strict';

// ─── MOBILE DETECTION ────────────────────────────────────────────────────────
// Exposed on window so peer substrates can extract: z = platform / mobileDetector
const urlParams = new URLSearchParams(window.location.search);
const MOBILE_MODE = urlParams.get('mobile') === 'true' ||
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
window.MOBILE_MODE = MOBILE_MODE; // export to shared dimensional space

MOBILE_MODE && (() => {
    const mobileCSS = document.createElement('link');
    mobileCSS.rel = 'stylesheet';
    mobileCSS.href = 'assets/css/mobile.css';
    document.head.appendChild(mobileCSS);
    document.addEventListener('DOMContentLoaded', () =>
        document.body.classList.add('mobile-mode')
    );
})();

// ─── IFRAME NOTIFICATION ─────────────────────────────────────────────────────
(window.parent !== window) && window.addEventListener('load', () =>
    window.parent.postMessage({ type: 'game-ready' }, '*')
);

// ─── PWA SUPPORT ─────────────────────────────────────────────────────────────
(function initPWA() {
    if ('serviceWorker' in navigator) {
        let refreshed = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshed) {
                refreshed = true;
                console.log('[PWA] SW controller changed — reloading for clean start');
                window.location.reload();
            }
        });
        navigator.serviceWorker.register('/fasttrack/sw.js', { scope: '/fasttrack/' })
            .then(reg => {
                reg.update();
                console.log('[PWA] Service worker registered — network-first, scope:', reg.scope);
            })
            .catch(err => console.log('[PWA] SW registration failed:', err));
    }

    const platform = {
        isIOS:        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
        isAndroid:    /Android/.test(navigator.userAgent),
        isWindows:    /Windows/.test(navigator.userAgent),
        isMac:        /Mac/.test(navigator.userAgent),
        isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
                      window.navigator.standalone === true
    };

    if (platform.isStandalone) {
        console.log('[PWA] Running as installed app');
        return;
    }

    let deferredPrompt = null;

    function createInstallBanner() {
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <style>
                #pwa-install-banner {
                    position: fixed; bottom: 20px; left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: linear-gradient(135deg, rgba(30,30,60,0.98), rgba(50,50,80,0.98));
                    padding: 16px 24px; border-radius: 16px;
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                    z-index: 10100; display: flex; align-items: center; gap: 16px;
                    opacity: 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    backdrop-filter: blur(20px); max-width: 90vw;
                }
                #pwa-install-banner.show { transform: translateX(-50%) translateY(0); opacity: 1; }
                #pwa-install-banner .icon { font-size: 36px; }
                #pwa-install-banner .text { color: #fff; }
                #pwa-install-banner .title { font-weight: 600; font-size: 15px; margin-bottom: 4px; }
                #pwa-install-banner .subtitle { font-size: 12px; color: rgba(255,255,255,0.7); }
                #pwa-install-banner .actions { display: flex; gap: 10px; margin-left: auto; }
                #pwa-install-banner button {
                    padding: 10px 20px; border: none; border-radius: 10px;
                    cursor: pointer; font-weight: 600; font-size: 13px;
                    transition: transform 0.2s, background 0.2s;
                }
                #pwa-install-banner button:hover { transform: scale(1.05); }
                #pwa-install-banner .install-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
                #pwa-install-banner .dismiss-btn { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
                @media (max-width: 500px) {
                    #pwa-install-banner { flex-direction: column; text-align: center; gap: 12px; }
                    #pwa-install-banner .actions { margin-left: 0; }
                }
            </style>
            <div class="icon">🎮</div>
            <div class="text">
                <div class="title">Install Fast Track</div>
                <div class="subtitle" id="install-subtitle">Play offline, faster loading</div>
            </div>
            <div class="actions">
                <button class="dismiss-btn" onclick="window.dismissInstall()">Later</button>
                <button class="install-btn" onclick="window.triggerInstall()">Install</button>
            </div>
        `;
        document.body.appendChild(banner);
        return banner;
    }

    function updateInstructions() {
        const subtitle = document.getElementById('install-subtitle');
        if (!subtitle) return;
        if (platform.isIOS) {
            subtitle.innerHTML = 'Tap <span style="font-size:16px">⬆️</span> Share → Add to Home Screen';
        } else if (platform.isAndroid) {
            subtitle.textContent = 'Add to home screen for quick access';
        } else if (platform.isWindows) {
            subtitle.textContent = 'Install as Windows app';
        } else if (platform.isMac) {
            subtitle.textContent = 'Install as Mac app';
        } else {
            subtitle.textContent = 'Install as desktop app';
        }
    }

    function showInstallBanner() {
        if (localStorage.getItem('pwa-install-dismissed-v2')) return;
        let banner = document.getElementById('pwa-install-banner');
        if (!banner) banner = createInstallBanner();
        updateInstructions();
        setTimeout(() => banner.classList.add('show'), 100);
    }

    window.dismissInstall = function() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.classList.remove('show');
        localStorage.setItem('pwa-install-dismissed-v2', 'true');
    };

    window.triggerInstall = async function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('[PWA] Install outcome:', outcome);
            deferredPrompt = null;
        } else if (platform.isIOS) {
            alert('To install:\n\n1. Tap the Share button ⬆️\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"');
        }
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.classList.remove('show');
    };

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] Install prompt available');
        setTimeout(showInstallBanner, 5000);
    });

    if (platform.isIOS) {
        setTimeout(showInstallBanner, 8000);
    }

    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed!');
        const banner = document.getElementById('pwa-install-banner');
        if (banner) banner.classList.remove('show');
        deferredPrompt = null;
    });
})();

