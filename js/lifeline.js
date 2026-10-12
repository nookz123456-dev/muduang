// เส้นชีวิต: คะแนนรายปี (อายุ 0-85) รวมตำราอินเดียกับจีน
// อินเดีย: ทศาใหญ่/ย่อย (ดาวดี/ร้ายตามลัคนา) + ดาวพฤหัสจร + เสาร์ทับ
// จีน: โชควัยจร 10 ปี (ต้องรู้เพศ) + ธาตุของปีนั้น เทียบธาตุให้คุณ
// เป็นแนวโน้มตามตำรา ไม่ใช่คำทำนายตายตัว คำอธิบายเขียนเองทั้งหมด
import { natalChart, dashas, houseOf } from "./chart.js";
import { SIGN_LORD, planetMatrix, JUPITER_GOOD, PLANET_TH } from "./readings.js";
import { siderealPositions } from "./planets.js";
import { baziChart, yearPillar, stemElement, BRANCH_ELEMENT, STEMS, BRANCHES, ELEMENTS } from "./bazi.js";

export const MONEY_DO = {
  sun: "เงินมาจากตำแหน่งและชื่อเสียง เหมาะขอเลื่อนขั้น รับงานที่ได้เป็นผู้นำ",
  moon: "เงินมาจากงานบริการและการดูแลคน ระวังใช้เงินตามอารมณ์",
  mars: "เงินมาจากการลงแรงและการแข่งขัน ระวังตัดสินใจเรื่องเงินตอนใจร้อน",
  mercury: "เงินมาจากการค้า การสื่อสาร งานออนไลน์ งานเสริมหลายทาง",
  jupiter: "เงินมาจากความรู้ การสอน การเป็นที่ปรึกษา และผู้ใหญ่ที่หนุน",
  venus: "เงินคล่องจากงานศิลป์ ความงาม ความบันเทิง แต่ใช้คล่องพอกัน ให้แบ่งเก็บก่อนใช้",
  saturn: "เงินมาช้าแต่มั่นคง เหมาะออมระยะยาว สะสมของที่จับต้องได้",
  rahu: "ช่องทางใหม่และงานต่างประเทศเปิด ระวังความโลภและข้อเสนอที่ดีเกินจริง",
  ketu: "เหมาะลดหนี้ ตัดรายจ่ายที่ไม่จำเป็น และลงทุนกับความรู้เฉพาะทาง",
};

const ROLE_TH = { 2: "ดาวโยคะการกะ (ดีที่สุดของลัคนาคุณ)", 1: "ดาวให้คุณของลัคนาคุณ", 0: "ดาวกลางๆ ของลัคนาคุณ", "-1": "ดาวที่ต้องระวังของลัคนาคุณ" };
const NATURAL = { jupiter: .4, venus: .3, moon: .2, mercury: .2, sun: 0, mars: -.1, saturn: -.2, rahu: -.2, ketu: -.2 };
const clamp = (x) => Math.max(0, Math.min(100, Math.round(x)));
const YEAR = 365.25 * 86400000;

// p = { y, m, d, time, place, male } (male = null ถ้าไม่รู้เพศ: ข้ามโชควัยจร)
export function lifeline(p, years = 85) {
  const chart = natalChart(p.y, p.m, p.d, p.time || null, p.place);
  const moonSign = chart.planets.moon.sign;
  const lagnaSign = chart.lagnaSign === null ? moonSign : chart.lagnaSign;
  const pm = planetMatrix(lagnaSign);
  const role = (pl) => (pm.yogakaraka.includes(pl) ? 2 : pm.benefic.includes(pl) ? 1 : pm.caution.includes(pl) ? -1 : 0);
  const lord = (h) => SIGN_LORD[(lagnaSign + h - 1) % 12];
  const moneyLords = [lord(2), lord(11)];
  const list = dashas(chart.planets.moon.lon, chart.date);
  const bz = baziChart(p.y, p.m, p.d, p.time || null, p.male ?? null);
  const wealthEl = (stemElement(bz.dm) + 2) % 5;
  const elScore = (els) => els.reduce((s, e) => s + (bz.fav.good.includes(e) ? 1 : bz.fav.avoid.includes(e) ? -1 : 0), 0) / els.length;
  const sadeSigns = [(moonSign + 11) % 12, moonSign, (moonSign + 1) % 12];
  const birth = chart.date.getTime();

  const raw = [];
  for (let age = 0; age <= years; age++) {
    const t = birth + (age + 0.5) * YEAR;
    const md = list.find((x) => x.start <= t && t < x.end) || list[list.length - 1];
    const ad = md.subs.find((x) => x.start <= t && t < x.end) || md.subs[0];
    const V = role(md.lord) + NATURAL[md.lord] + 0.5 * (role(ad.lord) + NATURAL[ad.lord]);
    const Vm = (moneyLords.includes(md.lord) ? 1 : 0) + 0.5 * (moneyLords.includes(ad.lord) ? 1 : 0) - (md.lord === lord(12) ? 0.5 : 0);

    // ดาวพฤหัสจร (นับจากราศีจันทร์) และเสาร์ทับ: เก็บตัวอย่างทุกเดือนของปีนั้น
    let jh = 0, ss = 0;
    const jHouses = [];
    for (let k = 0; k < 12; k++) {
      const pos = siderealPositions(new Date(birth + (age + k / 12) * YEAR));
      const h = houseOf(Math.floor(pos.jupiter / 30), moonSign);
      jHouses.push(h);
      if (sadeSigns.includes(Math.floor(pos.saturn / 30))) ss += 1 / 12;
    }
    jh = jHouses[6];
    const J = JUPITER_GOOD.includes(jh) ? 0.6 : -0.2;
    const Jm = [2, 11].includes(jh) ? 1 : [5, 9].includes(jh) ? 0.4 : 0;

    // จีน: ปีนั้น + โชควัยจร
    const gy = new Date(t).getUTCFullYear();
    const yp = yearPillar(t, gy); // ปีจีนเปลี่ยนที่ลี่ชุน ไม่ใช่ 1 ม.ค.
    const yEls = [stemElement(yp.stem), BRANCH_ELEMENT[yp.branch]];
    const a = elScore(yEls);
    let lp = null, l = 0, lm = 0;
    if (bz.luck) {
      lp = [...bz.luck.list].reverse().find((x) => x.age <= age) || null;
      if (lp) {
        const lEls = [stemElement(lp.stem), BRANCH_ELEMENT[lp.branch]];
        l = elScore(lEls);
        if (lEls.includes(wealthEl)) lm = bz.strength.strong ? 1 : 0.3;
      }
    }
    const am = yEls.includes(wealthEl) ? (bz.strength.strong ? 0.6 : 0.2) : 0;

    raw.push({
      age, year: gy, md, ad, roleMd: role(md.lord), jh, ss, yp, lp,
      overall: 50 + 8 * V + 8 * J + 10 * l + 5 * a - 14 * ss,
      money: 46 + 12 * Vm + 9 * Jm + 10 * lm + 6 * am + 3 * V - 8 * ss,
    });
  }
  // ปรับให้เส้นนุ่มขึ้นเล็กน้อย (ปีติดกันไม่กระโดดแรงเกินจริง)
  const smooth = (k) => raw.map((r, i) => clamp(0.25 * (raw[i - 1] || r)[k] + 0.5 * r[k] + 0.25 * (raw[i + 1] || r)[k]));
  const ov = smooth("overall"), mo = smooth("money");
  const pts = raw.map((r, i) => ({ ...r, overall: ov[i], money: mo[i] }));
  return { pts, lagnaSign, hasLuck: !!bz.luck, fav: bz.fav };
}

