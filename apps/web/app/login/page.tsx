import { AuthCard } from "@/components/auth-card";
import { TopNav } from "@/components/top-nav";

export default function LoginPage() {
  return (
    <>
      <TopNav />
      <main>
        <section style={{ marginBottom: 16 }}>
          <h1 style={{ marginBottom: 8 }}>Account Access</h1>
          <p className="muted" style={{ marginTop: 0 }}>
            Supabase auth scaffold for Sprint 6A.
          </p>
        </section>
        <AuthCard />
      </main>
    </>
  );
}
