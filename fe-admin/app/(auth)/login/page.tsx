import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { LoginHeader } from "@/components/auth/LoginHeader";
import { LoginIllustration } from "@/components/auth/LoginIllustration";
import { SecurityInfo } from "@/components/auth/SecurityInfo";

export const metadata: Metadata = {
  title: "Sign In — Municipal Tax Portal",
  description: "Administrator sign in for the Municipal Tax Portal.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-[#F8FAFC]">
      {/* Left panel — 45%, hidden below lg */}
      <div className="hidden lg:block lg:w-[45%]">
        <LoginIllustration />
      </div>

      {/* Right panel — 55% */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-[55%] lg:px-16">
        <div className="w-full max-w-[420px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.06)] sm:p-10">
            <LoginHeader />
            <LoginForm />
            <SecurityInfo />
          </div>

          <p className="mt-6 text-center text-xs text-slate-400 lg:hidden">
            © {new Date().getFullYear()} Municipal Tax Portal. All rights
            reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
