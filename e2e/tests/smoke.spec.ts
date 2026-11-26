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

  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Test User/ })).toBeVisible()
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
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Add movement' }).first().click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Add a movement' })).toBeVisible()
  expect(await page.evaluate(() => {
    const zIndex = (selector: string) => Number.parseInt(getComputedStyle(document.querySelector(selector)!).zIndex, 10) || 0
    return zIndex('.modal-backdrop') > zIndex('.mobile-nav') && zIndex('.modal-backdrop') > zIndex('.topbar')
  })).toBe(true)
  expect(await page.locator('.modal-backdrop').evaluate((element) => element.parentElement === document.body)).toBe(true)
  expect(await page.evaluate(() => ({ body: document.body.style.overflow, document: document.documentElement.style.overflow }))).toEqual({ body: 'hidden', document: 'hidden' })
  await dialog.getByRole('tab', { name: 'Income' }).click()
  await expect(dialog.getByRole('radio', { name: 'Allowance' })).toHaveCount(1)
  await dialog.getByRole('tab', { name: 'Expense' }).click()
  await dialog.getByRole('button', { name: 'More' }).click()
  const moreCategoryDialog = page.getByRole('dialog', { name: /More category options/ })
  await expect(moreCategoryDialog.getByRole('radio', { name: 'Health' })).toBeVisible()
  await expect(dialog.locator('select[aria-label="Category more options"]')).toHaveCount(0)
  await moreCategoryDialog.getByRole('radio', { name: 'Health' }).click()
  await expect(moreCategoryDialog).not.toBeVisible()
  await dialog.getByLabel('Amount').fill('120.50')
  await dialog.getByLabel('Merchant').fill('Neighborhood bakery')
  await dialog.getByLabel('Date').fill('2025-12-31')
  await dialog.getByLabel('Time').fill('08:45')
  await dialog.getByRole('button', { name: 'Save expense' }).click()

  await expect(page.getByRole('status')).toContainText('Expense added.')
  expect(await page.evaluate(() => ({ body: document.body.style.overflow, document: document.documentElement.style.overflow }))).toEqual({ body: '', document: '' })
  await page.goto('/transactions')
  const bakeryRow = page.locator('.transaction-list-full .transaction-row').filter({ hasText: 'Neighborhood bakery' }).first()
  await expect(bakeryRow).toBeVisible()
  await bakeryRow.click()
  const detailDialog = page.getByRole('dialog', { name: /Neighborhood bakery/ })
  await expect(detailDialog.getByText('Date & time')).toBeVisible()
  await expect(detailDialog).toContainText('8:45')
  await detailDialog.getByRole('button', { name: 'Close dialog' }).click()
})

test('adds coins back to the private jar without adding a jar row to the ledger', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Add movement' }).first().click()

  const dialog = page.getByRole('dialog', { name: /Add a movement/ })
  await dialog.getByLabel('Amount').fill('120')
  await dialog.getByLabel(/Coins back/).fill('20')
  await dialog.getByLabel('Merchant').fill('Jar bakery')
  await dialog.getByLabel('Time').fill('09:10')
  await dialog.getByRole('button', { name: 'Save expense' }).click()
  await expect(page.getByRole('status')).toContainText('Expense added.')

  await page.goto('/overview')
  const jar = page.getByRole('button', { name: /Coin jar with ₱20\.00 saved/ })
  await expect(jar).toBeVisible()
  await jar.click()
  const jarDialog = page.getByRole('dialog', { name: /Coin jar history/ })
  await expect(jarDialog.getByText('Jar bakery')).toBeVisible()
  await expect(jarDialog.getByText('+₱20.00')).toBeVisible()
  await jarDialog.getByRole('button', { name: 'Close dialog' }).click()

  await page.goto('/transactions')
  await expect(page.locator('.transaction-list-full .transaction-row').filter({ hasText: 'Jar bakery' })).toHaveCount(1)
  await expect(page.locator('.transaction-list-full .transaction-row').filter({ hasText: 'Coin jar history' })).toHaveCount(0)
})

