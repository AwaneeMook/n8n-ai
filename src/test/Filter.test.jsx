import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Filter, { __resetZoneCache } from '../Filter'

const SAVED_FILTER = { ageMin: 30, ageMax: 40, affiliation: 'ทั่วประเทศ', zone: [] }

const ZONE_RESPONSE = {
  ทั่วประเทศ: [
    { zone: 'กรุงเทพ' },
    { zone: 'ภาคเหนือ' },
  ],
  นครหลวง: [{ zone: 'กรุงเทพ' }],
  ภูมิภาค: [{ zone: 'ภาคเหนือ' }],
}

function mockFetch(zoneResponse = ZONE_RESPONSE) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(zoneResponse)),
      json: () => Promise.resolve({ success: true }),
    }),
  )
}

function renderFilter(overrides = {}) {
  const defaults = {
    onLogout: vi.fn(),
    onDashboard: vi.fn(),
    onBack: vi.fn(),
    onAdmin: vi.fn(),
    savedFilter: SAVED_FILTER,
  }
  return render(<Filter {...defaults} {...overrides} />)
}

beforeEach(() => {
  vi.restoreAllMocks()
  __resetZoneCache()
})

// ─── Render ──────────────────────────────────────────────────────────────────

describe('Filter — render', () => {
  it('render ได้โดยไม่ crash', () => {
    mockFetch()
    renderFilter()
  })

  it('แสดงปุ่ม Play', () => {
    mockFetch()
    renderFilter()
    expect(screen.getByLabelText('ไปหน้า Dashboard')).toBeTruthy()
  })

  it('แสดง Logout icon', () => {
    mockFetch()
    renderFilter()
    expect(screen.getByAltText('Logout')).toBeTruthy()
  })

  it('แสดง Admin icon', () => {
    mockFetch()
    renderFilter()
    expect(screen.getByAltText('Admin')).toBeTruthy()
  })
})

// ─── Age range ────────────────────────────────────────────────────────────────

describe('Filter — age range', () => {
  it('แสดงช่วงอายุจาก savedFilter', () => {
    mockFetch()
    renderFilter()
    expect(screen.getByText(/30.*40/)).toBeTruthy()
  })

  it('ใช้ค่า default เมื่อไม่มี savedFilter', () => {
    mockFetch()
    renderFilter({ savedFilter: null })
    expect(screen.getByText(/30.*40/)).toBeTruthy()
  })
})

// ─── Zone dropdown ────────────────────────────────────────────────────────────

describe('Filter — zone dropdown', () => {
  it('โหลด zone options จาก API', async () => {
    mockFetch()
    renderFilter()
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(fetch.mock.calls[0][0]).toContain('/zone')
  })

  it('แสดง dropdown สังกัด', () => {
    mockFetch()
    renderFilter()
    expect(screen.getByText('ทั่วประเทศ')).toBeTruthy()
  })

  it('คลิก dropdown สังกัด → เปิดรายการ', async () => {
    mockFetch()
    renderFilter()
    const toggle = screen.getByText('ทั่วประเทศ')
    fireEvent.click(toggle)
    await waitFor(() => expect(screen.getByText('นครหลวง')).toBeTruthy())
  })

  it('เปลี่ยนสังกัด → ล้าง zone ที่เลือก', async () => {
    mockFetch()
    renderFilter()

    // เปิด dropdown สังกัด แล้วเลือก นครหลวง
    fireEvent.click(screen.getByText('ทั่วประเทศ'))
    await waitFor(() => expect(screen.getByText('นครหลวง')).toBeTruthy())
    fireEvent.click(screen.getByText('นครหลวง'))

    // dropdown ปิด + สังกัดเปลี่ยน
    await waitFor(() => expect(screen.queryByText('ภูมิภาค')).toBeFalsy())
  })
})

// ─── Submit ───────────────────────────────────────────────────────────────────

describe('Filter — submit', () => {
  it('กด Play → เรียก onDashboard', async () => {
    mockFetch()
    const onDashboard = vi.fn()
    renderFilter({ onDashboard })

    fireEvent.click(screen.getByLabelText('ไปหน้า Dashboard'))
    expect(onDashboard).toHaveBeenCalledTimes(1)
  })

  it('กด Play → ส่ง age_min และ age_max ที่ถูกต้อง', () => {
    mockFetch()
    const onDashboard = vi.fn()
    renderFilter({ onDashboard })

    fireEvent.click(screen.getByLabelText('ไปหน้า Dashboard'))
    const [filterValues] = onDashboard.mock.calls[0]
    expect(filterValues).toHaveProperty('age_min', 30)
    expect(filterValues).toHaveProperty('age_max', 40)
  })

  it('กด Play → POST ไป /calculate', async () => {
    mockFetch()
    renderFilter()

    fireEvent.click(screen.getByLabelText('ไปหน้า Dashboard'))
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const calculateCall = fetch.mock.calls.find(([url]) => url.includes('/calculate'))
    expect(calculateCall).toBeTruthy()
  })
})

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('Filter — interactions', () => {
  it('คลิก Logout → เรียก onLogout', () => {
    mockFetch()
    const onLogout = vi.fn()
    renderFilter({ onLogout })
    fireEvent.click(screen.getByAltText('Logout').closest('div'))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('คลิก Admin → เรียก onAdmin', () => {
    mockFetch()
    const onAdmin = vi.fn()
    renderFilter({ onAdmin })
    fireEvent.click(screen.getByAltText('Admin').closest('div'))
    expect(onAdmin).toHaveBeenCalledTimes(1)
  })
})
