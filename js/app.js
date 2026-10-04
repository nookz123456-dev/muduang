import { birthNakshatra, nakshatraAt, taraOf, thaiBirthDay, thaiDate } from "./astro.js";
import { ANIMALS, NAKSHATRAS, RASHIS, TARAS, THEMES, THAI_DAYS } from "./data.js";
import { gunaMilan } from "./match.js";
import { pickDailyMissions } from "./missions.js";

const $ = (s) => document.querySelector(s);
const imgOf = (animal) => `img/${animal}.jpg`;

// ---------- storage (เก็บในเครื่องผู้ใช้เท่านั้น) ----------
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("muduang." + key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("muduang." + key, JSON.stringify(value));
    } catch { /* โหมดส่วนตัว: ใช้ได้แต่ไม่จำ */ }
  },
};

// ---------- วันที่ตามเวลาไทย ----------
const TZ = "Asia/Bangkok";
const dayKeyOf = (date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
const thaiLong = (date) =>
  date.toLocaleDateString("th-TH", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });

function shiftDay(key, delta) {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function weekKey(key) {
  const d = new Date(key + "T00:00:00Z");
  const day = (d.getUTCDay() + 6) % 7; // จันทร์=0
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10); // วันจันทร์ของสัปดาห์
}

function parseDate(v) {
  const [y, m, d] = v.split("-").map(Number);
  return { y, m, d };
}

// ---------- โปรไฟล์ ----------
function computeProfile(p) {
  const { y, m, d } = parseDate(p.date);
  const nak = birthNakshatra(y, m, d, p.time || null);
  const info = NAKSHATRAS[nak.index];
  return { ...p, nak, info, animal: ANIMALS[info.animal], day: THAI_DAYS[thaiBirthDay(y, m, d, p.time)] };
}

// ฤกษ์ของวันนี้: ใช้ดวงจันทร์ตอน 06:00 (วันไทยเริ่มตอนพระอาทิตย์ขึ้น) ให้ทั้งวันได้ผลเดียวกัน
function todayInfo(profile) {
  const now = new Date();
  const key = dayKeyOf(now);
  const { y, m, d } = parseDate(key);
  const moon = nakshatraAt(thaiDate(y, m, d, 6, 0));
  const t = taraOf(profile.nak.index, moon.index);
  return { key, now, moon, taraNo: t, tara: TARAS[t] };
}

// ---------- แท็บ ----------
function showTab(name) {
  document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => (p.hidden = p.id !== "tab-" + name));
  if (name === "mission") renderMissions();
  try { sessionStorage.setItem("muduang.tab", name); } catch { /* ไม่เป็นไร */ }
}
document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.goto)));

// ---------- ดวงฉัน ----------
let profile = null;

