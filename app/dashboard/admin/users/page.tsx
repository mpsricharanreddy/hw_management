import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (!me || me.role !== "admin" || me.status !== "approved") {
    redirect("/dashboard");
  }
  return supabase;
}

async function setStatus(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const userId = String(formData.get("user_id"));
  const status = String(formData.get("status"));
  await supabase.from("profiles").update({ status }).eq("id", userId);
  redirect("/dashboard/admin/users");
}

async function setRole(formData: FormData) {
  "use server";
  const supabase = await requireAdmin();
  const userId = String(formData.get("user_id"));
  const role = String(formData.get("role"));
  await supabase.from("profiles").update({ role }).eq("id", userId);
  redirect("/dashboard/admin/users");
}

async function inviteUser(formData: FormData) {
  "use server";
  await requireAdmin();

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  if (!email) return;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName || email },
  });

  if (!error && data?.user) {
    // Admin-initiated invites are auto-approved as regular users.
    await admin
      .from("profiles")
      .update({ status: "approved", full_name: fullName || email })
      .eq("id", data.user.id);
  }

  redirect("/dashboard/admin/users");
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function AdminUsersPage() {
  const supabase = await requireAdmin();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  const pending = (profiles ?? []).filter((p) => p.status === "pending");
  const others = (profiles ?? []).filter((p) => p.status !== "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">
          Approve new signups, manage roles, or invite someone directly.
        </p>
      </div>

      <div className="card p-5 max-w-lg">
        <h2 className="font-semibold text-gray-900 mb-3">Invite a user</h2>
        <form action={inviteUser} className="space-y-3">
          <div>
            <label className="label">Full name</label>
            <input name="full_name" className="input" placeholder="Jane Doe" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" placeholder="jane@company.com" />
          </div>
          <button type="submit" className="btn-primary w-full">
            Send invite
          </button>
        </form>
      </div>

      {pending.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">
            Pending approval ({pending.length})
          </h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.full_name || "—"}</p>
                      <p className="text-gray-500 text-xs">{p.email}</p>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <form action={setStatus} className="inline">
                        <input type="hidden" name="user_id" value={p.id} />
                        <input type="hidden" name="status" value="approved" />
                        <button className="btn-primary">Approve</button>
                      </form>
                      <form action={setStatus} className="inline">
                        <input type="hidden" name="user_id" value={p.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="btn-secondary">Reject</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">All users</h2>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {others.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-gray-900">{p.full_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{p.role}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusStyles[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <form action={setRole} className="inline">
                      <input type="hidden" name="user_id" value={p.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={p.role === "admin" ? "user" : "admin"}
                      />
                      <button className="btn-secondary">
                        {p.role === "admin" ? "Make user" : "Make admin"}
                      </button>
                    </form>
                    {p.status === "approved" && (
                      <form action={setStatus} className="inline">
                        <input type="hidden" name="user_id" value={p.id} />
                        <input type="hidden" name="status" value="rejected" />
                        <button className="btn-secondary">Revoke</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {others.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No other users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
