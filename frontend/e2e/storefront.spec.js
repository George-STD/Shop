const { test, expect } = require('@playwright/test');
const {
  PRODUCT,
  installAuthenticatedSession,
  installApiFixtures,
} = require('./fixtures');

test.describe('critical storefront paths', () => {
  test('completes the checkout funnel with one idempotent order request', async ({ page }) => {
    await installAuthenticatedSession(page);
    await installApiFixtures(page);

    await page.goto('/products');
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible();

    await page.getByRole('button', { name: new RegExp(`أضف للسلة.*${PRODUCT.name}`) }).first().click();
    await page.getByRole('button', { name: /سلة التسوق/ }).click();

    const cartDialog = page.getByRole('dialog', { name: /سلة التسوق/ });
    await expect(cartDialog).toContainText(PRODUCT.name);
    await expect(cartDialog.getByText('1', { exact: true })).toBeVisible();
    await cartDialog.getByRole('link', { name: /إتمام الشراء/ }).click();

    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByLabel(/الاسم الأول/)).toHaveValue('اختبار');
    await page.getByLabel(/الهاتف/).fill('01012345678');
    await page.getByLabel(/المحافظة/).selectOption({ label: 'القاهرة' });
    await page.getByLabel(/العنوان التفصيلي/).fill('شارع الاختبار 1');
    await page.getByRole('button', { name: 'التالي' }).click();
    await page.getByRole('button', { name: 'التالي' }).click();

    const orderRequest = page.waitForRequest((request) => request.url().endsWith('/api/orders') && request.method() === 'POST');
    await page.getByRole('button', { name: 'تأكيد الطلب' }).click();
    const request = await orderRequest;
    const payload = request.postDataJSON();

    expect(payload.idempotencyKey).toMatch(/^chk_/);
    expect(payload.items).toHaveLength(1);
    await expect(page).toHaveURL(/\/account\/orders\?success=true&order=E2E-1001/);
  });

  test('rolls back an optimistic wishlist mutation when the API fails', async ({ page }) => {
    await installAuthenticatedSession(page);
    await installApiFixtures(page, { wishlistMode: 'failure', wishlistDelay: 1500 });

    await page.goto('/products');
    const wishlistButton = page.locator('article').filter({ hasText: PRODUCT.name }).locator('button').first();
    await wishlistButton.click();

    await expect(wishlistButton).toHaveAttribute('aria-busy', 'true');
    await expect(wishlistButton).toHaveClass(/!bg-red-500/);
    await expect(wishlistButton).toHaveAttribute('aria-label', /إضافة إلى قائمة الأمنيات|أضف للأمنيات/);
    await expect(wishlistButton).not.toHaveAttribute('aria-busy', 'true', { timeout: 3000 });
    await expect(wishlistButton).not.toHaveClass(/!bg-red-500/);
  });

  test('captures product-page LCP and CLS observations', async ({ page }, testInfo) => {
    await installAuthenticatedSession(page);
    await installApiFixtures(page);
    await page.addInitScript(() => {
      window.__webVitals = { cls: 0, lcp: 0 };
      if (PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) window.__webVitals.cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      }
      if (PerformanceObserver.supportedEntryTypes.includes('largest-contentful-paint')) {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const last = entries[entries.length - 1];
          if (last) window.__webVitals.lcp = last.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      }
    });

    await page.goto(`/product/${PRODUCT.slug}`);
    await expect(page.getByRole('heading', { name: PRODUCT.name })).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const vitals = await page.evaluate(() => window.__webVitals);
    console.log(`WEB_VITALS cls=${vitals.cls} lcp=${vitals.lcp}`);
    await testInfo.attach('web-vitals.json', {
      body: JSON.stringify(vitals, null, 2),
      contentType: 'application/json',
    });

    expect(vitals.cls).toBeLessThan(0.1);
    expect(vitals.lcp).toBeGreaterThan(0);
  });
});
