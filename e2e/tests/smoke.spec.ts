import { expect, test } from '@playwright/test'

test.use({ actionTimeout: 10_000 })
test.setTimeout(60_000)

const E2E_STORAGE_KEY = 'pisopiso:local-state:v3:e2e-user'
const E2E_BOOTSTRAP_KEY = 'pisopiso:e2e-fixture-loaded'
const E2E_STATE = {
  profile: {
    id: 'e2e-user',
    displayName: 'Test User',
    email: 'e2e@example.com',
    theme: 'light',
    currency: 'PHP',
    avatarUrl: null,
    avatarName: null,
    avatarScale: 1,
    avatarPositionX: 0,
    avatarPositionY: 0,
  },
  wallets: [
    {
      id: 'wallet-test-bpi',
      userId: 'e2e-user',
      name: 'BPI Everyday',
      type: 'bank',
      openingBalanceCents: 6845075,
      allowOverdraft: false,
      color: '#a51d31',
      cardTheme: 'emerald',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'wallet-test-cash',
      userId: 'e2e-user',
      name: 'Cash on hand',
      type: 'cash',
      openingBalanceCents: 340000,
      allowOverdraft: false,
      color: '#6b806f',
      cardTheme: 'sand',
      logoUrl: null,
      logoName: null,
      logoScale: 1,
      logoPositionX: 0,
      logoPositionY: 0,
      isArchived: false,
      createdAt: '2025-01-02T00:00:00.000Z',
    },
  ],
  categories: [],
  transactions: [
    {
      id: 'transaction-test-salary',
      userId: 'e2e-user',
      walletId: 'wallet-test-bpi',
      type: 'income',
      amountCents: 6500000,
      categoryId: 'salary',
      merchant: 'Monthly salary',
      note: 'Test payroll',
      occurredAt: '2025-01-03T09:00:00.000Z',
      transferGroupId: null,
      transferDirection: null,
      relatedWalletId: null,
      receiptName: null,
      receiptUrl: null,
      createdAt: '2025-01-03T09:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 'transaction-test-coffee',
      userId: 'e2e-user',
      walletId: 'wallet-test-bpi',
      type: 'expense',
      amountCents: 12500,
      categoryId: 'food',
      merchant: 'Morning coffee',
      note: 'Test expense',
      occurredAt: '2025-01-04T09:00:00.000Z',
      transferGroupId: null,
      transferDirection: null,
      relatedWalletId: null,
      receiptName: null,
      receiptUrl: null,
      createdAt: '2025-01-04T09:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 'transaction-test-transfer-out',
      userId: 'e2e-user',
      walletId: 'wallet-test-bpi',
      type: 'transfer',
      amountCents: 50000,
      categoryId: null,
      merchant: 'Wallet transfer',
      note: 'Test transfer',
      occurredAt: '2025-01-05T09:00:00.000Z',
      transferGroupId: 'transfer-test-group',
      transferDirection: 'out',
      relatedWalletId: 'wallet-test-cash',
      receiptName: null,
      receiptUrl: null,
      createdAt: '2025-01-05T09:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 'transaction-test-transfer-in',
      userId: 'e2e-user',
      walletId: 'wallet-test-cash',
      type: 'transfer',
      amountCents: 50000,
      categoryId: null,
      merchant: 'Wallet transfer',
      note: 'Test transfer',
      occurredAt: '2025-01-05T09:00:00.000Z',
      transferGroupId: 'transfer-test-group',
      transferDirection: 'in',
      relatedWalletId: 'wallet-test-bpi',
      receiptName: null,
      receiptUrl: null,
      createdAt: '2025-01-05T09:00:00.000Z',
      deletedAt: null,
    },
    ...Array.from({ length: 9 }, (_, index) => ({
      id: `transaction-test-extra-${index + 1}`,
      userId: 'e2e-user',
      walletId: 'wallet-test-bpi',
      type: 'income',
      amountCents: 1000 + index * 100,
      categoryId: 'salary',
      merchant: `Other income ${index + 1}`,
      note: 'Pagination fixture',
      occurredAt: `2025-01-${String(6 + index).padStart(2, '0')}T09:00:00.000Z`,
      transferGroupId: null,
      transferDirection: null,
      relatedWalletId: null,
      receiptName: null,
      receiptUrl: null,
      createdAt: `2025-01-${String(6 + index).padStart(2, '0')}T09:00:00.000Z`,
      deletedAt: null,
    })),
  ],
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ bootstrapKey, storageKey, state }) => {
    if (window.localStorage.getItem(bootstrapKey) === 'true') return
    window.localStorage.clear()
    window.localStorage.setItem(storageKey, JSON.stringify(state))
    window.localStorage.setItem(bootstrapKey, 'true')
  }, { bootstrapKey: E2E_BOOTSTRAP_KEY, storageKey: E2E_STORAGE_KEY, state: E2E_STATE })
})

