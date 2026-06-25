export const MOCK = false;

export const mockPersona = {
  success: true,
  data: {
    personid: "9007485",
    sex: "M",
    age: 36,
    education: "ปริญญาตรี",
    occupation_descript: "Full Time Agent",
    workingYears: 12,
    district: "ภาคตะวันออก",
    attribute: { recruit: 4, management: 3, salesskill: 5, technology: 2 },
    top3: [{ name: "Endowment" }, { name: "PAR" }, { name: "Health Rider" }],
  },
};

export const mockMembers = {
  members: Array.from({ length: 20 }, (_, i) => ({ personid: `900${7485 + i}` })),
  top3: [{ name: "Endowment" }, { name: "PAR" }, { name: "Health Rider" }],
};

export const mockAllPersona = {
  data: [
    { bestgroup: "G01", personid: "9007485" },
    { bestgroup: "G02", personid: "9007486" },
    { bestgroup: "G03", personid: "9007487" },
    { bestgroup: "G05", personid: "9007488" },
    { bestgroup: "G07", personid: "9007489" },
    { bestgroup: "G08", personid: "9007490" },
    { bestgroup: "G10", personid: "9007491" },
  ],
};

export const mockZones = ["กรุงเทพ", "ภาคกลาง", "ภาคเหนือ", "ภาคตะวันออก", "ภาคตะวันออกเฉียงเหนือ", "ภาคใต้"];

export const mockCalculate = { success: true };

export const mockChat = [{
  answer: "<p>นี่คือข้อความ mock จาก AI ระบบ offline อยู่ในขณะนี้</p>",
  suggestions: ["ดูข้อมูลเพิ่มเติม", "วิเคราะห์ผลลัพธ์", "แนะนำแผนพัฒนา"],
}];

export const mockSave = { success: true };
