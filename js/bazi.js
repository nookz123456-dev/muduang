// ดวงจีน ปาจื้อ (八字 สี่เสา) คำนวณเองทั้งหมด
// ปี/เดือน: แบ่งตามสารท 24 ฤดู (ตำแหน่งดวงอาทิตย์จริง) ปีใหม่จีนทางโหราศาสตร์ = ลี่ชุน (ดวงอาทิตย์ 315 องศา)
// วัน: วงรอบ 60 วันจาก Julian Day (เวลาท้องถิ่นไทย เปลี่ยนวันตอนเที่ยงคืน)
import { tropicalPositions } from "./planets.js";
import { thaiDate } from "./astro.js";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const STEM_TH = ["กะ", "อิก", "เปี้ย", "เต็ง", "โบ่ว", "กี้", "แก", "ซิง", "หยิม", "กุ่ย"];
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
export const BRANCH_TH = ["ชวด", "ฉลู", "ขาล", "เถาะ", "มะโรง", "มะเส็ง", "มะเมีย", "มะแม", "วอก", "ระกา", "จอ", "กุน"];
export const BRANCH_ANIMAL = ["หนู", "วัว", "เสือ", "กระต่าย", "มังกร", "งู", "ม้า", "แพะ", "ลิง", "ไก่", "หมา", "หมู"];
// ธาตุ 0=ไม้ 1=ไฟ 2=ดิน 3=ทอง 4=น้ำ
export const ELEMENTS = ["ไม้", "ไฟ", "ดิน", "ทอง", "น้ำ"];
export const ELEMENT_ZH = ["木", "火", "土", "金", "水"];
export const stemElement = (s) => Math.floor(s / 2);
export const stemYang = (s) => s % 2 === 0;
export const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
// ราศีแฝงในกิ่ง (藏干) [หลัก, รอง, เศษ]
export const HIDDEN = [[9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 4, 6], [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0]];
const HIDDEN_W = [1, 0.5, 0.3];

const norm360 = (x) => ((x % 360) + 360) % 360;
const DAY = 86400000;
export const sunLon = (t) => tropicalPositions(new Date(t)).sun;

// ---------- สี่เสา ----------
export function yearPillar(t, y) {
  // ก่อนลี่ชุน (ดวงอาทิตย์ยังไม่ถึง 315) ในต้นปี = ปีจีนก่อนหน้า
  const lon = sunLon(t);
  const before = new Date(t).getUTCMonth() < 3 && lon < 315 && lon > 240;
  const yy = before ? y - 1 : y;
  return { stem: (((yy - 4) % 10) + 10) % 10, branch: (((yy - 4) % 12) + 12) % 12 };
}

export function monthPillar(t, yearStem) {
  const m = Math.floor(norm360(sunLon(t) - 315) / 30); // 0 = เดือนขาล 寅
  const yinStem = ((yearStem % 5) * 2 + 2) % 10; // 五虎遁
  return { stem: (yinStem + m) % 10, branch: (2 + m) % 12, index: m };
}

export function dayPillar(y, m, d) {
  const jdn = Math.round(Date.UTC(y, m - 1, d) / DAY + 2440587.5); // วันนั้นเที่ยงวัน
  const k = (((jdn + 49) % 60) + 60) % 60;
  return { stem: k % 10, branch: k % 12 };
}

export function hourPillar(hh, mm, dayStem) {
  const branch = Math.floor((hh + mm / 60 + 1) / 2) % 12;
  const ziStem = (dayStem % 5) * 2; // 五鼠遁
  return { stem: (ziStem + branch) % 10, branch };
}

// ---------- สิบเทพ (十神) เทียบกับธาตุประจำตัว ----------
export const TEN_GODS = {
  companion: ["比肩", "劫财"], output: ["食神", "伤官"], wealth: ["偏财", "正财"],
  officer: ["七杀", "正官"], resource: ["偏印", "正印"],
};
export function relation(dmElement, el) {
  if (el === dmElement) return "companion";
  if (el === (dmElement + 1) % 5) return "output";
  if (el === (dmElement + 2) % 5) return "wealth";
  if (el === (dmElement + 3) % 5) return "officer";
  return "resource";
}
export function tenGod(dmStem, stem) {
  const rel = relation(stemElement(dmStem), stemElement(stem));
  const same = stemYang(dmStem) === stemYang(stem);
  return { rel, zh: TEN_GODS[rel][same ? 0 : 1] };
}

