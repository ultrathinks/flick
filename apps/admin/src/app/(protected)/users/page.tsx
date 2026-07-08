import { Page } from "@/shared/ui";
import { UserDirectory } from "@/widgets/user-directory";

export default function UsersPage() {
  return (
    <Page title="사용자">
      <UserDirectory />
    </Page>
  );
}
