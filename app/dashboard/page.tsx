import { createClient } from "@/lib/supabase/server";
import type { Component, OwnershipTransfer, Profile } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = createClient();

  const [{ data: components }, { data: transfers }, { data: profiles }] =
    await Promise.all([
      supabase.from("components").select("*").returns<Component[]>(),
      supabase
        .from("ownership_transfers")
        .select("*")
        .order("transferred_at", { ascending: false })
        .limit(6)
        .returns<OwnershipTransfer[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
    ]);

  const allComponents = components ?? [];
  const allProfiles = profiles ?? [];
  const nameOf = (id: string | null) =>
    allProfiles.find((p) => p.id === id)?.full_name ||
    allProfiles.find((p) => p.id === id)?.email ||
    "Unassigned";

  const total = allComponents.length;
  const inStock = allComponents.filter((c) => c.status === "in_stock").length;
  const assigned = allComponents.filter((c) => c.status === "assigned").length;
  const retired = allComponents.filter((c) => c.status === "retired").length;

  const byCategory = allComponents.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {});
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...categories.map(([, count]) => count));

  const statCards = [
    { label: "Total components", value: total, color: "bg-brand-500" },
    { label: "In stock", value: inStock, color: "bg-emerald-500" },
    { label: "Assigned", value: assigned, color: "bg-amber-500" },
    { label: "Retired", value: retired, color: "bg-gray-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500">
          Live snapshot of your hardware inventory and its status.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
            <p className="text-3xl font-semibold text-gray-900 mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Components by classification
          </h2>
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">No components yet.</p>
          ) : (
            <div className="space-y-3">
              {categories.map(([category, count]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{category}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent transfers</h2>
          {!transfers || transfers.length === 0 ? (
            <p className="text-sm text-gray-500">No transfers logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {transfers.map((t) => {
                const comp = allComponents.find((c) => c.id === t.component_id);
                return (
                  <li key={t.id} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-gray-900 font-medium">
                      {comp?.name || "Unknown component"}
                    </p>
                    <p className="text-gray-500">
                      {nameOf(t.from_owner_id)} → {nameOf(t.to_owner_id)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(t.transferred_at).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
