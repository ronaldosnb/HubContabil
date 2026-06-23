import type { DashboardSummary } from "@hubcontabil/shared";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  try {
    const response = await fetch(`${apiUrl}/dashboard/summary`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}