function renderMe() {
  const form = $("#birth-form");
  if (!profile) {
    form.hidden = false;
    $("#me-result").hidden = true;
    return;
  }
  form.hidden = true;
  $("#me-result").hidden = false;

  const { nak, info, animal, day } = profile;
  $("#mascot-card").style.setProperty("--animal", animal.color);
  $("#mascot-img").src = imgOf(info.animal);
  $("#mascot-img").alt = animal.th;
  $("#nak-line").textContent = `${profile.name ? profile.name + " · " : ""}ฤกษ์${info.th} (${info.en}) บาทที่ ${nak.pada}`;
  $("#animal-name").textContent = `${animal.th}${info.sex === "M" ? "หนุ่ม" : "สาว"}ประจำฤกษ์`;
  $("#animal-trait").textContent = animal.trait;
  $("#chips").innerHTML = `
    <span class="chip">จันทร์ราศี${RASHIS[nak.rashi]}</span>
    <span class="chip">คณะ${{ D: "เทพ", M: "มนุษย์", R: "รากษส" }[info.gana]}</span>
    <span class="chip"><span class="dot" style="background:${day.hex}"></span>เกิดวัน${day.th} สี${day.color}</span>
    <span class="chip">พระประจำวัน ${day.buddha}</span>`;

  const unc = $("#uncertain");
  if (!nak.certain) {
    unc.hidden = false;
    unc.textContent = nak.alt
      ? `วันเกิดของคุณดวงจันทร์ย้ายจากฤกษ์${NAKSHATRAS[nak.alt[0]].th}ไปฤกษ์${NAKSHATRAS[nak.alt[1]].th} ใส่เวลาเกิดจะรู้แน่ชัดว่าเป็นตัวไหน`
      : "วันเกิดของคุณดวงจันทร์ย้ายราศี ใส่เวลาเกิดจะแม่นขึ้น";
  } else unc.hidden = true;

  const t = todayInfo(profile);
  $("#today-date").textContent = thaiLong(t.now);
  $("#today-mood").innerHTML = `${t.tara.mood} <span class="small tone-${t.tara.tone}">(${t.tara.tone})</span>`;
  $("#today-text").textContent = t.tara.text;
  $("#today-tech").textContent =
    `ดวงจันทร์วันนี้อยู่ฤกษ์${NAKSHATRAS[t.moon.index].th} นับจากฤกษ์เกิดได้ตารา ${t.taraNo} "${t.tara.name}"`;
}

$("#birth-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const p = { name: f.get("name").trim(), date: f.get("date"), time: f.get("time") };
  store.set("profile", p);
  profile = computeProfile(p);
  renderMe();
});

$("#edit-birth").addEventListener("click", () => {
  const form = $("#birth-form");
  form.name.value = profile.name || "";
  form.date.value = profile.date;
  form.time.value = profile.time || "";
  profile = null;
  renderMe();
});

// ---------- ภารกิจมู ----------
function streakOf(log, todayKey) {
  let key = (log[todayKey] || []).length ? todayKey : shiftDay(todayKey, -1);
  let n = 0;
  while ((log[key] || []).length) {
    n++;
    key = shiftDay(key, -1);
  }
  return n;
}

function renderMissions() {
  $("#mission-empty").hidden = !!profile;
  $("#mission-body").hidden = !profile;
  if (!profile) return;

  const t = todayInfo(profile);
  const log = store.get("log", {});
  const done = new Set(log[t.key] || []);
  const list = pickDailyMissions(t.tara.theme, t.key, profile.nak.index);

  $("#mission-theme").textContent = `วันนี้ "${t.tara.mood}" เน้นเรื่อง${THEMES[t.tara.theme]}`;
  $("#mission-list").innerHTML = list
    .map((m) => `
      <li class="mission ${done.has(m.id) ? "done" : ""}" data-id="${m.id}" role="checkbox" aria-checked="${done.has(m.id)}" tabindex="0">
        <span class="check">${done.has(m.id) ? "&#10003;" : ""}</span>
        <div><div class="mu">มู: ${m.mu}</div><div class="act">ทำจริง: ${m.act}</div></div>
      </li>`)
    .join("");

  const streak = streakOf(log, t.key);
  $("#streak-num").textContent = streak;
  $("#streak-sub").textContent = done.size
    ? `วันนี้ทำแล้ว ${done.size}/${list.length} ข้อ`
    : streak ? "ทำสักข้อวันนี้ จะได้ไม่ขาดนะ" : "เริ่มข้อแรกวันนี้เลย";

  renderReflect(t.key, log);
}

function toggleMission(id) {
  const key = dayKeyOf(new Date());
  const log = store.get("log", {});
  const set = new Set(log[key] || []);
  set.has(id) ? set.delete(id) : set.add(id);
  log[key] = [...set];
  store.set("log", log);
  renderMissions();
}

$("#mission-list").addEventListener("click", (e) => {
  const li = e.target.closest(".mission");
  if (li) toggleMission(li.dataset.id);
});
$("#mission-list").addEventListener("keydown", (e) => {
  const li = e.target.closest(".mission");
  if (li && (e.key === " " || e.key === "Enter")) {
    e.preventDefault();
    toggleMission(li.dataset.id);
  }
});

