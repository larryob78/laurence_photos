// ============================================================
// THINK IT. SEE IT. — AI Client (browser-side)
// ============================================================

import type { StrategicExtraction } from "./types";

async function post<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed: ${res.status} — ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function analyzeInput(text: string): Promise<StrategicExtraction> {
  return post<StrategicExtraction>("/api/analyze", { text });
}
