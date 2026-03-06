import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";

export default function SignupPage() {
  return (
    <main>
      <section className="app-shell">
        <TopNav />
        <div className="dashboard-main">
          <AuthForm mode="signup" />
        </div>
      </section>
    </main>
  );
}
