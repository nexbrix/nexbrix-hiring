import { redirect } from "next/navigation";

/**
 * The public /jobs listing page is not available.
 * Candidates access job applications only via the direct link:
 *   /jobs/[jobId]/apply
 *
 * This route is reserved for hiring managers who are redirected
 * to the dashboard instead.
 */
export default function JobsPage() {
  redirect("/dashboard");
}
