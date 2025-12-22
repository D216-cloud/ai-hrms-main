// Minimal server component for /pricing
export const metadata = {
  title: 'Pricing',
  description: 'Pricing page',
};

export default function PricingPage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Pricing</h1>
      <p className="mt-4">Pricing information will be published here.</p>
    </main>
  );
}
