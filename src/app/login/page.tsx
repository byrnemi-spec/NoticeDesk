import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  let from = "/";
  if (callbackUrl) {
    try {
      const u = new URL(callbackUrl, "http://localhost");
      from = u.pathname + u.search;
    } catch {}
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">
            Notice<span className="text-indigo-600">Desk</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your firm&apos;s notice inbox</p>
        </div>
        <LoginForm from={from} />
      </div>
    </main>
  );
}