test('adds, edits, and deletes a coin jar expense without changing the ledger', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Add movement' }).first().click()

  const movementDialog = page.getByRole('dialog', { name: /Add a movement/ })
  await movementDialog.getByLabel('Amount').fill('120')
  await movementDialog.getByLabel(/Coins back/).fill('20')
  await movementDialog.getByLabel('Merchant').fill('Jar refill')
  await movementDialog.getByRole('button', { name: 'Save expense' }).click()
  await expect(page.getByRole('status')).toContainText('Expense added.')

  await page.goto('/overview')
  await page.getByRole('button', { name: /Coin jar with ₱20\.00 saved/ }).click()
  const jarDialog = page.getByRole('dialog', { name: /Coin jar history/ })
  await jarDialog.getByRole('button', { name: 'Add expense' }).click()

  const expenseDialog = page.getByRole('dialog', { name: /Add jar expense/ })
  await expenseDialog.getByLabel('Amount').fill('5')
  await expenseDialog.getByLabel('What did you spend it on?').fill('Jar snack')
  await expenseDialog.getByLabel('Time').fill('10:15')
  await expenseDialog.getByRole('button', { name: 'Save jar expense' }).click()
  await expect(page.getByRole('status')).toContainText('Jar expense added.')
  await expect(jarDialog.getByText('Jar snack')).toBeVisible()
  await expect(jarDialog.getByText('-₱5.00')).toBeVisible()
  await expect(page.getByRole('button', { name: /Coin jar with ₱15\.00 saved/ })).toBeVisible()

  await jarDialog.getByRole('button', { name: 'Edit jar expense Jar snack' }).click()
  const editExpenseDialog = page.getByRole('dialog', { name: /Edit jar expense/ })
  await editExpenseDialog.getByLabel('Amount').fill('7')
  await editExpenseDialog.getByLabel('What did you spend it on?').fill('Jar treat')
  await editExpenseDialog.getByRole('button', { name: 'Update jar expense' }).click()
  await expect(page.getByRole('status')).toContainText('Jar expense updated.')
  await expect(jarDialog.getByText('Jar treat')).toBeVisible()
  await expect(jarDialog.getByText('-₱7.00')).toBeVisible()

  await jarDialog.getByRole('button', { name: 'Delete jar expense Jar treat' }).click()
  const confirmDialog = page.getByRole('dialog', { name: /Remove jar expense/ })
  await confirmDialog.getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByRole('status')).toContainText('Jar expense removed.')
  await expect(jarDialog.getByText('Jar treat')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Coin jar with ₱20\.00 saved/ })).toBeVisible()

  await page.goto('/transactions')
  await expect(page.locator('.transaction-list-full .transaction-row').filter({ hasText: 'Jar refill' })).toHaveCount(1)
  await expect(page.locator('.transaction-list-full .transaction-row').filter({ hasText: 'Jar treat' })).toHaveCount(0)
})

test('shows a useful empty state when filters have no results', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')
  await page.getByPlaceholder('Search merchant, note, or category').fill('not-a-real-movement')

  await expect(page.getByRole('heading', { name: 'No movements found' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible()
  await page.getByRole('button', { name: 'Clear filters' }).click()
  await page.getByRole('button', { name: 'Next page' }).click()
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

  const editMovement = async (filter: 'Income' | 'Expense' | 'Transfer', rowText: string, amount: string, saveLabel: string) => {
    await page.getByRole('button', { name: filter, exact: true }).click()
    await page.locator('.transaction-row').filter({ hasText: rowText }).first().click()
     const detailDialog = page.getByRole('dialog')
     await detailDialog.getByRole('button', { name: 'Edit movement' }).click()
     const editDialog = page.getByRole('dialog')
     await editDialog.getByLabel('Amount').fill(amount)
     await editDialog.getByLabel('Time').fill('10:20')
     await editDialog.getByRole('button', { name: saveLabel }).click()
    await expect(page.getByRole('status')).toBeVisible()
  }

  await editMovement('Income', 'Monthly salary', '70000', 'Update income')
  await expect(page.getByRole('status')).toContainText('Income updated.')
  await editMovement('Expense', 'Morning coffee', '130', 'Update expense')
  await expect(page.getByRole('status')).toContainText('Expense updated.')
  await editMovement('Transfer', 'To Cash on hand', '750', 'Update transfer')
  await expect(page.getByRole('status')).toContainText('Transfer updated')
  await expect(page.getByText('-₱750.00')).toBeVisible()
  await expect(page.getByText('+₱750.00')).toBeVisible()
})

test('deletes both entries when removing a transfer from history', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')

  await page.getByRole('button', { name: 'Transfer', exact: true }).click()
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
  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.getByText('1-10 of 11', { exact: true })).toBeVisible()
})

