import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Detail from '../Detail'

const PERSONA = { id: 1, key: 'G01', label: 'The Commander' }

const PERSONA_RESPONSE = {
  success: true,
  data: {
    sex: 'M',
    age: 35,
    education: 'ปริญญาตรี',
    occupation_descript: 'ตัวแทนประกัน',
    workingYears: 5,
    district: 'กรุงเทพ',
    attribute: { recruit: 5, management: 1, salesskill: 3, technology: 4 },
  },
}

const MEMBER_RESPONSE = {
  members: [
    { personid: 'A0000001' },
    { personid: 'A0000002' },
    { personid: 'A0000003' },
  ],
  top3: [
    { name: 'ประกันชีวิต' },
    { name: 'ประกันสุขภาพ' },
    { name: 'ประกันอุบัติเหตุ' },
  ],
}

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url) => {
      if (url.includes('/persona/member')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(MEMBER_RESPONSE) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([PERSONA_RESPONSE]) })
    }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

// ─── Render ──────────────────────────────────────────────────────────────────

describe('Detail — render', () => {
  it('render ได้โดยไม่ crash', () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
  })

  it('แสดงชื่อ persona ใน header', () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    expect(screen.getByText('The Commander')).toBeTruthy()
  })

  it('แสดง persona loading spinner ก่อน /persona ตอบกลับ', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('spinner หายหลัง /persona ตอบกลับ', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeFalsy())
  })
})

// ─── Persona data ─────────────────────────────────────────────────────────────

describe('Detail — persona data', () => {
  it('แสดงข้อมูล persona (age, district) หลัง /persona ตอบกลับ', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(screen.getByText('35')).toBeTruthy())
    expect(screen.getByText('กรุงเทพ')).toBeTruthy()
  })

  it('แสดง gender เป็น Male', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(screen.getByText('Male')).toBeTruthy())
  })

  it('เรียก /persona ด้วย key ที่ถูกต้อง', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    const personaCall = fetch.mock.calls.find(([url]) => url.includes('/persona') && !url.includes('/member'))
    expect(personaCall).toBeTruthy()
    const body = JSON.parse(personaCall[1].body)
    expect(body.key).toBe('G01')
  })
})

// ─── Member list (hardcoded mockup) ──────────────────────────────────────────

describe('Detail — member list', () => {
  it('แสดง member IDs จาก API', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(screen.getByText('A0000001')).toBeTruthy())
    expect(screen.getByText('A0000002')).toBeTruthy()
    expect(screen.getByText('A0000003')).toBeTruthy()
  })

  it('แสดง top3 products จาก API', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(screen.getByText('ประกันชีวิต')).toBeTruthy())
    expect(screen.getByText('ประกันสุขภาพ')).toBeTruthy()
  })

  it('เรียก onMembersLoaded หลังโหลดสมาชิกเสร็จ', async () => {
    mockFetch()
    const onMembersLoaded = vi.fn()
    render(
      <Detail
        persona={PERSONA}
        filterValues={null}
        onBack={() => {}}
        onSelectMember={() => {}}
        onMembersLoaded={onMembersLoaded}
      />,
    )
    await waitFor(() => expect(onMembersLoaded).toHaveBeenCalledTimes(1))
    expect(onMembersLoaded.mock.calls[0][0]).toHaveLength(3)
  })

  it('ไม่พบสมาชิก → แสดง "ไม่พบข้อมูล"', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/persona/member')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ members: [], top3: [] }) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([PERSONA_RESPONSE]) })
    }))
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(screen.getByText('ไม่พบข้อมูล')).toBeTruthy())
  })
})

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('Detail — interactions', () => {
  it('member card ไม่มี cursor-pointer (กดไม่ได้)', async () => {
    mockFetch()
    render(<Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={() => {}} />)
    await waitFor(() => expect(screen.getByText('A0000001')).toBeTruthy())
    const card = screen.getByText('A0000001').closest('div[style]')
    expect(card?.className).not.toContain('cursor-pointer')
  })

  it('คลิก member → ไม่เรียก onSelectMember', async () => {
    mockFetch()
    const onSelectMember = vi.fn()
    render(
      <Detail persona={PERSONA} filterValues={null} onBack={() => {}} onSelectMember={onSelectMember} />,
    )
    await waitFor(() => expect(screen.getByText('A0000001')).toBeTruthy())
    fireEvent.click(screen.getByText('A0000001'))
    expect(onSelectMember).not.toHaveBeenCalled()
  })

  it('คลิก Back → เรียก onBack', async () => {
    mockFetch()
    const onBack = vi.fn()
    render(<Detail persona={PERSONA} filterValues={null} onBack={onBack} onSelectMember={() => {}} />)
    await waitFor(() => expect(fetch).toHaveBeenCalled())
    fireEvent.click(screen.getByAltText('Back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
