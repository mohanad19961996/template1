import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

/** Tolerance for subpixel / scrollbar differences */
const MAX_HORIZONTAL_OVERFLOW_PX = 24;

const routes: { path: string; mustContain: RegExp }[] = [
  { path: '/en/app/habits', mustContain: /Habits|Build your habits/i },
  { path: '/ar/app/habits', mustContain: /العادات|عاداتك/i },
  { path: '/en/app', mustContain: /Today's Habits|Today/i },
  { path: '/ar/app', mustContain: /عادات اليوم|اليوم/i },
  { path: '/en/app/tasks', mustContain: /Sorted by due date|alongside your habits/i },
  { path: '/ar/app/tasks', mustContain: /مرتبة حسب الموعد|بجانب عاداتك/i },
];

/** Hero text can stay `visibility:hidden` briefly with Framer Motion; assert copy is in the DOM. */
async function expectPageHasText(page: import('@playwright/test').Page, re: RegExp, label: string) {
  await expect
    .poll(
      async () => {
        const body = await page.locator('body').innerText();
        return re.test(body);
      },
      { message: `${label}: expected body to match ${re}`, timeout: 60_000 },
    )
    .toBe(true);
}

function assertNoHorizontalOverflow(page: import('@playwright/test').Page, label: string) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const w = Math.max(doc.clientWidth, window.innerWidth);
    const sw = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
    return { overflow: sw - w, clientWidth: w, scrollWidth: sw };
  }).then(({ overflow, clientWidth, scrollWidth }) => {
    expect(
      overflow,
      `${label}: horizontal overflow (scrollWidth ${scrollWidth} vs clientWidth ${clientWidth})`,
    ).toBeLessThanOrEqual(MAX_HORIZONTAL_OVERFLOW_PX);
  });
}

for (const { path, mustContain } of routes) {
  test(`page renders: ${path}`, async ({ page }) => {
    const res = await page.goto(path, { waitUntil: 'domcontentloaded' });
    expect(res?.ok(), `${path} HTTP ok`).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
    await expectPageHasText(page, mustContain, path);
    await assertNoHorizontalOverflow(page, path);
  });

  test(`main column usable width: ${path}`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await expectPageHasText(page, mustContain, path);
    const vw = await page.evaluate(() => window.innerWidth);
    const mainW = await page.evaluate(() => {
      const main = document.querySelector('main');
      return main ? main.getBoundingClientRect().width : document.body.getBoundingClientRect().width;
    });
    expect(
      mainW,
      `${path}: main (or body) should use most of the viewport (got ${mainW}px of ${vw}px)`,
    ).toBeGreaterThan(vw * 0.45);
  });
}
