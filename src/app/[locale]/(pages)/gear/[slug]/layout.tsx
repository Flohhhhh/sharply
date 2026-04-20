export default function GearLayout({
  children,
  edit,
}: {
  children: React.ReactNode;
  edit: React.ReactNode;
}) {
  return (
    <>
      {children}
      {edit}
    </>
  );
}
