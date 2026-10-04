// คุณมิลาน (Ashtakoot Guna Milan) 8 หมวด รวม 36 คะแนน
// ตำราดั้งเดิมแยกฝ่ายชาย/หญิง บางหมวดให้คะแนนไม่สมมาตร
// เว็บนี้ไม่ถามเพศ จึงคิดทั้งสองทิศแล้วเฉลี่ย (คู่ชายหญิงจะได้ค่ากลางระหว่างสองแบบ)
import { NAKSHATRAS } from "./data.js";

const YONI_ORDER = ["horse", "elephant", "sheep", "serpent", "dog", "cat", "rat",
  "cow", "buffalo", "tiger", "deer", "monkey", "mongoose", "lion"];
export const YONI_TABLE = [
  [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
  [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
  [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
  [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
  [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
  [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
  [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
  [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
  [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
  [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
  [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
  [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
  [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
  [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4],
];

// วรรณะของราศี: 4=พราหมณ์ 3=กษัตริย์ 2=แพศย์ 1=ศูทร
const VARNA = [3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4];

// วศยะ: ราศีที่ "อยู่ใต้อิทธิพล" ของแต่ละราศี (ตามมุหูรตะจินตามณี)
const VASHYA = [[4, 7], [3, 6], [5], [7, 8], [6], [11, 2], [5, 9], [3], [11], [0, 10], [0], [9]];

// ดาวเจ้าเรือน: 0=อาทิตย์ 1=จันทร์ 2=อังคาร 3=พุธ 4=พฤหัส 5=ศุกร์ 6=เสาร์
const LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];
// ความสัมพันธ์ธรรมชาติ: F=มิตร N=กลาง E=ศัตรู [แถว=ดาว, คอลัมน์=ดาวอื่น]
const REL = [
  "-FFNFEE", // อาทิตย์
  "F-NFNNN", // จันทร์
  "FF-EFNN", // อังคาร
  "FEN-NFN", // พุธ
  "FFFE-EN", // พฤหัส
  "EENFN-F", // ศุกร์
  "EEEFNF-", // เสาร์
];
const MAITRI = { FF: 5, FN: 4, NF: 4, NN: 3, FE: 1, EF: 1, NE: 0.5, EN: 0.5, EE: 0 };

// คณะ: [แถว=ฝ่ายชาย, คอลัมน์=ฝ่ายหญิง] D,M,R
const GANA = { D: { D: 6, M: 6, R: 1 }, M: { D: 5, M: 6, R: 0 }, R: { D: 1, M: 0, R: 6 } };

// นาฑี: วนรอบ 6 ฤกษ์ อาทิ-มัธยะ-อันตยะ-อันตยะ-มัธยะ-อาทิ
export const nadiOf = (i) => [0, 1, 2, 2, 1, 0][i % 6];

function avg(f, a, b) {
  return (f(a, b) + f(b, a)) / 2;
}

const varna = (a, b) => (VARNA[a.rashi] >= VARNA[b.rashi] ? 1 : 0);

function vashya(a, b) {
  if (a.rashi === b.rashi) return 2;
  const ab = VASHYA[a.rashi].includes(b.rashi);
  const ba = VASHYA[b.rashi].includes(a.rashi);
  return ab && ba ? 2 : ab || ba ? 1 : 0;
}

function tara(a, b) {
  const good = (x, y) => ![3, 5, 7].includes((((y - x + 27) % 27) % 9) + 1);
  return (good(a.index, b.index) ? 1.5 : 0) + (good(b.index, a.index) ? 1.5 : 0);
}

function yoni(a, b) {
  const ya = YONI_ORDER.indexOf(NAKSHATRAS[a.index].animal);
  const yb = YONI_ORDER.indexOf(NAKSHATRAS[b.index].animal);
  return YONI_TABLE[ya][yb];
}

function maitri(a, b) {
  const la = LORD[a.rashi], lb = LORD[b.rashi];
  if (la === lb) return 5;
  return MAITRI[REL[la][lb] + REL[lb][la]];
}

const gana = (a, b) => GANA[NAKSHATRAS[a.index].gana][NAKSHATRAS[b.index].gana];

function bhakoot(a, b) {
  const d = ((b.rashi - a.rashi + 12) % 12) + 1;
  return [2, 12, 5, 9, 6, 8].includes(d) ? 0 : 7;
}

const nadi = (a, b) => (nadiOf(a.index) === nadiOf(b.index) ? 0 : 8);

// a, b = { index: ฤกษ์ 0-26, rashi: ราศีจันทร์ 0-11 }
export function gunaMilan(a, b) {
  const parts = [
    { key: "varna", th: "วรรณะ", hint: "ทัศนคติและการให้เกียรติกัน", max: 1, score: avg(varna, a, b) },
    { key: "vashya", th: "วศยะ", hint: "แรงดึงดูดและการยอมกัน", max: 2, score: vashya(a, b) },
    { key: "tara", th: "ตารา", hint: "โชคและจังหวะชีวิต", max: 3, score: tara(a, b) },
    { key: "yoni", th: "โยนี", hint: "ความเข้ากันของนิสัยสัตว์ประจำฤกษ์", max: 4, score: yoni(a, b) },
    { key: "maitri", th: "ไมตรี", hint: "ความคิดและมิตรภาพ", max: 5, score: maitri(a, b) },
    { key: "gana", th: "คณะ", hint: "อุปนิสัยพื้นฐาน", max: 6, score: avg(gana, a, b) },
    { key: "bhakoot", th: "ภกูฏ", hint: "ความรักและการเงินร่วมกัน", max: 7, score: bhakoot(a, b) },
    { key: "nadi", th: "นาฑี", hint: "ธาตุและพลังกาย", max: 8, score: nadi(a, b) },
  ];
  const total = parts.reduce((s, p) => s + p.score, 0);
  return { parts, total };
}
