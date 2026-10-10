// ปฏิทินวันดีเฉพาะบุคคล: รวมปฏิทินจีน (เสาวัน, 12 นายวัน 建除, 24 สารท, วันชง) กับฤกษ์ดวงจันทร์รายวันของอินเดีย
// คำอธิบายเขียนเองทั้งหมด
import { thaiDate } from "./astro.js";
import { dayPillar, monthPillar, yearPillar, sunLon, stemElement } from "./bazi.js";
import { dailyReading } from "./daily.js";

// q: 1 = วันดี, 0 = กลาง, -1 = วันควรเลี่ยงเรื่องมงคล
export const OFFICERS = [
  { zh: "建", th: "วันตั้งต้น", q: 0, text: "เหมาะวางแผน เดินทาง พบผู้ใหญ่ ไม่เหมาะขุดดินหรือเริ่มก่อสร้าง" },
  { zh: "除", th: "วันชำระ", q: 1, text: "เหมาะเคลียร์ของ ทำความสะอาดบ้าน เริ่มรักษาตัว ตัดสิ่งที่ไม่ดีออกจากชีวิต" },
  { zh: "満", th: "วันเต็ม", q: 1, text: "เหมาะเปิดร้าน รับเงิน จัดงานฉลอง ไม่เหมาะเริ่มรักษาโรค" },
  { zh: "平", th: "วันราบ", q: 0, text: "เหมาะงานทั่วไป ซ่อมแซม ปรับปรุงของในบ้าน" },
  { zh: "定", th: "วันตั้งมั่น", q: 1, text: "เหมาะเซ็นสัญญา หมั้น แต่งงาน รับคนเข้าทำงาน เรื่องที่อยากให้อยู่นาน" },
  { zh: "執", th: "วันยึดมั่น", q: 0, text: "เหมาะทวงถาม เก็บเกี่ยวผล ลงมือตามแผนที่วางไว้" },
  { zh: "破", th: "วันแตก", q: -1, text: "เลี่ยงเรื่องมงคลและการเริ่มใหม่ เหมาะรื้อถอน ทิ้งของเก่า เลิกนิสัยเสีย" },
  { zh: "危", th: "วันเสี่ยง", q: -1, text: "ระวังการเดินทางไกล ที่สูง และการตัดสินใจรีบร้อน ทำทุกอย่างอย่างรอบคอบ" },
  { zh: "成", th: "วันสำเร็จ", q: 1, text: "ดีแทบทุกเรื่อง เปิดกิจการ แต่งงาน ย้ายบ้าน เริ่มงานสำคัญ" },
  { zh: "収", th: "วันเก็บ", q: 0, text: "เหมาะเก็บเงิน ปิดงาน รวบรวมผล ไม่เหมาะเริ่มเรื่องใหม่" },
  { zh: "開", th: "วันเปิด", q: 1, text: "เหมาะเปิดร้าน เริ่มงาน เข้าบ้านใหม่ ออกเดินทาง" },
  { zh: "閉", th: "วันปิด", q: -1, text: "เหมาะพักผ่อนและเก็บตัว เลี่ยงเปิดตัวสิ่งใหม่" },
];
export const officerOf = (dayBranch, monthBranch) => (dayBranch - monthBranch + 12) % 12;

// 24 สารท เรียงจากดวงอาทิตย์ 0 องศา (春分) ทีละ 15 องศา
export const SOLAR_TERMS = [
  ["春分", "กลางฤดูใบไม้ผลิ"], ["清明", "เช็งเม้ง"], ["谷雨", "ฝนหล่อเลี้ยงพืช"], ["立夏", "เข้าฤดูร้อน"],
  ["小满", "รวงข้าวเริ่มเต็ม"], ["芒种", "หว่านกล้า"], ["夏至", "กลางฤดูร้อน"], ["小暑", "ร้อนน้อย"],
  ["大暑", "ร้อนจัด"], ["立秋", "เข้าฤดูใบไม้ร่วง"], ["处暑", "สิ้นร้อน"], ["白露", "น้ำค้างขาว"],
  ["秋分", "กลางฤดูใบไม้ร่วง"], ["寒露", "น้ำค้างเย็น"], ["霜降", "น้ำค้างแข็ง"], ["立冬", "เข้าฤดูหนาว"],
  ["小雪", "หิมะน้อย"], ["大雪", "หิมะมาก"], ["冬至", "กลางฤดูหนาว"], ["小寒", "หนาวน้อย"],
  ["大寒", "หนาวจัด"], ["立春", "เข้าฤดูใบไม้ผลิ (ปีใหม่จีนทางโหร)"], ["雨水", "ฝนแรก"], ["惊蛰", "แมลงตื่น"],
];
// สารทที่ตกในวันนั้น (เวลาไทย) ถ้าไม่มีคืน null
export function solarTermOn(y, m, d) {
  const a = Math.floor(sunLon(thaiDate(y, m, d, 0, 0).getTime()) / 15);
  const b = Math.floor(sunLon(thaiDate(y, m, d, 23, 59).getTime()) / 15);
  if (a === b) return null;
  const [zh, th] = SOLAR_TERMS[b % 24];
  return { zh, th };
}

