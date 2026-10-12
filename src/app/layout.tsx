import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer, Header, PageWrapper } from "@/components";
import { Provider } from "@/components/ui/provider";

export const metadata: Metadata = {
  title: {
    default: "Kanji",
    template: "%s | Kanji",
  },
  description: "Kanji Dictionary",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <PageWrapper>
            <Header />
            {children}
            <Footer />
          </PageWrapper>
        </Provider>
      </body>
    </html>
  );
}
