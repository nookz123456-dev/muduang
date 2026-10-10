// เปรียบเทียบดวงจีนสองคน: ธาตุประจำตัว (日干) + กิ่งวัน (ตำแหน่งคู่ครอง 夫妻宮) + ปีนักษัตร + ธาตุเติมกัน
// กติกา 合/冲/害 ตามตำราปาจื้อทั่วไป คำอธิบายเขียนเองทั้งหมด
import { baziChart, stemElement, ELEMENTS, BRANCH_ANIMAL, STEMS, BRANCHES } from "./bazi.js";

// 天干五合: 甲己 乙庚 丙辛 丁壬 戊癸 (ห่างกัน 5)
const stemCombine = (a, b) => Math.abs(a - b) === 5;
// 六合: ผลรวมกิ่ง = 1 (mod 12) เช่น 子丑 寅亥 卯戌 辰酉 巳申 午未
const sixCombine = (a, b) => (a + b) % 12 === 1;
// 三合: กิ่งห่างกัน 4 อยู่กลุ่มเดียวกัน เช่น 申子辰
const trine = (a, b) => a !== b && (a - b + 12) % 4 === 0;
// 六冲: ตรงข้ามกัน (ห่าง 6)
const clash = (a, b) => (a - b + 12) % 12 === 6;
// 六害: ผลรวมกิ่ง = 7 (mod 12) เช่น 子未 丑午 寅巳 卯辰 申亥 酉戌
const harm = (a, b) => (a + b) % 12 === 7;

export function branchRelation(a, b) {
  if (sixCombine(a, b)) return { key: "six", th: "หกประสาน (六合)", pts: 1 };
  if (trine(a, b)) return { key: "trine", th: "สามประสาน (三合)", pts: 0.7 };
  if (clash(a, b)) return { key: "clash", th: "ชงกัน (冲)", pts: -1 };
  if (harm(a, b)) return { key: "harm", th: "ขัดกัน (害)", pts: -0.5 };
  if (a === b) return { key: "same", th: "กิ่งเดียวกัน", pts: 0.3 };
  return { key: "none", th: "ไม่ส่งไม่ขัด", pts: 0 };
}

// ความสัมพันธ์ธาตุประจำตัว a กับ b
export function stemRelation(a, b) {
  if (stemCombine(a, b)) return { key: "combine", th: "ธาตุประจำตัวประสานกัน (五合)", pts: 15 };
  const ea = stemElement(a), eb = stemElement(b);
  if (ea === eb) return { key: "same", th: "ธาตุเดียวกัน", pts: 5 };
  if ((ea + 1) % 5 === eb || (eb + 1) % 5 === ea) return { key: "feed", th: "ธาตุหนึ่งให้กำเนิดอีกธาตุ", pts: 10 };
  return { key: "control", th: "ธาตุหนึ่งข่มอีกธาตุ", pts: -8 };
}

const TEXT = {
  combine: "ธาตุประจำตัวของทั้งคู่เป็นคู่ประสานตามตำรา ดึงดูดกันตั้งแต่แรกพบ อยู่ด้วยกันแล้วรู้สึกครบ",
  same: "ธาตุประจำตัวเหมือนกัน เข้าใจกันง่ายเหมือนเพื่อนสนิท แต่ดื้อในเรื่องเดียวกัน ต้องผลัดกันยอม",
  feed: "ธาตุคนหนึ่งหล่อเลี้ยงอีกคน คนให้จะรู้สึกมีคุณค่า คนรับจะรู้สึกอบอุ่น อย่าลืมสลับกันดูแลบ้าง",
  control: "ธาตุคนหนึ่งข่มอีกคน มีแรงตึงที่ทำให้ไม่เบื่อกัน แต่ถ้าคนหนึ่งคุมมากไป อีกคนจะอึดอัด",
};
const DAY_TEXT = {
  six: "กิ่งวันซึ่งเป็นตำแหน่งคู่ครองประสานกันแบบหกประสาน เข้ากันในชีวิตประจำวัน อยู่บ้านเดียวกันได้สบาย",
  trine: "กิ่งวันอยู่กลุ่มสามประสานเดียวกัน มองไปทางเดียวกัน ทำงานเป็นทีมได้ดี",
  clash: "กิ่งวันชงกัน จังหวะชีวิตสวนกันบ่อย ตกลงเรื่องเวลา การนอน และการใช้ชีวิตให้ชัดตั้งแต่ต้น",
  harm: "กิ่งวันขัดกันเล็กน้อย เรื่องเล็กสะสมเป็นเรื่องใหญ่ได้ พูดความรู้สึกเร็วอย่าเก็บไว้",
  same: "กิ่งวันเดียวกัน นิสัยคล้ายกันมาก เป็นทั้งข้อดีและเป็นกระจกสะท้อนกัน",
  none: "กิ่งวันไม่ส่งไม่ขัดกัน ความสัมพันธ์จะเป็นอย่างไรขึ้นกับการกระทำของทั้งคู่",
};

