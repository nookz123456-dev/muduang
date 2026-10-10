// ประกอบคำทำนายดวงละเอียดจากผังดวง
// ไม่มีเวลาเกิด: ใช้ราศีจันทร์เป็นลัคนาแทน (จันทรลัคนา) ตามที่ตำราอินเดียใช้กันทั่วไป
import { natalChart, dashas, currentDasha, transits, houseOf } from "./chart.js";
import {
  AREAS, LAGNA, HOUSE_TOPICS, SIGN_LORD, ELEMENT_TH, elementOf, lordPlacement, OCCUPANT, UPACHAYA,
  PLANET_TH, DASHA_TEXT, SUB_TEXT, JUPITER_TRANSIT, SATURN_TRANSIT, JUPITER_GOOD, SATURN_GOOD, LUCKY,
} from "./readings.js";
import { RASHIS } from "./data.js";

const MALEFIC = ["sun", "mars", "saturn", "rahu", "ketu"];
const clamp = (x) => Math.max(1, Math.min(5, Math.round(x * 2) / 2));

function areaReading(area, lagnaSign, planets) {
  const sign = (lagnaSign + area.house - 1) % 12;
  const lord = SIGN_LORD[sign];
  const lordHouse = houseOf(planets[lord].sign, lagnaSign);
  const lp = lordPlacement(lordHouse);
  const occupants = Object.keys(planets).filter((p) => houseOf(planets[p].sign, lagnaSign) === area.house);

  let score = 3 + lp.score;
  const lines = [
    `เรือน ${area.house} (${HOUSE_TOPICS[area.house]}) ตกราศี${RASHIS[sign]} ธาตุ${ELEMENT_TH[elementOf(sign)]}: ${area.element[elementOf(sign)]}`,
    `ดาวเจ้าเรือนคือดาว${PLANET_TH[lord]} ไปอยู่เรือน ${lordHouse} ${lp.text}`,
  ];
  for (const p of occupants) {
    const good = MALEFIC.includes(p) && UPACHAYA.includes(area.house);
    score += good ? 0.5 : OCCUPANT[p].score;
    lines.push(OCCUPANT[p].text + (good ? " (แต่ในเรือนนี้ ตำราว่าดาวแรงกลับเป็นผลดี)" : ""));
  }
  const kHouse = houseOf(planets[area.karaka].sign, lagnaSign);
  if (area.karaka !== lord && !occupants.includes(area.karaka)) {
    lines.push(`ดาว${PLANET_TH[area.karaka]} ซึ่งเป็นดาวประจำเรื่อง${area.th} อยู่เรือน ${kHouse} (${HOUSE_TOPICS[kHouse]})`);
  }
  const sc = clamp(score);
  const summary = sc >= 4.5 ? "เด่นมาก" : sc >= 3.5 ? "ดี" : sc >= 3 ? "กลางๆ" : "ต้องใส่ใจเป็นพิเศษ";
  return { ...area, sign, lord, lordHouse, occupants, score: sc, summary, lines };
}

const yearTh = (t) => new Date(t).getFullYear() + 543;
const monthTh = (t) => new Date(t).toLocaleDateString("th-TH", { month: "short", year: "numeric" });

// "ช่วงนี้" ของแต่ละด้าน: ทศา/ช่วงย่อยที่ดาวเจ้าเรือนหรือดาวในเรือนครองอยู่ + ดาวพฤหัส/เสาร์จรผ่านเรือนนั้น (นับจากลัคนา)
function areaTiming(a, cur, trHouse, tr) {
  const out = [];
  const touches = (p) => p === a.lord || a.occupants.includes(p);
  const how = (p) => (p === a.lord ? "เป็นดาวเจ้าเรือนนี้" : "อยู่ในเรือนนี้");
  if (cur && touches(cur.md.lord)) {
    out.push({ good: true, text: `ตอนนี้อยู่ในทศาดาว${PLANET_TH[cur.md.lord]} (ถึง พ.ศ. ${yearTh(cur.md.end)}) ซึ่ง${how(cur.md.lord)} เรื่องนี้จึงเป็นเรื่องหลักของชีวิตช่วงนี้ ลงแรงตรงนี้คุ้มที่สุด` });
  }
  if (cur && cur.ad.lord !== cur.md.lord && touches(cur.ad.lord)) {
    out.push({ good: true, text: `ช่วงย่อยดาว${PLANET_TH[cur.ad.lord]} (ถึง ${monthTh(cur.ad.end)}) ${how(cur.ad.lord)} เรื่องนี้จะถูกกระตุ้นให้ขยับเป็นพิเศษ` });
  }
  if (trHouse.jupiter === a.house) {
    const until = tr.jupiter.next ? ` ถึง ${monthTh(tr.jupiter.next.at)}` : "";
    out.push({ good: true, text: `ดาวพฤหัสจรผ่านเรือนนี้${until} โอกาสและคนช่วยเรื่องนี้มาง่าย รีบใช้จังหวะนี้` });
  }
  if (trHouse.saturn === a.house) {
    const until = tr.saturn.next ? ` ถึง ${monthTh(tr.saturn.next.at)}` : "";
    out.push({ good: false, text: `ดาวเสาร์จรผ่านเรือนนี้${until} เป็นช่วงวางรากฐาน ผลมาช้าแต่มั่นคง อย่าเร่งและอย่าทิ้งกลางทาง` });
  }
  return out;
}

export function detailReading(y, m, d, time, place, now = Date.now()) {
  const chart = natalChart(y, m, d, time, place);
  const moonSign = chart.planets.moon.sign;
  const usingMoon = chart.lagnaSign === null;
  const lagnaSign = usingMoon ? moonSign : chart.lagnaSign;

  const list = dashas(chart.planets.moon.lon, chart.date);
  const cur = currentDasha(list, now);
  const tr = transits(moonSign, now);
  const trHouse = { jupiter: houseOf(tr.jupiter.sign, lagnaSign), saturn: houseOf(tr.saturn.sign, lagnaSign) };

  const areas = [...AREAS].sort((a, b) => a.house - b.house).map((a) => {
    const r = areaReading(a, lagnaSign, chart.planets);
    return { ...r, timing: areaTiming(r, cur, trHouse, tr) };
  });
  const dasha = cur && {
    list,
    md: { ...cur.md, ...DASHA_TEXT[cur.md.lord], house: houseOf(chart.planets[cur.md.lord].sign, lagnaSign) },
    ad: { ...cur.ad, text: SUB_TEXT[cur.ad.lord] },
    next: list[list.indexOf(cur.md) + 1] || null,
  };

  const transit = {
    jupiter: { ...tr.jupiter, text: JUPITER_TRANSIT[tr.jupiter.house], good: JUPITER_GOOD.includes(tr.jupiter.house) },
    saturn: { ...tr.saturn, text: SATURN_TRANSIT[tr.saturn.house], good: SATURN_GOOD.includes(tr.saturn.house) },
  };

  const lagnaLord = SIGN_LORD[lagnaSign];
  return {
    chart, usingMoon, lagnaSign, lagna: LAGNA[lagnaSign], lagnaLord,
    areas, dasha, transit,
    lucky: { ...LUCKY[lagnaLord], planet: lagnaLord },
    planetsByHouse: Object.entries(chart.planets).map(([p, v]) => ({ p, th: PLANET_TH[p], sign: v.sign, house: houseOf(v.sign, lagnaSign) })),
  };
}
