// แผนที่มู: สถานที่ทั่วประเทศ (ค้นยืนยันจากเว็บแล้ว 2026-10)
// ไม่เก็บเวลาเปิดปิด เพราะเปลี่ยนบ่อย ให้ผู้ใช้ดูใน Google Maps
// ระยะทางคิดจากพิกัดตัวจังหวัด (provinces.js) เป็นระยะทางตรงโดยประมาณ
import { PROVINCES, placeOf } from "./provinces.js";

// tags: องค์เทพ (shiva uma skanda vishnu lakshmi durga ganesha brahma trimurti vessavana rahu naga)
//       + remedy = สะเดาะเคราะห์
// wishes: money love work health luck family
export const PLACES = [
  { name: "เทวสถานโบสถ์พราหมณ์ เสาชิงช้า", province: "กรุงเทพมหานคร", tags: ["shiva", "ganesha", "vishnu", "lakshmi"], wishes: ["work", "luck"] },
  { name: "วัดพระศรีมหาอุมาเทวี (วัดแขก สีลม)", province: "กรุงเทพมหานคร", tags: ["uma", "durga", "ganesha", "skanda", "shiva", "vishnu", "lakshmi"], wishes: ["love", "money", "family"] },
  { name: "พระแม่ลักษมี ชั้น 4 อาคารเกษร ราชประสงค์", province: "กรุงเทพมหานคร", tags: ["lakshmi"], wishes: ["money", "love"], q: "พระแม่ลักษมี เกษร ราชประสงค์" },
  { name: "พระนารายณ์ทรงครุฑ หน้าโรงแรมอินเตอร์คอนติเนนตัล", province: "กรุงเทพมหานคร", tags: ["vishnu"], wishes: ["work"], q: "พระนารายณ์ทรงครุฑ อินเตอร์คอนติเนนตัล ราชประสงค์" },
  { name: "พระแม่อุมาเทวี แยกราชประสงค์", province: "กรุงเทพมหานคร", tags: ["uma"], wishes: ["love", "family"], q: "พระแม่อุมาเทวี ราชประสงค์" },
  { name: "พระตรีมูรติ ลานหน้าเซ็นทรัลเวิลด์", province: "กรุงเทพมหานคร", tags: ["trimurti"], wishes: ["love"], q: "พระตรีมูรติ เซ็นทรัลเวิลด์" },
  { name: "พระพิฆเนศ ลานหน้าเซ็นทรัลเวิลด์", province: "กรุงเทพมหานคร", tags: ["ganesha"], wishes: ["work"], q: "พระพิฆเนศ เซ็นทรัลเวิลด์" },
  { name: "ศาลพระพิฆเนศ แยกห้วยขวาง", province: "กรุงเทพมหานคร", tags: ["ganesha"], wishes: ["work", "money"], q: "ศาลพระพิฆเนศ ห้วยขวาง" },
  { name: "ศาลท้าวมหาพรหม เอราวัณ ราชประสงค์", province: "กรุงเทพมหานคร", tags: ["brahma"], wishes: ["luck", "work", "health"], q: "ศาลท้าวมหาพรหม เอราวัณ" },
  { name: "วัดเทพมณเฑียร (ใกล้เสาชิงช้า)", province: "กรุงเทพมหานคร", tags: ["durga", "vishnu", "lakshmi"], wishes: ["luck"], q: "วัดเทพมณเฑียร กรุงเทพ" },
  { name: "วัดมังกรกมลาวาส (วัดเล่งเน่ยยี่) เยาวราช", province: "กรุงเทพมหานคร", tags: ["remedy"], wishes: ["luck", "health"], q: "วัดมังกรกมลาวาส" },
  { name: "วัดสมานรัตนาราม (พระพิฆเนศปางนอน)", province: "ฉะเชิงเทรา", tags: ["ganesha"], wishes: ["money", "work"], q: "วัดสมานรัตนาราม ฉะเชิงเทรา" },
  { name: "อุทยานพระพิฆเนศ คลองเขื่อน", province: "ฉะเชิงเทรา", tags: ["ganesha"], wishes: ["work"], q: "อุทยานพระพิฆเนศ คลองเขื่อน ฉะเชิงเทรา" },
  { name: "อุทยานพระพิฆเนศ นครนายก", province: "นครนายก", tags: ["ganesha"], wishes: ["work", "luck"], q: "อุทยานพระพิฆเนศ นครนายก" },
  { name: "วัดศีรษะทอง (ไหว้พระราหู)", province: "นครปฐม", tags: ["rahu", "remedy"], wishes: ["luck", "health"], q: "วัดศีรษะทอง นครปฐม" },
  { name: "วัดจุฬามณี (ท้าวเวสสุวรรณ) อัมพวา", province: "สมุทรสงคราม", tags: ["vessavana", "remedy"], wishes: ["money", "work"], q: "วัดจุฬามณี อัมพวา" },
  { name: "เทวาลัยพระศิวะมหาเทพ พัทยา", province: "ชลบุรี", tags: ["shiva"], wishes: ["work", "luck"], q: "เทวาลัยพระศิวะมหาเทพ พัทยา" },
  { name: "ร้อยทวารบาล บ้านเทวาลัย (พระพิฆเนศสามเศียร)", province: "เชียงใหม่", tags: ["ganesha"], wishes: ["work", "money"], q: "ร้อยทวารบาล บ้านเทวาลัย เชียงใหม่" },
  { name: "ศาลพระพิฆเนศ อาเขต", province: "เชียงใหม่", tags: ["ganesha"], wishes: ["work"], q: "ศาลพระพิฆเนศ อาเขต เชียงใหม่" },
  { name: "เทวาลัยศิวะมหาเทพ ขอนแก่น", province: "ขอนแก่น", tags: ["shiva", "brahma", "vishnu", "uma", "trimurti"], wishes: ["work", "love", "luck"], q: "เทวาลัยศิวะมหาเทพ ขอนแก่น" },
  { name: "คำชะโนด (ปู่ศรีสุทโธ ย่าปทุมมา)", province: "อุดรธานี", tags: ["naga"], wishes: ["money", "luck"], q: "คำชะโนด บ้านดุง อุดรธานี" },
  { name: "วัดเจดีย์ (ไอ้ไข่) สิชล", province: "นครศรีธรรมราช", tags: [], wishes: ["money", "luck", "work"], q: "วัดเจดีย์ ไอ้ไข่ สิชล" },
  { name: "พระพิฆเนศ ด่านนอก สะเดา (ใหญ่ที่สุดในภาคใต้)", province: "สงขลา", tags: ["ganesha"], wishes: ["work", "money"], q: "พระพิฆเนศ ด่านนอก สะเดา" },
  { name: "มูลนิธิจงฮั่วสงเคราะห์ หาดใหญ่ (พระพิฆเนศ พระพรหม)", province: "สงขลา", tags: ["ganesha", "brahma"], wishes: ["work", "luck"], q: "มูลนิธิจงฮั่วสงเคราะห์ หาดใหญ่" },
];

