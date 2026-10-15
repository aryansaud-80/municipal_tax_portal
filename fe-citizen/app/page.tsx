import { Landmark, Building2, Wallet, FileText, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Register Properties",
    description: "Register and manage your property records with the municipality.",
  },
  {
    icon: Wallet,
    title: "Pay Taxes Online",
    description: "Pay property, house rent, business and land taxes securely via Khalti or eSewa.",
  },
  {
    icon: FileText,
    title: "Download Receipts",
    description: "Access and download official tax payment receipts anytime.",
  },
  {
    icon: ShieldCheck,
    title: "Track Your Dues",
    description: "Monitor outstanding balances and assessment history in one place.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Municipal Tax Portal</span>
          </div>
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost">
              Sign in
            </LinkButton>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
          Citizen e-Governance
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Pay your municipal taxes online, anytime
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          A simple, secure portal to view property tax assessments, pay taxes
          and download receipts — without visiting the municipal office.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/login" size="lg">
            Get started
          </LinkButton>
          <LinkButton href="/login" size="lg" variant="outline">
            Sign in
          </LinkButton>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Log in with the credentials issued to you by your municipal office.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Landmark className="h-4 w-4" />
            Municipal Tax Portal — a B.Sc. CSIT e-Governance project
          </p>
          <p>Aligned with the Local Government Operation Act, 2074 (Nepal)</p>
        </div>
      </footer>
    </main>
  );
}
