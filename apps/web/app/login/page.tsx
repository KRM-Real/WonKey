import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";

export default function LoginPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 md:px-6 xl:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <TopNav />
        <div className="px-5 py-10 xl:px-8 xl:py-14">
          <AuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}
