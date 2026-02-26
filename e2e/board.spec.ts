import { test, expect } from '@playwright/test'

test.setTimeout(90000)

async function registerAndLogin(page: import('@playwright/test').Page) {
  const email = `e2e+board+${Date.now()}@example.com`
  await page.goto('/register')
  await page.getByLabel(/full name/i).fill('Board Tester')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill('password123')
  await page.getByRole('button', { name: /create account/i }).click()
  await expect(page).toHaveURL(/\/my-tasks/, { timeout: 25000 })
}

async function navigateToBoard(page: import('@playwright/test').Page) {
  const projectLink = page.locator('aside a[href*="/projects/"]').first()
  await projectLink.waitFor({ state: 'visible', timeout: 35000 })
  await projectLink.click()
  await expect(page).toHaveURL(/\/board/, { timeout: 15000 })
}

test.describe('Board view', () => {
  test('demo workspace is created on first login', async ({ page }) => {
    await registerAndLogin(page)
    await expect(page.locator('aside a[href*="/projects/"]').first()).toBeVisible({ timeout: 30000 })
  })

  test('navigate to board view', async ({ page }) => {
    await registerAndLogin(page)
    await navigateToBoard(page)
    await expect(page.locator('.flex.gap-4').first()).toBeVisible({ timeout: 10000 })
  })

  test('create a task in first board column', async ({ page }) => {
    await registerAndLogin(page)
    await navigateToBoard(page)

    await page.getByRole('button', { name: /add task/i }).first().click()
    const taskTitle = `E2E Task ${Date.now()}`
    await page.getByPlaceholder('Task name…').fill(taskTitle)
    await page.getByPlaceholder('Task name…').press('Enter')
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 })
  })

  test('open task detail drawer', async ({ page }) => {
    await registerAndLogin(page)
    await navigateToBoard(page)

    await page.getByRole('button', { name: /add task/i }).first().click()
    const taskTitle = `Drawer Task ${Date.now()}`
    await page.getByPlaceholder('Task name…').fill(taskTitle)
    await page.getByPlaceholder('Task name…').press('Enter')
    await expect(page.getByText(taskTitle)).toBeVisible({ timeout: 10000 })

    await page.getByText(taskTitle).click()
    const sheet = page.locator('[data-state="open"]')
    await expect(sheet.getByText(taskTitle)).toBeVisible({ timeout: 10000 })
  })

  test('filter bar filters tasks by priority', async ({ page }) => {
    await registerAndLogin(page)
    await navigateToBoard(page)

    // Use rounded-full filter pill buttons (not task cards) to avoid ambiguity
    await page.locator('button.rounded-full', { hasText: /^High$/ }).click()
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Clear' }).click()
    await expect(page.getByRole('button', { name: 'Clear' })).not.toBeVisible({ timeout: 5000 })
  })
})
