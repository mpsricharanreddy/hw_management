import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  if (!profile || profile.status !== "approved") {
    redirect("/pending-approval");
  }

  const isAdmin = profile.role === "admin";

  const navLinks = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/components", label: "Components" },
    { href: "/dashboard/transfers", label: "Transfer history" },
    ...(isAdmin ? [{ href: "/dashboard/admin/users", label: "Users" }] : []),
  ];

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-gray-200 bg-white p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-brand-500 text-white flex items-center justify-center text-sm font-bold">
            HW
          </div>
          <span className="font-semibold text-gray-900">HW Manager</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-sm font-medium text-gray-900 truncate">
            {profile.full_name || profile.email}
          </p>
          <p className="text-xs text-gray-500 mb-3 capitalize">{profile.role}</p>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}
