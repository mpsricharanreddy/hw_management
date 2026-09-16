import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Component, OwnershipTransfer, Profile } from "@/lib/types";

const statusStyles: Record<string, string> = {
  in_stock: "bg-emerald-100 text-emerald-700",
  assigned: "bg-amber-100 text-amber-700",
  retired: "bg-gray-100 text-gray-600",
};

async function transferOwnership(formData: FormData) {
  "use server";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const componentId = String(formData.get("component_id"));
  const toOwnerRaw = String(formData.get("to_owner_id") || "");
  const toOwnerId = toOwnerRaw === "" ? null : toOwnerRaw;
  const notes = String(formData.get("notes") || "").trim() || null;

  const { data: component } = await supabase
    .from("components")
    .select("*")
    .eq("id", componentId)
    .single();
  if (!component) return;

  await supabase.from("ownership_transfers").insert({
    component_id: componentId,
    from_owner_id: component.current_owner_id,
    to_owner_id: toOwnerId,
    transferred_by: user.id,
    notes,
  });

  await supabase
    .from("components")
    .update({
      current_owner_id: toOwnerId,
      status: toOwnerId ? "assigned" : "in_stock",
    })
    .eq("id", componentId);

  redirect(`/dashboard/components/${componentId}`);
}

async function updateStatus(formData: FormData) {
  "use server";
  const supabase = createClient();
  const componentId = String(formData.get("component_id"));
  const status = String(formData.get("status"));
  await supabase.from("components").update({ status }).eq("id", componentId);
  redirect(`/dashboard/components/${componentId}`);
}

export default async function ComponentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = me?.role === "admin";

  const [{ data: component }, { data: transfers }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("components")
        .select("*")
        .eq("id", params.id)
        .single<Component>(),
      supabase
        .from("ownership_transfers")
        .select("*")
        .eq("component_id", params.id)
        .order("transferred_at", { ascending: false })
        .returns<OwnershipTransfer[]>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("status", "approved")
        .returns<Profile[]>(),
    ]);

  if (!component) notFound();

  const nameOf = (id: string | null) => {
    if (!id) return "Unassigned";
    const p = (profiles ?? []).find((p) => p.id === id);
    return p?.full_name || p?.email || "Unknown";
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{component.name}</h1>
        <p className="text-sm text-gray-500">
          {component.category}
          {component.serial_number ? ` · SN ${component.serial_number}` : ""}
        </p>
      </div>

      <div className="card p-5 grid sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <span className={`badge ${statusStyles[component.status]}`}>
            {component.status.replace("_", " ")}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Current owner</p>
          <p className="text-sm font-medium text-gray-900">
            {nameOf(component.current_owner_id)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Added</p>
          <p className="text-sm text-gray-700">
            {new Date(component.created_at).toLocaleDateString()}
          </p>
        </div>
        {component.notes && (
          <div className="sm:col-span-3">
            <p className="text-xs text-gray-500 mb-1">Notes</p>
            <p className="text-sm text-gray-700">{component.notes}</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Transfer ownership</h2>
            <form action={transferOwnership} className="space-y-3">
              <input type="hidden" name="component_id" value={component.id} />
              <div>
                <label className="label">Assign to</label>
                <select name="to_owner_id" className="input" defaultValue="">
                  <option value="">Unassigned (return to stock)</option>
                  {(profiles ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea name="notes" className="input" rows={2} />
              </div>
              <button type="submit" className="btn-primary w-full">
                Log transfer
              </button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Update status</h2>
            <form action={updateStatus} className="space-y-3">
              <input type="hidden" name="component_id" value={component.id} />
              <select name="status" className="input" defaultValue={component.status}>
                <option value="in_stock">In stock</option>
                <option value="assigned">Assigned</option>
                <option value="retired">Retired</option>
              </select>
              <button type="submit" className="btn-secondary w-full">
                Save status
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Ownership history</h2>
        {(transfers ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">No transfers recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {(transfers ?? []).map((t) => (
              <li key={t.id} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                <p className="text-gray-900">
                  {nameOf(t.from_owner_id)} → {nameOf(t.to_owner_id)}
                </p>
                {t.notes && <p className="text-gray-500">{t.notes}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(t.transferred_at).toLocaleString()} · by{" "}
                  {nameOf(t.transferred_by)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
