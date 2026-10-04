import { birthNakshatra, nakshatraAt, taraOf, thaiBirthDay, thaiDate } from "./astro.js";
import { ANIMALS, NAKSHATRAS, RASHIS, TARAS, THEMES, THAI_DAYS, MISSIONS } from "./data.js";
import { gunaMilan } from "./match.js";
import { pickDailyMissions, hash } from "./missions.js";
import { CARDS, SUITS, SPREAD_POS, drawCards, dailyCard } from "./tarot.js";
import { STICKS, TOPICS, shakeStick } from "./siamsi.js";
import { birthIshta } from "./ishta.js";
import { sadeSati } from "./sadesati.js";
import { checkName, ROLE_MEANING } from "./taksa.js";
import { PROVINCES, placeOf } from "./provinces.js";
import { detailReading } from "./detail.js";
import { HOUSE_TOPICS } from "./readings.js";
import { nearest, withDistance, BIRTH_STUPAS, zodiacYear, PLANET_DEITY_TAG } from "./places.js";
import { DEITIES, ATMAKARAKA, NAK_DEITIES, PLANET_TH } from "./deities.js";

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
  const ishta = birthIshta(y, m, d, p.time || null);
  const dayIdx = thaiBirthDay(y, m, d, p.time);
  return { ...p, nak, info, ishta, dayIdx, animal: ANIMALS[info.animal], day: THAI_DAYS[dayIdx] };
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
  if (name === "deity") renderDeity();
  if (name === "detail") renderDetail();
  if (name === "oracle") renderOracle();
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
  renderSaturn();
  renderNameSub();
}

