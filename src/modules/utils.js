// D1: app.utils — các tiện ích chung (tách khỏi main.js).
;(function (root) {
    if (!root.app) root.app = {};
    root.app.utils = {
        async loadScript(src, globalVar, timeoutMs = 15000) {
            if (window[globalVar]) return true;
            const timeout = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Number(timeoutMs) : 15000;
            return new Promise(resolve => {
                const script = document.createElement('script');
                let settled = false;
                const finish = value => {
                    if (settled) return;
                    settled = true;
                    window.clearTimeout(timer);
                    script.onload = null;
                    script.onerror = null;
                    resolve(value);
                };
                const timer = window.setTimeout(() => {
                    script.remove();
                    console.error(`Timed out loading ${src}`);
                    finish(false);
                }, timeout);
                script.src = src;
                script.onload = () => finish(true);
                script.onerror = () => {
                    console.error(`Failed to load ${src}`);
                    finish(false); // resolve false instead of reject to avoid unhandled promise crashes
                };
                document.head.appendChild(script);
            });
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
