// เช็คเบอร์มือถือ: เลขแทนดาวแบบไทย (1 อาทิตย์ ... 8 ราหู 9 เกตุ, 0 = ช่วงพัก)
// คู่เลขดี/ขัด: ใช้คู่ที่ตำราไทยนิยมถือก่อน คู่ที่ไม่มีในนั้นดูจากความเป็นมิตรของดาวตามตำราพระเวท + ทักษาตามวันเกิด
// ตำราเลขศาสตร์แต่ละสำนักให้ความหมายต่างกัน ข้อความทั้งหมดเขียนเอง
import { roleTable } from "./taksa.js";
import { reduce } from "./numerology.js";

export const DIGIT_PLANET = [null, "sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];

// มิตร/ศัตรูตามธรรมชาติ (BPHS) ราหูถือแบบเสาร์ เกตุถือแบบอังคาร
const FRIENDS = {
  sun: ["moon", "mars", "jupiter", "ketu"], moon: ["sun", "mercury"], mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"], jupiter: ["sun", "moon", "mars", "ketu"], venus: ["mercury", "saturn", "rahu"],
  saturn: ["mercury", "venus", "rahu"],
};
const ENEMIES = {
  sun: ["venus", "saturn", "rahu"], moon: [], mars: ["mercury"], mercury: ["moon"],
  jupiter: ["mercury", "venus"], venus: ["sun", "moon"], saturn: ["sun", "moon", "mars", "ketu"],
};
const asBase = (p) => (p === "rahu" ? "saturn" : p === "ketu" ? "mars" : p);
export function relation(a, b) {
  const base = asBase(a);
  if (FRIENDS[base].includes(b) || FRIENDS[base].includes(asBase(b))) return 1;
  if (ENEMIES[base].includes(b) || ENEMIES[base].includes(asBase(b))) return -1;
  return 0;
}

export const THEME = [
  { th: "ช่วงพัก" },
  { th: "อำนาจและความมั่นใจ", plus: "กล้านำ คนเชื่อถือ", care: "ระวังความถือตัว" },
  { th: "เสน่ห์และความอ่อนโยน", plus: "คนเอ็นดู เจรจานุ่มนวล", care: "อารมณ์แกว่งง่าย" },
  { th: "ความกล้าและความขยัน", plus: "ลงมือไว สู้งาน", care: "ใจร้อน มีปากเสียงง่าย" },
  { th: "การพูดและการค้า", plus: "สื่อสารเก่ง ติดต่อคนคล่อง", care: "พูดเร็วกว่าคิด" },
  { th: "ปัญญาและผู้ใหญ่", plus: "มีคนแนะนำทาง เรียนรู้ไว", care: "ยึดความคิดตัวเองมากไป" },
  { th: "ความรักและเงินทอง", plus: "มีเสน่ห์ เงินคล่อง งานศิลป์เด่น", care: "ใช้เงินกับความสุขเกินตัว" },
  { th: "ความอดทนและความมั่นคง", plus: "ทำงานหนักได้ สร้างฐานระยะยาว", care: "เหนื่อยหนัก งานล่าช้า" },
  { th: "ไหวพริบและโอกาสพลิกผัน", plus: "หาช่องทางเก่ง กล้าลองของใหม่", care: "ตัดสินใจเสี่ยงเกินตัว" },
  { th: "สัญชาตญาณและสิ่งคุ้มครอง", plus: "ลางสังหรณ์ดี มีสิ่งคุ้มครอง", care: "คิดมาก ฟุ้งซ่าน" },
];
const GOOD_DOUBLE = [2, 4, 5, 6]; // ดาวศุภเคราะห์ ซ้ำแล้วเด่น

// คู่เลขที่ตำราไทยนิยมถือกันทั่วไป (ตรวจจากหลายแหล่ง กลับลำดับได้ เช่น 56 = 65) ใช้ก่อนสูตรดาว
const POP_GOOD = [14, 15, 16, 19, 22, 23, 24, 25, 26, 29, 35, 36, 39, 44, 45, 46, 47, 49, 55, 56, 59, 66, 69, 78, 79, 89, 99];
const POP_CARE = [7, 8, 12, 13, 17, 18, 27, 34, 37, 38, 48, 67, 77];
const popular = (a, b) => {
  const n = Math.min(a * 10 + b, b * 10 + a);
  return POP_GOOD.includes(n) ? "good" : POP_CARE.includes(n) ? "care" : null;
};

// q: "good" | "mid" | "care" | "rest"
export function pairOf(a, b) {
  const pair = `${a}${b}`;
  const pop = popular(a, b);
  if (pop === "care" && (a === 0 || b === 0)) {
    const x = a || b;
    return { pair, q: "care", text: `เลข 0 ติดกับ${THEME[x].th} ตำราว่าใจจะกังวลง่าย ${THEME[x].care} หาเวลาพักใจให้สม่ำเสมอ` };
  }
  if (pop === "good") {
    return { pair, q: "good", text: a === b ? `${THEME[a].th}ซ้ำสองชั้น ${THEME[a].plus} เด่นชัด` : `${THEME[a].th}หนุน${THEME[b].th}: ${THEME[a].plus} และ${THEME[b].plus}` };
  }
  if (pop === "care") {
    return { pair, q: "care", text: a === b ? `${THEME[a].th}ซ้ำสองชั้น พลังหนักไป ${THEME[a].care}` : `${THEME[a].th}กับ${THEME[b].th}ดึงกันคนละทาง: ${THEME[a].care} หรือ${THEME[b].care}` };
  }
  if (a === 0 || b === 0) {
    const x = a || b;
    return { pair, q: "rest", text: x ? `เลข 0 พักพลังของ${THEME[x].th}ไว้ ผลจะมาช้าลงแต่ไม่เสีย` : "ศูนย์ซ้อนกัน เป็นช่วงว่างของเบอร์" };
  }
  if (a === b) {
    const good = GOOD_DOUBLE.includes(a);
    return { pair, q: good ? "good" : "mid", text: `${THEME[a].th}ซ้ำสองชั้น ${good ? THEME[a].plus + " เด่นชัด" : `พลังแรง ใช้ให้พอดี ${THEME[a].care}`}` };
  }
  const pa = DIGIT_PLANET[a], pb = DIGIT_PLANET[b];
  const s = relation(pa, pb) + relation(pb, pa);
  if (s >= 1) return { pair, q: "good", text: `${THEME[a].th}หนุน${THEME[b].th}: ${THEME[a].plus} และ${THEME[b].plus}` };
  if (s <= -1) return { pair, q: "care", text: `${THEME[a].th}กับ${THEME[b].th}ดึงกันคนละทาง: ${THEME[a].care} หรือ${THEME[b].care}` };
  return { pair, q: "mid", text: `${THEME[a].th}กับ${THEME[b].th}อยู่ด้วยกันได้ ไม่ส่งเสริมไม่ขัด` };
}

// รับเบอร์ไทย 0xxxxxxxxx หรือ +66 / 66 นำหน้า คืนเลข 10 หลัก หรือ null
export function normalizePhone(raw) {
  let s = String(raw).replace(/\D/g, "");
  if (s.startsWith("66") && s.length === 11) s = "0" + s.slice(2);
  return /^0\d{9}$/.test(s) ? s : null;
}

// คู่ดีที่ประกอบจากเลขที่กำหนดเท่านั้น (ใช้แนะนำท้ายเบอร์ตามทักษาของเจ้าของ)
export function suggestPairs(digits) {
  return POP_GOOD.filter((n) => digits.includes(Math.floor(n / 10)) && digits.includes(n % 10))
    .map((n) => String(n).padStart(2, "0"));
}

const PAIR_POINTS = { good: 8, mid: 0, rest: -2, care: -8 };
const GOOD_ROLES = ["ศรี", "เดช", "มนตรี"];

// birthDay: เลขวันแบบ THAI_DAYS (0=อาทิตย์ ... 6=เสาร์, 7=พุธกลางคืน) หรือ null ถ้าไม่รู้
export function analyzePhone(raw, birthDay) {
  const num = normalizePhone(raw);
  if (!num) return null;
  const digits = [...num].map(Number);
  const core = digits.slice(3); // 7 หลักท้าย ตัดรหัสผู้ให้บริการ 3 หลักแรก
  const pairs = [];
  for (let i = 0; i < core.length - 1; i++) pairs.push({ ...pairOf(core[i], core[i + 1]), last: i === core.length - 2 });

  let score = 50;
  for (const p of pairs) score += PAIR_POINTS[p.q] * (p.last ? 2 : 1);

  // ทักษา: เลข 1-8 แทนดาววันเกิด 0-7 (เลข 9 และ 0 ไม่มีในทักษา)
  let taksa = null;
  if (birthDay !== null && birthDay !== undefined) {
    const table = roleTable(birthDay);
    const roleOfDigit = (n) => (n >= 1 && n <= 8 ? table[n - 1] : null);
    const kalakini = Number(Object.keys(table).find((k) => table[k] === "กาลกิณี")) + 1;
    const good = [1, 2, 3, 4, 5, 6, 7, 8].filter((n) => GOOD_ROLES.includes(roleOfDigit(n)));
    const hits = core.filter((n) => n === kalakini).length;
    const goodHits = core.filter((n) => good.includes(n)).length;
    score += Math.min(goodHits, 3) * 3 - hits * 6;
    taksa = { kalakini, good, hits, goodHits, roleOfDigit };
  }

  const sum = digits.reduce((a, b) => a + b, 0);
  return {
    num, core, pairs, sum, root: reduce(sum, true), taksa,
    score: Math.max(0, Math.min(100, Math.round(score))),
    lastPair: pairs[pairs.length - 1],
  };
}
