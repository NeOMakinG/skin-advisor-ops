import { Badge } from "@/components/ui/badge";
import type { AccountStatus } from "@/schemas/account";

const variants = {
  active: "success",
  frozen: "warning",
  closed: "secondary",
} as const satisfies Record<AccountStatus, string>;

export function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <Badge variant={variants[status]} className="capitalize">
      {status}
    </Badge>
  );
}
