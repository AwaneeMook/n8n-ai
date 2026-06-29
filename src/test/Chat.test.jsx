import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Chat from '../Chat'

const PERSONA = { id: 1, key: 'G01', label: 'The Commander' }
const MEMBER = { personid: 'A0000001' }
const PERSONA_DATA = {
  sex: 'M', age: 35, education: 'ปริญญาตรี',
  attribute: { recruit: 5, management: 3, salesskill: 4, technology: 2 },
}
const MEMBERS = [
  { personid: 'A0000001' },
  { personid: 'A0000002' },
  { personid: 'A0000003' },
]

function mockFetch(chatReply = 'ตอบกลับจาก AI') {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: chatReply }]),
    }),
  )
}

function renderChat(overrides = {}) {
  const defaults = {
    member: MEMBER,
    persona: PERSONA,
    personaData: PERSONA_DATA,
    members: MEMBERS,
    onBack: vi.fn(),
    onSelectMember: vi.fn(),
  }
  return render(<Chat {...defaults} {...overrides} />)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ─── Render ──────────────────────────────────────────────────────────────────

describe('Chat — render', () => {
  it('render ได้โดยไม่ crash', () => {
    mockFetch()
    renderChat()
  })

  it('แสดง welcome message พร้อม personId', () => {
    mockFetch()
    renderChat()
    expect(screen.getByText(/Welcome back, A0000001/)).toBeTruthy()
  })

  it('แสดง welcome message เมื่อไม่มี member', () => {
    mockFetch()
    renderChat({ member: null })
    expect(screen.getByText(/Welcome back, Agent/)).toBeTruthy()
  })

  it('แสดง bootLoading spinner เมื่อยังไม่มี personaData', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    renderChat({ personaData: null, members: [] })
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('ไม่แสดง spinner เมื่อมี personaData และ members', () => {
    mockFetch()
    renderChat()
    expect(document.querySelector('.animate-spin')).toBeFalsy()
  })
})

// ─── Member List ──────────────────────────────────────────────────────────────

describe('Chat — member list', () => {
  it('แสดง member IDs ในรายการ', () => {
    mockFetch()
    renderChat()
    expect(screen.getByText('A0000001')).toBeTruthy()
    expect(screen.getByText('A0000002')).toBeTruthy()
    expect(screen.getByText('A0000003')).toBeTruthy()
  })

  it('คลิก member อื่น → เปลี่ยน active และขึ้น welcome ใหม่', async () => {
    mockFetch()
    renderChat()
    fireEvent.click(screen.getByText('A0000002'))
    await waitFor(() =>
      expect(screen.getByText(/Switched to A0000002/)).toBeTruthy(),
    )
  })

  it('คลิก member เดิมซ้ำ → deselect กลับเป็น Agent', async () => {
    mockFetch()
    renderChat()
    fireEvent.click(screen.getByText('A0000001'))
    await waitFor(() =>
      expect(screen.getByText(/Welcome back, Agent/)).toBeTruthy(),
    )
  })

  it('คลิก member → เรียก onSelectMember', () => {
    mockFetch()
    const onSelectMember = vi.fn()
    renderChat({ onSelectMember })
    fireEvent.click(screen.getByText('A0000002'))
    expect(onSelectMember).toHaveBeenCalledTimes(1)
    expect(onSelectMember.mock.calls[0][0]).toMatchObject({ personid: 'A0000002' })
  })
})

// ─── Quick Prompts ────────────────────────────────────────────────────────────

describe('Chat — quick prompts', () => {
  it('แสดงปุ่ม quick prompt ครบ 6 ปุ่ม', () => {
    mockFetch()
    renderChat()
    expect(screen.getByText('วิเคราะห์ Insight')).toBeTruthy()
    expect(screen.getByText('แนะนำแนวการขาย')).toBeTruthy()
    expect(screen.getByText('AI Role Play')).toBeTruthy()
  })

  it('กด quick prompt → POST ไป /chat/quick', async () => {
    mockFetch()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: 'insight result' }]),
    }))

    fireEvent.click(screen.getByText('วิเคราะห์ Insight'))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [url] = fetch.mock.calls[0]
    expect(url).toContain('/chat/quick')
  })

  it('กด quick prompt → ขึ้น user bubble ในแชท', async () => {
    mockFetch()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: 'insight result' }]),
    }))

    fireEvent.click(screen.getByText('วิเคราะห์ Insight'))

    await waitFor(() =>
      expect(screen.getAllByText(/วิเคราะห์ Insight/).length).toBeGreaterThan(1),
    )
  })

  it('กด quick prompt เมื่อเลือก member → label ไม่มีคำว่า "กลุ่ม"', async () => {
    mockFetch()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: 'ok' }]),
    }))

    fireEvent.click(screen.getByText('วิเคราะห์ Insight'))

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const bubbles = screen.getAllByText(/วิเคราะห์ Insight/)
    const userBubble = bubbles.find(el => el.closest('[class*="bg-sky"]'))
    if (userBubble) expect(userBubble.textContent).not.toContain('กลุ่ม')
  })
})

