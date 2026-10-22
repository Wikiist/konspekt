// POST /api/plan { level, topic, minutes, guidelines, needs } -> a ready lesson plan (konspekt) tied to the 2026 core curriculum.
// level: "przedszkole-3-4" | "przedszkole-5-6" | "klasa-1" | "klasa-2" | "klasa-3". Nothing is stored. Key from env (GEMINI_API_KEY).
import { readFileSync } from "node:fs";
import path from "node:path";

const read = (f) => JSON.parse(readFileSync(path.join(process.cwd(), "data", f), "utf8"));
const PRE = read("przedszkole.json");
const SCH = read("klasy-1-3.json");
const MODEL = process.env.PLAN_MODEL || "gemini-3.5-flash";
const FALLBACK = process.env.PLAN_FALLBACK_MODEL || "gemini-3.5-flash-lite";

export const LEVELS = {
  "przedszkole-3-4": { label: "przedszkole, dzieci 3–4 lata", kind: "pre", who: "Dziecko" },
  "przedszkole-5-6": { label: "przedszkole, dzieci 5–6 lat", kind: "pre", who: "Dziecko" },
  "klasa-1": { label: "klasa I szkoły podstawowej", kind: "sch", who: "Uczeń" },
  "klasa-2": { label: "klasa II szkoły podstawowej", kind: "sch", who: "Uczeń" },
  "klasa-3": { label: "klasa III szkoły podstawowej", kind: "sch", who: "Uczeń" },
};

function build(kind) {
  const codes = new Map();
  let text;
  if (kind === "pre") {
    for (const a of PRE.areas) for (const it of a.items) codes.set(it.code, { area: a.name, text: it.text });
    for (const e of PRE.experiences) codes.set(e.code, { area: "Doświadczenie edukacyjne", text: e.text });
    text = "Podstawa programowa wychowania przedszkolnego (załącznik nr 1):\n" +
      PRE.areas.map((a) => `${a.name}:\n` + a.items.map((i) => `  ${i.code} ${i.text}`).join("\n")).join("\n") +
      "\nDoświadczenia edukacyjne (co najmniej raz w roku):\n" + PRE.experiences.map((e) => `  ${e.code} ${e.text}`).join("\n");
  } else {
    for (const a of SCH.areas) for (const s of a.sections) for (const it of s.items) codes.set(it.code, { area: `${a.name}, ${s.name}`, text: it.text });
    for (const e of SCH.experiences) codes.set(e.code, { area: "Doświadczenie edukacyjne", text: e.text });
    text = "Podstawa programowa edukacji wczesnoszkolnej, klasy I–III (załącznik nr 2). Wymagania są na koniec klasy III; w klasach I i II dobieraj je w zakresie odpowiednim dla wieku:\n" +
      SCH.areas.map((a) => `${a.name}:\n` + a.sections.map((s) => ` ${s.name}:\n` + s.items.map((i) => `  ${i.code} ${i.text}`).join("\n")).join("\n")).join("\n") +
      "\nDoświadczenia edukacyjne:\n" + SCH.experiences.map((e) => `  ${e.code} ${e.text}`).join("\n");
  }
  return { codes, text };
}
const CUR = { pre: build("pre"), sch: build("sch") };

