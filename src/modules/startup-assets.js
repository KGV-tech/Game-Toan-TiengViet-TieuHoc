/* Optional-at-login resources load without holding the auth bindings. They
   become required before opening gameplay after successful authentication. */
(function () {
    let resolveTemplates;
    window.gameTemplatesReady = new Promise(resolve => { resolveTemplates = resolve; });
    window.gameStylesReady = Promise.all(
        [...document.querySelectorAll('link[rel="stylesheet"][onload]')]
            .filter(link => link.getAttribute('href').startsWith('./src/'))
            .map(link => new Promise(resolve => {
                if (link.dataset.loadError === 'true') return resolve(false);
                if (link.sheet && link.media === 'all') return resolve(true);
                link.addEventListener('load', () => resolve(true), { once: true });
                link.addEventListener('error', () => resolve(false), { once: true });
            }))
    ).then(results => results.every(Boolean));
    window.waitForGameAssets = async (timeoutMs = 15000) => {
        let timeout;
        try {
            return await Promise.race([
                Promise.all([window.gameTemplatesReady, window.gameStylesReady]).then(results => results.every(Boolean)),
                new Promise(resolve => { timeout = window.setTimeout(() => resolve(false), timeoutMs); })
            ]);
        } finally {
            window.clearTimeout(timeout);
        }
    };
    const load = () => {
        const scripts = [...document.querySelectorAll('script[type="application/x-game-template"]')];
        const pending = scripts.map(source => new Promise(resolve => {
            const script = document.createElement('script');
            script.async = false;
            script.src = source.dataset.src;
            script.addEventListener('load', () => resolve(true), { once: true });
            script.addEventListener('error', () => resolve(false), { once: true });
            document.head.appendChild(script);
        }));
        Promise.all(pending).then(results => resolveTemplates(
            results.every(Boolean)
            && typeof window.Grade4MathTemplates?.generateQuestion === 'function'
            && typeof window.Grade4VietnameseTemplates?.generateQuestion === 'function'
        ));
    };
    // Deferred scripts run while readyState is "interactive", before the DOM
    // event. Starting here would compete with the still-downloading shell.
    if (document.readyState !== 'complete') document.addEventListener('DOMContentLoaded', load, { once: true });
    else load();
})();
