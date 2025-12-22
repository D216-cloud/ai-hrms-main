// Minimal server component for /blog
export const metadata = {
  title: 'Blog',
  description: 'Blog listing',
};

export default function BlogPage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">Blog</h1>
      <p className="mt-4">Blog posts will appear here.</p>
    </main>
  );
}
