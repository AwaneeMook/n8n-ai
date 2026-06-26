
const stars = () =>
  Array.from({ length: 5 }, (_, i) => ({ star: i + 1, criteria: "" }));

export const attributeCriteria = {
  recruit: {
    stars: [{
      star: 1, criteria: "ไม่มีทีม ไม่เคย Recruit"
    },
    { star: 2, criteria: "เริ่ม Recruit บ้าง แต่ยังไม่มีระบบ" },
    { star: 3, criteria: "มีทีมเล็ก Recruit ได้บ้าง" },
    { star: 4, criteria: "Recruit ได้ดี มีทีมเติบโต" },
    { star: 5, criteria: "สร้างทีม HP ได้สม่ำเสมอ" }]
  },
  management: {
    stars: [{
      star: 1, criteria: "ติด status flag หลายข้อ บริหารตัวเองไม่ได้"
    },
    { star: 2, criteria: "ติด status flag 1-2 ข้อ ยังไม่สม่ำเสมอ" },
    { star: 3, criteria: "ไม่มี flag แต่ผลงานขึ้นลง" },
    { star: 4, criteria: "ไม่มี flag มีระบบ ผลงานสม่ำเสมอ" },
    { star: 5, criteria: "ไม่มี flag เลย Stability สูง FP สูงมาก" }]
  },
  salesskill: {
    stars: [{
      star: 1, criteria: "Benefit ต่ำมาก ขายได้น้อย"
    },
    { star: 2, criteria: "ขายได้บ้าง แต่ยังต่ำกว่าเกณฑ์ G" },
    { star: 3, criteria: "ขายได้ดีพอใช้ ใกล้เกณฑ์ G" },
    { star: 4, criteria: "ขายได้ดี เกิน G แล้ว" },
    { star: 5, criteria: "Top Performer ขายได้สูงสุด" }]
  },
  technology: {
    stars: [{
      star: 1, criteria: "ไม่ใช้ Digital เลย พึ่งแค่ Walk-in"
    },
    { star: 2, criteria: "ใช้ LINE/โทรศัพท์พื้นฐาน" },
    { star: 3, criteria: "ใช้ App + e-Form ได้" },
    { star: 4, criteria: "ใช้ CRM + Social Media ขายได้" },
    { star: 5, criteria: "ใช้ Data + Digital Sales ครบ" }]
  },
};


export default attributeCriteria;
