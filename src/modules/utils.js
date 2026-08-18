// D1: app.utils — các tiện ích chung (tách khỏi main.js).
;(function (root) {
    if (!root.app) root.app = {};
    root.app.utils = {
        async loadScript(src, globalVar) {
            if (window[globalVar]) return true;
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = () => resolve(true);
                script.onerror = () => {
                    console.error(`Failed to load ${src}`);
                    resolve(false); // resolve false instead of reject to avoid unhandled promise crashes
                };
                document.head.appendChild(script);
            });
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
