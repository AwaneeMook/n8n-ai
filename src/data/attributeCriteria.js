
const stars = () =>
  Array.from({ length: 5 }, (_, i) => ({ star: i + 1, criteria: "" }));

export const attributeCriteria = {
  recruit: {
    label: "Recruit — วัดจากความสามารถสร้างทีม",
    stars: [
      { star: 1, criteria: "ไม่มีทีม ไม่เคย Recruit",              indicator: "HP = 0%, Total < 20 ใบ" },
      { star: 2, criteria: "เริ่ม Recruit บ้าง แต่ยังไม่มีระบบ",  indicator: "HP = 0-5%, Total 20-40 ใบ" },
      { star: 3, criteria: "มีทีมเล็ก Recruit ได้บ้าง",            indicator: "HP = 5-20%, Total 40-70 ใบ" },
      { star: 4, criteria: "Recruit ได้ดี มีทีมเติบโต",            indicator: "HP = 20-50%, Total 70-100 ใบ" },
      { star: 5, criteria: "สร้างทีม HP ได้สม่ำเสมอ",             indicator: "HP ≥ 50%, Total > 100 ใบ" },
    ]
  },
  management: {
    label: "Management — วัดจากวินัยและความเสถียร",
    stars: [
      { star: 1, criteria: "ติด status flag หลายข้อ บริหารตัวเองไม่ได้",   indicator: "status flag ≥ 3 ข้อ" },
      { star: 2, criteria: "ติด flag 1-2 ข้อ ยังไม่สม่ำเสมอ",             indicator: "status flag 1-2 ข้อ, Stability < 1" },
      { star: 3, criteria: "ไม่มี flag แต่ผลงานขึ้นลง",                    indicator: "status = 0, Stability 1-2" },
      { star: 4, criteria: "ไม่มี flag มีระบบ ผลงานสม่ำเสมอ",             indicator: "status = 0, Stability 2-3, FP ≥ 0.90" },
      { star: 5, criteria: "ไม่มี flag เลย Stability สูง FP สูงมาก",       indicator: "status = 0, Stability ≥ 3, FP ≥ 0.95" },
    ]
  },
  salesskill: {
    label: "Sales Skills — วัดจากผลงานการขาย",
    stars: [
      { star: 1, criteria: "Benefit ต่ำมาก ขายได้น้อย",                   indicator: "Benefit < 5M, Deal < 300K" },
      { star: 2, criteria: "ขายได้บ้าง แต่ยังต่ำกว่าเกณฑ์ G",            indicator: "Benefit 5-15M, Deal 300-450K" },
      { star: 3, criteria: "ขายได้ดีพอใช้ ใกล้เกณฑ์ G",                  indicator: "Benefit 15-40M, Deal 450-600K" },
      { star: 4, criteria: "ขายได้ดี เกิน G แล้ว",                        indicator: "Benefit 40-80M, Deal 600-900K" },
      { star: 5, criteria: "Top Performer ขายได้สูงสุด",                   indicator: "Benefit > 80M, Deal > 900K" },
    ]
  },
  technology: {
    label: "Technology — วัดจากการใช้ Digital Tools",
    stars: [
      { star: 1, criteria: "ไม่ใช้ Digital เลย พึ่งแค่ Walk-in",          indicator: "อายุ > 55, อาชีพเกษตร/รับจ้าง" },
      { star: 2, criteria: "ใช้ LINE/โทรศัพท์พื้นฐาน",                    indicator: "อายุ 51-55, ไม่มี Digital Record" },
      { star: 3, criteria: "ใช้ App + e-Form ได้",                         indicator: "อายุ 41-50, อาชีพพนักงาน/ราชการ" },
      { star: 4, criteria: "ใช้ CRM + Social Media ขายได้",               indicator: "อายุ 31-40, อาชีพธุรกิจ/ตัวแทน" },
      { star: 5, criteria: "ใช้ Data + Digital Sales ครบ",                 indicator: "อายุ < 35, ใช้ Analytics ได้" },
    ]
  },
};


export default attributeCriteria;