const RULES = `Jesteś doświadczonym nauczycielem i metodykiem. Przygotowujesz gotowy konspekt zajęć zgodny z nową podstawą programową (rozporządzenie MEN z 11 marca 2026 r., Dz.U. 2026 poz. 378), tak żeby nauczyciel mógł jutro poprowadzić zajęcia bez dodatkowego przygotowania.

Dobre praktyki, które stosujesz zawsze, chyba że wytyczne nauczyciela mówią inaczej:
- Dzieci uczą się przez działanie, ruch i prawdziwe przedmioty: materiały naturalne (liście, kamienie, muszle, kasztany), przedmioty codziennego użytku, wyjście w teren. Ekran najwyżej jako krótki dodatek, nigdy jako główna część.
- Pytania otwarte, które wymagają myślenia, a nie zgadywania z dwóch odpowiedzi. Daj dzieciom czas na namysł.
- Chwal konkretny wysiłek i sposób myślenia, nie samą poprawną odpowiedź. Bez nagród za każde zadanie.
- Abstrakcję buduj od konkretu, np. matematykę od rytmu, klaskania, segregowania klocków; kodowanie od poleceń ruchowych na dywanie, bez komputera.
- W grupie zawsze są dzieci, które już wszystko wiedzą, i takie, które nic nie rozumieją. Zaplanuj dla obu.
- Bezpieczeństwo: przy wyjściach, narzędziach i materiałach naturalnych podaj konkretne zasady.

Zasady konspektu:
- Kody z podstawy wybieraj tylko z listy poniżej i tylko takie, które zajęcia naprawdę realizują (3–8 kodów, 0–2 doświadczenia D.x). Do każdego kodu jedno krótkie zdanie, jak zajęcia go realizują.
- Cele operacyjne zaczynaj od formy „{WHO}:” i czasownika (np. „nazywa”, „porównuje”, „układa”), mierzalne.
- Przebieg: 4–7 etapów; suma minut równa czasowi zajęć. Przy każdym etapie: co robi nauczyciel (konkretnie, z przykładowymi słowami do dzieci), co robią dzieci, 1–3 pytania otwarte.
- Wiadomość dla rodziców: 2–4 zdania, jedno proste działanie do zrobienia razem w domu lub na spacerze, bez ekranu.
- Wpis do dziennika: jedna linia w formie „Temat. (kody)”.
- Temat wrażliwy (religia, światopogląd, rodzina, ciało, śmierć): podaj fakty naukowe rzetelnie, a sprawy wiary i wartości zostaw rozmowie w domu; nie oceniaj przekonań rodzin.
- Przebieg pisz w czasie teraźniejszym (dzieci odsłaniają, porównują), bo to plan zajęć, nie relacja.
- Gramatyka: rzeczownik „dzieci” łączy się z formą niemęskoosobową (dzieci układają, układały). Gdy nauczyciel zwraca się do mieszanej grupy w 2. osobie, używaj formy męskoosobowej (zrobiliście, gdybyście spotkali). Słowa nauczyciela bez form zdradzających płeć (zamiast „przyniosłem/przyniosłam” napisz „mam tu dla was”).
- Naturalna, poprawna polszczyzna, bez kalk z angielskiego i bez myślników w zdaniach. Sprawdź literówki i spacje między wyrazami.
- Zwróć wyłącznie JSON według schematu.`;

const str = { type: "string" };
const arr = (items) => ({ type: "array", items });
const SCHEMA = {
  type: "object",
  properties: {
    temat: str,
    cel_ogolny: str,
    cele: arr(str),
    podstawa: arr({ type: "object", properties: { code: str, why: str }, required: ["code", "why"] }),
    metody: arr(str),
    formy: arr(str),
    pomoce: arr(str),
    przebieg: arr({ type: "object", properties: { etap: str, minuty: { type: "integer" }, nauczyciel: str, dzieci: str, pytania: arr(str) }, required: ["etap", "minuty", "nauczyciel", "dzieci", "pytania"] }),
    roznicowanie: { type: "object", properties: { szybciej: str, wsparcie: str, potrzeby: arr({ type: "object", properties: { potrzeba: str, dostosowanie: str }, required: ["potrzeba", "dostosowanie"] }) }, required: ["szybciej", "wsparcie", "potrzeby"] },
    sprawdzenie: str,
    bezpieczenstwo: str,
    dla_rodzicow: str,
    wpis_do_dziennika: str,
  },
  required: ["temat", "cel_ogolny", "cele", "podstawa", "metody", "formy", "pomoce", "przebieg", "roznicowanie", "sprawdzenie", "bezpieczenstwo", "dla_rodzicow", "wpis_do_dziennika"],
};

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 12;
}

const S = (x) => String(x || "").trim();
const list = (x, n) => (Array.isArray(x) ? x : []).map(S).filter(Boolean).slice(0, n);

