// Small lifecycle registry for browser resources that must follow a screen or
// interaction scope. It deliberately has no app-specific knowledge so modules
// can register listeners/timers without introducing a framework dependency.
;(function (root) {
    const app = root.app || (root.app = {});
    const scopes = new Map();
    const schedule = root.setTimeout ? root.setTimeout.bind(root) : setTimeout;
    const cancel = root.clearTimeout ? root.clearTimeout.bind(root) : clearTimeout;
    const repeat = root.setInterval ? root.setInterval.bind(root) : setInterval;
    const stopRepeat = root.clearInterval ? root.clearInterval.bind(root) : clearInterval;

    function getScope(name) {
        const key = String(name || 'default');
        if (!scopes.has(key)) scopes.set(key, new Set());
        return scopes.get(key);
    }

    function register(name, disposer) {
        const scope = getScope(name);
        scope.add(disposer);
        return disposer;
    }

    function listen(name, target, type, handler, options) {
        if (!target || typeof target.addEventListener !== 'function' || typeof handler !== 'function') return null;
        target.addEventListener(type, handler, options);
        return register(name, () => target.removeEventListener(type, handler, options));
    }

    function timeout(name, handler, delay = 0) {
        if (typeof handler !== 'function') return null;
        let disposer;
        const timerId = schedule(() => {
            if (disposer) getScope(name).delete(disposer);
            handler();
        }, Math.max(0, Number(delay) || 0));
        disposer = register(name, () => cancel(timerId));
        return timerId;
    }

    function interval(name, handler, delay = 0) {
        if (typeof handler !== 'function') return null;
        const timerId = repeat(handler, Math.max(1, Number(delay) || 1));
        register(name, () => stopRepeat(timerId));
        return timerId;
    }

    function cleanup(name) {
        const key = String(name || 'default');
        const scope = scopes.get(key);
        if (!scope) return 0;
        const disposers = [...scope];
        scope.clear();
        disposers.forEach(dispose => {
            try { dispose(); } catch (_) { /* cleanup must continue */ }
        });
        scopes.delete(key);
        return disposers.length;
    }

    function cleanupAll() {
        return [...scopes.keys()].reduce((count, name) => count + cleanup(name), 0);
    }

    app.lifecycle = {
        listen,
        timeout,
        interval,
        cleanup,
        cleanupAll,
        getActiveCount(name) { return scopes.get(String(name || 'default'))?.size || 0; }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