// เรื่องที่ต้องการหาวัน: good/bad = นายวันที่ดี/ควรเลี่ยงตามตำรา, area = ด้านในดวงรายวันที่ใช้ดูประกอบ
export const PURPOSES = {
  open: { th: "เปิดร้าน เริ่มกิจการ", good: [2, 8, 10], bad: [6, 7, 11], area: "money" },
  sign: { th: "เซ็นสัญญา ตกลงงาน", good: [4, 8, 5], bad: [6, 7], area: "work" },
  move: { th: "ย้ายบ้าน เข้าบ้านใหม่", good: [8, 10, 4], bad: [6, 7, 11], area: "luck", noClash: true },
  wed: { th: "แต่งงาน หมั้น ขอแต่ง", good: [4, 8, 2, 10], bad: [6, 7, 11, 0], area: "love", noClash: true },
  travel: { th: "เดินทางไกล", good: [0, 10, 8], bad: [7, 6], area: "luck" },
  health: { th: "เริ่มรักษา ดูแลสุขภาพ", good: [1, 4], bad: [2, 6], area: "health" },
};

const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));
// เกณฑ์ตั้งจากการกระจายคะแนนทั้งปี: ดีมาก ~15%, ดี ~30%, กลาง ~35%, ระวัง ~20%
export const levelOf = (s) => (s >= 62 ? "ดีมาก" : s >= 50 ? "ดี" : s >= 36 ? "กลาง" : "ระวัง");

// natal: { nakIndex, rashi, m, d, dayBranch, yearBranch, fav: { good, avoid } }
export function dayInfo(natal, y, m, d) {
  const t = thaiDate(y, m, d, 12, 0).getTime();
  const pillar = dayPillar(y, m, d);
  const month = monthPillar(t, yearPillar(t, y).stem);
  const officerIndex = officerOf(pillar.branch, month.branch);
  const officer = OFFICERS[officerIndex];
  const vedic = dailyReading(natal, y, m, d);

  const clashes = [];
  if ((pillar.branch - natal.dayBranch + 12) % 12 === 6) clashes.push("วันชงกับเสาวันเกิด");
  if ((pillar.branch - natal.yearBranch + 12) % 12 === 6) clashes.push("วันชงกับปีเกิด");
  const dayEl = stemElement(pillar.stem);
  const favEl = natal.fav.good.includes(dayEl) ? 1 : natal.fav.avoid.includes(dayEl) ? -1 : 0;

  const score = clamp(8 + vedic.overall * 12 + officer.q * 12 + favEl * 6 - clashes.length * 15);
  return { y, m, d, pillar, monthBranch: month.branch, officerIndex, officer, vedic, clashes, favEl, score, level: levelOf(score), term: solarTermOn(y, m, d) };
}

// คะแนนสำหรับเรื่องเฉพาะ (0-100)
export function purposeScore(info, key) {
  const p = PURPOSES[key];
  let s = info.score;
  if (p.good.includes(info.officerIndex)) s += 15;
  if (p.bad.includes(info.officerIndex)) s -= 30;
  const area = info.vedic.areas.find((a) => a.key === p.area);
  if (area) s += (area.score - 3) * 6;
  if (p.noClash && info.clashes.length) s -= 30;
  if (info.vedic.house === 8) s -= 20; // จันทราษฎมะ ตำราอินเดียให้เลี่ยงเริ่มเรื่องใหญ่
  return clamp(s);
}

const addDays = (y, m, d, n) => {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};

// หาวันดีที่สุดสำหรับเรื่องนั้นในอีก days วัน (เริ่มพรุ่งนี้)
export function findBestDays(natal, key, from, days = 60, top = 3) {
  const out = [];
  for (let i = 1; i <= days; i++) {
    const { y, m, d } = addDays(from.y, from.m, from.d, i);
    const info = dayInfo(natal, y, m, d);
    out.push({ ...info, purpose: purposeScore(info, key) });
  }
  return out.sort((a, b) => b.purpose - a.purpose || a.y - b.y || a.m - b.m || a.d - b.d).slice(0, top);
}