// keep only codes that exist for this level, attach the official wording, total the minutes
export function normalise(out, kind) {
  const { codes } = CUR[kind];
  const seen = new Set();
  const podstawa = (Array.isArray(out.podstawa) ? out.podstawa : [])
    .map((x) => ({ code: S(x && x.code), why: S(x && x.why) }))
    .filter((x) => codes.has(x.code) && !seen.has(x.code) && seen.add(x.code))
    .slice(0, 10)
    .map((x) => ({ ...x, ...codes.get(x.code) }));
  const przebieg = (Array.isArray(out.przebieg) ? out.przebieg : []).filter((e) => e && e.etap).slice(0, 8).map((e) => ({
    etap: S(e.etap), minuty: Math.max(0, Math.round(Number(e.minuty) || 0)), nauczyciel: S(e.nauczyciel), dzieci: S(e.dzieci), pytania: list(e.pytania, 4),
  }));
  const r = out.roznicowanie || {};
  return {
    temat: S(out.temat).replace(/ [–—-] /g, ": "), cel_ogolny: S(out.cel_ogolny), cele: list(out.cele, 8), podstawa,
    metody: list(out.metody, 6), formy: list(out.formy, 4), pomoce: list(out.pomoce, 14), przebieg,
    minuty_razem: przebieg.reduce((n, e) => n + e.minuty, 0),
    roznicowanie: { szybciej: S(r.szybciej), wsparcie: S(r.wsparcie), potrzeby: (Array.isArray(r.potrzeby) ? r.potrzeby : []).filter((p) => p && p.potrzeba).slice(0, 6).map((p) => ({ potrzeba: S(p.potrzeba), dostosowanie: S(p.dostosowanie) })) },
    sprawdzenie: S(out.sprawdzenie), bezpieczenstwo: S(out.bezpieczenstwo), dla_rodzicow: S(out.dla_rodzicow), wpis_do_dziennika: S(out.wpis_do_dziennika).replace(/ [–—-] /g, ": "),
  };
}

export async function makePlan({ level, topic, minutes, guidelines, needs }, fetchImpl = fetch) {
  const lv = LEVELS[level] || LEVELS["klasa-1"];
  topic = S(topic).slice(0, 300);
  guidelines = S(guidelines).slice(0, 1500);
  needs = list(needs, 8).map((n) => n.slice(0, 80));
  minutes = [20, 30, 45, 60, 90].includes(Number(minutes)) ? Number(minutes) : 45;
  if (topic.length < 3) return { status: 400, body: { error: "Wpisz temat zajęć." } };
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: 200, body: normalise({ temat: `[mock] ${topic}`, przebieg: [{ etap: "Wprowadzenie", minuty: minutes }], podstawa: [{ code: lv.kind === "pre" ? "5.2" : "6.1.a", why: "mock" }] }, lv.kind) };
  const system = RULES.replace("{WHO}", lv.who) + "\n\n" + CUR[lv.kind].text;
  const user = [
    `Temat lub cel zajęć: ${topic}`,
    `Grupa: ${lv.label}. Czas zajęć: ${minutes} minut.`,
    needs.length ? `W grupie są dzieci, które potrzebują dostosowań: ${needs.join(", ")}. W polu „potrzeby” podaj konkretne dostosowanie dla każdej z tych potrzeb.` : "Nie podano szczególnych potrzeb; pole „potrzeby” zostaw puste.",
    guidelines ? `Wytyczne nauczyciela (mają pierwszeństwo przed dobrymi praktykami):\n${guidelines}` : "",
  ].filter(Boolean).join("\n");
  const call = async (model, ms) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      return await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        signal: ctl.signal,
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 8000, responseMimeType: "application/json", responseSchema: SCHEMA, thinkingConfig: { thinkingLevel: "medium" } },
        }),
      });
    } catch {
      return { ok: false, status: 504, text: async () => "timeout" };
    } finally {
      clearTimeout(t);
    }
  };
  // busy models usually answer 503 within a second, so alternate and retry while there is time left (function limit 60 s)
  const t0 = Date.now();
  const left = () => 55000 - (Date.now() - t0);
  let res = await call(MODEL, 38000);
  for (let i = 0; !res.ok && [429, 500, 503, 504].includes(res.status) && left() > 8000 && i < 4; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1500));
    res = await call(i % 2 ? MODEL : FALLBACK, Math.min(30000, left()));
  }
  if (!res.ok) {
    console.error("gemini", res.status, await res.text());
    return { status: 502, body: { error: "Model AI jest teraz przeciążony. Spróbuj za chwilę." } };
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "{}";
  try {
    return { status: 200, body: normalise(JSON.parse(text), lv.kind) };
  } catch {
    return { status: 502, body: { error: "Nie udało się przygotować konspektu. Spróbuj jeszcze raz." } };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "local";
  if (limited(ip)) return res.status(429).json({ error: "Za dużo prób naraz. Odczekaj chwilę." });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const out = await makePlan(body);
  res.status(out.status).json(out.body);
}
