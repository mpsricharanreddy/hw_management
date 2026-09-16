import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function PendingApprovalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If already approved, don't strand them here
  if (profile?.status === "approved") redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
          ⏳
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          {profile?.status === "rejected" ? "Access denied" : "Awaiting approval"}
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {profile?.status === "rejected"
            ? "An admin has denied this account. Contact your administrator if you think this is a mistake."
            : "Your account is pending admin approval. You'll be able to access the dashboard once approved."}
        </p>
        <SignOutButton />
      </div>
    </main>
  );
}
