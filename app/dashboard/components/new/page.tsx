import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function createComponent(formData: FormData) {
  "use server";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const serial_number = String(formData.get("serial_number") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!name || !category) return;

  await supabase.from("components").insert({
    name,
    category,
    serial_number,
    notes,
    created_by: user.id,
  });

  redirect("/dashboard/components");
}

export default function NewComponentPage() {
  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Add component</h1>
      <p className="text-sm text-gray-500 mb-6">
        Register a new hardware unit into the inventory.
      </p>

      <form action={createComponent} className="card p-6 space-y-4">
        <div>
          <label className="label">Name</label>
          <input name="name" className="input" required placeholder="Dell Latitude 5420" />
        </div>
        <div>
          <label className="label">Category / classification</label>
          <input
            name="category"
            className="input"
            required
            placeholder="Laptop, Monitor, Server, Networking..."
            list="category-suggestions"
          />
          <datalist id="category-suggestions">
            <option value="Laptop" />
            <option value="Desktop" />
            <option value="Monitor" />
            <option value="Server" />
            <option value="Networking" />
            <option value="Peripheral" />
            <option value="Mobile Device" />
          </datalist>
        </div>
        <div>
          <label className="label">Serial number (optional)</label>
          <input name="serial_number" className="input" placeholder="SN-00123" />
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea name="notes" className="input" rows={3} />
        </div>

        <button type="submit" className="btn-primary w-full">
          Save component
        </button>
      </form>
    </div>
  );
}
