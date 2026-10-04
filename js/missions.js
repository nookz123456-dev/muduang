// เลือกภารกิจมูประจำวัน
import { MISSIONS } from "./data.js";

// แปลงข้อความเป็นตัวเลขคงที่ (ใส่ค่าเดิมได้ผลเดิมทุกครั้ง) ใช้เป็น seed ได้
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// theme   = ธีมของวันจากตาราพละ เช่น "money", "love"
// dayKey  = วันที่แบบ "2026-10-04" (เวลาไทย)
// birthIndex = ฤกษ์เกิด 0-26 (ให้คนต่างฤกษ์ได้ภารกิจต่างกัน)
// ต้องคืนภารกิจ 3 ข้อ และวันเดียวกันต้องได้ชุดเดิมเสมอ (รีเฟรชแล้วไม่เปลี่ยน)
export function pickDailyMissions(theme, dayKey, birthIndex) {
  const pool = MISSIONS.filter((m) => m.theme === theme);
  // หมุนตามจำนวนวัน: เลื่อนวันละ 4 ข้อ (ธีมละ 6 ข้อ) ได้ 3 ชุดวนกัน แต่ละชุดซ้ำกับวันก่อนไม่เกิน 1 ข้อ
  // ฤกษ์เกิดกับ hash ช่วยให้คนต่างฤกษ์เริ่มคนละจุด
  const dayNo = Math.floor(Date.parse(dayKey + "T00:00:00Z") / 86400000);
  const start = (dayNo * 4 + birthIndex + (hash(theme) % pool.length)) % pool.length;
  return [0, 1, 2].map((i) => pool[(start + i) % pool.length]);
}