// พระธาตุประจำปีเกิด 12 นักษัตร (ตำราล้านนา) ปีที่อยู่ต่างประเทศใส่ที่ไหว้แทนในไทยถ้ามี
export const BIRTH_STUPAS = [
  { year: "ชวด", name: "พระธาตุศรีจอมทอง", province: "เชียงใหม่" },
  { year: "ฉลู", name: "พระธาตุลำปางหลวง", province: "ลำปาง" },
  { year: "ขาล", name: "พระธาตุช่อแฮ", province: "แพร่" },
  { year: "เถาะ", name: "พระธาตุแช่แห้ง", province: "น่าน" },
  { year: "มะโรง", name: "วัดพระสิงห์วรมหาวิหาร", province: "เชียงใหม่" },
  { year: "มะเส็ง", name: "เจดีย์พุทธคยา (อินเดีย)", province: null, alt: { name: "วัดเจ็ดยอด (จำลองพุทธคยา)", province: "เชียงใหม่", q: "วัดเจ็ดยอด เชียงใหม่" } },
  { year: "มะเมีย", name: "พระมหาธาตุเจดีย์ชเวดากอง (เมียนมา)", province: null },
  { year: "มะแม", name: "พระบรมธาตุดอยสุเทพ", province: "เชียงใหม่" },
  { year: "วอก", name: "พระธาตุพนม", province: "นครพนม" },
  { year: "ระกา", name: "พระธาตุหริภุญชัย", province: "ลำพูน" },
  { year: "จอ", name: "พระธาตุอินทร์แขวน (เมียนมา)", province: null, alt: { name: "วัดเกตการาม (พระธาตุเกตุแก้วจุฬามณี)", province: "เชียงใหม่", q: "วัดเกตการาม เชียงใหม่" } },
  { year: "กุน", name: "พระธาตุดอยตุง", province: "เชียงราย" },
];

// ปีนักษัตรแบบล้านนา: เปลี่ยนปีตอนสงกรานต์ (ใช้ 16 เม.ย. วันเถลิงศก)
export function zodiacYear(y, m, d) {
  const yy = m < 4 || (m === 4 && d < 16) ? y - 1 : y;
  return (((yy - 4) % 12) + 12) % 12; // 0 = ชวด
}

// ระยะทางตรง (กม.) สูตร haversine
export function distanceKm(a, b) {
  const R = Math.PI / 180;
  const dLat = (b.lat - a.lat) * R, dLon = (b.lon - a.lon) * R;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const coordsOf = (province) => (province ? placeOf(province) : null);

export function withDistance(place, origin) {
  const c = coordsOf(place.province);
  return { ...place, q: place.q || place.name, km: c && origin ? distanceKm(origin, c) : null };
}

// หาที่ใกล้สุดตามเงื่อนไข tag หรือ wish
export function nearest({ tags = [], wishes = [] }, origin, limit = 2) {
  return PLACES
    .filter((p) => p.tags.some((t) => tags.includes(t)) || p.wishes.some((w) => wishes.includes(w)))
    .map((p) => withDistance(p, origin))
    .sort((a, b) => a.km - b.km || a.tags.length - b.tags.length) // ระยะเท่ากันให้ที่เฉพาะทางมาก่อน
    .slice(0, limit);
}

export const PLANET_DEITY_TAG = {
  sun: "shiva", moon: "uma", mars: "skanda", mercury: "vishnu", jupiter: "shiva",
  venus: "lakshmi", saturn: "vishnu", rahu: "durga", ketu: "ganesha",
};

export { PROVINCES };
