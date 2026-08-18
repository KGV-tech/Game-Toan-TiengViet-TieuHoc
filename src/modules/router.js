// D1: app.router — điều hướng giữa các màn hình (tách khỏi main.js).
;(function (root) {
    if (!root.app) root.app = {};
    const app = root.app;
    app.router = {
        open(screenId) {
            if (app.game && app.game.hardTimer) clearInterval(app.game.hardTimer);
            if (app.exam && app.exam.examTimer) clearInterval(app.exam.examTimer);
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById(screenId).classList.add('active');
        },
        openGameView(viewId) {
            if (app.game && app.game.hardTimer) clearInterval(app.game.hardTimer);
            if (app.exam && app.exam.examTimer) clearInterval(app.exam.examTimer);
            document.querySelectorAll('.game-view').forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
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
