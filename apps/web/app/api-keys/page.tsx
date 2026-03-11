import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default function ApiKeysPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 md:px-6 xl:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <TopNav />
        <div className="space-y-6 px-5 py-8 xl:px-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-900 md:text-5xl">API Keys</h1>
            <p className="mt-3 text-sm text-slate-500 md:text-base">
              Select a project to create, rotate, and revoke credentials.
            </p>
          </div>

          <Card>
            <CardHeader className="border-b border-slate-100 pb-5">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <CardTitle>Open a project key dashboard</CardTitle>
              <CardDescription>
                API keys are managed at the project level so each environment can have isolated credentials.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Link href="/projects" className={buttonVariants({ variant: "default" })}>
                Go to projects
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
