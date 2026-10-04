// ตำแหน่งดาวแบบ geocentric (tropical, equinox of date)
// สูตร: Paul Schlyter "How to compute planetary positions" (คลาด ~1-2 ลิปดา)
import { julianDay, moonTropical, lahiriAyanamsa } from "./astro.js";

const DEG = Math.PI / 180;
const sin = (x) => Math.sin(x * DEG);
const cos = (x) => Math.cos(x * DEG);
const norm360 = (x) => ((x % 360) + 360) % 360;

// [N, i, w, a, e, M] แต่ละตัวเป็น [ค่าคงที่, อัตราต่อวัน]
const ELEMENTS = {
  mercury: [[48.3313, 3.24587e-5], [7.0047, 5.0e-8], [29.1241, 1.01444e-5], [0.387098, 0], [0.205635, 5.59e-10], [168.6562, 4.0923344368]],
  venus: [[76.6799, 2.4659e-5], [3.3946, 2.75e-8], [54.891, 1.38374e-5], [0.72333, 0], [0.006773, -1.302e-9], [48.0052, 1.6021302244]],
  mars: [[49.5574, 2.11081e-5], [1.8497, -1.78e-8], [286.5016, 2.92961e-5], [1.523688, 0], [0.093405, 2.516e-9], [18.6021, 0.5240207766]],
  jupiter: [[100.4542, 2.76854e-5], [1.303, -1.557e-7], [273.8777, 1.64505e-5], [5.20256, 0], [0.048498, 4.469e-9], [19.895, 0.0830853001]],
  saturn: [[113.6634, 2.3898e-5], [2.4886, -1.081e-7], [339.3939, 2.97661e-5], [9.55475, 0], [0.055546, -9.499e-9], [316.967, 0.0334442282]],
};

function kepler(M, e) {
  let E = M + (e / DEG) * sin(M) * (1 + e * cos(M));
  for (let k = 0; k < 10; k++) {
    const dE = (E - (e / DEG) * sin(E) - M) / (1 - e * cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-7) break;
  }
  return E;
}

function orbit(el, d) {
  const [N, i, w, a, e, M] = el.map(([c, r]) => c + r * d);
  const E = kepler(norm360(M), e);
  const xv = a * (cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sin(E);
  const v = Math.atan2(yv, xv) / DEG;
  const r = Math.hypot(xv, yv);
  const vw = v + w;
  return {
    x: r * (cos(N) * cos(vw) - sin(N) * sin(vw) * cos(i)),
    y: r * (sin(N) * cos(vw) + cos(N) * sin(vw) * cos(i)),
    z: r * sin(vw) * sin(i),
    M: norm360(M),
  };
}

function sunXY(d) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = norm360(356.047 + 0.9856002585 * d);
  const E = kepler(M, e);
  const xv = cos(E) - e;
  const yv = Math.sqrt(1 - e * e) * sin(E);
  const lon = Math.atan2(yv, xv) / DEG + w;
  const r = Math.hypot(xv, yv);
  return { lon: norm360(lon), x: r * cos(lon), y: r * sin(lon) };
}

// ลองจิจูด tropical ของดาวทุกดวง (องศา)
export function tropicalPositions(date) {
  const jd = julianDay(date);
  const d = jd - 2451543.5;
  const sun = sunXY(d);
  const out = { sun: sun.lon, moon: moonTropical(jd) };

  const Mj = orbit(ELEMENTS.jupiter, d).M;
  const Ms = orbit(ELEMENTS.saturn, d).M;
  for (const name of Object.keys(ELEMENTS)) {
    const h = orbit(ELEMENTS[name], d);
    let lon = Math.atan2(h.y, h.x) / DEG;
    const lat = Math.atan2(h.z, Math.hypot(h.x, h.y)) / DEG;
    const r = Math.hypot(h.x, h.y, h.z);
    if (name === "jupiter") {
      lon += -0.332 * sin(2 * Mj - 5 * Ms - 67.6) - 0.056 * sin(2 * Mj - 2 * Ms + 21) + 0.042 * sin(3 * Mj - 5 * Ms + 21)
        - 0.036 * sin(Mj - 2 * Ms) + 0.022 * cos(Mj - Ms) + 0.023 * sin(2 * Mj - 3 * Ms + 52) - 0.016 * sin(Mj - 5 * Ms - 69);
    } else if (name === "saturn") {
      lon += 0.812 * sin(2 * Mj - 5 * Ms - 67.6) - 0.229 * cos(2 * Mj - 4 * Ms - 2) + 0.119 * sin(Mj - 2 * Ms - 3)
        + 0.046 * sin(2 * Mj - 6 * Ms - 69) + 0.014 * sin(Mj - 3 * Ms + 32);
    }
    const xh = r * cos(lon) * cos(lat);
    const yh = r * sin(lon) * cos(lat);
    out[name] = norm360(Math.atan2(yh + sun.y, xh + sun.x) / DEG);
  }

  // ราหู (mean node) และเกตุอยู่ตรงข้าม
  const T = (jd - 2451545) / 36525;
  out.rahu = norm360(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T);
  out.ketu = norm360(out.rahu + 180);
  return out;
}

export function siderealPositions(date) {
  const ayan = lahiriAyanamsa(julianDay(date));
  const trop = tropicalPositions(date);
  const out = {};
  for (const [k, v] of Object.entries(trop)) out[k] = norm360(v - ayan);
  return out;
}
