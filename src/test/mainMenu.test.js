import { describe, it, expect } from 'vitest'

// copy ฟังก์ชัน buildRows มาทดสอบโดยตรง
// (ฟังก์ชันนี้ไม่ export — test ครอบ logic แทน)
function buildRows(items) {
  const n = items.length
  if (n <= 3) return [items]
  if (n === 4) return [items.slice(0, 2), items.slice(2)]
  if (n === 5) return [items.slice(0, 2), items.slice(2)]
  if (n === 6) return [items.slice(0, 3), items.slice(3)]
  if (n === 7) return [items.slice(0, 2), items.slice(2, 5), items.slice(5)]
  if (n === 8) return [items.slice(0, 3), items.slice(3, 6), items.slice(6)]
  const rows = []
  for (let i = 0; i < items.length; i += 3) rows.push(items.slice(i, i + 3))
  return rows
}

const makeItems = (n) => Array.from({ length: n }, (_, i) => ({ key: `G${i}` }))

describe('buildRows', () => {
  it('0 item → array ว่าง 1 row', () => {
    expect(buildRows([])).toEqual([[]])
  })

  it('1-3 items → 1 row', () => {
    ;[1, 2, 3].forEach((n) => {
      expect(buildRows(makeItems(n))).toHaveLength(1)
    })
  })

  it('4 items → 2 rows [2, 2]', () => {
    const rows = buildRows(makeItems(4))
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(2)
    expect(rows[1]).toHaveLength(2)
  })

  it('5 items → 2 rows [2, 3]', () => {
    const rows = buildRows(makeItems(5))
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(2)
    expect(rows[1]).toHaveLength(3)
  })

  it('6 items → 2 rows [3, 3]', () => {
    const rows = buildRows(makeItems(6))
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveLength(3)
    expect(rows[1]).toHaveLength(3)
  })

  it('7 items → 3 rows [2, 3, 2]', () => {
    const rows = buildRows(makeItems(7))
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveLength(2)
    expect(rows[1]).toHaveLength(3)
    expect(rows[2]).toHaveLength(2)
  })

  it('9 items → 3 rows ละ 3', () => {
    const rows = buildRows(makeItems(9))
    expect(rows).toHaveLength(3)
    rows.forEach((r) => expect(r).toHaveLength(3))
  })

  it('ทุก item ยังอยู่ครบหลัง buildRows', () => {
    const items = makeItems(7)
    const flat = buildRows(items).flat()
    expect(flat).toHaveLength(7)
    expect(flat).toEqual(items)
  })
})
