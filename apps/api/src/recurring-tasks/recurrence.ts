import { BadRequestException } from "@nestjs/common";

export function assertRecurrenceRule(rule: string) {
  if (["DAILY", "WEEKLY", "MONTHLY"].includes(rule)) {
    return;
  }

  if (/^MONTHLY_DAY:([1-9]|[12][0-9]|3[01])$/.test(rule)) {
    return;
  }

  throw new BadRequestException("Regra de recorrência inválida.");
}

export function calculateNextRunAt(rule: string, fromDate = new Date()) {
  assertRecurrenceRule(rule);

  const next = new Date(fromDate);

  if (rule === "DAILY") {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (rule === "WEEKLY") {
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (rule === "MONTHLY") {
    return addMonthsClamped(fromDate, fromDate.getDate());
  }

  const day = Number(rule.split(":")[1]);
  return addMonthsClamped(fromDate, day);
}

function addMonthsClamped(fromDate: Date, preferredDay: number) {
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth() + 1;
  const target = new Date(fromDate);
  target.setFullYear(year, month, 1);
  target.setDate(Math.min(preferredDay, daysInMonth(target.getFullYear(), target.getMonth())));
  return target;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
