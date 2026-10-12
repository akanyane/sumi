import type { ReactNode } from "react";

const PageWrapper = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    {children}
  </div>
);

export default PageWrapper;
