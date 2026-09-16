import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Component, Profile } from "@/lib/types";

const statusStyles: Record<string, string> = {
  in_stock: "bg-emerald-100 text-emerald-700",
  assigned: "bg-amber-100 text-amber-700",
  retired: "bg-gray-100 text-gray-600",
};

export default async function ComponentsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string };
}) {
  const supabase = createClient();

  const { data: authData } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user!.id)
    .single();
  const isAdmin = me?.role === "admin";

  let query = supabase.from("components").select("*").order("created_at", { ascending: false });
  if (searchParams.category) query = query.eq("category", searchParams.category);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const [{ data: components }, { data: allComponents }, { data: profiles }] =
    await Promise.all([
      query.returns<Component[]>(),
      supabase.from("components").select("category").returns<{ category: string }[]>(),
      supabase.from("profiles").select("*").returns<Profile[]>(),
    ]);

  const categories = Array.from(
    new Set((allComponents ?? []).map((c) => c.category))
  ).sort();

  const nameOf = (id: string | null) => {
    if (!id) return "—";
    const p = (profiles ?? []).find((p) => p.id === id);
    return p?.full_name || p?.email || "—";
  };

  const buildHref = (params: { category?: string; status?: string }) => {
    const merged = {
      category: params.category ?? searchParams.category,
      status: params.status ?? searchParams.status,
    };
    const usp = new URLSearchParams();
    if (merged.category) usp.set("category", merged.category);
    if (merged.status) usp.set("status", merged.status);
    const qs = usp.toString();
    return `/dashboard/components${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Components</h1>
          <p className="text-sm text-gray-500">
            All hardware components and their current status.
          </p>
        </div>
        {isAdmin && (
          <Link href="/dashboard/components/new" className="btn-primary">
            + Add component
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={buildHref({ category: undefined })}
          className={`badge ${!searchParams.category ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={buildHref({ category: c })}
            className={`badge ${searchParams.category === c ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600"}`}
          >
            {c}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Serial</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(components ?? []).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/components/${c.id}`}
                    className="font-medium text-brand-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.category}</td>
                <td className="px-4 py-3 text-gray-500">
                  {c.serial_number || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${statusStyles[c.status]}`}>
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {nameOf(c.current_owner_id)}
                </td>
              </tr>
            ))}
            {(components ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No components match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
