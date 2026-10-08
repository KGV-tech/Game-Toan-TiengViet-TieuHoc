const { test, expect } = require('@playwright/test');
for(const viewport of [{width:1280,height:720},{width:1024,height:768}]) {
  test(`bấm trạm Soạn Đề trên bản đồ ${viewport.width}`,async({page},testInfo)=>{
    await page.setViewportSize(viewport);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({contentType:'application/javascript',body:''}));
    await page.route('**/*.supabase.co/**',route=>route.abort());
    await page.goto('/');
    await page.evaluate(()=>{
      app.data.currentUser={username:'teacher',role:'admin',fullname:'Giáo viên',classlevel:'4'};
      app.auth.updateHeader();app.router.open('map-screen');
    });
    await page.screenshot({path:testInfo.outputPath('map.png')});
    const station=page.locator('.station[data-subject="exam"]');
    expect(await station.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})).toBe(true);
    await station.click({timeout:5000});
    await expect(page.locator('#admin-compose-screen')).toHaveClass(/active/);
    await expect(page.getByRole('region',{name:'Thư viện đề',exact:true})).toBeVisible();
    await page.evaluate(()=>app.router.open('map-screen'));
    await page.getByRole('button',{name:'Quản lý học sinh',exact:true}).click();
    await expect(page.locator('#treasure-modal')).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#treasure-modal')).not.toHaveClass(/active/);
    await page.getByRole('button',{name:'Phiếu học tập · Bài được giao',exact:true}).click();
    await expect(page.locator('#worksheet-classroom-screen')).toHaveClass(/active/);
    expect(errors).toEqual([]);
  });
}
