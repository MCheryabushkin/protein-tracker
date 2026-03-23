"use server"

import { prisma } from "../../lib/prisma";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function getFoodEntriesForDate(date: string) {
  if (!date) {
    return { ok: false, error: "Date is required" } as ActionResult<never>;
  }

  try {
    const entries = await prisma.foodEntry.findMany({
      where: { date },
      orderBy: { createdAt: "asc" },
    });

    return { ok: true, data: entries } as ActionResult<typeof entries>;
  } catch {
    return {
      ok: false,
      error:
        "Не удалось получить данные из базы. Проверьте DATABASE_URL и доступность PostgreSQL.",
    } as ActionResult<never>;
  }
}

export async function addFoodEntry(
  date: string,
  name: string,
  proteinGrams: number
) {
  if (!date) {
    return { ok: false, error: "Date is required" } as ActionResult<never>;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    return {
      ok: false,
      error: "Название блюда не может быть пустым",
    } as ActionResult<never>;
  }

  if (!Number.isFinite(proteinGrams) || proteinGrams < 0) {
    return {
      ok: false,
      error: "Количество белка должно быть неотрицательным числом",
    } as ActionResult<never>;
  }

  const roundedProtein = Math.round(proteinGrams);

  try {
    const entry = await prisma.foodEntry.create({
      data: {
        date,
        name: trimmedName,
        proteinGrams: roundedProtein,
      },
    });

    return { ok: true, data: entry } as ActionResult<typeof entry>;
  } catch {
    return {
      ok: false,
      error:
        "Не удалось сохранить запись в базе. Проверьте DATABASE_URL и доступность PostgreSQL.",
    } as ActionResult<never>;
  }
}

export async function deleteFoodEntry(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "Некорректный id записи" } as ActionResult<never>;
  }

  try {
    await prisma.foodEntry.delete({
      where: { id: Math.trunc(id) },
    });

    return { ok: true, data: null } as ActionResult<null>;
  } catch {
    return {
      ok: false,
      error:
        "Не удалось удалить запись из базы. Проверьте DATABASE_URL и доступность PostgreSQL.",
    } as ActionResult<never>;
  }
}