test('paginates wallet transaction history', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/wallets/wallet-test-bpi')

  await expect(page.getByText('1-5 of 12', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('6-10 of 12', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Next page' }).click()
  await expect(page.getByText('11-12 of 12', { exact: true })).toBeVisible()
})

test('defaults wallet-detail movement fields to the wallet being viewed', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/wallets/wallet-test-cash')
  await page.getByRole('button', { name: 'Add movement' }).click()

  const dialog = page.getByRole('dialog', { name: /Add a movement/ })
  await expect(dialog.getByLabel('Paid from')).toHaveValue('wallet-test-cash')
  await dialog.getByRole('tab', { name: 'Income' }).click()
  await expect(dialog.getByLabel('Added to')).toHaveValue('wallet-test-cash')
  await dialog.getByRole('tab', { name: 'Transfer' }).click()
  await expect(dialog.getByLabel('From wallet')).toHaveValue('wallet-test-cash')
  await expect(dialog.getByLabel('To wallet')).not.toHaveValue('wallet-test-cash')
})

test('supports receipt attachments on transfers', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/transactions')
  await page.getByRole('button', { name: 'Add movement' }).first().click()

  const dialog = page.getByRole('dialog', { name: /Add a movement/ })
  await dialog.getByRole('tab', { name: 'Transfer' }).click()
  await expect(dialog.getByRole('button', { name: 'Choose image' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Use camera' })).toBeVisible()
  await dialog.locator('input[type="file"]').first().setInputFiles({
    name: 'transfer-receipt.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  })
  await expect(dialog.getByText('transfer-receipt.png')).toBeVisible()
  await dialog.getByLabel('Amount').fill('100')
  await dialog.getByRole('button', { name: 'Save transfer' }).click()
  await expect(page.getByRole('status')).toContainText('Transfer recorded')
  await expect(page.getByLabel('Receipt attached')).toHaveCount(2)
})

test('can create a wallet with a custom card style and open its details', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/wallets')
  await expect(page.getByRole('heading', { name: 'Wallets' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Add another wallet' }).click()
  const dialog = page.getByRole('dialog', { name: /Add a wallet/ })
  await expect(dialog.getByRole('button', { name: 'Use camera' })).toBeVisible()
  await expect(dialog.getByText('Camera', { exact: true })).toHaveCount(0)
  expect(await dialog.locator('.wallet-logo-actions').evaluate((element) => getComputedStyle(element).flexWrap)).toBe('nowrap')
  await dialog.getByLabel('Wallet name').fill('Weekend cash')
  await dialog.locator('input[type="file"]').first().setInputFiles({
    name: 'weekend-logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  })
  const cropDialog = page.getByRole('dialog', { name: /Crop wallet logo/ })
  await expect(cropDialog.getByText('Drag the image to reposition it.')).toBeVisible()
  await cropDialog.getByRole('button', { name: 'Use crop' }).click()
  await expect(dialog.getByText('weekend-logo.png')).toHaveCount(0)
  await expect(dialog.locator('.wallet-logo-actions').getByRole('button', { name: 'Crop wallet logo' })).toBeVisible()
  await expect(dialog.locator('.wallet-logo-actions').getByRole('button', { name: 'Remove wallet logo' })).toBeVisible()
  await dialog.getByRole('radio', { name: 'Ocean' }).click()
  await dialog.getByRole('button', { name: 'Add wallet' }).click()
  await expect(page.getByRole('link', { name: /Weekend cash/ })).toBeVisible()
  const createdWalletCard = page.locator('.wallets-page-grid .wallet-card').filter({ hasText: 'Weekend cash' })
  await expect(createdWalletCard.locator('.wallet-card-background-logo img')).toHaveCount(1)
  await expect(createdWalletCard.locator('.wallet-card-identity-copy > span')).toHaveCount(0)
  await expect(createdWalletCard.getByText('Traditional bank', { exact: true })).toHaveCount(0)
  await expect(createdWalletCard.getByRole('button', { name: /Edit|Archive/ })).toHaveCount(0)
  await page.getByRole('link', { name: /Weekend cash/ }).click()
  await expect(page).toHaveURL(/\/wallets\//)
  await expect(page.getByRole('heading', { name: 'Weekend cash' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit wallet' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Edit wallet' })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()
  await page.getByRole('button', { name: 'Archive wallet' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Archive' }).click()
  await expect(page).toHaveURL(/\/wallets$/)
  await expect(page.getByRole('link', { name: /Weekend cash/ })).not.toBeVisible()
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
  await expect(page.locator('.wallet-carousel')).toBeVisible()
  expect(await page.locator('.topbar').evaluate((element) => Number.parseFloat(getComputedStyle(element).marginBottom))).toBeGreaterThan(0)
  await expect(page.locator('.wallet-carousel .wallet-card')).toHaveCount(3)
  const carouselViewport = await page.locator('.wallet-carousel-viewport').boundingBox()
  const carouselCard = await page.locator('.wallet-carousel-item-active .wallet-card').boundingBox()
  const sideCard = await page.locator('.wallet-carousel-item-previous .wallet-card').boundingBox()
  expect(carouselViewport).not.toBeNull()
  expect(carouselCard).not.toBeNull()
  expect(sideCard).not.toBeNull()
  expect(carouselCard!.width).toBeLessThanOrEqual(carouselViewport!.width)
  expect(carouselCard!.width).toBeGreaterThan(sideCard!.width)
  expect(carouselCard!.width / carouselCard!.height).toBeGreaterThan(1.25)
  expect(await page.locator('.wallet-carousel-item-active .wallet-card').evaluate((element) => getComputedStyle(element).boxShadow)).toContain('rgba')
  await expect(page.locator('.wallet-carousel .wallet-card-identity-copy > span')).toHaveCount(0)
  const documentSize = await page.evaluate(() => ({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
  expect(documentSize.scrollWidth).toBeLessThanOrEqual(documentSize.clientWidth)
  await expect(page.locator('.wallet-card').getByText('Protected', { exact: true })).toHaveCount(0)
  await expect(page.locator('.wallet-card').getByText('Traditional bank', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Add transaction' }).first().click()
  const quickDialog = page.getByRole('dialog', { name: /Add a movement/ })
  await expect(quickDialog).toBeVisible()
  expect(await quickDialog.locator('.transaction-category-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  const quickModalSize = await quickDialog.evaluate((element) => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth }))
  expect(quickModalSize.scrollWidth).toBeLessThanOrEqual(quickModalSize.clientWidth)
  await quickDialog.getByRole('tab', { name: 'Transfer' }).click()
  expect(await quickDialog.locator('.transfer-wallet-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  expect(await quickDialog.locator('.transaction-entry-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  expect(await page.locator('.modal-backdrop').evaluate((element) => element.parentElement === document.body)).toBe(true)
  expect(await page.evaluate(() => ({ body: document.body.style.overflow, document: document.documentElement.style.overflow }))).toEqual({ body: 'hidden', document: 'hidden' })
  await quickDialog.getByRole('button', { name: 'Close dialog' }).click()
  await expect(quickDialog).not.toBeVisible()
  expect(await page.evaluate(() => ({ body: document.body.style.overflow, document: document.documentElement.style.overflow }))).toEqual({ body: '', document: '' })
  expect(await page.locator('.metric-grid').first().evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(3)
  await page.getByRole('link', { name: 'Wallets' }).last().click()
  await expect(page.getByRole('heading', { name: 'Wallets' }).first()).toBeVisible()
  expect(await page.locator('.wallets-page-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  await expect(page.locator('.wallet-summary-icon')).toHaveCount(0)
  await expect(page.getByText('Every account in one view', { exact: true })).toHaveCount(0)
  await page.goto('/dashboard')
  expect(await page.locator('.dashboard-income-row').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(2)
  expect(await page.locator('.dashboard-summary').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(3)
  await page.getByRole('button', { name: 'All time' }).click()
  await expect(page.locator('.dashboard-summary-category .dashboard-category-icon')).toBeVisible()
  await page.locator('.dashboard-chart').click({ position: { x: 24, y: 24 } })
  expect(await page.locator('.dashboard-chart .recharts-surface[role="application"]').evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('none')
  expect(await page.locator('.dashboard-chart .recharts-surface[role="application"]').evaluate((element) => getComputedStyle(element).borderStyle)).toBe('none')
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
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'returning@example.com' })).toBeVisible()
  await page.getByRole('tab', { name: 'Create account' }).click()
  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
})

test('requires PIN access before opening a main route', async ({ page }) => {
  await page.goto('/overview')

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Create your money space.' })).toBeVisible()
})

test('keeps the active account open after a refresh', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/dashboard')
  await page.reload()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), Test User/ })).toBeVisible()
  await expect(page).not.toHaveURL(/\/login$/)
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

test('crops and persists the profile picture', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: 'Use camera' })).toBeVisible()
  await expect(page.getByText('Camera', { exact: true })).toHaveCount(0)
  expect(await page.locator('.profile-photo-actions').evaluate((element) => getComputedStyle(element).flexWrap)).toBe('nowrap')
  await page.locator('input[type="file"]').first().setInputFiles({
    name: 'profile.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  })
  const cropDialog = page.getByRole('dialog', { name: /Crop profile picture/ })
  await expect(cropDialog.getByText('Drag the image to reposition it.')).toBeVisible()
  await cropDialog.getByRole('button', { name: 'Use crop' }).click()
  await expect(page.getByRole('button', { name: 'Crop profile photo' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Use camera' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remove profile picture' })).toBeVisible()
  expect(await page.locator('.profile-photo-actions').evaluate((element) => getComputedStyle(element).flexWrap)).toBe('nowrap')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Crop profile picture' })).toBeVisible()
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
  expect(await page.locator('.auth-art').evaluate((element) => getComputedStyle(element, '::after').mixBlendMode)).toBe('screen')
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

test('does not expose the destructive start fresh action', async ({ page }) => {
  await openUnlockedApp(page)
  await page.goto('/settings')
  await expect(page.getByRole('button', { name: 'Start fresh' })).toHaveCount(0)
  await expect(page.locator('.about-card').getByText('0.1.2', { exact: true })).toBeVisible()
  await expect(page.locator('.about-card').getByText('Updated November 26, 2026', { exact: true })).toBeVisible()
  await expect(page.getByText('John Benedict M. Javier')).toBeVisible()
})
