// D1: app.safeStorage — truy cập localStorage an toàn khi bị chặn (tách khỏi main.js).
;(function (root) {
    if (!root.app) root.app = {};
    root.app.safeStorage = {
        getItem(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage is blocked:', e);
                return null;
            }
        },
        setItem(key, value) {
            try {
                localStorage.setItem(key, value);
            } catch (e) {
                console.warn('localStorage is blocked:', e);
            }
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
