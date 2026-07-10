import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/** Public marketing layout: sticky header + footer around every public page. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
