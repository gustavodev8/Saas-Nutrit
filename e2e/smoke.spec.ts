import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 },
] as const;

for (const viewport of viewports) {
  test(`public pages and protected route gates at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    for (const route of ["/", "/consultas", "/resultados"] as const) {
      await page.goto(route);
      await expect.soft(page.locator("#root > *").first(), `${route} should mount the app`).toBeAttached();
      if (route !== "/") {
        await expect.soft(page.getByRole("heading", { level: 1 }), `${route} should show its page heading`).toBeVisible();
      }
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect.soft(documentWidth, `${route} should fit ${viewport.width}px without horizontal overflow`)
        .toBeLessThanOrEqual(viewport.width);
    }

    await page.goto("/admin");
    await expect.soft(page, "admin must redirect to login without a session").toHaveURL(/\/admin\/login$/);
    await expect.soft(page.getByRole("heading", { name: "Painel Admin" })).toBeVisible();

    await page.goto("/portal/treinos");
    await expect.soft(page, "portal training must redirect to portal login without a session")
      .toHaveURL(/\/portal\/login(?:\?|$)/);

    expect.soft(pageErrors, `uncaught browser errors: ${pageErrors.join(" | ")}`).toEqual([]);
    expect.soft(consoleErrors, `console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
  });
}
