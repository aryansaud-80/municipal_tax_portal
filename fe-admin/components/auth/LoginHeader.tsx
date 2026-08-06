import { Landmark } from 'lucide-react';

export function LoginHeader() {
  return (
    <div className="mb-8">
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-700">
          <Landmark className="h-5 w-5 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Municipal Tax Portal</p>
          <p className="text-xs text-slate-500">Admin Portal</p>
        </div>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Sign in with your administrator credentials to continue.
      </p>
    </div>
  );
}