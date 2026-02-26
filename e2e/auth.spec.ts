import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('register page renders', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Create your account')).toBeVisible()
  })

  test('login redirects unauthenticated user', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('register → auto login → see my tasks', async ({ page }) => {
    const email = `e2e+${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel(/full name/i).fill('E2E User')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill('password123')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/my-tasks/, { timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'My Tasks' })).toBeVisible()
  })
})