// ---------- เสาร์ทับ ----------
const thaiShort = (t) => new Date(t).toLocaleDateString("th-TH", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" });
function untilText(ms) {
  const months = Math.max(0, Math.round(ms / (30.44 * 86400000)));
  const y = Math.floor(months / 12), m = months % 12;
  return (y ? `${y} ปี ` : "") + (m ? `${m} เดือน` : "") || "ไม่ถึงเดือน";
}

function renderSaturn() {
  const ss = sadeSati(profile.nak.rashi);
  const now = Date.now();
  const mu = $("#ss-mu");
  if (ss.current) {
    const { start, end } = ss.current;
    const phases = ["ดาวเสาร์ถอยออกไปพักชั่วคราว", "ช่วงต้น", "ช่วงกลาง (หนักที่สุด)", "ช่วงท้าย ใกล้พ้นแล้ว"];
    $("#ss-title").textContent = `อยู่ในช่วงเสาร์ทับ: ${phases[ss.phase]}`;
    $("#ss-bar").hidden = false;
    $("#ss-fill").style.width = `${((now - start) / (end - start)) * 100}%`;
    $("#ss-dates").textContent = `เริ่ม ${thaiShort(start)} · พ้น ${thaiShort(end)} (อีก ${untilText(end - now)})`;
    $("#ss-text").textContent =
      "ตำราว่าเป็นช่วงที่ชีวิตสอนเรื่องความอดทนและความรับผิดชอบ งานหนักขึ้น ผลมาช้า แต่สิ่งที่สร้างในช่วงนี้จะอยู่ยาว ไม่ใช่ช่วงซวย แต่เป็นช่วงฝึก";
    mu.hidden = false;
    mu.innerHTML = "<b>มู:</b> ทำบุญวันเสาร์ ไหว้พระประจำวันเสาร์ (ปางนาคปรก) · <b>ทำจริง:</b> ตั้งวินัย 1 ข้อแล้วทำทุกวัน และช่วยงานผู้สูงอายุหรือคนที่ลำบากกว่า ตำราอินเดียถือว่าเป็นวิธีแก้ดาวเสาร์ที่ดีที่สุด";
  } else {
    $("#ss-title").textContent = "ตอนนี้ไม่อยู่ในช่วงเสาร์ทับ";
    $("#ss-bar").hidden = true;
    $("#ss-dates").textContent =
      (ss.last ? `รอบที่แล้วพ้นเมื่อ ${thaiShort(ss.last.end)} · ` : "") +
      (ss.next ? `รอบถัดไป ${thaiShort(ss.next.start)} ถึง ${thaiShort(ss.next.end)}` : "");
    $("#ss-text").textContent = "ช่วงนี้ดาวเสาร์ไม่กดดันดวงจันทร์ของคุณ เป็นจังหวะดีที่จะวางรากฐานระยะยาวไว้ก่อนรอบหน้ามาถึง";
    mu.hidden = true;
  }
}

// ---------- ชื่อมงคล (ทักษา) ----------
function renderNameSub() {
  const r = checkName("", profile.dayIdx);
  $("#nc-sub").textContent = `คุณเกิดวัน${profile.day.th} อักษรกาลกิณีคือ ` +
    (r.kalakiniIsVowel ? "สระทุกตัว" : [...r.kalakiniLetters].join(" "));
}

$("#name-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = checkName(e.target.n.value, profile.dayIdx);
  $("#nc-result").hidden = false;
  if (!r.chars.length) {
    $("#nc-letters").innerHTML = "";
    $("#nc-verdict").textContent = "พิมพ์เป็นภาษาไทยนะ ทักษาใช้กับอักษรไทยเท่านั้น";
    return;
  }
  $("#nc-letters").innerHTML = r.chars
    .map((c) => {
      const cls = c.role === "กาลกิณี" ? "bad" : ["เดช", "ศรี", "มนตรี"].includes(c.role) ? "good" : "";
      const shown = /[ัิ-ฺ็]/.test(c.ch) ? "◌" + c.ch : c.ch; // สระบน/ล่างวางบนวงกลมจุด
      return `<span class="${cls}">${shown}<small>${c.role}</small></span>`;
    })
    .join("");
  const goods = [...new Set(r.good.map((c) => c.role))];
  const goodText = goods.length ? ` มีอักษร${goods.join(" ")} ช่วยเสริมเรื่อง${goods.map((g) => ROLE_MEANING[g]).join(", ")}` : "";
  let verdict;
  if (!r.kalakini.length) verdict = `ไม่มีอักษรกาลกิณีเลย ถือเป็นชื่อที่ดีตามตำรา${goodText}`;
  else if (r.kalakiniIsVowel)
    verdict = `คนเกิดวันจันทร์ ตำราถือสระเป็นกาลกิณี แต่ชื่อไทยเลี่ยงสระได้ยากมาก ส่วนใหญ่จึงดูแค่อักษรตัวแรก` +
      (r.first.role === "กาลกิณี" ? " ซึ่งชื่อนี้ขึ้นต้นด้วยสระ" : ` ชื่อนี้ขึ้นต้นด้วย "${r.first.ch}" (${r.first.role}) ไม่มีปัญหา`) + goodText;
  else
    verdict = `มีอักษรกาลกิณี ${r.kalakini.length} ตัว (${r.kalakini.map((c) => c.ch).join(" ")}) ตำราแนะนำให้เลี่ยงในชื่อเล่น ชื่อร้าน หรือชื่อแบรนด์ ` +
      `ถ้าเป็นชื่อจริงที่ใช้มานานแล้วไม่ต้องกังวลมาก การกระทำของเราสำคัญกว่าตัวอักษร${goodText}`;
  $("#nc-verdict").textContent = verdict;
});


$("#birth-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const p = { name: f.get("name").trim(), date: f.get("date"), time: f.get("time"), place: f.get("place") };
  store.set("profile", p);
  profile = computeProfile(p);
  renderMe();
});

