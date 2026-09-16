import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl font-bold">
            HW
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Hardware Management System
          </h1>
          <p className="text-gray-600 mb-8">
            Track every hardware component, its classification, and its full
            ownership history — with admin-approved access for your team.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Log in
            </Link>
            <Link href="/signup" className="btn-secondary">
              Create an account
            </Link>
          </div>
        </div>
      </div>
      <footer className="text-center text-xs text-gray-400 py-4">
        New accounts require admin approval before they can access the dashboard.
      </footer>
    </main>
  );
}
