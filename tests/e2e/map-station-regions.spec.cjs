const { test, expect } = require('@playwright/test');

for (const viewport of [{width:1280,height:720},{width:1440,height:900},{width:1024,height:768}]) {
  test(`Bấm công trình trên bản đồ vào đúng trạm ${viewport.width}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({contentType:'application/javascript',body:''}));
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = {username:'demo-admin',fullname:'Giáo viên',role:'admin'};
      document.getElementById("admin-station").style.display = "flex";
      document.getElementById("quest-station").style.display = "none";
      app.auth.updateHeader();
      app.router.open('map-screen');
      window.visitedStations = [];
      app.router.animateCatTo = station => window.visitedStations.push(station.id || station.dataset.subject);
    });
    const bg = page.locator('.map-bg');
    await expect.poll(() => bg.evaluate(img => img.naturalWidth)).toBe(1672);
    const rect = await bg.boundingBox();
    const scale = Math.max(rect.width/1672, rect.height/941);
    const point = (x,y) => ({x:rect.x+(rect.width-1672*scale)/2+x*scale,y:rect.y+(rect.height-941*scale)/2+y*scale});
    for (const [id,x,y] of [['math',390,210],['vietnamese',260,600],['exam-station',810,260],['admin-station',1050,320],['shop-station',1280,390],['treasure-station',1370,630]]) {
      await page.mouse.click(point(x,y).x,point(x,y).y);
      await expect.poll(() => page.evaluate(() => window.visitedStations.at(-1))).toBe(id);
    }
    await page.mouse.click(point(830,550).x,point(830,550).y);
    expect(await page.evaluate(() => window.visitedStations.length)).toBe(6);
    await page.locator('.station-math').focus();
    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => window.visitedStations.at(-1))).toBe('math');
    await page.locator('.station-math').click();
    expect(await page.evaluate(() => window.visitedStations.at(-1))).toBe('math');
    await page.evaluate(() => {
      app.data.currentUser = {username:'demo-student',fullname:'Học sinh',role:'student'};
      document.getElementById('admin-station').style.display = 'none';
      document.getElementById('quest-station').style.display = 'flex';
      app.auth.updateHeader();
      window.visitedStations = [];
    });
    await page.mouse.click(point(1050,320).x,point(1050,320).y);
    expect(await page.evaluate(() => window.visitedStations)).toEqual(['quest-station']);
    await page.evaluate(() => {
      document.querySelector('.station-math').style.pointerEvents = 'none';
      window.visitedStations = [];
    });
    await page.mouse.click(point(390,210).x,point(390,210).y);
    expect(await page.evaluate(() => window.visitedStations)).toEqual([]);
    await page.screenshot({path:`test-results/ui-review/map-regions-${viewport.width}.png`});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  });
}

test.describe('Thao tác chạm trên tablet', () => {
  test.use({ viewport: {width:1024,height:768}, hasTouch:true });
  test('chạm kim tự tháp mở phần luyện Toán', async ({page}) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({contentType:'application/javascript',body:''}));
    await page.goto('/');
    await page.evaluate(() => {
      app.data.currentUser = {username:'demo-student',fullname:'Học sinh',role:'student',classlevel:'4'};
      app.auth.updateHeader();
      app.router.open('map-screen');
    });
    const bg = page.locator('.map-bg');
    await expect.poll(() => bg.evaluate(img => img.naturalWidth)).toBe(1672);
    const rect = await bg.boundingBox();
    const scale = Math.max(rect.width/1672, rect.height/941);
    await page.touchscreen.tap(rect.x+(rect.width-1672*scale)/2+390*scale,rect.y+(rect.height-941*scale)/2+210*scale);
    await expect(page.locator('#game-screen')).toHaveClass(/active/);
    await expect(page.locator('#game-config-title')).toHaveText('VUI HỌC TOÁN');
    expect(errors).toEqual([]);
  });
});
