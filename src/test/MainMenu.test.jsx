import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MainMenu, { __resetPersonaCache } from '../MainMenu'

const ALL_PERSONA_RESPONSE = {
  data: [
    { key: 'G01', name: 'The Commander' },
    { key: 'G02', name: 'The Visionary' },
    { key: 'G07', name: 'The Mentor' },
  ],
}

function mockFetch(response = ALL_PERSONA_RESPONSE) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    }),
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
  __resetPersonaCache()
})

// ─── Render ──────────────────────────────────────────────────────────────────

describe('MainMenu — render', () => {
  it('แสดง loading spinner ก่อน fetch เสร็จ', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})))
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('แสดง persona cards หลัง fetch เสร็จ', async () => {
    mockFetch()
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)

    await waitFor(() => expect(screen.getByText('The Commander')).toBeTruthy())
    expect(screen.getByText('The Visionary')).toBeTruthy()
    expect(screen.getByText('The Mentor')).toBeTruthy()
  })

  it('spinner หายหลัง fetch เสร็จ', async () => {
    mockFetch()
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)

    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeFalsy())
  })

  it('fetch ล้มเหลว → ไม่แสดง persona cards', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network')))
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)

    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeFalsy())
    expect(screen.queryByText('The Commander')).toBeFalsy()
  })
})

// ─── Interactions ─────────────────────────────────────────────────────────────

describe('MainMenu — interactions', () => {
  it('คลิก persona card → เรียก onSelect พร้อม item ที่ถูกต้อง', async () => {
    mockFetch()
    const onSelect = vi.fn()
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={onSelect} onAdmin={() => {}} />)

    await waitFor(() => expect(screen.getByText('The Commander')).toBeTruthy())
    fireEvent.click(screen.getByText('The Commander'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect.mock.calls[0][0]).toMatchObject({ key: 'G01', label: 'The Commander' })
  })

  it('คลิก persona card → ส่ง id ที่ถูกต้อง (G07 = id 5)', async () => {
    mockFetch()
    const onSelect = vi.fn()
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={onSelect} onAdmin={() => {}} />)

    await waitFor(() => expect(screen.getByText('The Mentor')).toBeTruthy())
    fireEvent.click(screen.getByText('The Mentor'))

    expect(onSelect.mock.calls[0][0]).toMatchObject({ key: 'G07', id: 5 })
  })

  it('คลิก logout icon → เรียก onLogout', async () => {
    mockFetch()
    const onLogout = vi.fn()
    render(<MainMenu onLogout={onLogout} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)

    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeFalsy())
    fireEvent.click(screen.getByAltText('Logout').closest('div'))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('คลิก admin icon → เรียก onAdmin', async () => {
    mockFetch()
    const onAdmin = vi.fn()
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={onAdmin} />)

    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeFalsy())
    fireEvent.click(screen.getByAltText('Admin').closest('div'))
    expect(onAdmin).toHaveBeenCalledTimes(1)
  })
})

// ─── Cache ────────────────────────────────────────────────────────────────────

describe('MainMenu — cache', () => {
  it('mount ครั้งแรก → เรียก /all_persona', async () => {
    mockFetch()
    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(fetch.mock.calls[0][0]).toContain('all_persona')
  })

  it('mount ครั้งที่สอง (cache hit) → ไม่เรียก fetch อีก', async () => {
    mockFetch()
    const { unmount } = render(
      <MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />,
    )
    await waitFor(() => expect(screen.getByText('The Commander')).toBeTruthy())
    unmount()

    vi.restoreAllMocks()
    vi.stubGlobal('fetch', vi.fn())

    render(<MainMenu onLogout={() => {}} onBack={() => {}} onSelect={() => {}} onAdmin={() => {}} />)
    await waitFor(() => expect(screen.getByText('The Commander')).toBeTruthy())

    expect(fetch).not.toHaveBeenCalled()
  })
})
