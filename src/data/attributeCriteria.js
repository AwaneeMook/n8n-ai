// ⚠️ PLACEHOLDER — ไฟล์ต้นฉบับสูญหายและกู้จาก VS Code Local History ไม่ได้
// โครงสร้างนี้ถูกต้องตามที่ promptBuilders.js เรียกใช้
// (attributeCriteria[attrKey].stars -> [{ star: 1..5, criteria: "..." }])
// กรุณาเติมข้อความ criteria จริงของแต่ละดาวกลับเข้าไป

const stars = () =>
  Array.from({ length: 5 }, (_, i) => ({ star: i + 1, criteria: "" }));

export const attributeCriteria = {
  recruit: { stars: stars() },
  management: { stars: stars() },
  salesskill: { stars: stars() },
  technology: { stars: stars() },
};

export default attributeCriteria;
