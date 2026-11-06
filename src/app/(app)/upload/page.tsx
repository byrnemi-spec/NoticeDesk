import { PageHeader } from "@/components/page-header";

export default function UploadnoticePage() {
  return (
    <>
      <PageHeader title="Upload notice" />
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        Upload a PDF or photo of an IRS notice — coming in Prompt 4.
      </div>
    </>
  );
}
