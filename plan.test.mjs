import { test } from "node:test";
import assert from "node:assert/strict";
import { normalise, makePlan } from "./api/plan.js";

test("school plans keep only grade 1–3 codes, with official wording", () => {
  const r = normalise({ podstawa: [{ code: "5.1.f", why: "dodawanie" }, { code: "4.5", why: "preschool code" }, { code: "D.3.3.g", why: "projekt" }, { code: "5.1.f", why: "dup" }] }, "sch");
  assert.deepEqual(r.podstawa.map((c) => c.code), ["5.1.f", "D.3.3.g"]);
  assert.match(r.podstawa[0].text, /dodaje liczby/);
  assert.match(r.podstawa[0].area, /Edukacja matematyczna, liczby/);
});

test("preschool plans keep only preschool codes", () => {
  const r = normalise({ podstawa: [{ code: "4.5", why: "a" }, { code: "5.1.f", why: "b" }] }, "pre");
  assert.deepEqual(r.podstawa.map((c) => c.code), ["4.5"]);
});

test("minutes are totalled and cleaned", () => {
  const r = normalise({ przebieg: [{ etap: "Wstęp", minuty: 5.4 }, { etap: "Praca", minuty: "30" }, { etap: "", minuty: 99 }, { etap: "Koniec", minuty: -3 }] }, "sch");
  assert.equal(r.przebieg.length, 3);
  assert.equal(r.minuty_razem, 35);
});

test("topic is required", async () => {
  const r = await makePlan({ topic: "" });
  assert.equal(r.status, 400);
});
