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

test('filters the dashboard and downloads a dashboard image', async ({ page }) => {
  await page.goto('/dashboard')

  for (const label of ['This day', 'This week', 'This month', '90 days', 'All time']) {
    await expect(page.getByRole('button', { name: label })).toBeVisible()
  }
  await page.getByRole('button', { name: 'This week' }).click()
  await expect(page.getByText('This week').last()).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download dashboard image' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^pisopiso-dashboard-\d{4}-\d{2}-\d{2}\.png$/)
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

test('shows a useful empty state when filters have no results', async ({ page }) => {
  await page.goto('/transactions')
  await page.getByPlaceholder('Search merchant, note, or category').fill('not-a-real-movement')

  await expect(page.getByRole('heading', { name: 'No movements found' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByText('Monthly salary')).toBeVisible()
})

test('can create a wallet with a custom card style and open its details', async ({ page }) => {
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Wallets' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Add wallet' }).first().click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Wallet name').fill('Weekend cash')
  await dialog.locator('input[type="file"]').first().setInputFiles({
    name: 'weekend-logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  })
  const logoSize = dialog.getByRole('slider', { name: 'Logo size' })
  await expect(logoSize).toBeVisible()
  await logoSize.fill('1.25')
  await expect(dialog.getByText('125%')).toBeVisible()
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
  await page.goto('/dashboard')
  await expect(page.locator('.dashboard-period-picker svg')).toHaveCount(0)
  const firstFilter = await page.locator('.dashboard-period-picker button').nth(0).boundingBox()
  const secondRowFilter = await page.locator('.dashboard-period-picker button').nth(3).boundingBox()
  expect(firstFilter).not.toBeNull()
  expect(secondRowFilter).not.toBeNull()
  expect(secondRowFilter!.y).toBeGreaterThan(firstFilter!.y)
})

test('keeps demo access explicit', async ({ page }) => {
  await page.goto('/login')

  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
  await page.getByRole('button', { name: 'Use demo space' }).click()
  await expect(page).toHaveURL(/\/overview$/)
  await expect(page.getByRole('heading', { name: 'Overview' }).first()).toBeVisible()
})

test('validates a confirmed signup PIN', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email address').fill('new-account@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  for (const digit of '123456') await page.getByRole('button', { name: digit, exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Confirm your PIN.' })).toBeVisible()
  for (const digit of '123457') await page.getByRole('button', { name: digit, exact: true }).click()
  await page.getByRole('button', { name: 'Create account' }).click()
  await expect(page.getByRole('alert')).toContainText('PINs do not match')
})

test('adjusts the profile picture size', async ({ page }) => {
  await page.goto('/settings')
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'profile.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  })
  const avatarSize = page.getByRole('slider', { name: 'Profile picture size' })
  await expect(avatarSize).toBeVisible()
  await avatarSize.fill('1.3')
  await expect(page.getByText('130%')).toBeVisible()
})

test('can start fresh without changing remote data', async ({ page }) => {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Start fresh' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Start fresh?' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Start fresh' }).click()
  await expect(page.getByText('0 active movements')).toBeVisible()
})
