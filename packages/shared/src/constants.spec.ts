import assert from "node:assert/strict";
import test from "node:test";
import {
  DOCUMENT_CATEGORIES,
  TASK_STATUS_LABELS,
  USER_ROLE_LABELS
} from "./index";

test("document categories include MVP tax guides and fallback category", () => {
  assert.ok(DOCUMENT_CATEGORIES.includes("Guias de impostos"));
  assert.ok(DOCUMENT_CATEGORIES.includes("Outros"));
});

test("kanban has the five MVP statuses", () => {
  assert.deepEqual(Object.keys(TASK_STATUS_LABELS), [
    "TODO",
    "IN_PROGRESS",
    "WAITING_CLIENT",
    "DONE",
    "CANCELED"
  ]);
});

test("user role labels cover the two MVP roles", () => {
  assert.equal(USER_ROLE_LABELS.ADMIN, "Administrador");
  assert.equal(USER_ROLE_LABELS.COLLABORATOR, "Colaborador");
});
