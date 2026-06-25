// ⚠️ PLACEHOLDER — ไฟล์ต้นฉบับสูญหายและกู้จาก VS Code Local History ไม่ได้
// โครงสร้างนี้ถูกต้องตามที่ promptBuilders.js / MainMenu.jsx เรียกใช้
// (clusterByKey[key] -> { persona, strengths[], weaknesses[], opportunities[], risks[] })
// กรุณาเติมข้อมูลเนื้อหาจริงกลับเข้าไปแต่ละ cluster

const make = (persona) => ({
  persona,
  strengths: [],
  weaknesses: [],
  opportunities: [],
  risks: [],
});

export const clusterByKey = {
  G01: make("The Commander"),
  G02: make("The Visionary"),
  G03: make("The Moral Anchor"),
  G05: make("The Strategist"),
  G07: make("The Mentor"),
  G08: make("The Stabilizer"),
  G10: make("The Catalyst"),
};

export default clusterByKey;
