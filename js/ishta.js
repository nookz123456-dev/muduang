// หาองค์เทพประจำตัว (อิษฏเทวตา) แบบไชมินิ
// 1) อาตมการกะ = ดาว 7 ดวง (อาทิตย์-เสาร์) ที่องศาในราศีสูงสุด
// 2) การกางศะ = ราศีนวางศ์ของอาตมการกะ
// 3) เรือนที่ 12 จากการกางศะ (ในผังนวางศ์): มีดาวอยู่ใช้ดาวนั้น ไม่มีใช้เจ้าเรือน
import { siderealPositions } from "./planets.js";
import { thaiDate } from "./astro.js";
import { SIGN_LORD } from "./deities.js";

const KARAKAS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
const ALL = [...KARAKAS, "rahu", "ketu"];

// นวางศ์: แบ่งราศีละ 9 ส่วน (3 องศา 20 ลิปดา) วนต่อกันทั้งจักรราศี
export const navamsaOf = (lon) => Math.floor(lon / (30 / 9)) % 12;

export function ishtaFromPositions(pos) {
  const ak = KARAKAS.reduce((best, p) => (pos[p] % 30 > pos[best] % 30 ? p : best), KARAKAS[0]);
  const karakamsha = navamsaOf(pos[ak]);
  const twelfth = (karakamsha + 11) % 12;
  const occupants = ALL.filter((p) => navamsaOf(pos[p]) === twelfth)
    .sort((a, b) => (pos[b] % 30) - (pos[a] % 30));
  const deityPlanet = occupants.length ? occupants[0] : SIGN_LORD[twelfth];
  return { ak, karakamsha, twelfth, occupants, deityPlanet, via: occupants.length ? "occupant" : "lord" };
}

// ไม่รู้เวลาเกิด: คำนวณทุกชั่วโมงของวัน (xx:30) แล้วเลือกองค์ที่เจอบ่อยสุด
// odds = สัดส่วนชั่วโมงที่ได้องค์นั้น ใช้บอกผู้ใช้ตรงๆ ว่ามั่นใจแค่ไหน
export function birthIshta(y, m, d, time) {
  if (time) {
    const [hh, mm] = time.split(":").map(Number);
    return { ...ishtaFromPositions(siderealPositions(thaiDate(y, m, d, hh, mm))), certain: true, odds: 1, alts: [] };
  }
  const runs = Array.from({ length: 24 }, (_, h) => ishtaFromPositions(siderealPositions(thaiDate(y, m, d, h, 30))));
  const count = {};
  for (const r of runs) count[r.deityPlanet] = (count[r.deityPlanet] || 0) + 1;
  const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]);
  const top = ranked[0][0];
  const best = runs.find((r) => r.deityPlanet === top);
  return {
    ...best,
    certain: ranked.length === 1,
    odds: ranked[0][1] / 24,
    alts: ranked.slice(1).map(([p, c]) => ({ planet: p, odds: c / 24 })),
  };
}
