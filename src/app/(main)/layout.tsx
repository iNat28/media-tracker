import { Navbar } from "@/components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="py-8">
        {children}
      </div>
    </div>
  );
}
