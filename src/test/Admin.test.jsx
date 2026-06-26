import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Admin from '../Admin'

const PERSONA_RESPONSE = {
  success: true,
  data: {
    personid: '12345678',
    attribute: { recruit: 5, management: 1, salesskill: 3, technology: 4 },
  },
}

function mockFetch(response = PERSONA_RESPONSE) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([response]),
    }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ─── Render ──────────────────────────────────────────────────────────────────

describe('Admin — render', () => {
  it('render ได้โดยไม่ crash', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('แสดง loading spinner ตอนโหลด', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<Admin onBack={() => {}} />)
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('spinner หายหลัง fetch เสร็จ', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )
  })
})

// ─── Persona Dropdown ─────────────────────────────────────────────────────────

describe('Admin — GlassDropdown', () => {
  it('แสดง persona เริ่มต้น "The Commander"', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    expect(screen.getByText('The Commander')).toBeTruthy()
  })

  it('คลิก dropdown เปิดรายการ persona', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const toggle = screen.getAllByRole('button').find((b) =>
      b.textContent.includes('The Commander'),
    )
    fireEvent.click(toggle)

    expect(screen.getByText('The Visionary')).toBeTruthy()
    expect(screen.getByText('The Mentor')).toBeTruthy()
  })

  it('เลือก persona ใหม่แล้วปิด dropdown', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const toggle = screen.getAllByRole('button').find((b) =>
      b.textContent.includes('The Commander'),
    )
    fireEvent.click(toggle)
    fireEvent.click(screen.getByText('The Visionary'))

    expect(screen.queryByText('The Mentor')).toBeFalsy()
  })

  it('เปลี่ยน persona → เรียก /persona API ด้วย key ใหม่', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))

    const toggle = screen.getAllByRole('button').find((b) =>
      b.textContent.includes('The Commander'),
    )
    fireEvent.click(toggle)
    fireEvent.click(screen.getByText('The Visionary'))

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
    const body = JSON.parse(fetch.mock.calls[1][1].body)
    expect(body.key).toBe('G02')
  })

  it('เปลี่ยน persona → ล้างแชทขึ้นข้อความต้อนรับใหม่', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const toggle = screen.getAllByRole('button').find((b) =>
      b.textContent.includes('The Commander'),
    )
    fireEvent.click(toggle)
    fireEvent.click(screen.getByText('The Visionary'))

    expect(screen.getByText('สวัสดี! มีอะไรให้ช่วยไหมครับ?')).toBeTruthy()
  })
})

// ─── Quick Prompts ────────────────────────────────────────────────────────────

describe('Admin — Quick Prompts', () => {
  it('แสดงปุ่ม quick prompt ครบ 4 ปุ่ม', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    expect(screen.getByText('วิเคราะห์ด้าน Recruit')).toBeTruthy()
    expect(screen.getByText('วิเคราะห์ด้าน Management')).toBeTruthy()
    expect(screen.getByText('วิเคราะห์ด้าน Sales Skills')).toBeTruthy()
    expect(screen.getByText('วิเคราะห์ด้าน Technology')).toBeTruthy()
  })

  it('กด Recruit → POST ไป /chat/quick', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([{ answer: 'วิเคราะห์แล้วครับ' }]),
      }),
    )

    fireEvent.click(screen.getByText('วิเคราะห์ด้าน Recruit'))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/chat/quick')

    const body = JSON.parse(opts.body)
    expect(body).toHaveProperty('cluster')
    expect(body).toHaveProperty('prompt', 'วิเคราะห์ด้าน Recruit')
    expect(body).toHaveProperty('custer')
    expect(body).toHaveProperty('attibute')
  })

  it('กด Recruit → ข้อความ user ขึ้นในแชท', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ answer: 'ตอบกลับ' }]),
      }),
    )

    fireEvent.click(screen.getByText('วิเคราะห์ด้าน Recruit'))

    await waitFor(() =>
      expect(screen.getAllByText('วิเคราะห์ด้าน Recruit').length).toBeGreaterThan(1),
    )
  })

  it('กด Recruit → AI ตอบกลับในแชท', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ answer: 'วิเคราะห์แล้วครับ' }]),
      }),
    )

    fireEvent.click(screen.getByText('วิเคราะห์ด้าน Recruit'))
    await waitFor(() =>
      expect(screen.getByText('วิเคราะห์แล้วครับ')).toBeTruthy(),
    )
  })
})

// ─── Chat Input ───────────────────────────────────────────────────────────────

describe('Admin — Chat input', () => {
  it('Send button disabled เมื่อ input ว่าง', async () => {
    mockFetch()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const sendBtn = screen.getAllByRole('button').find((b) =>
      b.querySelector('img[alt="Send"]'),
    )
    expect(sendBtn).toBeDisabled()
  })

  it('พิมข้อความ → Send button ใช้งานได้', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<Admin onBack={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const textarea = screen.getByPlaceholderText(/Ask.*AI/i)
    await user.type(textarea, 'สวัสดี')

    const sendBtn = screen.getAllByRole('button').find((b) =>
      b.querySelector('img[alt="Send"]'),
    )
    expect(sendBtn).not.toBeDisabled()
  })

  it('ส่งข้อความ → POST ไป /chat พร้อม personId และ prompt', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ answer: 'ตอบ' }]),
      }),
    )

    const textarea = screen.getByPlaceholderText(/Ask.*AI/i)
    await user.type(textarea, 'ทดสอบ{Enter}')

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/chat/quick')

    const body = JSON.parse(opts.body)
    expect(body).toHaveProperty('personId')
    expect(body).toHaveProperty('prompt', 'ทดสอบ')
  })

  it('กด Enter ส่งข้อความและล้าง input', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ answer: 'ตอบ' }]),
      }),
    )

    const textarea = screen.getByPlaceholderText(/Ask.*AI/i)
    await user.type(textarea, 'ทดสอบ{Enter}')

    expect(textarea.value).toBe('')
  })

  it('API error → แสดงข้อความ error ในแชท', async () => {
    mockFetch()
    const user = userEvent.setup()
    render(<Admin onBack={() => {}} />)
    await waitFor(() =>
      expect(document.querySelector('.animate-spin')).toBeFalsy(),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    )

    const textarea = screen.getByPlaceholderText(/Ask.*AI/i)
    await user.type(textarea, 'test{Enter}')

    await waitFor(() =>
      expect(screen.getByText(/เกิดข้อผิดพลาด/)).toBeTruthy(),
    )
  })
})

// ─── Back button ──────────────────────────────────────────────────────────────

describe('Admin — Back button', () => {
  it('กดปุ่ม Home → เรียก onBack', async () => {
    mockFetch()
    const onBack = vi.fn()
    render(<Admin onBack={onBack} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())

    fireEvent.click(screen.getByAltText('Back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
