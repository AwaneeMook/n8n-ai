import { clusterByKey } from "./clusterData";
import { attributeCriteria } from "./attributeCriteria";

const ID_TO_KEY = { 1: "G01", 2: "G02", 3: "G03", 4: "G05", 5: "G07", 6: "G08", 7: "G10" };

const GENDER_MAP = { M: "ชาย", F: "หญิง" };

/**
 * หา star criteria ของ attribute ตาม star value ที่ได้รับ
 * ถ้าไม่มีค่า หรือค่าเป็น 0 → คืน "ไม่มีข้อมูล"
 */
function resolveCriteria(attrKey, starValue) {
  const def = attributeCriteria[attrKey];
  if (!def || !starValue) return "ไม่มีข้อมูล";
  const found = def.stars.find((s) => s.star === Number(starValue));
  if (!found) return "ไม่มีข้อมูล";
  return `${found.criteria}`;
}

/**
 * สร้าง "body ทั้งก้อน" ที่จะ POST ไป /chat/quick สำหรับ Quick Prompt ทุกปุ่ม
 *
 * - เลือก member (memberMode=true): ส่ง personId + prompt สั้น (= title)
 *     (ข้อมูลคนนั้นจะถูก query แยกที่ backend)
 * - ไม่เลือก: ส่ง cluster (key) + prompt เต็ม (title + ข้อมูลส่วนตัว + products)
 *
 * @param {string} title  ข้อความนำของแต่ละ prompt เช่น "วิเคราะห์หา Insight",
 *                        "แนะนำกลยุทธ์การพัฒนาจุดแข็งจุดอ่อน", "แนะนำแนวการขาย" ฯลฯ
 *
 * หมายเหตุ: key "custer" / "attibute" สะกดตามที่ backend ต้องการ (ห้ามแก้)
 */
export function buildQuickPayload({ persona, personaData, memberMode, personId, title }) {
  const clusterKey = persona?.key ?? ID_TO_KEY[persona?.id] ?? "";
  const cluster = clusterByKey[clusterKey] ?? {};
  const clusterName = persona?.label ?? cluster.persona ?? clusterKey;

  const gender = GENDER_MAP[personaData?.sex] ?? personaData?.sex ?? "ไม่ระบุ";
  const age = personaData?.age ?? "ไม่ระบุ";
  const education = personaData?.education ?? "ไม่ระบุ";
  const occupation = personaData?.occupation_descript ?? "ไม่ระบุ";
  const experience = personaData?.workingYears ?? "ไม่ระบุ";
  const district = personaData?.district ?? "ไม่ระบุ";
  const products =
    (personaData?.top3 ?? []).map((p) => p.name).join(", ") || "ไม่ระบุ";

  const attr = personaData?.attribute ?? {};
  const attibute =
    `Recruit ${resolveCriteria("recruit", attr.recruit)} ` +
    `Management ${resolveCriteria("management", attr.management)} ` +
    `Sales Skills ${resolveCriteria("salesskill", attr.salesskill)} ` +
    `Technology ${resolveCriteria("technology", attr.technology)}`;

  if (memberMode) {
    return {
      personId,
      prompt: title,
      custer: clusterName,
      attibute,
    };
  }

  return {
    cluster: clusterKey,
    prompt: `${title} ของกลุ่มคนที่ Cluster ${clusterName} ข้อมูลส่วนตัว Gender ${gender} Age ${age} Education ${education} Occupation ${occupation} Full Time Experience ${experience} years District ${district} ขายประกันแบบ ${products} มากสุดเรียงตามลำดับ `,
    custer: clusterName,
    attibute,
  };
}

// เก็บชื่อเดิมไว้ใช้ได้ (alias) — สำหรับ Quick Prompt "วิเคราะห์ Insight"
export function buildInsightPayload(args) {
  return buildQuickPayload({ ...args, title: "วิเคราะห์หา Insight" });
}

/**
 * สร้าง prompt "วิเคราะห์ Insight" สำหรับ cluster
 *
 * @param {object} persona       – { id, label, key } (G01, G03, ...)
 * @param {object} personaData   – ข้อมูล member จาก API
 * @param {string[]} top3        – สินค้า 3 อันดับแรก
 */
/**
 * @param {object} persona
 * @param {object} personaData
 * @param {boolean} memberMode  true = เลือก member อยู่ → ตัดส่วน "ข้อมูลส่วนตัว"
 *   และ "ขายประกันแบบ top3" ออก (เพราะจะ query ข้อมูลคนนั้นแยกแล้วส่งให้ AI เอง)
 */
