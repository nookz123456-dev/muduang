// ผังดวง: ลัคนา 12 เรือน (whole sign) ทศาวิมโศตรี และดาวจรปีนี้
import { julianDay, lahiriAyanamsa, thaiDate, NAK_SPAN } from "./astro.js";
import { siderealPositions } from "./planets.js";

const R = Math.PI / 180;
const DAY = 86400000;
const YEAR = 365.25 * DAY;
const norm360 = (x) => ((x % 360) + 360) % 360;

// ลัคนา (ascendant) แบบ sidereal ที่ละติจูด/ลองจิจูดที่เกิด
export function ascendant(date, lat, lon) {
  const jd = julianDay(date);
  const T = (jd - 2451545) / 36525;
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T;
  const lst = norm360(gmst + lon) * R;
  const eps = (23.4393 - 0.013 * T) * R;
  const asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(lat * R) * Math.sin(eps))) / R;
  return norm360(asc - lahiriAyanamsa(jd));
}

export const PLANETS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
const signOf = (lon) => Math.floor(lon / 30);

// เรือนที่ 1-12 ของราศี เมื่อลัคนาอยู่ราศี lagnaSign
export const houseOf = (sign, lagnaSign) => ((sign - lagnaSign + 12) % 12) + 1;

export function natalChart(y, m, d, time, place) {
  const [hh, mm] = time ? time.split(":").map(Number) : [12, 0];
  const date = thaiDate(y, m, d, hh, mm);
  const pos = siderealPositions(date);
  const lagna = time ? ascendant(date, place.lat, place.lon) : null;
  const lagnaSign = lagna === null ? null : signOf(lagna);
  const planets = Object.fromEntries(PLANETS.map((p) => {
    const sign = signOf(pos[p]);
    return [p, { lon: pos[p], sign, house: lagnaSign === null ? null : houseOf(sign, lagnaSign) }];
  }));
  return { date, lagna, lagnaSign, planets };
}

// ---------- ทศาวิมโศตรี (120 ปี) ----------
export const DASHA_ORDER = ["ketu", "venus", "sun", "moon", "mars", "rahu", "jupiter", "saturn", "mercury"];
export const DASHA_YEARS = { ketu: 7, venus: 20, sun: 6, moon: 10, mars: 7, rahu: 18, jupiter: 16, saturn: 19, mercury: 17 };

export function dashas(moonLon, birth) {
  const idx = Math.floor(moonLon / NAK_SPAN);
  const first = idx % 9;
  const done = (moonLon % NAK_SPAN) / NAK_SPAN; // สัดส่วนฤกษ์ที่ดวงจันทร์เดินผ่านไปแล้วตอนเกิด
  let t = birth.getTime() - done * DASHA_YEARS[DASHA_ORDER[first]] * YEAR;
  const out = [];
  for (let k = 0; k < 9; k++) {
    const lord = DASHA_ORDER[(first + k) % 9];
    const len = DASHA_YEARS[lord] * YEAR;
    const subs = [];
    let u = t;
    for (let j = 0; j < 9; j++) {
      const sub = DASHA_ORDER[(first + k + j) % 9];
      const sl = (DASHA_YEARS[lord] * DASHA_YEARS[sub] / 120) * YEAR;
      subs.push({ lord: sub, start: u, end: u + sl });
      u += sl;
    }
    out.push({ lord, start: t, end: t + len, subs });
    t += len;
  }
  return out;
}

export function currentDasha(list, now = Date.now()) {
  const md = list.find((x) => x.start <= now && now < x.end);
  if (!md) return null;
  const ad = md.subs.find((x) => x.start <= now && now < x.end);
  return { md, ad };
}

// ---------- ดาวจร: พฤหัสและเสาร์นับเรือนจากจันทร์เกิด ----------
function nextSignChange(planet, from) {
  const s0 = signOf(siderealPositions(new Date(from))[planet]);
  for (let t = from + DAY; t < from + 4 * YEAR; t += DAY) {
    const s = signOf(siderealPositions(new Date(t))[planet]);
    if (s !== s0) return { at: t, sign: s };
  }
  return null;
}

export function transits(moonSign, now = Date.now()) {
  const pos = siderealPositions(new Date(now));
  const out = {};
  for (const p of ["jupiter", "saturn"]) {
    const sign = signOf(pos[p]);
    out[p] = { sign, house: houseOf(sign, moonSign), next: nextSignChange(p, now) };
  }
  return out;
}
