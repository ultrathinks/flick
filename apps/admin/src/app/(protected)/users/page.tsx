import { SectionHeader } from "@/shared/ui";
import { UserDirectory } from "@/widgets/user-directory";

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="사용자" />
      <UserDirectory />
    </div>
  );
}
