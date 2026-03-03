import { AuthForm } from "@/components/auth-form";
import { TopNav } from "@/components/top-nav";

export default function SignupPage() {
  return (
    <>
      <TopNav />
      <main>
        <AuthForm mode="signup" />
      </main>
    </>
  );
}
