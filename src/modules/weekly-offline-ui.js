/* Explicit preparation and local weekly entry; no offline Supabase login. */
(function () {
    const CACHE = 'weekly-shell-v1', ACCOUNTS = 'weekly-offline:accounts:v1';
    const api = app.weeklyOffline = {
        async prepare() {
            if (!navigator.serviceWorker || !window.caches) throw new Error('Trình duyệt này chưa hỗ trợ mở lại Offline.');
            await navigator.serviceWorker.register('./weekly-offline-sw.js');
            await navigator.serviceWorker.ready;
            const urls = [...document.querySelectorAll('script[src],script[data-src],link[rel="stylesheet"]')].map(node => node.src || node.dataset.src || node.href).map(value => new URL(value, location.href)).filter(url => url.origin === location.origin && url.pathname.startsWith('/src/')).map(url => url.href);
            urls.push(new URL('/index.html', location.href).href, new URL('/src/icons/rank-laurel.svg', location.href).href);
            const cache = await caches.open(CACHE);
            await cache.addAll([...new Set(urls)]);
            // Cache success precedes enabling writes and advertising readiness.
            await app.classroom.setOffline(true);
            const user = app.data.currentUser;
            const accounts = JSON.parse(localStorage.getItem(ACCOUNTS) || '[]').filter(item => item.id !== app.classroom.owner);
            accounts.push({ id: app.classroom.owner, username: user.username, name: user.fullname || user.username });
            localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
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
        },
        async resume(account) {
            if (!await window.waitForGameAssets?.()) throw new Error('Chưa tải đủ giao diện Offline.');
            const saved = JSON.parse(localStorage.getItem(`weekly-offline:v1:${account.id}`) || 'null');
            if (!saved || !Array.isArray(saved.roster)) throw new Error('Chưa chuẩn bị dữ liệu Offline cho tài khoản này.');
            window.weeklyOfflineEntry = true;
            app.data.shutdownRealtime?.();
            app.data.currentUser = { id: account.id, auth_user_id: saved.authUserId, username: account.username, fullname: account.name, role: 'admin' };
            app.data.users = saved.roster;
            const repo = app.classroom.activate();
            await repo.setOffline(true);
            document.body.classList.add('weekly-local-entry');
            app.admin.openAdmin('quests'); app.admin.switchQuestMode('weekly');
            document.getElementById('quest-management-back').textContent = '← Đăng nhập Online';
        },
        initEntry() {
            let accounts;
            try { accounts = JSON.parse(localStorage.getItem(ACCOUNTS) || '[]'); } catch (_) { return; }
            if (!Array.isArray(accounts) || !accounts.length) return;
            const region = document.createElement('div'); region.className = 'weekly-offline-entry';
            const select = document.createElement('select'); select.setAttribute('aria-label', 'Tài khoản Thi đua tuần Offline');
            for (const account of accounts) select.add(new Option(account.name || account.username, account.id));
            const button = document.createElement('button'); button.type = 'button'; button.id = 'weekly-open-offline'; button.textContent = 'Mở Thi đua tuần Offline';
            button.onclick = async () => {
                button.disabled = true;
                try { await this.resume(accounts.find(account => account.id === select.value)); }
                catch (error) { app.auth.showAuthFeedback('login-error', error.message, []); }
                finally { button.disabled = false; }
            };
            region.append(select, button); document.getElementById('login-form').append(region);
        }
    };
    // A local copy unlocks this workspace only. Other Admin/game entry points
    // remain unavailable; server mutations require the verified sync path.
    for (const [target, name, allowed] of [[app.admin, 'openAdmin', value => value === 'quests'], [app.admin, 'switchTab', value => value === 'quests'], [app.admin, 'switchQuestMode', value => value === 'weekly'], [app.router, 'open', value => value === 'login-screen']]) {
        const original = target[name];
        target[name] = function (value, ...args) { if (window.weeklyOfflineEntry && !allowed(value)) return; return original.call(this, value, ...args); };
    }
    const back = app.admin.returnToQuestManagement, close = app.treasure.close;
    app.admin.returnToQuestManagement = function () { if (window.weeklyOfflineEntry) location.assign('/'); else back.call(this); };
    app.treasure.close = function (...args) { if (window.weeklyOfflineEntry) location.assign('/'); else close.apply(this, args); };
    document.addEventListener('DOMContentLoaded', () => api.initEntry(), { once: true });
})();
