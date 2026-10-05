/* Offline operations stay inside an authenticated teacher session. */
(function () {
    const CACHE = 'weekly-shell-v2';
    app.weeklyOffline = {
        async prepare() {
            const user = app.data.currentUser;
            if (!app.admin.isAdminUser()) throw new Error('Hãy đăng nhập tài khoản giáo viên trước khi chuẩn bị Offline.');
            const { data, error } = await app.classroom.getClient()?.auth?.getUser?.() || {};
            if (error || !data?.user?.id || data.user.id !== user.auth_user_id || app.data.currentUser !== user) throw new Error('Hãy đăng nhập lại tài khoản giáo viên để xác thực phiên.');
            if (!navigator.serviceWorker || !window.caches) throw new Error('Trình duyệt này chưa hỗ trợ mở lại Offline.');
            await navigator.serviceWorker.register('./weekly-offline-sw.js');
            await navigator.serviceWorker.ready;
            const urls = [...document.querySelectorAll('script[src],script[data-src],link[rel="stylesheet"]')].map(node => node.src || node.dataset.src || node.href).map(value => new URL(value, location.href)).filter(url => url.origin === location.origin && url.pathname.startsWith('/src/')).map(url => url.href);
            urls.push(new URL('/index.html', location.href).href, new URL('/src/icons/rank-laurel.svg', location.href).href);
            const cache = await caches.open(CACHE);
            await cache.addAll([...new Set(urls)]);
            // Cache success precedes enabling writes and advertising readiness.
            if (app.data.currentUser !== user || !app.admin.isAdminUser()) throw new Error('Phiên giáo viên đã thay đổi. Hãy đăng nhập lại.');
            await app.classroom.setOffline(true);
            await navigator.storage?.persist?.();
        },
        status() {
            const repo = app.classroom;
            if (repo.offlineFault) return repo.offlineFault;
            if (repo.offlineSyncing) return 'Đang đồng bộ…';
            if (repo.offlineQueue?.length) return `${repo.offlineMode ? 'Offline · ' : ''}${repo.offlineQueue.length} thao tác chưa đồng bộ · đã lưu trên máy`;
            return repo.offlineMode ? 'Offline · đã lưu trên máy này' : '';
        },
        markup(busy) {
            const repo = app.classroom;
            return `<div class="weekly-offline-controls" aria-label="Chế độ lưu dữ liệu"><button type="button" id="weekly-offline" class="classroom-button classroom-button--quiet" aria-pressed="${!!repo.offlineMode}" ${busy ? 'disabled' : ''}>${repo.offlineMode ? 'Offline ✓' : 'Offline'}</button><button type="button" id="weekly-sync-all" class="classroom-button classroom-button--save" ${busy ? 'disabled' : ''}>Đồng bộ${repo.offlineQueue?.length ? ` (${repo.offlineQueue.length})` : ''}</button><button type="button" id="weekly-export" class="classroom-button classroom-button--quiet" ${busy ? 'disabled' : ''}>Sao lưu</button></div>`;
        },
        bind() {
            const action = async callback => {
                const ui = app.admin.weeklyState();
                if (ui.busy || ui.drawing) return;
                ui.busy = true;
                document.querySelectorAll('.weekly-offline-controls button').forEach(button => { button.disabled = true; });
                try { await callback(); ui.error = ''; }
                catch (error) { ui.error = error.message; }
                finally { ui.busy = false; if (app.admin.isAdminUser() && app.admin.weeklyUI === ui) app.admin.refreshWeeklyAfterAsync(); }
            };
            document.getElementById('weekly-offline').onclick = () => action(async () => {
                if (app.classroom.offlineMode) await app.classroom.setOffline(false);
                else await this.prepare();
            });
            document.getElementById('weekly-sync-all').onclick = () => action(() => app.classroom.syncOffline());
            document.getElementById('weekly-export').onclick = () => {
                const repo = app.classroom.activate();
                const blob = new Blob([localStorage.getItem(`weekly-offline:v1:${repo.owner}`) || JSON.stringify({ owner: repo.owner, weeks: repo.weeks })], { type: 'application/json' });
                const url = URL.createObjectURL(blob), link = document.createElement('a');
                link.href = url; link.download = 'thi-dua-tuan-backup.json'; link.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            };
        }
    };
    // Update an existing worker so an old cached shell cannot restore the removed
    // login bypass. Weekly records and the durable outbox are not cache assets.
    navigator.serviceWorker?.getRegistration().then(registration => registration?.update()).catch(() => {});
})();
