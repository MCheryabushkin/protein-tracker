"use client";

import { useEffect, useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addFoodEntry,
  deleteFoodEntry,
  getFoodEntriesForDate,
} from "@/app/actions";

type FoodEntry = {
  id: number;
  date: string;
  name: string;
  proteinGrams: number;
  createdAt: Date;
};

function getTodayAsISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function FoodTracker() {
  const [date, setDate] = useState<string>(getTodayAsISODate);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getFoodEntriesForDate(date);
        if (!isCancelled) {
          if (result.ok) {
            setEntries(result.data);
          } else {
            setEntries([]);
            setError(result.error);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isCancelled = true;
    };
  }, [date]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const proteinNumber = Number(protein.replace(",", "."));

    if (!name.trim()) {
      setError("Введите название блюда");
      return;
    }

    if (!Number.isFinite(proteinNumber) || proteinNumber < 0) {
      setError("Введите корректное количество белка");
      return;
    }

    setIsSubmitting(true);
    try {
      const addResult = await addFoodEntry(date, name, proteinNumber);
      if (!addResult.ok) {
        setError(addResult.error);
        return;
      }

      const updated = await getFoodEntriesForDate(date);
      if (!updated.ok) {
        setError(updated.error);
        return;
      }

      setEntries(updated.data);
      setName("");
      setProtein("");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm("Удалить запись из списка?");
    if (!ok) return;

    setError(null);
    const removeResult = await deleteFoodEntry(id);
    if (!removeResult.ok) {
      setError(removeResult.error);
      return;
    }

    const updated = await getFoodEntriesForDate(date);
    if (!updated.ok) {
      setError(updated.error);
      return;
    }
    setEntries(updated.data);
  }

  const totalProtein = entries.reduce(
    (sum, entry) => sum + entry.proteinGrams,
    0
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Трекер белка по дням
        </h1>
        <p className="text-sm text-muted-foreground">
          Выберите день, добавляйте блюда и их содержание белка.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-foreground">
            День
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Название блюда
            </label>
            <Input
              placeholder="Например, куриная грудка"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="w-full max-w-[180px] space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Белок, г
            </label>
            <Input
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            За выбранный день:{" "}
            <span className="font-medium text-foreground">
              {totalProtein} г белка
            </span>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Сохранение..." : "Добавить блюдо"}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Список блюд за день
        </h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Загрузка записей...
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            На этот день пока нет записей.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-foreground">
                    {entry.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {entry.proteinGrams} г белка
                  </span>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="xs"
                  onClick={() => void handleDelete(entry.id)}
                >
                  Удалить
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