$("#edit-birth").addEventListener("click", () => {
  const form = $("#birth-form");
  form.name.value = profile.name || "";
  form.date.value = profile.date;
  form.time.value = profile.time || "";
  form.place.value = placeOf(profile.place).name;
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

// ---------- ดวงละเอียด ----------
const DASHA_COLOR = {
  ketu: "#c9b8a6", venus: "#f7b6cf", sun: "#f6a96b", moon: "#d9dcef", mars: "#ef8a8a",
  rahu: "#a9a9b8", jupiter: "#f3d27a", saturn: "#a99bd6", mercury: "#9fd8b0",
};
const ym = (t) => new Date(t).toLocaleDateString("th-TH", { timeZone: TZ, month: "short", year: "numeric" });
const stars = (n) => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");

function renderDetail() {
  $("#detail-empty").hidden = !!profile;
  $("#detail-body").hidden = !profile;
  if (!profile) return;
  const { y, m, d } = parseDate(profile.date);
  const place = placeOf(profile.place);
  const r = detailReading(y, m, d, profile.time || null, place);

  $("#lagna-title").textContent = r.usingMoon ? `จันทรลัคนา ราศี${r.lagna.th}` : `ลัคนาราศี${r.lagna.th}`;
  $("#lagna-text").textContent = r.lagna.text;
  $("#lagna-note").hidden = !r.usingMoon;
  $("#lagna-note").textContent = "ไม่ได้ใส่เวลาเกิด จึงใช้ราศีของดวงจันทร์แทนลัคนา (ตำราอินเดียใช้วิธีนี้กันทั่วไป) ใส่เวลาเกิดจะได้ลัคนาจริงและคำทำนายแม่นขึ้น";

  const ds = r.dasha;
  if (ds) {
    $("#md-title").textContent = `ทศา${PLANET_TH[ds.md.lord]}: ${ds.md.title}`;
    $("#md-dates").textContent = `${ym(ds.md.start)} ถึง ${ym(ds.md.end)}` + (profile.time ? "" : " (ไม่มีเวลาเกิด วันที่อาจคลาดได้หลายเดือน)");
    $("#md-text").textContent = ds.md.text;
    $("#md-house").textContent = `ดาว${PLANET_TH[ds.md.lord]}อยู่เรือน ${ds.md.house} ของคุณ ช่วงนี้เรื่อง${HOUSE_TOPICS[ds.md.house]}จะเด่นเป็นพิเศษ`;
    $("#ad-text").textContent = `${ds.ad.text} (${ym(ds.ad.start)} ถึง ${ym(ds.ad.end)})`;
    $("#md-next").textContent = ds.next ? `ช่วงใหญ่ถัดไป: ทศา${PLANET_TH[ds.next.lord]} เริ่ม ${ym(ds.next.start)}` : "";

    const birth = new Date(Date.UTC(y, m - 1, d)).getTime();
    const span = 100 * 365.25 * 86400000;
    const bar = ds.list
      .filter((x) => x.end > birth && x.start < birth + span)
      .map((x) => {
        const w = ((Math.min(x.end, birth + span) - Math.max(x.start, birth)) / span) * 100;
        return `<span style="width:${w}%;background:${DASHA_COLOR[x.lord]}" title="${PLANET_TH[x.lord]}"></span>`;
      })
      .join("");
    const nowPct = ((Date.now() - birth) / span) * 100;
    $("#life-bar").innerHTML = bar + `<i class="now" style="left:${nowPct}%"></i>`;
  }

  $("#transit-list").innerHTML = ["jupiter", "saturn"]
    .map((p) => {
      const t = r.transit[p];
      const next = t.next ? ` · ย้ายราศีครั้งถัดไป ${ym(t.next.at)}` : "";
      return `<li class="${t.good ? "good" : "care"}">${t.text}<div class="small muted">ตอนนี้อยู่ราศี${RASHIS[t.sign]}${next}</div></li>`;
    })
    .join("");

  $("#area-list").innerHTML = r.areas
    .map((a) => `
      <details class="card area">
        <summary><span>${a.th}</span><span class="stars">${stars(a.score)}<small>${a.summary}</small></span></summary>
        <ul>${a.lines.map((l) => `<li>${l}</li>`).join("")}</ul>
        <p class="mission-line"><b>ภารกิจ:</b> ${a.mission}</p>
      </details>`)
    .join("");

  $("#lucky-why").textContent = `ตามดาว${PLANET_TH[r.lucky.planet]} เจ้าเรือนลัคนาของคุณ`;
  $("#lucky-grid").innerHTML = `
    <div><span class="small muted">เลขนำโชค</span><b>${r.lucky.num}</b></div>
    <div><span class="small muted">สีนำโชค</span><b>${r.lucky.color}</b></div>
    <div><span class="small muted">ทิศมงคล</span><b>${r.lucky.dir}</b></div>
    <div><span class="small muted">วันดี</span><b>${r.lucky.day}</b></div>`;

  $("#planet-table").innerHTML = "<tr><th>ดาว</th><th>ราศี</th><th>เรือน</th></tr>" +
    r.planetsByHouse.map((x) => `<tr><td>${x.th}</td><td>${RASHIS[x.sign]}</td><td>${x.house}</td></tr>`).join("");
}

// ---------- เสี่ยงทาย ----------
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const RANK_SHORT = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "P", "Kn", "Q", "K"];
const SUIT_SVG = {
  wands: '<svg viewBox="0 0 40 40"><path d="M14 36 L26 6" stroke="#7a4a1e" stroke-width="4" stroke-linecap="round"/><path d="M24 12c4-2 7-1 8 1-3 2-6 2-8-1zM21 19c-4-1-6-4-6-6 3 0 6 2 6 6z" fill="#5fae6b"/></svg>',
  cups: '<svg viewBox="0 0 40 40"><path d="M9 7h22c0 11-5 16-11 16S9 18 9 7z" fill="#f3d27a" stroke="#b8902e" stroke-width="2"/><path d="M20 23v8M13 34h14" stroke="#b8902e" stroke-width="3" stroke-linecap="round"/></svg>',
  swords: '<svg viewBox="0 0 40 40"><path d="M20 3l3 6v18h-6V9z" fill="#e9eef5" stroke="#6b7a90" stroke-width="2"/><path d="M11 27h18" stroke="#b8902e" stroke-width="4" stroke-linecap="round"/><path d="M20 29v8" stroke="#7a4a1e" stroke-width="4" stroke-linecap="round"/></svg>',
  pentacles: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" fill="#f3d27a" stroke="#b8902e" stroke-width="2"/><path d="M20 9l3.2 7.6 8.1.6-6.2 5.3 2 7.9-7.1-4.4-7.1 4.4 2-7.9-6.2-5.3 8.1-.6z" fill="#fff8e0"/></svg>',
  major: '<svg viewBox="0 0 40 40"><path d="M20 3l4 12 13 1-10 8 4 13-11-8-11 8 4-13L3 16l13-1z" fill="#f2b84b"/><circle cx="20" cy="20" r="4" fill="#fff"/></svg>',
};

function cardHTML({ card, reversed }, big = false) {
  const top = card.major ? ROMAN[card.num] : RANK_SHORT[card.rank];
  const bg = card.major ? "" : `style="--suit:${SUITS[card.suit].color}"`;
  return `<div class="tcard ${card.major ? "major" : ""} ${reversed ? "rev" : ""} ${big ? "big" : ""}" ${bg} title="${card.en}">
    <span class="tn">${top}</span>${SUIT_SVG[card.major ? "major" : card.suit]}<span class="tname">${card.th}</span></div>`;
}

const cardMeaning = ({ card, reversed }) => (reversed ? card.rev : card.up);
const cardTitle = ({ card, reversed }) => `${card.th} (${card.en})${reversed ? " · กลับหัว" : ""}`;

function missionFor(theme, seed) {
  const pool = MISSIONS.filter((m) => m.theme === theme);
  const m = pool[hash(seed) % pool.length];
  return `<b>ภารกิจ:</b> ${m.act} <span class="muted">(มู: ${m.mu})</span>`;
}

let siamsiTopic = "all";

function renderOracle() {
  const key = dayKeyOf(new Date());
  const birthIndex = profile ? profile.nak.index : 0;
  const daily = dailyCard(key, birthIndex, hash);
  $("#daily-card").innerHTML = cardHTML(daily, true);
  $("#daily-title").textContent = cardTitle(daily);
  $("#daily-text").textContent = cardMeaning(daily);
  $("#daily-mission").innerHTML = missionFor(daily.card.theme, `daily:${key}:${birthIndex}`);

  const spread = store.get("spread", null);
  if (spread && spread.day === key) showSpread(spread);
  else $("#spread-result").hidden = true;
  $("#spread-form").querySelector("button").disabled = !!(spread && spread.day === key);
  $("#spread-form").querySelector("button").textContent = spread && spread.day === key ? "เปิดใหม่ได้พรุ่งนี้" : "สับไพ่";

  $("#siamsi-topics").innerHTML = Object.entries(TOPICS)
    .map(([k, v]) => `<button type="button" class="chip" data-topic="${k}" aria-pressed="${k === siamsiTopic}">${v}</button>`).join("");
  showSiamsiFor(siamsiTopic);
}

function showSpread(sp) {
  const cards = sp.cards.map(({ id, reversed }) => ({ card: CARDS.find((c) => c.id === id), reversed }));
  $("#spread-result").hidden = false;
  $("#spread-q").textContent = sp.q ? `คำถาม: ${sp.q}` : "";
  $("#spread-cards").innerHTML = cards.map((c, i) => `<div>${cardHTML(c)}<div class="tlabel">${SPREAD_POS[i]}</div></div>`).join("");
  $("#spread-read").innerHTML = cards.map((c, i) => `<li><b>${SPREAD_POS[i]}: ${cardTitle(c)}</b><br>${cardMeaning(c)}</li>`).join("") +
    `<li class="mission-line" style="list-style:none;margin-left:-18px">${missionFor(cards[2].card.theme, `spread:${sp.day}`)}</li>`;
}

$("#spread-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const key = dayKeyOf(new Date());
  const cards = drawCards(3).map(({ card, reversed }) => ({ id: card.id, reversed }));
  const sp = { day: key, q: e.target.q.value.trim(), cards };
  store.set("spread", sp);
  renderOracle();
});

