import { describe, it, expect } from 'vitest'
import {
  buildQuickPayload,
  buildInsightPayload,
  buildInsightPrompt,
  buildSalesPrompt,
  buildActivityPrompt,
} from '../data/promptBuilders'

const PERSONA_G01 = { id: 1, key: 'G01', label: 'The Commander' }
const PERSONA_G02 = { id: 2, key: 'G02', label: 'The Visionary' }

const PERSONA_DATA = {
  sex: 'M',
  age: 35,
  education: 'ปริญญาตรี',
  occupation_descript: 'ตัวแทนประกัน',
  workingYears: 5,
  district: 'กรุงเทพ',
  top3: [{ name: 'ประกันชีวิต' }, { name: 'ประกันสุขภาพ' }, { name: 'ประกันอุบัติเหตุ' }],
  attribute: { recruit: 5, management: 1, salesskill: 3, technology: 4 },
}

// ─── buildQuickPayload ───────────────────────────────────────────────────────

describe('buildQuickPayload — cluster mode (memberMode=false)', () => {
  it('มี field ครบ: cluster, prompt, custer, attibute', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
      title: 'วิเคราะห์หา Insight',
    })
    expect(result).toHaveProperty('cluster')
    expect(result).toHaveProperty('prompt')
    expect(result).toHaveProperty('custer')
    expect(result).toHaveProperty('attibute')
  })

  it('cluster ตรงกับ persona.key', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
      title: 'test',
    })
    expect(result.cluster).toBe('G01')
  })

  it('custer ตรงกับ persona.label', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
      title: 'test',
    })
    expect(result.custer).toBe('The Commander')
  })

  it('prompt มี title และข้อมูลส่วนตัวรวมอยู่', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
      title: 'วิเคราะห์หา Insight',
    })
    expect(result.prompt).toContain('วิเคราะห์หา Insight')
    expect(result.prompt).toContain('The Commander')
  })

  it('attibute มีทั้ง 4 หัวข้อ', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
      title: 'test',
    })
    expect(result.attibute).toContain('Recruit')
    expect(result.attibute).toContain('Management')
    expect(result.attibute).toContain('Sales Skills')
    expect(result.attibute).toContain('Technology')
  })

  it('attibute แปลงค่าดาวเป็นข้อความ criteria', () => {
    // recruit=5 → "สร้างทีม HP ได้สม่ำเสมอ"
    // management=1 → "ติด status flag หลายข้อ บริหารตัวเองไม่ได้"
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
      title: 'test',
    })
    expect(result.attibute).toContain('สร้างทีม HP ได้สม่ำเสมอ')
    expect(result.attibute).toContain('ติด status flag หลายข้อ บริหารตัวเองไม่ได้')
  })
})

describe('buildQuickPayload — member mode (memberMode=true)', () => {
  it('มี personId แทน cluster', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: true,
      personId: 'A1234567',
      title: 'วิเคราะห์หา Insight',
    })
    expect(result).toHaveProperty('personId', 'A1234567')
    expect(result).not.toHaveProperty('cluster')
  })

  it('prompt เป็นแค่ title ไม่มีข้อมูลส่วนตัว', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: true,
      personId: 'A1234567',
      title: 'วิเคราะห์หา Insight',
    })
    expect(result.prompt).toBe('วิเคราะห์หา Insight')
    expect(result.prompt).not.toContain('Gender')
  })

  it('attibute ยังมีครบ 4 หัวข้อ', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: true,
      personId: 'A1234567',
      title: 'test',
    })
    expect(result.attibute).toContain('Recruit')
    expect(result.attibute).toContain('Management')
  })
})

// ─── buildInsightPayload (alias) ─────────────────────────────────────────────

describe('buildInsightPayload', () => {
  it('prompt มี "วิเคราะห์หา Insight"', () => {
    const result = buildInsightPayload({
      persona: PERSONA_G01,
      personaData: PERSONA_DATA,
      memberMode: false,
      personId: '',
    })
    expect(result.prompt).toContain('วิเคราะห์หา Insight')
  })
})

// ─── buildInsightPrompt ──────────────────────────────────────────────────────

describe('buildInsightPrompt', () => {
  it('มีชื่อ cluster ใน prompt', () => {
    const result = buildInsightPrompt(PERSONA_G01, PERSONA_DATA)
    expect(result).toContain('The Commander')
  })

  it('มีข้อมูลส่วนตัวเมื่อ memberMode=false', () => {
    const result = buildInsightPrompt(PERSONA_G01, PERSONA_DATA, false)
    expect(result).toContain('Gender')
    expect(result).toContain('Age')
  })

  it('ไม่มีข้อมูลส่วนตัวเมื่อ memberMode=true', () => {
    const result = buildInsightPrompt(PERSONA_G01, PERSONA_DATA, true)
    expect(result).not.toContain('Gender')
    expect(result).not.toContain('Age')
  })

  it('มี criteria ของแต่ละ attribute', () => {
    const result = buildInsightPrompt(PERSONA_G01, PERSONA_DATA)
    expect(result).toContain('Recruit')
    expect(result).toContain('Management')
    expect(result).toContain('Sales Skills')
    expect(result).toContain('Technology')
  })
})

// ─── buildSalesPrompt ────────────────────────────────────────────────────────

describe('buildSalesPrompt', () => {
  it('มีชื่อ cluster', () => {
    const result = buildSalesPrompt(PERSONA_G02, PERSONA_DATA)
    expect(result).toContain('The Visionary')
  })

  it('มี keyword การขาย', () => {
    const result = buildSalesPrompt(PERSONA_G01, PERSONA_DATA)
    expect(result).toContain('ขาย')
  })

  it('มีสินค้า top3', () => {
    const result = buildSalesPrompt(PERSONA_G01, PERSONA_DATA)
    expect(result).toContain('ประกันชีวิต')
  })
})

// ─── buildActivityPrompt ─────────────────────────────────────────────────────

describe('buildActivityPrompt', () => {
  it('มี keyword CRM', () => {
    const result = buildActivityPrompt(PERSONA_G01, PERSONA_DATA)
    expect(result).toContain('CRM')
  })

  it('มีชื่อ cluster', () => {
    const result = buildActivityPrompt(PERSONA_G01, PERSONA_DATA)
    expect(result).toContain('The Commander')
  })
})

// ─── edge cases ──────────────────────────────────────────────────────────────

describe('buildQuickPayload — edge cases', () => {
  it('personaData เป็น null ไม่ throw', () => {
    expect(() =>
      buildQuickPayload({
        persona: PERSONA_G01,
        personaData: null,
        memberMode: false,
        personId: '',
        title: 'test',
      })
    ).not.toThrow()
  })

  it('attribute star ที่ไม่มีในเกณฑ์ → "ไม่มีข้อมูล"', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: { ...PERSONA_DATA, attribute: { recruit: 9 } },
      memberMode: false,
      personId: '',
      title: 'test',
    })
    expect(result.attibute).toContain('ไม่มีข้อมูล')
  })

  it('attribute เป็น 0 → "ไม่มีข้อมูล"', () => {
    const result = buildQuickPayload({
      persona: PERSONA_G01,
      personaData: { ...PERSONA_DATA, attribute: { recruit: 0, management: 0, salesskill: 0, technology: 0 } },
      memberMode: false,
      personId: '',
      title: 'test',
    })
    expect(result.attibute).toContain('ไม่มีข้อมูล')
  })
})
