import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";

export default function LoginPage() {
  return (
    <main>
      <section className="app-shell">
        <TopNav />
        <div className="dashboard-main">
          <AuthForm mode="login" />
        </div>
      </section>
    </main>
  );
}