function showSiamsiFor(topic) {
  const log = store.get("siamsi", {});
  const key = dayKeyOf(new Date());
  const got = log[key] && log[key][topic];
  const btn = $("#siamsi-shake");
  btn.disabled = !!got;
  btn.textContent = got ? `เรื่อง${TOPICS[topic]}เสี่ยงแล้ววันนี้` : "เขย่าเซียมซี";
  if (!got) { $("#siamsi-result").hidden = true; return; }
  const st = STICKS[got - 1];
  $("#siamsi-result").hidden = false;
  $("#ss-no").textContent = `ใบที่ ${st.no} · ${st.level}`;
  $("#ss-verse").textContent = st.verse;
  $("#ss-all").innerHTML = `<b>ภาพรวม:</b> ${st.all}`;
  $("#ss-topic").innerHTML = topic === "all"
    ? ["work", "money", "love", "health"].map((t) => `<b>${TOPICS[t]}:</b> ${st[t]}`).join("<br>")
    : `<b>${TOPICS[topic]}:</b> ${st[topic]}`;
  $("#ss-advice").innerHTML = `<b>คำแนะนำ:</b> ${st.advice}`;
}

$("#siamsi-topics").addEventListener("click", (e) => {
  const t = e.target.dataset.topic;
  if (!t) return;
  siamsiTopic = t;
  document.querySelectorAll("#siamsi-topics button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.topic === t));
  showSiamsiFor(t);
});

$("#siamsi-shake").addEventListener("click", () => {
  const tube = $("#siamsi-tube");
  const btn = $("#siamsi-shake");
  btn.disabled = true;
  tube.classList.add("shaking");
  setTimeout(() => {
    tube.classList.remove("shaking");
    const key = dayKeyOf(new Date());
    const log = store.get("siamsi", {});
    // เก็บแค่วันนี้ ไม่ให้ข้อมูลสะสมไม่จบ
    const today = log[key] || {};
    today[siamsiTopic] = shakeStick().no;
    store.set("siamsi", { [key]: today });
    showSiamsiFor(siamsiTopic);
  }, 1300);
});

// ---------- องค์เทพ ----------
const SIGN_NAMES = RASHIS;
const mapLink = (q) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);

