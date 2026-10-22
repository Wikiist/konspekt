// Builds data/klasy-1-3.json from the official core curriculum for grades 1–3 (Dz.U. 2026 poz. 378, Annex 2, stage I).
// Codes: "5.1.f" = Edukacja matematyczna, 1) liczby, f). Experiences: "D.1", "D.2.3", "D.3.3.g".
// Usage: node scripts/parse.mjs
import { readFileSync, writeFileSync } from "node:fs";

const raw = readFileSync("data/annex2-klasy-1-3.txt", "utf8");
const s = raw
  .replace(/﻿?\s*Dziennik Ustaw[\s\S]*?Poz\. 378/g, " ") // drop page headers
  .replace(/\s+/g, " ");
const start = s.indexOf("1. Edukacja językowa – polonistyczna:");
const expStart = s.indexOf("1. Uczeń przynajmniej cztery razy w roku szkolnym");
const end = s.indexOf("Warunki i sposób realizacji", expStart);
const body = s.slice(start, s.indexOf("W ramach edukacji wczesnoszkolnej uczniowie zdobywają", start));
const clean = (t) => t.trim().replace(/[;,.]\s*$/, "").replace(/\s*–\s*moduł [a-ząęółśżźćń -]+$/, "");

// 3 and 4 are minority and regional languages; most classes do not teach them
const SKIP = new Set([3, 4]);
const areas = [];
const heads = [...body.matchAll(/(\d{1,2})\. ((?:Edukacja|Wychowanie|Etyka)[^:]{0,80}):/g)];
heads.forEach((h, i) => {
  const id = Number(h[1]);
  const text = body.slice(h.index + h[0].length, i + 1 < heads.length ? heads[i + 1].index : undefined);
  const subs = [...text.matchAll(/ (\d{1,2})\) ([^)]{3,120}?) – uczeń:/g)];
  const sections = subs.map((m, j) => {
    const chunk = text.slice(m.index + m[0].length, j + 1 < subs.length ? subs[j + 1].index : undefined);
    const items = [];
    for (const it of chunk.matchAll(/ ([a-z])\) (.+?)(?=(?: [a-z]\) )|$)/g)) {
      const expected = String.fromCharCode(97 + items.length);
      if (it[1] !== expected) continue; // a letter inside a sentence, not a new item
      items.push({ code: `${id}.${m[1]}.${it[1]}`, text: clean(it[2]) });
    }
    return { name: m[2].replace(/\s*–\s*moduł.*$/, ""), items };
  });
  if (!SKIP.has(id)) areas.push({ id, name: h[2].trim(), sections });
});

// educational experiences
const exp = s.slice(expStart, end);
const experiences = [];
const d1 = exp.match(/1\. (Uczeń przynajmniej cztery razy w roku szkolnym .+?)\. 2\. Uczeń/);
if (d1) experiences.push({ code: "D.1", text: d1[1] });
const yr = exp.match(/2\. Uczeń przynajmniej raz w roku szkolnym: (.+?) 3\. Uczeń przynajmniej raz w trakcie/);
for (const it of yr[1].matchAll(/(\d)\) (.+?)(?=(?: \d\) )|$)/g)) experiences.push({ code: `D.2.${it[1]}`, text: `raz w roku: ${clean(it[2])}` });
const st = exp.slice(exp.indexOf("3. Uczeń przynajmniej raz w trakcie etapu edukacyjnego:") + 56);
const projIdx = st.indexOf(" 3) ");
for (const it of st.slice(0, projIdx).matchAll(/(\d)\) (.+?)(?=(?: \d\) )|$)/g)) experiences.push({ code: `D.3.${it[1]}`, text: `raz w etapie: ${clean(it[2])}` });
for (const it of st.slice(projIdx).matchAll(/ ([a-i])\) (.+?)(?=(?: [a-i]\) )|$)/g)) experiences.push({ code: `D.3.3.${it[1]}`, text: `projekt edukacyjny raz w etapie: ${clean(it[2])}` });

const count = areas.reduce((n, a) => n + a.sections.reduce((m, x) => m + x.items.length, 0), 0);
writeFileSync("data/klasy-1-3.json", JSON.stringify({ source: "Dz.U. 2026 poz. 378, załącznik nr 2, I etap edukacyjny", areas, experiences }, null, 1));
console.log(`${areas.length} edukacji, ${count} wymagań, ${experiences.length} doświadczeń`);
for (const a of areas) console.log(a.id, a.name, a.sections.map((x) => `${x.name.slice(0, 18)}:${x.items.length}`).join(" | "));