function renderReflect(todayKey, log) {
  const wk = weekKey(todayKey);
  let doneThisWeek = 0;
  for (let i = 0; i < 7; i++) doneThisWeek += (log[shiftDay(wk, i)] || []).length;
  $("#reflect-sub").textContent = `สัปดาห์นี้ทำภารกิจไปแล้ว ${doneThisWeek} ข้อ`;

  const reflect = store.get("reflect", {});
  const labels = { 1: "เหมือนเดิม", 2: "ดีขึ้นนิดนึง", 3: "ดีขึ้นชัดเจน" };
  const answered = reflect[wk];
  $("#reflect-btns").hidden = !!answered;
  $("#reflect-done").hidden = !answered;
  if (answered) {
    const past = Object.entries(reflect).filter(([k]) => k !== wk).length;
    $("#reflect-done").textContent =
      `บันทึกแล้ว: ${labels[answered.score]} (ทำภารกิจ ${answered.missions} ข้อ)` +
      (past ? ` · ย้อนดูได้อีก ${past} สัปดาห์` : "");
  }
}

$("#reflect-btns").addEventListener("click", (e) => {
  const score = e.target.dataset.score;
  if (!score) return;
  const key = dayKeyOf(new Date());
  const wk = weekKey(key);
  const log = store.get("log", {});
  let missions = 0;
  for (let i = 0; i < 7; i++) missions += (log[shiftDay(wk, i)] || []).length;
  const reflect = store.get("reflect", {});
  reflect[wk] = { score: Number(score), missions };
  store.set("reflect", reflect);
  renderReflect(key, log);
});

// ---------- เช็คคู่ ----------
const COUPLE_MISSIONS = {
  varna: "ชมกันเรื่องที่อีกฝ่ายภูมิใจ 1 เรื่อง",
  vashya: "ผลัดกันเลือกกิจกรรมวันหยุด คนละครั้ง",
  tara: "วางแผนทริปหรือเป้าหมายร่วมกัน 1 อย่าง",
  yoni: "หากิจกรรมที่ทั้งคู่ชอบทำ แล้วทำด้วยกันสัปดาห์ละครั้ง",
  maitri: "คุยเรื่องที่คิดต่างกันโดยไม่ต้องหาว่าใครถูก 15 นาที",
  gana: "บอกกันตรงๆ ว่าอะไรทำให้แต่ละคนรู้สึกได้รับความรัก",
  bhakoot: "คุยเรื่องเงินและเป้าหมายระยะยาวแบบสบายๆ",
  nadi: "ชวนกันนอนให้พอและออกกำลังกายด้วยกัน",
};

function verdict(total) {
  if (total >= 28) return ["คู่บุญ", "ตำราว่าเป็นคู่ที่เกื้อหนุนกันมาก ประคองกันไว้ดีๆ นะ"];
  if (total >= 21) return ["เข้ากันดี", "พื้นฐานดี มีบางเรื่องต้องปรับจูน แต่ไปด้วยกันได้สบาย"];
  if (total >= 18) return ["ผ่านเกณฑ์", "ตำราถือ 18 คะแนนเป็นเกณฑ์ผ่าน ความเข้าใจกันจะเติมส่วนที่ขาดได้"];
  return ["คนละโลก", "คะแนนน้อยแปลว่าต่างกันเยอะ ซึ่งแปลว่าได้เรียนรู้จากกันเยอะเหมือนกัน"];
}

