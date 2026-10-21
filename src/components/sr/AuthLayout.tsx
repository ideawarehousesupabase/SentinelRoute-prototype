import { Logo, PrototypeBanner } from "./primitives";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-hero p-10 text-navy-foreground md:flex">
        <Logo light />
        <div>
          <h2 className="text-3xl font-semibold">
            Structured custody records for high-consequence deliveries.
          </h2>
          <p className="mt-3 text-navy-muted">
            Smart seals · mobile capture · chained ledger · anomaly review
          </p>
        </div>
        <p className="text-xs text-navy-muted">
          Prototype demonstration — not independently verified.
        </p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 md:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <PrototypeBanner className="my-5" />
          {children}
        </div>
      </div>
    </div>
  );
}
