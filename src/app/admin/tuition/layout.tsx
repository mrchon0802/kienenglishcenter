import { Suspense } from "react";
import { TuitionTabs } from "./_components/TuitionTabs";

export default function TuitionLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Suspense fallback={<div style={{ minHeight: 44 }} aria-hidden="true" />}>
        <TuitionTabs />
      </Suspense>
      {children}
    </>
  );
}
