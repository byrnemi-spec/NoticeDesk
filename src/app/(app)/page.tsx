import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        Upcoming deadlines across all clients — coming in Prompt 8.
      </div>
    </>
  );
}