async function openUnlockedApp(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => window.localStorage.setItem('pisopiso:e2e-session', 'true'))
  await page.goto('/overview')
}

test('shows the account balances on the overview', async ({ page }) => {
  await openUnlockedApp(page)

  await expect(page.getByRole('heading', { name: 'Overview' }).first()).toBeVisible()
  await expect(page.getByText('Total balance')).toBeVisible()
  await expect(page.getByRole('link', { name: /BPI Everyday/ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View history' })).toBeVisible()
})

test('filters the dashboard and downloads a dashboard image', async ({ page }) => {
  await openUnlockedApp(page)
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
  await openUnlockedApp(page)
  await page.getByRole('button', { name: 'Log something' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Add a movement' })).toBeVisible()
  await dialog.getByRole('tab', { name: 'Income' }).click()
  await expect(dialog.getByRole('option', { name: 'Allowance' })).toHaveCount(1)
  await dialog.getByRole('tab', { name: 'Expense' }).click()
  await dialog.getByLabel('Amount').fill('120.50')
  await dialog.getByLabel('Merchant').fill('Neighborhood bakery')
  await dialog.getByLabel('Date').fill('2024-12-31')
  await dialog.getByRole('button', { name: 'Save expense' }).click()

  await expect(page.getByRole('status')).toContainText('Expense added.')
  await page.goto('/transactions')
  await expect(page.locator('.transaction-list-full .transaction-row').first()).toContainText('Neighborhood bakery')
})

test('shows a useful empty state when filters have no results', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')
  await page.getByPlaceholder('Search merchant, note, or category').fill('not-a-real-movement')

  await expect(page.getByRole('heading', { name: 'No movements found' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByText('Monthly salary')).toBeVisible()
})

test('paginates transaction history and shows the empty page range', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')

  await expect(page.getByText('1-10 of 13', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Page 1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('11-13 of 13', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Page 2')).toBeVisible()
  await page.getByPlaceholder('Search merchant, note, or category').fill('nothing matches this')
  await expect(page.getByText('0-0 of 0', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Page 0')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()
})

test('edits income, expense, and linked transfer movements', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')

  const editMovement = async (rowText: string, amount: string, saveLabel: string) => {
    await page.locator('.transaction-row').filter({ hasText: rowText }).first().click()
    const detailDialog = page.getByRole('dialog')
    await detailDialog.getByRole('button', { name: 'Edit movement' }).click()
    const editDialog = page.getByRole('dialog')
    await editDialog.getByLabel('Amount').fill(amount)
    await editDialog.getByRole('button', { name: saveLabel }).click()
    await expect(page.getByRole('status')).toBeVisible()
  }

  await editMovement('Monthly salary', '70000', 'Update income')
  await expect(page.getByRole('status')).toContainText('Income updated.')
  await editMovement('Morning coffee', '130', 'Update expense')
  await expect(page.getByRole('status')).toContainText('Expense updated.')
  await editMovement('To Cash on hand', '750', 'Update transfer')
  await expect(page.getByRole('status')).toContainText('Transfer updated')
  await expect(page.getByText('-₱750.00')).toBeVisible()
  await expect(page.getByText('+₱750.00')).toBeVisible()
})

test('deletes both entries when removing a transfer from history', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')

  await page.locator('.transaction-row').filter({ hasText: 'To Cash on hand' }).first().click()
  const detailDialog = page.getByRole('dialog')
  await expect(detailDialog.getByRole('button', { name: 'Edit movement' })).toBeVisible()
  await detailDialog.getByRole('button', { name: 'Delete movement' }).click()
  const confirmDialog = page.getByRole('dialog')
  await expect(confirmDialog.getByRole('heading', { name: 'Remove movement?' })).toBeVisible()
  await confirmDialog.getByRole('button', { name: 'Remove' }).click()

  await expect(page.getByRole('status')).toContainText('Movement removed.')
  await expect(page.locator('.transaction-row').filter({ hasText: 'To Cash on hand' })).toHaveCount(0)
  await expect(page.locator('.transaction-row').filter({ hasText: 'From BPI Everyday' })).toHaveCount(0)
  await expect(page.getByText('1-10 of 11', { exact: true })).toBeVisible()
})

test('paginates wallet transaction history', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/wallets/wallet-test-bpi')

  await expect(page.getByText('1-10 of 12', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('11-12 of 12', { exact: true })).toBeVisible()
})

test('can create a wallet with a custom card style and open its details', async ({ page }) => {
  await openUnlockedApp(page)
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
  await dialog.getByRole('slider', { name: 'Logo horizontal position' }).fill('18')
  await dialog.getByRole('slider', { name: 'Logo vertical position' }).fill('-12')
  await expect(dialog.getByText('+18%')).toBeVisible()
  await expect(dialog.getByText('-12%')).toBeVisible()
  await expect(dialog.getByText('weekend-logo.png')).toHaveCount(0)
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

test('reorders wallets and preserves the first position', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/wallets')

  const firstWallet = page.locator('.wallets-page-grid > article.wallet-card').first()
  await expect(firstWallet).toHaveAttribute('data-wallet-id', 'wallet-test-bpi')
  await expect(firstWallet).toHaveClass(/wallet-card-reorderable/)
  expect(await firstWallet.evaluate((element) => getComputedStyle(element).touchAction)).toBe('auto')
  const firstBox = await page.locator('[data-wallet-id="wallet-test-bpi"]').boundingBox()
  const secondBox = await page.locator('[data-wallet-id="wallet-test-cash"]').boundingBox()
  expect(firstBox).not.toBeNull()
  expect(secondBox).not.toBeNull()
  await page.mouse.move(firstBox!.x + firstBox!.width / 2, firstBox!.y + firstBox!.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(700)
  await expect(page.locator('[data-wallet-id="wallet-test-bpi"]')).toHaveClass(/wallet-card-pressing/)
  await page.waitForTimeout(1500)
  await expect(page.locator('[data-wallet-id="wallet-test-bpi"]')).toHaveClass(/wallet-card-dragging/)
  await page.mouse.move(secondBox!.x + secondBox!.width / 2, secondBox!.y + secondBox!.height / 2)
  await page.mouse.up()
  await expect(page.locator('.wallets-page-grid > article.wallet-card').first()).toHaveAttribute('data-wallet-id', 'wallet-test-cash')

  await page.locator('[data-wallet-id="wallet-test-cash"]').press('ArrowDown')
  await expect(page.locator('.wallets-page-grid > article.wallet-card').first()).toHaveAttribute('data-wallet-id', 'wallet-test-bpi')

  await page.reload()
  await expect(page.locator('.wallets-page-grid > article.wallet-card').first()).toHaveAttribute('data-wallet-id', 'wallet-test-bpi')
})

test('keeps the primary flow usable on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openUnlockedApp(page)

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

test('starts authentication at the app entry and remembers the last email', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use demo space' })).toHaveCount(0)
  const manifest = await page.request.get('/manifest.webmanifest')
  expect((await manifest.json()).start_url).toBe('/login')

  await page.getByLabel('Email address').fill('returning@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Choose a six-digit PIN.' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Enter your PIN.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'returning@example.com' })).toBeVisible()
  await page.getByRole('tab', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
})

test('requires PIN access before opening a main route', async ({ page }) => {
  await page.goto('/overview')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
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
  await openUnlockedApp(page)
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
  await page.getByRole('slider', { name: 'Profile picture horizontal position' }).fill('20')
  await page.getByRole('slider', { name: 'Profile picture vertical position' }).fill('-15')
  await expect(page.getByText('+20%')).toBeVisible()
  await expect(page.getByText('-15%')).toBeVisible()
  await page.getByRole('button', { name: 'Save profile' }).click()
  await page.reload()
  await expect(page.getByRole('slider', { name: 'Profile picture horizontal position' })).toHaveValue('20')
  await expect(page.getByRole('slider', { name: 'Profile picture vertical position' })).toHaveValue('-15')
})

test('keeps the auth screens inside a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')
  const fitsViewport = async () => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.body.scrollHeight <= window.innerHeight)
  const fitsAuthPanel = async () => page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('.auth-panel')
    return Boolean(panel && panel.scrollHeight <= panel.clientHeight && panel.scrollWidth <= panel.clientWidth)
  })

  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
  expect(await fitsViewport()).toBe(true)
  expect(await fitsAuthPanel()).toBe(true)
  await page.getByLabel('Email address').fill('mobile@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  expect(await fitsViewport()).toBe(true)
  expect(await fitsAuthPanel()).toBe(true)
  for (const digit of '123456') await page.getByRole('button', { name: digit, exact: true }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  expect(await fitsViewport()).toBe(true)
  expect(await fitsAuthPanel()).toBe(true)

  await page.evaluate(() => window.localStorage.clear())
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
  expect(await fitsViewport()).toBe(true)
  expect(await fitsAuthPanel()).toBe(true)
  await page.getByLabel('Email address').fill('short-screen@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  expect(await fitsViewport()).toBe(true)
  expect(await fitsAuthPanel()).toBe(true)
  for (const digit of '123456') await page.getByRole('button', { name: digit, exact: true }).click()
  expect(await fitsAuthPanel()).toBe(true)
  await page.getByRole('button', { name: 'Continue' }).click()
  expect(await fitsAuthPanel()).toBe(true)
})

test('can start fresh without changing account settings', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Start fresh' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Start fresh?' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Start fresh' }).click()
  await expect(page.getByText('0 active movements')).toBeVisible()
})
