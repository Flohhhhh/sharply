import { Header } from "~/components/header";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      {children}
    </div>
  );
}
