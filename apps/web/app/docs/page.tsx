import { FileText, LifeBuoy, ShieldCheck } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { Card, CardContent } from "@/components/ui/card";

export default function DocsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1440px] px-4 py-5 md:px-6 xl:px-8">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <TopNav />
        <div className="space-y-6 px-5 py-8 xl:px-8">
          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-900 md:text-5xl">Docs</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-500 md:text-base">
              API documentation placeholder. Link your public docs site here or render internal docs pages.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Authentication", icon: ShieldCheck, body: "Document API key auth, scopes, and environment strategy." },
              { title: "SDK Guides", icon: FileText, body: "Add quickstarts for Node, Python, and edge runtimes." },
              { title: "Support", icon: LifeBuoy, body: "Capture error handling, support channels, and operational runbooks." },
            ].map((item) => (
              <Card key={item.title}>
                <CardContent className="space-y-4 p-6">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{item.body}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
