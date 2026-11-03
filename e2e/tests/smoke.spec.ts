import { expect, test } from '@playwright/test'

test.use({ actionTimeout: 10_000 })
test.setTimeout(60_000)

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear())
})

test('shows the overview and its seeded balances', async ({ page }) => {
  await page.goto('/overview')

  await expect(page.getByRole('heading', { name: 'Overview' }).first()).toBeVisible()
  await expect(page.getByText('Total balance')).toBeVisible()
  await expect(page.getByText('BPI Everyday')).toBeVisible()
  await expect(page.getByRole('link', { name: 'View history' })).toBeVisible()
})

test('can record an expense through the shared movement flow', async ({ page }) => {
  await page.goto('/overview')
  await page.getByRole('button', { name: 'Log something' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Add a movement' })).toBeVisible()
  await dialog.getByLabel('Amount').fill('120.50')
  await dialog.getByLabel('Merchant').fill('Neighborhood bakery')
  await dialog.getByRole('button', { name: 'Save expense' }).click()

  await expect(page.getByRole('status')).toContainText('Expense added.')
  await expect(page.getByText('Neighborhood bakery')).toBeVisible()
})

test('can create a wallet with a custom card style and open its details', async ({ page }) => {
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Wallets' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Add wallet' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Wallet name').fill('Weekend cash')
  await dialog.getByRole('radio', { name: 'Ocean' }).click()
  await dialog.getByRole('button', { name: 'Add wallet' }).click()
  await expect(page.getByRole('link', { name: /Weekend cash/ })).toBeVisible()
  await page.getByRole('link', { name: /Weekend cash/ }).click()
  await expect(page).toHaveURL(/\/wallets\//)
  await expect(page.getByRole('heading', { name: 'Weekend cash' })).toBeVisible()
  await page.getByRole('main').getByRole('link', { name: 'Wallets' }).click()
  await page.getByRole('button', { name: 'Wallet actions for Weekend cash' }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Edit wallet' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Wallet actions for Weekend cash' }).click()
  await page.getByRole('menuitem', { name: 'Archive' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()
  await expect(page.getByText('Weekend cash')).not.toBeVisible()
})

test('keeps the primary flow usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/overview')

  await expect(page.locator('.sidebar')).toBeHidden()
  await expect(page.locator('.mobile-nav')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add transaction' }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Wallets' }).last().click()
  await expect(page.getByRole('heading', { name: 'Wallets' }).first()).toBeVisible()
})

test('keeps demo access explicit', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Keep your money close.' })).toBeVisible()
  await page.getByRole('button', { name: 'Use demo space' }).click()
  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByRole('heading', { name: 'Overview' }).first()).toBeVisible()
})
