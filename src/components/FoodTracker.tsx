"use client";

import { useMemo, useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FoodEntry = {
  id: number;
  date: string;
  name: string;
  proteinGrams: number;
  createdAt: string;
};

const STORAGE_KEY = "protein-tracker:entries-by-date";
const GOAL_STORAGE_KEY = "protein-tracker:daily-goal";

type EntriesByDate = Record<string, FoodEntry[]>;

function getTodayAsISODate() {
  return new Date().toISOString().slice(0, 10);
}

function readEntriesByDate(): EntriesByDate {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as EntriesByDate;
  } catch {
    return {};
  }
}

function writeEntriesByDate(value: EntriesByDate) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function readDailyGoal(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return window.localStorage.getItem(GOAL_STORAGE_KEY) ?? "";
}

function writeDailyGoal(value: string) {
  window.localStorage.setItem(GOAL_STORAGE_KEY, value);
}

export default function FoodTracker() {
  const [date, setDate] = useState<string>(getTodayAsISODate);
  const [storageVersion, setStorageVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState<string>(readDailyGoal);

  const [name, setName] = useState("");
  const [protein, setProtein] = useState("");

  const entries = useMemo(() => {
    void storageVersion;
    const byDate = readEntriesByDate();
    return byDate[date] ?? [];
  }, [date, storageVersion]);

  function handleSubmit(event: FormEvent) {
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

    const newEntry: FoodEntry = {
      id: Date.now(),
      date,
      name: name.trim(),
      proteinGrams: Math.round(proteinNumber),
      createdAt: new Date().toISOString(),
    };

    const byDate = readEntriesByDate();
    const updated = [...(byDate[date] ?? []), newEntry];
    byDate[date] = updated;
    writeEntriesByDate(byDate);

    setStorageVersion((value) => value + 1);
    setName("");
    setProtein("");
  }

  function handleDelete(id: number) {
    const ok = window.confirm("Удалить запись из списка?");
    if (!ok) return;

    const byDate = readEntriesByDate();
    const updated = (byDate[date] ?? []).filter((entry) => entry.id !== id);
    byDate[date] = updated;
    writeEntriesByDate(byDate);

    setStorageVersion((value) => value + 1);
    setError(null);
  }

  const totalProtein = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.proteinGrams, 0),
    [entries]
  );
  const dailyGoalValue = Number(dailyGoal.replace(",", "."));
  const hasDailyGoal = dailyGoal.trim() !== "" && Number.isFinite(dailyGoalValue) && dailyGoalValue >= 0;
  const goalDiff = hasDailyGoal ? Math.round((totalProtein - dailyGoalValue) * 10) / 10 : 0;

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
            Ежедневная цель, г
          </label>
          <Input
            type="number"
            min={0}
            step="1"
            inputMode="decimal"
            value={dailyGoal}
            onChange={(e) => {
              setDailyGoal(e.target.value);
              writeDailyGoal(e.target.value);
            }}
            className="max-w-xs"
            placeholder="Например, 130"
          />
        </div>
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
            {hasDailyGoal && (
              <span className="ml-2">
                ({goalDiff >= 0 ? "+" : ""}
                {goalDiff} г к цели)
              </span>
            )}
          </div>
          <Button type="submit">Добавить блюдо</Button>
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
        {entries.length === 0 ? (
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