// p = { y, m, d, time } ของแต่ละคน
export function baziMatch(p1, p2) {
  const a = baziChart(p1.y, p1.m, p1.d, p1.time || null, null);
  const b = baziChart(p2.y, p2.m, p2.d, p2.time || null, null);
  const dm = stemRelation(a.dm, b.dm);
  const day = branchRelation(a.pillars[1].branch, b.pillars[1].branch);
  const year = branchRelation(a.pillars[3].branch, b.pillars[3].branch);

  // ธาตุเด่นของอีกฝ่ายเติมธาตุที่เราต้องการไหม
  const top = (c) => c.strength.scores.indexOf(Math.max(...c.strength.scores));
  const fills = (me, other) => (me.fav.good.includes(top(other)) ? 1 : me.fav.avoid.includes(top(other)) ? -1 : 0);
  const aGets = fills(a, b), bGets = fills(b, a);

  const score = Math.max(0, Math.min(100, Math.round(
    50 + dm.pts + day.pts * 15 + year.pts * 8 + aGets * 8 + bGets * 8,
  )));
  const fillText = (gets, who, other, el) =>
    gets > 0 ? `${other}มีธาตุ${el}ที่${who}ต้องการ อยู่ใกล้กันแล้ว${who}มีพลังขึ้น`
      : gets < 0 ? `ธาตุ${el}ของ${other}เป็นธาตุที่${who}มีมากเกินอยู่แล้ว ${who}ต้องหาเวลาพักของตัวเองบ้าง`
        : `ธาตุ${el}ของ${other}เป็นกลางกับดวง${who}`;

  return {
    a, b, score, dm, day, year,
    lines: [
      { th: "ธาตุประจำตัว", detail: `${STEMS[a.dm]} ธาตุ${ELEMENTS[stemElement(a.dm)]} กับ ${STEMS[b.dm]} ธาตุ${ELEMENTS[stemElement(b.dm)]} · ${dm.th}`, text: TEXT[dm.key], good: dm.pts > 0 },
      { th: "ตำแหน่งคู่ครอง (กิ่งวัน)", detail: `${BRANCHES[a.pillars[1].branch]} กับ ${BRANCHES[b.pillars[1].branch]} · ${day.th}`, text: DAY_TEXT[day.key], good: day.pts > 0 },
      { th: "ปีนักษัตร", detail: `ปี${BRANCH_ANIMAL[a.pillars[3].branch]} กับ ปี${BRANCH_ANIMAL[b.pillars[3].branch]} · ${year.th}`, text: year.pts > 0 ? "ครอบครัวและคนรอบตัวของสองฝ่ายเข้ากันง่าย" : year.pts < 0 ? "ทัศนคติจากครอบครัวต่างกัน ค่อยๆ ทำความรู้จักครอบครัวของกันและกัน" : "ปีเกิดไม่ส่งไม่ขัดกัน", good: year.pts > 0 },
      { th: "ธาตุเติมกัน", detail: `ธาตุเด่น: คนที่ 1 ${ELEMENTS[top(a)]} · คนที่ 2 ${ELEMENTS[top(b)]}`, text: `${fillText(aGets, "คนที่ 1", "คนที่ 2", ELEMENTS[top(b)])} · ${fillText(bGets, "คนที่ 2", "คนที่ 1", ELEMENTS[top(a)])}`, good: aGets + bGets > 0 },
    ],
  };
}