// ---------- ความแข็งแรงของธาตุ ----------
export function elementScores(pillars, dmStem) {
  const sc = [0, 0, 0, 0, 0];
  pillars.forEach((p, i) => {
    if (!p) return;
    if (i !== 1) sc[stemElement(p.stem)] += 1; // ไม่นับตัวธาตุประจำตัวเอง
    const mult = i === 2 ? 1.5 : 1; // กิ่งเดือนมีอิทธิพลตามฤดู
    HIDDEN[p.branch].forEach((s, k) => (sc[stemElement(s)] += HIDDEN_W[k] * mult));
  });
  const total = sc.reduce((a, b) => a + b, 0);
  const dm = stemElement(dmStem);
  const support = (sc[dm] + sc[(dm + 4) % 5]) / total; // ธาตุเดียวกัน + ธาตุแม่
  return { scores: sc, pct: sc.map((v) => v / total), support, strong: support >= 0.45 };
}

export function favorable(dmStem, strong) {
  const dm = stemElement(dmStem);
  const el = { companion: dm, resource: (dm + 4) % 5, output: (dm + 1) % 5, wealth: (dm + 2) % 5, officer: (dm + 3) % 5 };
  return strong
    ? { good: [el.output, el.wealth, el.officer], avoid: [el.resource, el.companion] }
    : { good: [el.resource, el.companion], avoid: [el.officer, el.wealth, el.output] };
}

// ---------- โชควัยจร 10 ปี (大运) ----------
// ปีหยาง+ชาย หรือ ปีหยิน+หญิง เดินหน้า นอกนั้นถอยหลัง
// อายุเริ่ม = จำนวนวันถึงสารทแบ่งเดือนถัดไป/ก่อนหน้า หาร 3
function jieTime(t, forward) {
  const lon = sunLon(t);
  let target = forward ? 15 + 30 * Math.ceil((lon - 15) / 30 + 1e-9) : 15 + 30 * Math.floor((lon - 15) / 30 - 1e-9);
  target = norm360(target);
  let est = t + ((forward ? 1 : -1) * Math.abs(norm360((target - lon) * (forward ? 1 : -1)))) / 0.9856 * DAY;
  for (let i = 0; i < 4; i++) {
    const diff = ((norm360(sunLon(est) - target) + 180) % 360) - 180;
    est -= (diff / 0.9856) * DAY;
  }
  return est;
}

export function luckPillars(t, yearStem, month, male, count = 8) {
  const forward = stemYang(yearStem) === male;
  const jt = jieTime(t, forward);
  const startAge = Math.abs(jt - t) / DAY / 3;
  const base = sexagenary(month.stem, month.branch);
  const list = [];
  for (let i = 1; i <= count; i++) {
    const k = (((base + (forward ? i : -i)) % 60) + 60) % 60;
    list.push({ stem: k % 10, branch: k % 12, age: startAge + (i - 1) * 10 });
  }
  return { forward, startAge, list };
}

// ลำดับในวงรอบ 60 จากคู่ราศีฟ้า-ดิน
export function sexagenary(stem, branch) {
  for (let k = 0; k < 60; k++) if (k % 10 === stem && k % 12 === branch) return k;
  return 0;
}

// ---------- รวม ----------
export function baziChart(y, m, d, time, male) {
  const [hh, mm] = time ? time.split(":").map(Number) : [12, 0];
  const t = thaiDate(y, m, d, hh, mm).getTime();
  const year = yearPillar(t, y);
  const month = monthPillar(t, year.stem);
  const day = dayPillar(y, m, d);
  const hour = time ? hourPillar(hh, mm, day.stem) : null;
  const pillars = [hour, day, month, year]; // เรียง ยาม วัน เดือน ปี
  const strength = elementScores(pillars, day.stem);
  const fav = favorable(day.stem, strength.strong);
  const luck = male === null || male === undefined ? null : luckPillars(t, year.stem, month, male);
  return { t, pillars, dm: day.stem, strength, fav, luck };
}

export function yearPillarOf(gregYear) {
  return { stem: (((gregYear - 4) % 10) + 10) % 10, branch: (((gregYear - 4) % 12) + 12) % 12 };
}
