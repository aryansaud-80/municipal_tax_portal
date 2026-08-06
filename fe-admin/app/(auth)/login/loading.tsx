export default function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6">
      <div className="w-full max-w-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white p-10">
        <div className="mb-8 space-y-2">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="h-4 w-56 rounded bg-slate-100" />
        </div>
        <div className="space-y-5">
          <div className="h-11 rounded-lg bg-slate-100" />
          <div className="h-11 rounded-lg bg-slate-100" />
          <div className="h-11 rounded-lg bg-slate-200" />
        </div>
      </div>
    </main>
  );
}