// ---------- แผนที่มู ----------
const WISH_TH = { money: "การเงิน", love: "ความรัก", work: "การงาน", health: "สุขภาพ", luck: "โชคลาภ", family: "ครอบครัว" };
const AREA_WISH = { self: "luck", money: "money", love: "love", work: "work", health: "health", home: "family" };
let gpsOrigin = null; // ตำแหน่งจากมือถือ ใช้ในเครื่องเท่านั้น ไม่ส่งออก ไม่บันทึก

function currentOrigin() {
  if (gpsOrigin) return gpsOrigin;
  return placeOf($("#origin-select").value || profile.place);
}

function placeItem(p, note) {
  const dist = p.km === null || p.km === undefined ? "" : p.km < 15 ? "ใกล้มาก" : `~${Math.round(p.km)} กม.`;
  const sub = [p.province, dist, note].filter(Boolean).join(" · ");
  return `<li><a href="${mapLink(p.q)}" target="_blank" rel="noopener"><span class="pname">${p.name}<small>${sub}</small></span><span>เปิดแผนที่</span></a></li>`;
}

function group(title, why, items) {
  if (!items.length) return "";
  return `<div class="mu-group"><h4>${title}</h4><p class="small muted why">${why}</p><ul class="places">${items.join("")}</ul></div>`;
}

