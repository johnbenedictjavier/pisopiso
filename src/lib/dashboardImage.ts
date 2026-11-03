import { formatCurrency } from './money'

export interface DashboardImageData {
  periodLabel: string
  generatedAt: string
  incomeCents: number
  expenseCents: number
  savingsRate: string
  monthlyData: Array<{ label: string; income: number; expenses: number }>
  categoryData: Array<{ name: string; amount: number; color: string }>
}

const width = 1400
const height = 880

function escapeSvg(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character)
}

function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value
}

function safeColor(value: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function buildMonthlyBars(data: DashboardImageData): string {
  const chartX = 110
  const chartY = 430
  const chartWidth = 760
  const chartHeight = 230
  const maxValue = Math.max(1, ...data.monthlyData.flatMap((item) => [item.income, item.expenses]))
  const slotWidth = chartWidth / Math.max(1, data.monthlyData.length)
  const grid = Array.from({ length: 4 }, (_, index) => {
    const y = chartY + (chartHeight / 3) * index
    return `<line x1="${chartX}" y1="${y}" x2="${chartX + chartWidth}" y2="${y}" stroke="#dce6dc" stroke-width="1" />`
  }).join('')
  const bars = data.monthlyData.map((item, index) => {
    const groupX = chartX + index * slotWidth
    const incomeHeight = (item.income / maxValue) * chartHeight
    const expenseHeight = (item.expenses / maxValue) * chartHeight
    const barWidth = Math.min(20, slotWidth / 4)
    const incomeX = groupX + slotWidth / 2 - barWidth - 2
    const expenseX = groupX + slotWidth / 2 + 2
    const labelX = groupX + slotWidth / 2
    return `<rect x="${incomeX}" y="${chartY + chartHeight - incomeHeight}" width="${barWidth}" height="${incomeHeight}" rx="6" fill="#5f8068" /><rect x="${expenseX}" y="${chartY + chartHeight - expenseHeight}" width="${barWidth}" height="${expenseHeight}" rx="6" fill="#d69570" /><text x="${labelX}" y="${chartY + chartHeight + 30}" text-anchor="middle" fill="#87938b" font-size="14">${escapeSvg(item.label)}</text>`
  }).join('')
  return `${grid}${bars}`
}

function buildCategoryBars(data: DashboardImageData): string {
  const rows = data.categoryData.slice(0, 6)
  if (!rows.length) return '<text x="985" y="465" fill="#87938b" font-size="15">No spending in this period.</text>'
  const maxAmount = Math.max(1, ...rows.map((item) => item.amount))
  return rows.map((item, index) => {
    const y = 430 + index * 53
    const barWidth = (item.amount / maxAmount) * 310
    const color = safeColor(item.color, '#5f8068')
    return `<text x="985" y="${y}" fill="#526157" font-size="14">${escapeSvg(truncate(item.name, 23))}</text><text x="1315" y="${y}" text-anchor="end" fill="#1c2921" font-size="14" font-weight="700">${escapeSvg(formatCurrency(item.amount))}</text><rect x="985" y="${y + 12}" width="330" height="10" rx="5" fill="#e5ece4" /><rect x="985" y="${y + 12}" width="${barWidth}" height="10" rx="5" fill="${color}" />`
  }).join('')
}

function buildSvg(data: DashboardImageData): string {
  const netCents = data.incomeCents - data.expenseCents
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="#f4f7f3" />
    <text x="70" y="72" fill="#2f4d3a" font-family="Avenir Next, Segoe UI, sans-serif" font-size="20" font-weight="800">PisoPiso</text>
    <text x="70" y="122" fill="#1c2921" font-family="Avenir Next, Segoe UI, sans-serif" font-size="38" font-weight="800">Financial dashboard</text>
    <text x="1330" y="74" text-anchor="end" fill="#5f8068" font-family="Avenir Next, Segoe UI, sans-serif" font-size="16" font-weight="700">${escapeSvg(data.periodLabel)}</text>
    <text x="1330" y="100" text-anchor="end" fill="#87938b" font-family="Avenir Next, Segoe UI, sans-serif" font-size="14">${escapeSvg(data.generatedAt)}</text>
    <g font-family="Avenir Next, Segoe UI, sans-serif">
      <rect x="70" y="160" width="400" height="130" rx="20" fill="#ffffff" stroke="#dce6dc" />
      <rect x="500" y="160" width="400" height="130" rx="20" fill="#ffffff" stroke="#dce6dc" />
      <rect x="930" y="160" width="400" height="130" rx="20" fill="#ffffff" stroke="#dce6dc" />
      <text x="100" y="202" fill="#87938b" font-size="15">Money in</text>
      <text x="100" y="247" fill="#1c2921" font-size="30" font-weight="800">${escapeSvg(formatCurrency(data.incomeCents))}</text>
      <text x="530" y="202" fill="#87938b" font-size="15">Money out</text>
      <text x="530" y="247" fill="#1c2921" font-size="30" font-weight="800">${escapeSvg(formatCurrency(data.expenseCents))}</text>
      <text x="960" y="202" fill="#87938b" font-size="15">Savings rate</text>
      <text x="960" y="247" fill="#1c2921" font-size="30" font-weight="800">${escapeSvg(data.savingsRate)}</text>
      <text x="100" y="274" fill="#87938b" font-size="13">Net movement ${escapeSvg(formatCurrency(netCents))}</text>
      <text x="530" y="274" fill="#87938b" font-size="13">Tracked expenses</text>
      <text x="960" y="274" fill="#87938b" font-size="13">Income kept</text>
      <rect x="70" y="325" width="830" height="465" rx="20" fill="#ffffff" stroke="#dce6dc" />
      <rect x="930" y="325" width="400" height="465" rx="20" fill="#ffffff" stroke="#dce6dc" />
      <text x="105" y="370" fill="#5f8068" font-size="12" font-weight="800" letter-spacing="2">SIX-MONTH VIEW</text>
      <text x="105" y="405" fill="#1c2921" font-size="23" font-weight="800">Income vs. expenses</text>
      <circle cx="650" cy="367" r="6" fill="#5f8068" /><text x="665" y="373" fill="#526157" font-size="13">Income</text>
      <circle cx="755" cy="367" r="6" fill="#d69570" /><text x="770" y="373" fill="#526157" font-size="13">Expenses</text>
      ${buildMonthlyBars(data)}
      <text x="965" y="370" fill="#5f8068" font-size="12" font-weight="800" letter-spacing="2">SPENDING</text>
      <text x="965" y="405" fill="#1c2921" font-size="23" font-weight="800">Where it went</text>
      ${buildCategoryBars(data)}
    </g>
    <text x="70" y="838" fill="#87938b" font-family="Avenir Next, Segoe UI, sans-serif" font-size="13">Generated by PisoPiso</text>
  </svg>`
}

export async function downloadDashboardImage(data: DashboardImageData): Promise<void> {
  const svgUrl = URL.createObjectURL(new Blob([buildSvg(data)], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Could not prepare the dashboard image.'))
      element.src = svgUrl
    })
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = width * scale
    canvas.height = height * scale
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not prepare the dashboard image.')
    context.scale(scale, scale)
    context.drawImage(image, 0, 0, width, height)
    const imageBlob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the dashboard image.')), 'image/png'))
    const downloadUrl = URL.createObjectURL(imageBlob)
    const anchor = document.createElement('a')
    anchor.href = downloadUrl
    anchor.download = `pisopiso-dashboard-${new Date().toISOString().slice(0, 10)}.png`
    anchor.click()
    URL.revokeObjectURL(downloadUrl)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
