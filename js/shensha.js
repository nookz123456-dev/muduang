// ดาวมงคล/ดาวร้ายในดวงจีน (神煞) เลือกเฉพาะดวงที่ตำราส่วนใหญ่ใช้กฎตรงกัน
// กิ่ง 0=子 ... 11=亥 · ก้าน 0=甲 ... 9=癸 · คำอธิบายเขียนเองทั้งหมด

// กลุ่มสามประสานของกิ่ง: 申子辰=0 (น้ำ), 亥卯未=1 (ไม้), 寅午戌=2 (ไฟ), 巳酉丑=3 (ทอง)
const TRINE_GROUP = [0, 3, 2, 1, 0, 3, 2, 1, 0, 3, 2, 1];
const byTrine = (table) => (ref) => [table[TRINE_GROUP[ref]]];

// กฎหาเป้าหมาย: คืนรายการกิ่ง (branch) หรือก้าน (stem) ที่ถ้ามีในดวงถือว่าได้ดาวนั้น
const NOBLE = { 0: [1, 7], 4: [1, 7], 6: [1, 7], 1: [0, 8], 5: [0, 8], 2: [11, 9], 3: [11, 9], 7: [2, 6], 8: [3, 5], 9: [3, 5] };
const WENCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
const LU = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const YANGREN = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };
const YUEDE = [8, 0, 2, 6]; // ก้านของเดือนตามกลุ่ม: 申子辰→壬 亥卯未→甲 寅午戌→丙 巳酉丑→庚
const GUCHEN = [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2];
const GUASU = [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10];

export const STARS = [
  { key: "noble", zh: "天乙贵人", th: "ดาวผู้อุปถัมภ์", kind: "good", from: "day-stem", target: (s) => NOBLE[s],
    text: "มีคนช่วยในจังหวะสำคัญ ผู้ใหญ่เมตตา เจอทางตันแล้วมักมีคนเปิดประตูให้", act: "ขอบคุณคนที่เคยช่วยคุณอย่างเจาะจง และกล้าขอความช่วยเหลือเมื่อจำเป็น" },
  { key: "wenchang", zh: "文昌", th: "ดาวปัญญา", kind: "good", from: "day-stem", target: (s) => [WENCHANG[s]],
    text: "เรียนรู้ไว เขียนและสอบเก่ง ความรู้เป็นทางหาเงินของคุณ", act: "ลงเรียนหรืออ่านเรื่องที่อยากเก่ง 15 นาทีทุกวัน" },
  { key: "lu", zh: "禄神", th: "ดาวลาภประจำตัว", kind: "good", from: "day-stem", target: (s) => [LU[s]],
    text: "มีกินมีใช้ หาเงินได้ด้วยฝีมือตัวเอง ไม่ค่อยขาดแคลน", act: "แยกเงินเก็บทันทีที่รายได้เข้า ลาภที่มีจะงอกเงย" },
  { key: "yuede", zh: "月德贵人", th: "ดาวคุณธรรม", kind: "good", from: "month-branch", stem: true, target: (b) => [YUEDE[TRINE_GROUP[b]]],
    text: "จิตใจดี มีบุญคุ้มครอง เรื่องร้ายมักเบาลง", act: "ทำบุญหรือช่วยคนโดยไม่บอกใครเดือนละครั้ง" },
  { key: "general", zh: "将星", th: "ดาวแม่ทัพ", kind: "good", from: "trine", target: byTrine([0, 3, 6, 9]),
    text: "มีภาวะผู้นำ คนยอมรับ เหมาะกับงานที่ต้องคุมทีม", act: "อาสาเป็นคนนำในงานกลุ่มสักเรื่อง" },
  { key: "hongluan", zh: "红鸾", th: "ดาวคู่ครอง", kind: "good", from: "year-branch", target: (b) => [(3 - b + 12) % 12],
    text: "เรื่องความรักและงานมงคลเข้ามาง่าย ปีที่ดาวนี้มาเยือนมักมีข่าวดีเรื่องคู่", act: "เปิดใจรู้จักคนใหม่ หรือวางแผนเรื่องคู่ให้ชัด" },
  { key: "tianxi", zh: "天喜", th: "ดาวข่าวดี", kind: "good", from: "year-branch", target: (b) => [(9 - b + 12) % 12],
    text: "มีเรื่องน่ายินดี งานฉลอง คนรอบตัวนำความสุขมาให้", act: "จัดมื้อดีๆ ฉลองความสำเร็จเล็กๆ กับคนที่รัก" },
  { key: "peach", zh: "桃花", th: "ดาวเสน่ห์", kind: "mixed", from: "trine", target: byTrine([9, 0, 3, 6]),
    text: "มีเสน่ห์ คนชอบเข้าหา เหมาะกับงานที่ต้องพบผู้คน ใช้ให้ดีเป็นจุดแข็ง ใช้เพลินเกินเป็นเรื่องวุ่นใจ", act: "ใช้เสน่ห์กับงานขายหรืองานบริการ และชัดเจนกับความสัมพันธ์" },
  { key: "horse", zh: "驿马", th: "ดาวม้าเดินทาง", kind: "mixed", from: "trine", target: byTrine([2, 5, 8, 11]),
    text: "ชีวิตเคลื่อนไหวบ่อย ย้ายที่ เดินทาง เปลี่ยนงานแล้วได้โอกาส อยู่นิ่งนานจะอึดอัด", act: "วางแผนเที่ยวหรือเรียนรู้ที่ใหม่ปีละครั้ง และเตรียมเอกสารเดินทางให้พร้อม" },
  { key: "canopy", zh: "华盖", th: "ดาวร่มศิลป์", kind: "mixed", from: "trine", target: byTrine([4, 7, 10, 1]),
    text: "มีหัวศิลปะ ชอบศาสตร์ลึกลับและการภาวนา ต้องการเวลาส่วนตัว บางครั้งดูเหงาในฝูงชน", act: "จัดเวลาสร้างงานศิลป์หรือภาวนาสัปดาห์ละครั้ง" },
  { key: "yangren", zh: "羊刃", th: "ดาวดาบคม", kind: "mixed", from: "day-stem", target: (s) => (YANGREN[s] === undefined ? [] : [YANGREN[s]]),
    text: "ใจกล้า ลุยเก่ง ตัดสินใจเด็ดขาด ถ้าคุมไม่อยู่จะใจร้อนและเสี่ยงเกินไป", act: "ออกกำลังกายหนักสัปดาห์ละ 2 ครั้ง ช่วยปล่อยพลังที่เกิน" },
  { key: "jiesha", zh: "劫煞", th: "ดาวฉกฉวย", kind: "care", from: "trine", target: byTrine([5, 8, 11, 2]),
    text: "ไหวพริบไว แต่มีโอกาสเสียของหรือถูกเอาเปรียบ ระวังสัญญาและการให้ยืม", act: "อ่านสัญญาทุกครั้งก่อนเซ็น และไม่ค้ำประกันให้ใครง่ายๆ" },
  { key: "guchen", zh: "孤辰寡宿", th: "ดาวเดียวดาย", kind: "care", from: "year-branch", target: (b) => [GUCHEN[b], GUASU[b]],
    text: "พึ่งตัวเองเก่ง แต่บางช่วงรู้สึกโดดเดี่ยว ปล่อยให้คนอื่นเข้ามาใกล้บ้าง", act: "นัดเพื่อนหรือครอบครัวสม่ำเสมอ อย่ารอให้เหงาก่อนค่อยติดต่อ" },
];

