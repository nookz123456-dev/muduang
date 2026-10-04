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

export function detailReading(y, m, d, time, place, now = Date.now()) {
  const chart = natalChart(y, m, d, time, place);
  const moonSign = chart.planets.moon.sign;
  const usingMoon = chart.lagnaSign === null;
  const lagnaSign = usingMoon ? moonSign : chart.lagnaSign;

  const areas = AREAS.map((a) => areaReading(a, lagnaSign, chart.planets));

  const list = dashas(chart.planets.moon.lon, chart.date);
  const cur = currentDasha(list, now);
  const dasha = cur && {
    list,
    md: { ...cur.md, ...DASHA_TEXT[cur.md.lord], house: houseOf(chart.planets[cur.md.lord].sign, lagnaSign) },
    ad: { ...cur.ad, text: SUB_TEXT[cur.ad.lord] },
    next: list[list.indexOf(cur.md) + 1] || null,
  };

  const tr = transits(moonSign, now);
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
