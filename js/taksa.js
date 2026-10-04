// ทักษาปกรณ์: ตรวจอักษรในชื่อตามวันเกิด
// ลำดับดาวในทักษา (วนขวา): อาทิตย์ จันทร์ อังคาร พุธ เสาร์ พฤหัส ราหู ศุกร์
// ดาววันเกิด = บริวาร แล้วไล่ไป อายุ เดช ศรี มูละ อุตสาหะ มนตรี กาลกิณี

// key ดาวใช้เลขวันแบบ THAI_DAYS: 0=อาทิตย์ 1=จันทร์ 2=อังคาร 3=พุธ 4=พฤหัส 5=ศุกร์ 6=เสาร์ 7=ราหู
const ORDER = [0, 1, 2, 3, 6, 4, 7, 5];
export const ROLES = ["บริวาร", "อายุ", "เดช", "ศรี", "มูละ", "อุตสาหะ", "มนตรี", "กาลกิณี"];
export const ROLE_MEANING = {
  บริวาร: "คนรอบข้างและลูกน้อง",
  อายุ: "สุขภาพและอายุยืน",
  เดช: "อำนาจ ชื่อเสียง",
  ศรี: "โชคลาภ เสน่ห์ ความมั่งมี",
  มูละ: "หลักทรัพย์ มรดก",
  อุตสาหะ: "ความขยันหมั่นเพียร",
  มนตรี: "ผู้ใหญ่อุปถัมภ์",
  กาลกิณี: "อักษรอัปมงคล ตำราแนะนำให้เลี่ยง",
};

const VOWELS = "อะาิีึืุูเแโใไำัฤฦ";
const LETTERS = {
  0: VOWELS,
  1: "กขฃคฅฆง",
  2: "จฉชซฌญ",
  3: "ฎฏฐฑฒณ",
  6: "ดตถทธน",
  4: "บปผฝพฟภม",
  7: "ยรลว",
  5: "ศษสหฬฮ",
};

const planetOfChar = (ch) => {
  for (const [p, set] of Object.entries(LETTERS)) if (set.includes(ch)) return Number(p);
  return null; // วรรณยุกต์ การันต์ และอักขระอื่นไม่นับ
};

// birthDay = 0-7 (7 = พุธกลางคืน)
export function roleTable(birthDay) {
  const start = ORDER.indexOf(birthDay);
  const table = {};
  ROLES.forEach((role, i) => (table[ORDER[(start + i) % 8]] = role));
  return table; // planet -> role
}

export function checkName(name, birthDay) {
  const table = roleTable(birthDay);
  const chars = [...name.replace(/\s+/g, "")]
    .map((ch) => ({ ch, planet: planetOfChar(ch) }))
    .filter((c) => c.planet !== null)
    .map((c) => ({ ...c, role: table[c.planet] }));
  const kalakini = chars.filter((c) => c.role === "กาลกิณี");
  const good = chars.filter((c) => ["เดช", "ศรี", "มนตรี"].includes(c.role));
  const kalakiniPlanet = Number(Object.keys(table).find((p) => table[p] === "กาลกิณี"));
  return {
    chars,
    kalakini,
    good,
    first: chars[0] || null,
    kalakiniLetters: LETTERS[kalakiniPlanet],
    kalakiniIsVowel: kalakiniPlanet === 0,
  };
}
