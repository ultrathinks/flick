import { SectionHeader } from "@/shared/ui";
import { AuditTrail } from "@/widgets/audit-trail";

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="감사 로그" />
      <AuditTrail />
    </div>
  );
}
