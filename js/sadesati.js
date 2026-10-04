// สาเฑสาตี (เสาร์ทับ 7 ปีครึ่ง): ดาวเสาร์จรผ่านราศีที่ 12, 1, 2 นับจากจันทร์ราศีเกิด
// ไล่ตำแหน่งดาวเสาร์ทีละวัน รวมช่วงที่ถอยหลัง (พักร) ออกแล้วกลับเข้ามาให้เป็นรอบเดียวกัน
import { siderealPositions } from "./planets.js";

const DAY = 86400000;
const saturnSign = (t) => Math.floor(siderealPositions(new Date(t)).saturn / 30);

// ช่วงเวลาที่ดาวเสาร์อยู่ในราศีที่ต้องการ (รายวัน) ระหว่าง from-to
function saturnStays(signs, from, to) {
  const out = [];
  let cur = null;
  for (let t = from; t <= to; t += DAY) {
    const s = saturnSign(t);
    const inside = signs.includes(s);
    if (inside && !cur) cur = { start: t, end: t, signs: [s] };
    else if (inside) {
      cur.end = t;
      if (cur.signs[cur.signs.length - 1] !== s) cur.signs.push(s);
    } else if (cur) {
      out.push(cur);
      cur = null;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// รวมช่วงที่ห่างกันไม่เกิน 2 ปี (ดาวเสาร์ถอยหลังออกไปแล้วกลับมา) เป็นรอบเดียว
function mergeCycles(stays) {
  const out = [];
  for (const s of stays) {
    const last = out[out.length - 1];
    if (last && s.start - last.end < 730 * DAY) last.end = s.end;
    else out.push({ start: s.start, end: s.end });
  }
  return out;
}

// moonRashi = จันทร์ราศีเกิด 0-11, now = Date
export function sadeSati(moonRashi, now = new Date()) {
  const signs = [(moonRashi + 11) % 12, moonRashi, (moonRashi + 1) % 12];
  const from = now.getTime() - 12 * 365 * DAY;
  const to = now.getTime() + 32 * 365 * DAY;
  const cycles = mergeCycles(saturnStays(signs, from, to));
  const t = now.getTime();
  const current = cycles.find((c) => c.start <= t && t <= c.end) || null;
  const next = cycles.find((c) => c.start > t) || null;
  const last = [...cycles].reverse().find((c) => c.end < t) || null;

  let phase = null;
  if (current) {
    const s = saturnSign(t);
    phase = s === signs[0] ? 1 : s === signs[1] ? 2 : s === signs[2] ? 3 : 0; // 0 = ถอยออกชั่วคราว
  }
  return { signs, current, next, last, phase, saturnNow: saturnSign(t) };
}
