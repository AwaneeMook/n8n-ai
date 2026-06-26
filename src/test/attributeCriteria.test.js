import { describe, it, expect } from 'vitest'
import { attributeCriteria } from '../data/attributeCriteria'

const EXPECTED_KEYS = ['recruit', 'management', 'salesskill', 'technology']

describe('attributeCriteria — โครงสร้าง', () => {
  it('มีครบ 4 attribute keys', () => {
    EXPECTED_KEYS.forEach((key) => {
      expect(attributeCriteria).toHaveProperty(key)
    })
  })

  EXPECTED_KEYS.forEach((key) => {
    it(`${key} มี stars array ครบ 5 ดาว`, () => {
      const stars = attributeCriteria[key].stars
      expect(stars).toHaveLength(5)
      const starNums = stars.map((s) => s.star).sort((a, b) => a - b)
      expect(starNums).toEqual([1, 2, 3, 4, 5])
    })

    it(`${key} ทุก star มี criteria ไม่ว่าง`, () => {
      attributeCriteria[key].stars.forEach(({ star, criteria }) => {
        expect(criteria, `${key} star ${star} criteria ไม่ควรว่าง`).toBeTruthy()
        expect(criteria.trim()).not.toBe('')
      })
    })
  })
})

describe('attributeCriteria — ค่าที่รู้จาก star', () => {
  it('recruit star 5 → สร้างทีม HP ได้สม่ำเสมอ', () => {
    const found = attributeCriteria.recruit.stars.find((s) => s.star === 5)
    expect(found?.criteria).toBe('สร้างทีม HP ได้สม่ำเสมอ')
  })

  it('management star 1 → ติด status flag หลายข้อ บริหารตัวเองไม่ได้', () => {
    const found = attributeCriteria.management.stars.find((s) => s.star === 1)
    expect(found?.criteria).toBe('ติด status flag หลายข้อ บริหารตัวเองไม่ได้')
  })

  it('salesskill star 3 → ขายได้ดีพอใช้ ใกล้เกณฑ์ G', () => {
    const found = attributeCriteria.salesskill.stars.find((s) => s.star === 3)
    expect(found?.criteria).toBe('ขายได้ดีพอใช้ ใกล้เกณฑ์ G')
  })

  it('technology star 4 → ใช้ CRM + Social Media ขายได้', () => {
    const found = attributeCriteria.technology.stars.find((s) => s.star === 4)
    expect(found?.criteria).toBe('ใช้ CRM + Social Media ขายได้')
  })
})
