// D1: app.daily — năng lượng, quà hằng ngày, chào mèo robot, addStars (tách khỏi main.js).
;(function (root) {
    if (!root.app) root.app = {};
    const app = root.app;
    app.daily = {
        todayKey() {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date()).split('/').reverse().join('-');
        },
        addStars(user, amount) {
            if (!user || !amount) return;
            user.stars = (user.stars || 0) + amount;
            user.total_stars_earned = (user.total_stars_earned || 0) + amount;
        },
        getEnergy(user) {
            if (!user) return 5;
            const today = this.todayKey();
            if (user.energy_date !== today) {
                user.energy = 5;
                user.energy_date = today;
            }
            return Number(user.energy ?? 5);
        },
        renderEnergy() {
            const el = document.getElementById('energy-display');
            if (!el) return;
            const user = app.data.currentUser;
            if (!user || user.role?.toLowerCase() === 'admin') { el.style.display = 'none'; return; }
            const energy = this.getEnergy(user);
            let hearts = '';
            for (let i = 0; i < 5; i++) hearts += `<span class="heart ${i < energy ? 'heart--full' : 'heart--empty'}">${i < energy ? '❤️' : '🤍'}</span>`;
            el.innerHTML = `<span class="energy-label">Năng lượng</span> ${hearts}`;
            el.style.display = 'flex';
        },
        spendEnergy(user) {
            const current = this.getEnergy(user);
            if (current <= 0) return false;
            user.energy = current - 1;
            user.energy_date = this.todayKey();
            if (window.supabase && user.id) {
                supabaseClient.from('game_users').update({ energy: user.energy, energy_date: user.energy_date }).eq('id', user.id).then(() => {});
            }
            this.renderEnergy();
            return true;
        },
        giftClaimedToday(user) {
            return Boolean(user && user.daily_gift_date === this.todayKey());
        },
        rollGift() {
            const r = Math.random();
            if (r < 0.45) return { stars: 2, label: '2 Sao ⭐' };
            if (r < 0.75) return { stars: 3, label: '3 Sao ⭐' };
            if (r < 0.95) return { stars: 5, label: '5 Sao ⭐' };
            return { stars: 10, label: '10 Sao ⭐' };
        },
        shiftDate(dateKey, days) {
            const d = new Date(dateKey + 'T12:00:00');
            d.setDate(d.getDate() + days);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        },
        // Thưởng hằng ngày: 1 sao cho ngày có ≥1 lượt luyện tập; +5 sao nếu đủ chuỗi 5 ngày liên tiếp.
        registerPracticeDay(user) {
            if (!user) return { daily: false, stars: 0 };
            const today = this.todayKey();
            if (user.last_practice_date === today) {
                return { daily: false, streak: user.practice_streak || 0, bonus: 0, stars: 0 };
            }
            this.addStars(user, 1);
            const yesterday = this.shiftDate(today, -1);
            const streak = (user.last_practice_date === yesterday) ? (user.practice_streak || 0) + 1 : 1;
            user.last_practice_date = today;
            user.practice_streak = streak;
            let bonus = 0;
            let streakDays = streak;
            if (streak >= 5) {
                bonus = 5;
                this.addStars(user, 5);
                streakDays = 5;
                user.practice_streak = 0; // bắt đầu chuỗi mới
            }
            if (window.supabase && user.id) {
                supabaseClient.from('game_users').update({
                    stars: user.stars,
                    total_stars_earned: user.total_stars_earned || 0,
                    last_practice_date: user.last_practice_date,
                    practice_streak: user.practice_streak
                }).eq('id', user.id).then(() => {});
            }
            return { daily: true, streak: streakDays, bonus, stars: 1 + bonus };
        },
        async claimDailyGift() {
            const user = app.data.currentUser;
            if (!user || this.giftClaimedToday(user)) return;
            const gift = this.rollGift();
            app.daily.addStars(user, gift.stars);
            user.daily_gift_date = this.todayKey();
            user.daily_gift_streak = (user.daily_gift_streak || 0) + 1;
            if (window.supabase && user.id) {
                await supabaseClient.from('game_users').update({
                    stars: user.stars, total_stars_earned: user.total_stars_earned || 0, daily_gift_date: user.daily_gift_date, daily_gift_streak: user.daily_gift_streak
                }).eq('id', user.id);
            }
            this.renderGiftNotice();
            app.auth.updateHeader();
            if (app.quest && typeof app.quest.render === 'function') app.quest.render();
            app.playSound('correct');
            if (window.confetti) confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
            alert(`Chúc mừng! Bạn nhận được ${gift.label} từ hộp quà hôm nay!`);
            return gift;
        },
        showGreeting() {
            const user = app.data.currentUser;
            if (!user) return;
            const catWrapper = document.getElementById('map-cat-wrapper');
            if (!catWrapper) return;
            const existing = document.getElementById('map-greet-bubble');
            if (existing) existing.remove();
            const bubble = document.createElement('div');
            bubble.id = 'map-greet-bubble';
            bubble.className = 'map-greet-bubble';
            bubble.innerHTML = `Chào mừng trở lại,<br><b>${app.data.sanitizeHTML(user.fullname)}</b>!`;
            catWrapper.appendChild(bubble);
            app.playSound('correct');
            setTimeout(() => bubble.remove(), 4000);
        },
        onMapEnter() {
            const user = app.data.currentUser;
            this.renderEnergy();
            this.renderGiftNotice();
            if (!user || user.role?.toLowerCase() === 'admin') return;
            this.showGreeting();
        },
        renderGiftNotice() {
            const el = document.getElementById('gift-notice');
            if (!el) return;
            const user = app.data.currentUser;
            if (!user || user.role?.toLowerCase() === 'admin' || this.giftClaimedToday(user)) {
                el.style.display = 'none';
            } else {
                el.style.display = 'flex';
            }
        }
    };
})(typeof globalThis !== 'undefined' ? globalThis : this);