const PILLAR_TH = ["ยาม", "วัน", "เดือน", "ปี"];

// pillars เรียง [ยาม, วัน, เดือน, ปี] ตามที่ baziChart คืนมา (ยามอาจเป็น null)
export function findStars(pillars) {
  const [, day, month, year] = pillars;
  const out = [];
  for (const st of STARS) {
    const refs = st.from === "day-stem" ? [["วัน", st.target(day.stem)]]
      : st.from === "month-branch" ? [["เดือน", st.target(month.branch)]]
        : st.from === "year-branch" ? [["ปี", st.target(year.branch)]]
          : [["ปี", st.target(year.branch)], ["วัน", st.target(day.branch)]];
    const where = new Set();
    for (const [, targets] of refs) {
      pillars.forEach((p, i) => {
        if (!p) return;
        const v = st.stem ? p.stem : p.branch;
        if (targets.includes(v)) where.add(PILLAR_TH[i]);
      });
    }
    if (where.size) out.push({ ...st, where: [...where] });
  }
  return out;
}

// ปีจร: กิ่งของปีจีนนั้น (นับปีใหม่ที่ลี่ชุน) ไปตรงกับเป้าของดาวไหน (ดาวที่ "มาเยือน" ปีนี้)
export function yearStars(pillars, yb) {
  const [, day, , year] = pillars;
  return STARS.filter((st) => {
    if (st.stem) return false;
    const targets = st.from === "day-stem" ? st.target(day.stem)
      : st.from === "year-branch" ? st.target(year.branch)
        : st.from === "month-branch" ? []
          : [...st.target(year.branch), ...st.target(day.branch)];
    return targets.includes(yb);
  });
}
