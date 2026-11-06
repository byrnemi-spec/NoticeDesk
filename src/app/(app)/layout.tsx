import { signOut } from "@/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const firm = await db.firm.findUnique({ where: { id: user.firmId }, select: { name: true } });

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <div className="mb-8 px-3">
          <div className="text-lg font-semibold text-slate-900">
            Notice<span className="text-indigo-600">Desk</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{firm?.name}</div>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-slate-200 px-3 pt-4">
          <div className="truncate text-sm font-medium text-slate-900">{user.name}</div>
          <div className="truncate text-xs text-slate-500">{user.email}</div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="mt-3 text-sm text-slate-600 hover:text-indigo-600">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
