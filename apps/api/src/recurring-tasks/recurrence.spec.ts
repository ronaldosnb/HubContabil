import assert from "node:assert/strict";
import test from "node:test";
import { calculateNextRunAt } from "./recurrence";

test("daily recurrence advances one day", () => {
  const next = calculateNextRunAt("DAILY", new Date("2026-06-22T10:00:00.000Z"));
  assert.equal(next.toISOString(), "2026-06-23T10:00:00.000Z");
});

test("weekly recurrence advances seven days", () => {
  const next = calculateNextRunAt("WEEKLY", new Date("2026-06-22T10:00:00.000Z"));
  assert.equal(next.toISOString(), "2026-06-29T10:00:00.000Z");
});

test("monthly day recurrence clamps to last day of shorter month", () => {
  const next = calculateNextRunAt("MONTHLY_DAY:31", new Date("2026-01-31T10:00:00.000Z"));
  assert.equal(next.toISOString(), "2026-02-28T10:00:00.000Z");
});

test("invalid recurrence rule throws", () => {
  assert.throws(() => calculateNextRunAt("YEARLY", new Date()), /Regra de recorrência inválida/);
});