function renderMuMap() {
  const origin = currentOrigin();
  const { ishta } = profile;
  const { y, m, d } = parseDate(profile.date);
  const deity = DEITIES[ishta.deityPlanet];
  const groups = [];

  groups.push(group(`องค์เทพประจำตัว: ${deity.th}`, "ไปไหว้ขอพรและขอบคุณ",
    nearest({ tags: [PLANET_DEITY_TAG[ishta.deityPlanet]] }, origin, 3).map((p) => placeItem(p))));

  const r = detailReading(y, m, d, profile.time || null, placeOf(profile.place));
  if (r.dasha) {
    const lord = r.dasha.md.lord;
    const tag = PLANET_DEITY_TAG[lord];
    const extra = lord === "rahu" ? ["rahu"] : [];
    groups.push(group(`ทศา${PLANET_TH[lord]}ตอนนี้: ${DEITIES[lord].th}`, `ช่วงชีวิตนี้ดาว${PLANET_TH[lord]}คุมอยู่ ไหว้องค์เทพของดาวนี้ช่วยให้ใจนิ่งตามช่วงชีวิต`,
      nearest({ tags: [tag, ...extra] }, origin, 2).map((p) => placeItem(p))));
  }

  const ss = sadeSati(profile.nak.rashi);
  if (ss.current) {
    groups.push(group("ช่วงเสาร์ทับ: สะเดาะเคราะห์", "ทำบุญ ปัดเคราะห์ และตั้งใจทำความดีให้ต่อเนื่อง",
      nearest({ tags: ["remedy"] }, origin, 2).map((p) => placeItem(p))));
  }

  const weakest = [...r.areas].sort((a, b) => a.score - b.score)[0];
  const wish = AREA_WISH[weakest.key];
  groups.push(group(`เติมด้าน${weakest.th}`, `ด้าน${weakest.th}ได้คะแนนน้อยที่สุดในดวงคุณ (${weakest.score}/5) ไปขอพรเรื่อง${WISH_TH[wish]}`,
    nearest({ wishes: [wish] }, origin, 2).map((p) => placeItem(p, `ขอเรื่อง${WISH_TH[wish]}`))));

  const zy = zodiacYear(y, m, d);
  const st = BIRTH_STUPAS[zy];
  const stItems = [];
  if (st.province) stItems.push(placeItem(withDistance({ ...st, tags: [], wishes: [] }, origin)));
  else {
    stItems.push(`<li class="small muted">${st.name} อยู่ต่างประเทศ</li>`);
    if (st.alt) stItems.push(placeItem(withDistance({ ...st.alt, tags: [], wishes: [] }, origin), "ไหว้แทนในไทย"));
  }
  const beforeSongkran = m < 4 || (m === 4 && d < 16);
  const calYear = BIRTH_STUPAS[(((y - 4) % 12) + 12) % 12];
  const why = "ตามตำราล้านนา (นับปีใหม่ที่สงกรานต์) ไหว้แล้วเป็นสิริมงคลกับชีวิต" +
    (beforeSongkran ? ` · ถ้านับปีแบบปฏิทิน (1 ม.ค.) คุณจะเป็นปี${calYear.year} พระธาตุคือ${calYear.name}` : "");
  groups.push(group(`พระธาตุประจำปีเกิด: ปี${st.year}`, why, stItems));

  $("#mu-groups").innerHTML = groups.join("");
}

