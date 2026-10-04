// คำนวณตำแหน่งดวงจันทร์แบบ sidereal (Lahiri) เพื่อหานักษัตร 27 ฤกษ์และราศีจันทร์
// สูตรดวงจันทร์: Meeus, Astronomical Algorithms บทที่ 47 (ตัดเหลือพจน์หลัก ~0.02 องศา)

const DEG = Math.PI / 180;
export const NAK_SPAN = 360 / 27; // 13 องศา 20 ลิปดา

function norm360(x) {
  return ((x % 360) + 360) % 360;
}

// Julian Day จากเวลา UTC (Date object)
export function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// [coef (1e-6 deg), D, M, M', F]
const MOON_TERMS = [
  [6288774, 0, 0, 1, 0], [1274027, 2, 0, -1, 0], [658314, 2, 0, 0, 0],
  [213618, 0, 0, 2, 0], [-185116, 0, 1, 0, 0], [-114332, 0, 0, 0, 2],
  [58793, 2, 0, -2, 0], [57066, 2, -1, -1, 0], [53322, 2, 0, 1, 0],
  [45758, 2, -1, 0, 0], [-40923, 0, 1, -1, 0], [-34720, 1, 0, 0, 0],
  [-30383, 0, 1, 1, 0], [15327, 2, 0, 0, -2], [-12528, 0, 0, 1, 2],
  [10980, 0, 0, 1, -2], [10675, 4, 0, -1, 0], [10034, 0, 0, 3, 0],
  [8548, 4, 0, -2, 0], [-7888, 2, 1, -1, 0], [-6766, 2, 1, 0, 0],
  [-5163, 1, 0, -1, 0], [4987, 1, 1, 0, 0], [4036, 2, -1, 1, 0],
  [3994, 2, 0, 2, 0], [3861, 4, 0, 0, 0], [3665, 2, 0, -3, 0],
  [-2689, 0, 1, -2, 0], [-2602, 2, 0, -1, 2], [2390, 2, -1, -2, 0],
  [-2348, 1, 0, 1, 0], [2236, 2, -2, 0, 0], [-2120, 0, 1, 2, 0],
  [-2069, 0, 2, 0, 0],
];

// ลองจิจูดดวงจันทร์แบบ tropical (องศา)
export function moonTropical(jd) {
  const T = (jd - 2451545) / 36525;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const A1 = 119.75 + 131.849 * T;
  const A2 = 53.09 + 479264.29 * T;

  let sum = 0;
  for (const [c, d, m, mp, f] of MOON_TERMS) {
    const arg = (d * D + m * M + mp * Mp + f * F) * DEG;
    const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
    sum += c * e * Math.sin(arg);
  }
  sum += 3958 * Math.sin(A1 * DEG) + 1962 * Math.sin((Lp - F) * DEG) + 318 * Math.sin(A2 * DEG);
  return norm360(Lp + sum / 1e6);
}

// Lahiri ayanamsa: 23.853 องศาที่ J2000 + precession ~50.29 พิลิปดา/ปี
export function lahiriAyanamsa(jd) {
  const years = (jd - 2451545) / 365.25;
  return 23.853 + (50.29 / 3600) * years;
}

export function moonSidereal(date) {
  const jd = julianDay(date);
  return norm360(moonTropical(jd) - lahiriAyanamsa(jd));
}

// สร้าง Date จากวันเกิดเวลาไทย (UTC+7) ไม่รู้เวลาใช้เที่ยงวัน
export function thaiDate(y, m, d, hh = 12, mm = 0) {
  return new Date(Date.UTC(y, m - 1, d, hh - 7, mm));
}

export function nakshatraAt(date) {
  const lon = moonSidereal(date);
  const index = Math.floor(lon / NAK_SPAN);
  const pada = Math.floor((lon % NAK_SPAN) / (NAK_SPAN / 4)) + 1;
  return { lon, index, pada, rashi: Math.floor(lon / 30) };
}

// ไม่รู้เวลาเกิด: เช็คว่าทั้งวัน (00:00-23:59) อยู่ฤกษ์เดียวกันไหม
export function birthNakshatra(y, m, d, time) {
  if (time) {
    const [hh, mm] = time.split(":").map(Number);
    return { ...nakshatraAt(thaiDate(y, m, d, hh, mm)), certain: true };
  }
  const start = nakshatraAt(thaiDate(y, m, d, 0, 0));
  const end = nakshatraAt(thaiDate(y, m, d, 23, 59));
  const noon = nakshatraAt(thaiDate(y, m, d, 12, 0));
  return {
    ...noon,
    certain: start.index === end.index && start.rashi === end.rashi,
    alt: start.index !== end.index ? [start.index, end.index] : null,
  };
}

// ตาราพละ: นับจากฤกษ์เกิดไปฤกษ์ที่ดวงจันทร์อยู่วันนี้ ได้ 1-9
export function taraOf(birthIndex, todayIndex) {
  const n = ((todayIndex - birthIndex + 27) % 27) + 1;
  return ((n - 1) % 9) + 1;
}

// วันเกิดแบบไทย: พุธหลัง 18:00 = ราหู (index 7)
export function thaiBirthDay(y, m, d, time) {
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (wd === 3 && time && Number(time.split(":")[0]) >= 18) return 7;
  return wd;
}
