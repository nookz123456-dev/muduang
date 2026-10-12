// ปีนักษัตรแบบไทยตามสูติบัตร: ทางราชการเปลี่ยนปีนักษัตรวัน "ขึ้น 1 ค่ำ เดือนอ้าย"
// (หนังสือเวียนกรมการปกครอง 5 ก.พ. 2539) ตรงกับราวปลาย พ.ย. ถึงกลาง ธ.ค. ของปีก่อนหน้า
// เช่น 11 ธ.ค. 2015 เริ่มปีวอก, 13 ธ.ค. 2023 เริ่มปีมะโรง, 1 ธ.ค. 2024 เริ่มปีมะเส็ง, 21 พ.ย. 2025 เริ่มปีมะเมีย
// ปฏิทินหลวงใช้วิธีคำนวณดวงจันทร์เฉลี่ยของไทย วันที่จึงอาจต่างจากเดือนดับทางดาราศาสตร์ได้ 1 วัน
// คนที่เกิดห่างวันเปลี่ยนไม่เกิน 1 วัน ระบบจะบอกว่าคาบเกี่ยว
import { julianDay, moonTropical } from "./astro.js";
import { tropicalPositions } from "./planets.js";

const DAY = 86400000;
const BKK = 7 * 3600000;
const norm = (x) => ((x % 360) + 360) % 360;
const elong = (t) => norm(moonTropical(julianDay(new Date(t))) - tropicalPositions(new Date(t)).sun);

// วันเดือนดับ (เวลาไทย) ที่อยู่ในช่วง 18 พ.ย. - 17 ธ.ค. ของปี y = เดือนอ้าย ขึ้น 1 ค่ำ (โดยประมาณ)
const cache = new Map();
export function thaiYearStart(y) {
  if (cache.has(y)) return cache.get(y);
  let t = Date.UTC(y, 10, 18) - BKK, prev = elong(t), found = null;
  for (let k = 0; k < 30 * 4; k++) {           // ทีละ 6 ชั่วโมง
    const t2 = t + DAY / 4, cur = elong(t2);
    if (prev > 300 && cur < 60) {                // ข้ามศูนย์ = เดือนดับ ค่อยหาให้ละเอียด
      let a = t, b = t2;
      for (let i = 0; i < 20; i++) { const mid = (a + b) / 2; if (elong(mid) > 180) a = mid; else b = mid; }
      found = b;
      break;
    }
    t = t2; prev = cur;
  }
  const local = new Date(found + BKK);
  const res = { m: local.getUTCMonth() + 1, d: local.getUTCDate() };
  cache.set(y, res);
  return res;
}

export const ANIMAL_TH = ["หนู", "วัว", "เสือ", "กระต่าย", "มังกร", "งู", "ม้า", "แพะ", "ลิง", "ไก่", "หมา", "หมู"];
export const YEAR_TH = ["ชวด", "ฉลู", "ขาล", "เถาะ", "มะโรง", "มะเส็ง", "มะเมีย", "มะแม", "วอก", "ระกา", "จอ", "กุน"];
const branchOf = (gy) => (((gy - 4) % 12) + 12) % 12;

// คืน { branch, th, animal, near } near = เกิดห่างวันเปลี่ยนปีไม่เกิน 1 วัน (ควรเช็คสูติบัตร)
export function thaiZodiac(y, m, d) {
  const s = thaiYearStart(y);
  const day = Date.UTC(y, m - 1, d), start = Date.UTC(y, s.m - 1, s.d);
  const branch = branchOf(day >= start ? y + 1 : y);
  return { branch, th: YEAR_TH[branch], animal: ANIMAL_TH[branch], near: Math.abs(day - start) <= DAY, start: s };
}