function renderDeity() {
  $("#deity-empty").hidden = !!profile;
  $("#deity-body").hidden = !profile;
  if (!profile) return;

  const { ishta, info, day } = profile;
  const deity = DEITIES[ishta.deityPlanet];
  const ak = ATMAKARAKA[ishta.ak];
  $("#deity-card").style.setProperty("--deity", deity.color);
  $("#deity-name").textContent = deity.th;
  $("#deity-en").textContent = `${deity.en} · ชี้โดยดาว${PLANET_TH[ishta.deityPlanet]}`;
  $("#deity-blessing").textContent = deity.blessing;

  const odds = $("#deity-odds");
  if (ishta.certain) odds.hidden = true;
  else {
    odds.hidden = false;
    odds.textContent = `ไม่ได้ใส่เวลาเกิด: มีโอกาส ${Math.round(ishta.odds * 100)}% เป็นองค์นี้` +
      (ishta.alts.length ? ` อีกทางคือ ${ishta.alts.map((a) => `${DEITIES[a.planet].th} ${Math.round(a.odds * 100)}%`).join(", ")}` : "") +
      " ใส่เวลาเกิดที่แท็บดวงฉันจะรู้แน่ชัด";
  }

  $("#ak-line").textContent = `คำทำนายจากอาตมการกะ: ดาว${PLANET_TH[ishta.ak]} ดาวแห่งดวงวิญญาณของคุณ`;
  $("#ak-title").textContent = ak.title;
  $("#ak-text").textContent = ak.text;

  if (!gpsOrigin) $("#origin-select").value = store.get("origin", null) || placeOf(profile.place).name;
  renderMuMap();
  $("#deity-offering").textContent = deity.offering;
  $("#deity-act").textContent = deity.act;

  $("#deity-extra").innerHTML = `
    <li><b>เทพประจำฤกษ์${info.th}:</b> ${NAK_DEITIES[info.index]}</li>
    <li><b>พระประจำวันเกิด (วัน${day.th}):</b> ${day.buddha}</li>`;

  $("#deity-how").textContent =
    `ดาวที่องศาในราศีสูงสุดตอนเกิดคือดาว${PLANET_TH[ishta.ak]} (อาตมการกะ) อยู่ราศี${SIGN_NAMES[ishta.karakamsha]}ในผังนวางศ์ ` +
    `นับไปเรือนที่ 12 คือราศี${SIGN_NAMES[ishta.twelfth]} ` +
    (ishta.via === "occupant" ? `ซึ่งมีดาว${PLANET_TH[ishta.deityPlanet]}สถิตอยู่` : `ไม่มีดาวอยู่ จึงใช้เจ้าเรือนคือดาว${PLANET_TH[ishta.deityPlanet]}`) +
    ` ตำราปราศร (BPHS) ให้ดาวนี้ชี้ไปที่${deity.th} หลักการจับคู่ดาวกับเทพแต่ละสำนักอาจต่างกันเล็กน้อย`;
}

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
$("#place-select").innerHTML = PROVINCES.map((p) => `<option>${p.name}</option>`).join("");
$("#origin-select").innerHTML = PROVINCES.map((p) => `<option>${p.name}</option>`).join("");
$("#origin-select").addEventListener("change", () => {
  gpsOrigin = null;
  $("#gps-note").hidden = true;
  store.set("origin", $("#origin-select").value);
  renderMuMap();
});
$("#use-gps").addEventListener("click", () => {
  const note = $("#gps-note");
  note.hidden = false;
  if (!navigator.geolocation) { note.textContent = "เบราว์เซอร์นี้ไม่รองรับการหาตำแหน่ง เลือกจังหวัดแทนได้เลย"; return; }
  note.textContent = "กำลังหาตำแหน่ง...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      gpsOrigin = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      note.textContent = "เรียงจากตำแหน่งปัจจุบันของคุณแล้ว (ใช้คำนวณในเครื่องเท่านั้น ไม่ได้ส่งหรือบันทึกไว้)";
      renderMuMap();
    },
    () => { note.textContent = "หาตำแหน่งไม่ได้หรือไม่ได้อนุญาต เลือกจังหวัดแทนได้เลย"; },
    { timeout: 10000, maximumAge: 600000 },
  );
});
const saved = store.get("profile", null);
if (saved && saved.date) profile = computeProfile(saved);
renderMe();
let startTab = "me";
try { startTab = sessionStorage.getItem("muduang.tab") || "me"; } catch { /* ไม่เป็นไร */ }
showTab(startTab);
