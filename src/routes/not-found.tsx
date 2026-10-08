import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CompassIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function NotFoundPage() {
  return (
    <Card className="items-center py-12 text-center">
      <CompassIcon className="size-8 text-muted-foreground" aria-hidden="true" />
      <CardTitle>Page not found</CardTitle>
      <CardDescription>That link does not point anywhere in this prototype.</CardDescription>
      <Button asChild variant="outline">
        <Link to="/">
          <ArrowLeftIcon />
          Back to overview
        </Link>
      </Button>
    </Card>
  );
}
