import type { Metadata } from "next";
import Link from "next/link";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <CenteredPage>
      <div className="panel p-6 text-center sm:p-8">
        <p className="eyebrow">Error 404</p>
        <h1 className="mt-2 text-[24px] font-semibold text-fg">This page doesn&rsquo;t exist</h1>
        <p className="mt-2 text-[14px] text-fg-muted">
          The link may be old, or the page was moved. If you followed a citation, the document may have been deleted.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/dashboard" className={buttonVariants({ variant: "primary" })}>
            Go to your dashboard
          </Link>
          <Link href="/" className={buttonVariants({ variant: "secondary" })}>
            SupportAI home
          </Link>
        </div>
      </div>
    </CenteredPage>
  );
}
