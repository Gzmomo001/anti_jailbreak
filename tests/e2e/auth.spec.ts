import { expect, test } from "@playwright/test";

test("login and registration controls are accessible", async ({ page }) => {
  await page.goto("/login");

  await expect(
    page.getByRole("heading", { name: "欢迎回来" }),
  ).toBeVisible();
  await expect(page.getByLabel("邮箱")).toHaveAttribute(
    "autocomplete",
    "username",
  );
  await expect(page.getByRole("textbox", { name: "密码" })).toHaveAttribute(
    "autocomplete",
    "current-password",
  );

  await page.getByRole("button", { name: "注册" }).click();

  await expect(
    page.getByRole("heading", { name: "创建 Gatehouse 账户" }),
  ).toBeVisible();
  await expect(page.getByLabel("用户名")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "密码" })).toHaveAttribute(
    "autocomplete",
    "new-password",
  );

  await page.getByLabel("显示密码").click();
  await expect(page.getByRole("textbox", { name: "密码" })).toHaveAttribute(
    "type",
    "text",
  );
});

test("authentication screen fits without horizontal overflow", async ({
  page,
}) => {
  await page.goto("/login");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );

  expect(overflow).toBe(false);
  await expect(page.getByRole("button", { name: "进入工作台" })).toBeVisible();
});