// เกณฑ์เทียบกับดวงของคนนั้นเอง (เปอร์เซ็นไทล์) ทุกคนจึงเห็นช่วงขึ้น/ลงของตัวเอง ไม่ใช่เทียบกับคนอื่น
export function percentile(pts, key, q) {
  const v = pts.map((x) => x[key]).sort((a, b) => a - b);
  return v[Math.min(v.length - 1, Math.floor(q * v.length))];
}

// ช่วงที่คะแนนติดกันผ่านเกณฑ์ (อย่างน้อย min ปี)
export function windows(pts, key, test, min = 2) {
  const out = [];
  let cur = null;
  for (const p of pts) {
    if (test(p[key])) {
      if (!cur) cur = { from: p.age, to: p.age, peak: p[key], fromYear: p.year };
      else { cur.to = p.age; cur.peak = Math.max(cur.peak, p[key]); }
    } else if (cur) {
      if (cur.to - cur.from + 1 >= min) out.push(cur);
      cur = null;
    }
  }
  if (cur && cur.to - cur.from + 1 >= min) out.push(cur);
  return out;
}

// เหตุผลและสิ่งที่ควรทำของปีหนึ่ง
export function explainYear(pt) {
  const why = [
    `ทศาใหญ่ดาว${PLANET_TH[pt.md.lord]} ซึ่งเป็น${ROLE_TH[pt.roleMd]} · ช่วงย่อยดาว${PLANET_TH[pt.ad.lord]}`,
    `ดาวพฤหัสจรเรือน ${pt.jh} นับจากราศีจันทร์ ${JUPITER_GOOD.includes(pt.jh) ? "เป็นเรือนดี โอกาสเปิด" : "ยังไม่ใช่เรือนเด่น"}`,
  ];
  if (pt.ss > 0) why.push(`อยู่ในช่วงเสาร์ทับ${pt.ss >= 0.9 ? "ทั้งปี" : "บางส่วนของปี"} งานหนักขึ้น ต้องอดทน`);
  if (pt.lp) why.push(`โชควัยจรจีน ${STEMS[pt.lp.stem]}${BRANCHES[pt.lp.branch]} ธาตุ${ELEMENTS[stemElement(pt.lp.stem)]}/${ELEMENTS[BRANCH_ELEMENT[pt.lp.branch]]}`);
  why.push(`ปีจีน ${STEMS[pt.yp.stem]}${BRANCHES[pt.yp.branch]} ธาตุ${ELEMENTS[stemElement(pt.yp.stem)]}/${ELEMENTS[BRANCH_ELEMENT[pt.yp.branch]]}`);
  const tone = pt.overall >= 65 ? "high" : pt.overall >= 45 ? "mid" : "low";
  const todo = {
    high: "ช่วงขาขึ้น เหมาะเริ่มเรื่องใหญ่ ขยายงาน เปลี่ยนงานที่ดีกว่า หรือลงมือเป้าหมายที่รอมานาน",
    mid: "ช่วงทรงตัว ค่อยๆ สร้างทีละขั้น เก็บทักษะและเครือข่ายไว้รอจังหวะขึ้น",
    low: "ช่วงสะสมกำลัง เก็บเงินสำรองให้ได้ 6 เดือน ดูแลสุขภาพ เลี่ยงกู้หรือค้ำประกันก้อนใหญ่",
  }[tone];
  return { why, tone, todo, money: MONEY_DO[pt.md.lord] };
}