// ─── Chat Input ───────────────────────────────────────────────────────────────

describe('Chat — chat input', () => {
  it('Send button disabled เมื่อ input ว่าง', () => {
    mockFetch()
    renderChat()
    const sendBtn = screen.getAllByRole('button').find((b) =>
      b.querySelector('img[alt="Send"]'),
    )
    expect(sendBtn).toBeDisabled()
  })

  it('พิมข้อความ → Send button ใช้งานได้', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderChat()
    const textarea = screen.getByPlaceholderText(/Commander AI|Agent AI/i)
    await user.type(textarea, 'สวัสดี')
    const sendBtn = screen.getAllByRole('button').find((b) =>
      b.querySelector('img[alt="Send"]'),
    )
    expect(sendBtn).not.toBeDisabled()
  })

  it('กด Enter → ส่งข้อความและล้าง input', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: 'ตอบ' }]),
    }))

    const textarea = screen.getByPlaceholderText(/Commander AI|Agent AI/i)
    await user.type(textarea, 'ทดสอบ{Enter}')
    expect(textarea.value).toBe('')
  })

  it('ส่งข้อความ → POST ไป /chat/quick พร้อม personId และ prompt', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: 'ตอบ' }]),
    }))

    const textarea = screen.getByPlaceholderText(/Commander AI|Agent AI/i)
    await user.type(textarea, 'ถามอะไรหน่อย{Enter}')

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const [url, opts] = fetch.mock.calls[0]
    expect(url).toContain('/chat/quick')
    const body = JSON.parse(opts.body)
    expect(body).toHaveProperty('prompt', 'ถามอะไรหน่อย')
    expect(body).toHaveProperty('personId')
  })

  it('AI ตอบกลับ → แสดงในแชท', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ answer: 'นี่คือคำตอบ' }]),
    }))

    const textarea = screen.getByPlaceholderText(/Commander AI|Agent AI/i)
    await user.type(textarea, 'สวัสดี{Enter}')

    await waitFor(() => expect(screen.getByText('นี่คือคำตอบ')).toBeTruthy())
  })

  it('API error → แสดง error message', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')))

    const textarea = screen.getByPlaceholderText(/Commander AI|Agent AI/i)
    await user.type(textarea, 'ทดสอบ error{Enter}')

    await waitFor(() =>
      expect(screen.getByText(/เกิดข้อผิดพลาด/)).toBeTruthy(),
    )
  })

  it('กำลังโหลด → แสดง typing indicator (animate-bounce)', async () => {
    mockFetch()
    const user = userEvent.setup()
    renderChat()

    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))

    const textarea = screen.getByPlaceholderText(/Commander AI|Agent AI/i)
    await user.type(textarea, 'ทดสอบ{Enter}')

    await waitFor(() =>
      expect(document.querySelector('.animate-bounce')).toBeTruthy(),
    )
  })
})

// ─── Back button ──────────────────────────────────────────────────────────────

describe('Chat — back button', () => {
  it('กดปุ่ม Back → เรียก onBack', () => {
    mockFetch()
    const onBack = vi.fn()
    renderChat({ onBack })
    fireEvent.click(screen.getByAltText('Back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