export function buildInsightPrompt(persona, personaData, memberMode = false) {
  const clusterKey = persona?.key ?? ID_TO_KEY[persona?.id] ?? "";
  const cluster = clusterByKey[clusterKey] ?? {};

  const clusterName = persona?.label ?? cluster.persona ?? clusterKey;
  const gender = GENDER_MAP[personaData?.sex] ?? personaData?.sex ?? "ไม่ระบุ";
  const age = personaData?.age ?? "ไม่ระบุ";
  const education = personaData?.education ?? "ไม่ระบุ";
  const occupation = personaData?.occupation_descript ?? "ไม่ระบุ";
  const experience = personaData?.workingYears ?? "ไม่ระบุ";
  const district = personaData?.district ?? "ไม่ระบุ";

  const products = (personaData?.top3 ?? []).map((p) => p.name).join(", ") || "ไม่ระบุ";

  // attribute stars → แปลเป็น criteria text
  const attr = personaData?.attribute ?? {};
  const recruitCriteria = resolveCriteria("recruit", attr.recruit);
  const managementCriteria = resolveCriteria("management", attr.management);
  const salesskillCriteria = resolveCriteria("salesskill", attr.salesskill);
  const technologyCriteria = resolveCriteria("technology", attr.technology);

  // ส่วนที่ตัดออกเมื่อเลือก member (จะถูก query แยกแล้วส่งให้ AI เอง)
  const personalAndProducts = memberMode
    ? ""
    : `ข้อมูลส่วนตัว: Gender ${gender}, Age ${age}, Education ${education}, Occupation ${occupation}, Full Time Experience ${experience} years, District ${district}

ขายประกัน แบบ ${products} มากสุดเรียงตามลำดับ

`;

  return `วิเคราะห์หา Insight ของกลุ่มคนที่ Cluster "${clusterName}"

${personalAndProducts}วิเคราะห์เพิ่มเติมด้าน:
- Recruit: ${recruitCriteria}
- Management: ${managementCriteria}
- Sales Skills: ${salesskillCriteria}
- Technology: ${technologyCriteria}

ให้วิเคราะห์เชิงลึกของกลุ่มคนใน cluster นี้ โดยอิงจากข้อมูลทีีแจ้งไป หากส่วนไหนไม่ระบุ หรือไม่มีข้อมูล ให้ข้ามเรื่องนั้นไป
`;
}

/**
 * prompt เดิม (แนะนำกลยุทธ์) — คงไว้ใช้งาน
 */
export function buildStrategyPrompt(persona, personaData, top3 = []) {
  const gender = GENDER_MAP[personaData?.sex] ?? personaData?.sex ?? "";
  const age = personaData?.age ?? "";
  const education = personaData?.education ?? "";
  const occupation = personaData?.occupation_descript ?? "";
  const experience = personaData?.workingYears ?? "";
  const district = personaData?.district ?? "";
  const products = (top3.length > 0 ? top3 : personaData?.product ?? []).join(", ");
  const attr = personaData?.attribute ?? {};

  return `แนะนำกลยุทธ์การพัฒนาจุดแข็งจุดอ่อนของกลุ่มคนที่ cluster ${persona?.label ?? ""} Gender: ${gender} Age: ${age} Education: ${education} Occupation: ${occupation} Full Time Experience: ${experience} years District: ${district} ขายประกัน แบบ ${products} มากสุดเรียงตามลำดับ และช่วยวิเคราะห์เติมด้าน Recruit ${attr.recruit ?? ""} ,Management ${attr.management ?? ""} ,Sales Skills ${attr.salesskill ?? ""} ,Technology ${attr.technology ?? ""}`;
}

// ⚠️ กู้คืนตามรูปแบบเดิม (ต้นฉบับสูญหาย) — ปรับข้อความได้ตามต้องการ
function buildBaseContext(persona, personaData) {
  const clusterKey = persona?.key ?? ID_TO_KEY[persona?.id] ?? "";
  const cluster = clusterByKey[clusterKey] ?? {};
  const clusterName = persona?.label ?? cluster.persona ?? clusterKey;
  const gender = GENDER_MAP[personaData?.sex] ?? personaData?.sex ?? "ไม่ระบุ";
  const age = personaData?.age ?? "ไม่ระบุ";
  const education = personaData?.education ?? "ไม่ระบุ";
  const occupation = personaData?.occupation_descript ?? "ไม่ระบุ";
  const experience = personaData?.workingYears ?? "ไม่ระบุ";
  const district = personaData?.district ?? "ไม่ระบุ";
  const products = (personaData?.top3 ?? []).map((p) => p.name).join(", ") || "ไม่ระบุ";
  return { clusterName, gender, age, education, occupation, experience, district, products };
}

/**
 * prompt "แนะนำแนวการขาย"
 */
export function buildSalesPrompt(persona, personaData) {
  const c = buildBaseContext(persona, personaData);
  return `แนะนำแนวทางการขายประกันสำหรับกลุ่มคนที่ cluster "${c.clusterName}"

ข้อมูลส่วนตัว: Gender ${c.gender}, Age ${c.age}, Education ${c.education}, Occupation ${c.occupation}, Full Time Experience ${c.experience} years, District ${c.district}
สินค้าที่ขายดีเรียงตามลำดับ: ${c.products}

ให้แนะนำเทคนิคและแนวทางการนำเสนอขายที่เหมาะสมกับกลุ่มนี้ หากส่วนไหนไม่มีข้อมูลให้ข้ามไป`;
}

/**
 * prompt "แนะนำ CRM Strategy / กิจกรรม"
 */
export function buildActivityPrompt(persona, personaData) {
  const c = buildBaseContext(persona, personaData);
  return `แนะนำ CRM Strategy และกิจกรรมเพื่อรักษาความสัมพันธ์กับกลุ่มคนที่ cluster "${c.clusterName}"

ข้อมูลส่วนตัว: Gender ${c.gender}, Age ${c.age}, Education ${c.education}, Occupation ${c.occupation}, Full Time Experience ${c.experience} years, District ${c.district}
สินค้าที่ขายดีเรียงตามลำดับ: ${c.products}

ให้แนะนำกิจกรรมและกลยุทธ์ CRM ที่เหมาะสมกับกลุ่มนี้ หากส่วนไหนไม่มีข้อมูลให้ข้ามไป`;
}
