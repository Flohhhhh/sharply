export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pt-24 sm:px-6">
      {children}
    </div>
  );
}
