import { CircleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function QueryError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Card className="items-center py-10 text-center" role="alert">
      <CircleAlertIcon className="size-8 text-destructive" aria-hidden="true" />
      <CardTitle>{title}</CardTitle>
      <CardDescription>{message}</CardDescription>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </Card>
  );
}
