const { expect } = require('@playwright/test');

async function waitForTeamBoardVisualAssets(page) {
    const canvas = page.locator('#treasure-content-area .team-stadium-canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas.locator('.team-stadium-lane__vehicle')).toHaveCount(8);

    const assetReport = await canvas.evaluate(async element => {
        const elements = [element, ...element.querySelectorAll('*')];
        const backgroundUrls = [...new Set(elements.flatMap(item => {
            const backgroundImage = getComputedStyle(item).backgroundImage;
            return [...backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)].map(match => match[1]);
        }))];

        const backgroundResults = await Promise.all(backgroundUrls.map(src => new Promise(resolve => {
            const image = new Image();
            const finish = loaded => resolve({ src, loaded });
            image.onload = () => finish(true);
            image.onerror = () => finish(false);
            image.src = src;
            if (image.complete) finish(image.naturalWidth > 0);
        })));

        const inlineImages = [...element.querySelectorAll('img')];
        const inlineImageResults = await Promise.all(inlineImages.map(async image => {
            try {
                await image.decode();
            } catch {
                // Report failed image decoding below with the asset path.
            }

            return {
                src: image.currentSrc || image.src,
                loaded: image.complete && image.naturalWidth > 0
            };
        }));

        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        return {
            backgroundUrls,
            failedBackgrounds: backgroundResults.filter(result => !result.loaded).map(result => result.src),
            failedInlineImages: inlineImageResults.filter(result => !result.loaded).map(result => result.src)
        };
    });

    expect(assetReport.backgroundUrls.length, 'team board should use a background image').toBeGreaterThan(0);
    expect(assetReport.failedBackgrounds, 'team board background images should finish loading').toEqual([]);
    expect(assetReport.failedInlineImages, 'team vehicles and overlays should finish decoding').toEqual([]);
}

module.exports = { waitForTeamBoardVisualAssets };
