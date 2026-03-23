"use server"

import { prisma } from "../../lib/prisma";

export async function getFoodEntriesForDate(date: string) {
  if (!date) {
    throw new Error("Date is required");
  }

  const entries = await prisma.foodEntry.findMany({
    where: { date },
    orderBy: { createdAt: "asc" },
  });

  return entries;
}

export async function addFoodEntry(
  date: string,
  name: string,
  proteinGrams: number
) {
  if (!date) {
    throw new Error("Date is required");
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Название блюда не может быть пустым");
  }

  if (!Number.isFinite(proteinGrams) || proteinGrams < 0) {
    throw new Error("Количество белка должно быть неотрицательным числом");
  }

  const roundedProtein = Math.round(proteinGrams);

  const entry = await prisma.foodEntry.create({
    data: {
      date,
      name: trimmedName,
      proteinGrams: roundedProtein,
    },
  });

  return entry;
}

export async function deleteFoodEntry(id: number) {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Некорректный id записи");
  }

  await prisma.foodEntry.delete({
    where: { id: Math.trunc(id) },
  });
}

