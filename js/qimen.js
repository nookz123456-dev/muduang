// ฉีเหมินตุ้นเจี่ย (奇門遁甲) ผังยาม แบบหมุนจาน (轉盤) หาเลขผังด้วยวิธี 拆補法
// วัง (宮) ตามลั่วซู: 1 坎 เหนือ, 2 坤 ตต.เฉียงใต้, 3 震 ตะวันออก, 4 巽 ตอ.เฉียงใต้, 5 中, 6 乾 ตต.เฉียงเหนือ, 7 兌 ตะวันตก, 8 艮 ตอ.เฉียงเหนือ, 9 離 ใต้
import { thaiDate } from "./astro.js";
import { dayPillar, hourPillar, sunLon } from "./bazi.js";

// เลขผัง 上/中/下元 ของแต่ละสารท (ชื่อตาม SOLAR_TERMS ใน calendar.js เริ่ม 春分 = 0 องศา)
const JU = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6], 立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8], 立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2], 立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};
const TERM_NAMES = ["春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露",
  "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至", "小寒", "大寒", "立春", "雨水", "惊蛰"];
// สารทช่วงหยาง (冬至 ถึง 芒种) = ดวงอาทิตย์ 270 ถึง 90 องศา
const isYangTerm = (idx) => idx >= 18 || idx < 6;

export const PALACE_DIR = [null, "เหนือ", "ตะวันตกเฉียงใต้", "ตะวันออก", "ตะวันออกเฉียงใต้", "กลาง", "ตะวันตกเฉียงเหนือ", "ตะวันตก", "ตะวันออกเฉียงเหนือ", "ใต้"];
export const PALACE_ZH = [null, "坎", "坤", "震", "巽", "中", "乾", "兌", "艮", "離"];
const RING = [1, 8, 3, 4, 9, 2, 7, 6]; // วงนอกตามเข็มนาฬิกา
const ringIdx = (p) => RING.indexOf(p === 5 ? 2 : p);

export const STARS = [null, "天蓬", "天芮", "天沖", "天輔", "天禽", "天心", "天柱", "天任", "天英"]; // ตามวังเดิม
export const DOORS = [null, "休", "死", "傷", "杜", null, "開", "驚", "生", "景"]; // ตามวังเดิม
export const DEITIES = ["值符", "螣蛇", "太陰", "六合", "白虎", "玄武", "九地", "九天"];
const QI_ORDER = [4, 5, 6, 7, 8, 9, 3, 2, 1]; // 戊己庚辛壬癸丁丙乙 (เลขก้าน)
const XUN_YI = { 0: 4, 10: 5, 8: 6, 6: 7, 4: 8, 2: 9 }; // กิ่งเริ่มรอบ (甲子 甲戌 ...) → 六儀 ที่ซ่อน 甲

export function juOf(t, y, m, d) {
  const termIdx = Math.floor(sunLon(t) / 15) % 24;
  const term = TERM_NAMES[termIdx];
  const day = dayPillar(y, m, d);
  const fuTouBranch = (day.branch - (day.stem % 5) + 12) % 12; // วัน 甲/己 ล่าสุด
  const yuan = [0, 6, 3, 9].includes(fuTouBranch) ? 0 : [2, 8, 5, 11].includes(fuTouBranch) ? 1 : 2;
  const yang = isYangTerm(termIdx);
  return { term, yuan, yang, ju: JU[term][yuan], day };
}

const addDay = (y, m, d) => {
  const t = new Date(Date.UTC(y, m - 1, d + 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};

// สร้างผังยาม ณ เวลาไทย y-m-d hh:mm
export function qimenChart(y, m, d, hh, mm) {
  const t = thaiDate(y, m, d, hh, mm).getTime();
  const dd = hh >= 23 ? addDay(y, m, d) : { y, m, d }; // ยามชวดหลัง 23:00 นับเป็นวันใหม่
  const { term, yuan, yang, ju, day } = juOf(t, dd.y, dd.m, dd.d);
  const hour = hourPillar(hh, mm, day.stem);
  return { t, term, yuan, day, ...buildChart(ju, yang, hour) };
}

// วางผังจากเลขผัง + หยาง/หยิน + เสายาม (แยกไว้ให้เทียบกับตัวอย่างในตำราได้ตรงๆ)
export function buildChart(ju, yang, hour) {
  // จานดิน
  const earth = Array(10).fill(null);
  for (let i = 0; i < 9; i++) {
    const p = (((ju - 1 + (yang ? i : -i)) % 9) + 9) % 9 + 1;
    earth[p] = QI_ORDER[i];
  }
  const palaceOfEarth = (stem) => earth.indexOf(stem);

  // หัวรอบของยาม
  const xunBranch = (hour.branch - hour.stem + 12) % 12;
  const xunYi = XUN_YI[xunBranch];
  const zhiPalace = palaceOfEarth(xunYi);
  const zhiBase = zhiPalace === 5 ? 2 : zhiPalace;
  const zhiFu = STARS[zhiPalace];
  const zhiShi = DOORS[zhiBase];

  // จานฟ้า: ดาวประธานไปอยู่วังที่ก้านยามอยู่บนจานดิน (ยาม 甲 ใช้ 六儀 ของรอบ)
  const hourStem = hour.stem === 0 ? xunYi : hour.stem;
  let target = palaceOfEarth(hourStem);
  if (target === 5) target = 2;
  const shift = ringIdx(target) - ringIdx(zhiBase);
  const palaces = Array(10).fill(null).map((_, p) => ({ p, earth: earth[p] }));
  palaces[5].star = "天禽";
  RING.forEach((P, i) => {
    const orig = RING[(((i - shift) % 8) + 8) % 8];
    palaces[P].star = STARS[orig] + (orig === 2 ? "·天禽" : "");
    palaces[P].heaven = orig === 2 ? [earth[2], earth[5]] : [earth[orig]];
  });

  // ประตู: เริ่มนับจากวังจริงของหัวรอบ (รวมวัง 5) เดินตามเลขวังทีละยาม หยางเดินหน้า หยินถอยหลัง
  // ตกวัง 5 จึงฝากวัง 2
  const steps = hour.stem;
  let doorPalace = (((zhiPalace - 1 + (yang ? steps : -steps)) % 9) + 9) % 9 + 1;
  if (doorPalace === 5) doorPalace = 2;
  const dShift = ringIdx(doorPalace) - ringIdx(zhiBase);
  RING.forEach((P, i) => { palaces[P].door = DOORS[RING[(((i - dShift) % 8) + 8) % 8]]; });

  // เทพ 8 องค์: เริ่ม 值符 ที่วังของดาวประธาน หยางวนตามเข็ม หยินวนทวน
  const start = ringIdx(target);
  DEITIES.forEach((g, k) => { palaces[RING[(((start + (yang ? k : -k)) % 8) + 8) % 8]].deity = g; });

  return { yang, ju, hour, xunBranch, zhiFu, zhiShi, zhiFuPalace: target, zhiShiPalace: doorPalace, palaces };
}
