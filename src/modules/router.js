// D1: app.router — điều hướng giữa các màn hình (tách khỏi main.js).
;(function (root) {
    if (!root.app) root.app = {};
    const app = root.app;
    const routeAssetSelectors = {
        'map-screen': ['.map-bg', '.station-img', '#map-cat'],
        'game-config-view': ['.cat-avatar', '#game-start-btn img'],
        'game-play-view': ['#play-cat-img', '#submit-ans-img'],
        'exam-select-screen': ['.subject-box img', '.exam-guide-mascot', '.btn-start-massive img'],
        'shop-modal': ['.shop-tabs img']
    };

    function getRouteImages(routeId) {
        const container = document.getElementById(routeId);
        const selectors = routeAssetSelectors[routeId];
        if (!container || !selectors) return { container, images: [] };
        const images = [...new Set(selectors.flatMap(selector => [...container.querySelectorAll(selector)]))];
        return { container, images };
    }

    function getAssetStatus(container) {
        let status = container.querySelector(':scope > .route-asset-status');
        if (status) return status;
        status = document.createElement('div');
        status.className = 'route-asset-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.innerHTML = '<span class="route-asset-status__spinner" aria-hidden="true"></span><span>Đang chuẩn bị hình ảnh…</span>';
        status.hidden = true;
        container.appendChild(status);
        return status;
    }

    function markButtonImageFallback(image) {
        image.closest('.asset-button')?.classList.add('asset-button--image-fallback');
    }

    function waitForImage(image) {
        const button = image.closest('.asset-button');
        if (image.complete) {
            if (image.naturalWidth > 0) button?.classList.remove('asset-button--image-fallback');
            else markButtonImageFallback(image);
            return Promise.resolve(image.naturalWidth > 0);
        }

        return new Promise(resolve => {
            const finish = loaded => {
                if (loaded) button?.classList.remove('asset-button--image-fallback');
                else markButtonImageFallback(image);
                resolve(loaded);
            };
            image.addEventListener('load', () => finish(true), { once: true });
            image.addEventListener('error', () => finish(false), { once: true });
        });
    }

    function prepareRouteAssets(routeId, showStatus) {
        const { container, images } = getRouteImages(routeId);
        if (!container || !routeAssetSelectors[routeId]) return Promise.resolve([]);

        images.forEach(image => {
            image.loading = 'eager';
            image.fetchPriority = 'high';
        });

        const hasPendingImages = images.some(image => !image.complete);
        let status;
        if (showStatus) {
            status = getAssetStatus(container);
            container.setAttribute('aria-busy', String(hasPendingImages));
            status.hidden = !hasPendingImages;
        }

        if (!hasPendingImages) {
            images.forEach(image => {
                if (image.complete && image.naturalWidth === 0) markButtonImageFallback(image);
            });
            return Promise.resolve(images.map(image => image.naturalWidth > 0));
        }

        const settled = Promise.all(images.map(waitForImage));
        let timeoutId;
        const timeout = new Promise(resolve => {
            timeoutId = window.setTimeout(() => {
                images.filter(image => !image.complete).forEach(markButtonImageFallback);
                resolve(images.map(image => image.naturalWidth > 0));
            }, 8000);
        });

        return Promise.race([settled, timeout]).then(result => {
            window.clearTimeout(timeoutId);
            if (showStatus) {
                container.setAttribute('aria-busy', 'false');
                status.hidden = true;
            }
            return result;
        });
    }

    app.router = {
        open(screenId) {
            const target = document.getElementById(screenId);
            if (!target) return;
            prepareRouteAssets(screenId, true);
            app.game?.stopTimers?.();
            app.exam?.stopTimer?.();
            app.admin?.stopTeamCompetitionBoardTimer?.();
            app.teamCompetition?.clearPlayTimer?.();
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            target.classList.add('active');
        },
        openGameView(viewId) {
            const target = document.getElementById(viewId);
            if (!target) return;
            prepareRouteAssets(viewId, true);
            app.game?.stopTimers?.();
            app.exam?.stopTimer?.();
            app.admin?.stopTeamCompetitionBoardTimer?.();
            app.teamCompetition?.clearPlayTimer?.();
            document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
            target.classList.add('active');
        },
        prefetch(routeId) {
            return prepareRouteAssets(routeId, false);
        },
        prepareAssets(routeId) {
            return prepareRouteAssets(routeId, true);
        },
        animateCatTo(el, callback) {
            const catWrapper = document.getElementById('map-cat-wrapper');
            if (!catWrapper) return callback();

            // Get target top and left from inline styles directly since they are percentage based
            // But they might be like top: 22%; left: 51%;
            catWrapper.style.top = el.style.top;
            catWrapper.style.left = el.style.left;

            setTimeout(() => {
                callback();
                // Reset cat to default position if user goes back
                setTimeout(() => {
                    catWrapper.style.top = '50%';
                    catWrapper.style.left = '50%';
                }, 500);
            }, 800);
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
