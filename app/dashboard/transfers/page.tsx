import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Component, OwnershipTransfer, Profile } from "@/lib/types";

export default async function TransfersPage() {
  const supabase = createClient();

  const [{ data: transfers }, { data: components }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("ownership_transfers")
        .select("*")
        .order("transferred_at", { ascending: false })
        .returns<OwnershipTransfer[]>(),
      supabase.from("components").select("*").returns<Component[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
    ]);

  const nameOf = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = (profiles ?? []).find((p) => p.id === id);
    return p?.full_name || p?.email || "Unknown";
  };
  const componentOf = (id: string) => (components ?? []).find((c) => c.id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Transfer history</h1>
        <p className="text-sm text-gray-500">
          Full audit trail of who owned what, and when it changed hands.
        </p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Component</th>
              <th className="px-4 py-3 font-medium">From</th>
              <th className="px-4 py-3 font-medium">To</th>
              <th className="px-4 py-3 font-medium">Authorized by</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(transfers ?? []).map((t) => {
              const comp = componentOf(t.component_id);
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/components/${t.component_id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {comp?.name || "Deleted component"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{nameOf(t.from_owner_id)}</td>
                  <td className="px-4 py-3 text-gray-600">{nameOf(t.to_owner_id)}</td>
                  <td className="px-4 py-3 text-gray-600">{nameOf(t.transferred_by)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(t.transferred_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {(transfers ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No ownership transfers logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
