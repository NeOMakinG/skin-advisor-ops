import { Badge } from "@/components/ui/badge";
import { type Outcome, outcomeLabel } from "@/schemas/session";

const variant: Record<Outcome, "success" | "secondary" | "outline" | "destructive" | "warning"> = {
  purchased: "success",
  clicked: "secondary",
  recommended: "outline",
  abandoned: "warning",
  failed: "destructive",
};

export function OutcomeBadge({ outcome }: { outcome: Outcome }) {
  return <Badge variant={variant[outcome]}>{outcomeLabel[outcome]}</Badge>;
}