$("#couple-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const p1 = parseDate(f.get("d1")), p2 = parseDate(f.get("d2"));
  const a = birthNakshatra(p1.y, p1.m, p1.d, f.get("t1") || null);
  const b = birthNakshatra(p2.y, p2.m, p2.d, f.get("t2") || null);
  const r = gunaMilan(a, b);
  const [title, text] = verdict(r.total);

  for (const [i, n] of [[1, a], [2, b]]) {
    const animal = NAKSHATRAS[n.index].animal;
    $(`#c-img${i}`).src = imgOf(animal);
    $(`#c-img${i}`).alt = ANIMALS[animal].th;
    $(`#c-img${i}`).style.background = ANIMALS[animal].color;
  }
  $("#c-total").textContent = Number.isInteger(r.total) ? r.total : r.total.toFixed(1);
  $("#c-verdict").textContent = title;
  $("#c-text").textContent =
    `${ANIMALS[NAKSHATRAS[a.index].animal].th} (${NAKSHATRAS[a.index].th}) กับ ${ANIMALS[NAKSHATRAS[b.index].animal].th} (${NAKSHATRAS[b.index].th}) · ${text}` +
    (a.certain && b.certain ? "" : " · มีคนที่วันเกิดคร่อมรอยต่อฤกษ์ ใส่เวลาเกิดจะแม่นขึ้น");
  $("#c-parts").innerHTML = r.parts
    .map((p) => `
      <li><div class="top-line"><span>${p.th} <span class="muted small">${p.hint}</span></span><span>${p.score}/${p.max}</span></div>
      <div class="bar"><span style="width:${(p.score / p.max) * 100}%"></span></div></li>`)
    .join("");
  const weakest = [...r.parts].sort((x, y) => x.score / x.max - y.score / y.max)[0];
  $("#c-mission").textContent = `หมวดที่ต้องเติมคือ "${weakest.th}" ภารกิจสัปดาห์นี้: ${COUPLE_MISSIONS[weakest.key]}`;
  $("#couple-result").hidden = false;
});

// ---------- การ์ดแชร์ (PNG) ----------
async function saveCard() {
  const c = $("#share-canvas");
  const g = c.getContext("2d");
  const { info, animal, nak, day } = profile;
  const t = todayInfo(profile);
  await document.fonts.load("700 64px Mali");

  const grad = g.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, "#fff1f6");
  grad.addColorStop(1, "#efe4ff");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1080, 1350);

  g.fillStyle = animal.color;
  g.beginPath();
  g.arc(540, 440, 290, 0, Math.PI * 2);
  g.fill();

  const img = new Image();
  img.src = imgOf(info.animal);
  await img.decode();
  g.globalCompositeOperation = "multiply";
  g.drawImage(img, 300, 200, 480, 480);
  g.globalCompositeOperation = "source-over";

  g.textAlign = "center";
  g.fillStyle = "#4a3b5c";
  g.font = "700 76px Mali";
  g.fillText(`${animal.th}${info.sex === "M" ? "หนุ่ม" : "สาว"}ประจำฤกษ์`, 540, 840);
  g.font = "600 40px Mali";
  g.fillStyle = "#9a8aa8";
  g.fillText(`${profile.name ? profile.name + " · " : ""}ฤกษ์${info.th} · จันทร์ราศี${RASHIS[nak.rashi]}`, 540, 910);
  g.fillStyle = "#4a3b5c";
  g.font = "400 40px Mali";
  g.fillText(animal.trait, 540, 990, 960);
  g.fillStyle = "#b78cf2";
  g.font = "700 48px Mali";
  g.fillText(`วันนี้: ${t.tara.mood}`, 540, 1100);
  g.fillStyle = day.hex;
  g.font = "600 38px Mali";
  g.fillText(`สีมงคลวันเกิด: ${day.color}`, 540, 1170);
  g.fillStyle = "#b78cf2";
  g.font = "700 44px Mali";
  g.fillText("มูดวง", 540, 1290);

  const a = document.createElement("a");
  a.download = `muduang-${info.animal}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
}
$("#save-card").addEventListener("click", saveCard);

// ---------- เริ่ม ----------
const saved = store.get("profile", null);
if (saved && saved.date) profile = computeProfile(saved);
renderMe();
let startTab = "me";
try { startTab = sessionStorage.getItem("muduang.tab") || "me"; } catch { /* ไม่เป็นไร */ }
showTab(startTab);
