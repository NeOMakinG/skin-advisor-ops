import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { users } from "@/data/users";
import { UserId } from "@/lib/ids";
import { session, useViewerId } from "@/lib/session";

export function ViewerSelect() {
  const viewerId = useViewerId();
  const queryClient = useQueryClient();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="viewer" className="hidden text-muted-foreground sm:flex">
        Signed in as
      </Label>
      <Select
        value={viewerId}
        onValueChange={(value) => {
          session.setViewerId(UserId.parse(value));
          void queryClient.invalidateQueries();
        }}
      >
        <SelectTrigger
          id="viewer"
          size="sm"
          className="max-w-44 sm:min-w-44 sm:max-w-none [&>span]:truncate"
          aria-label="Signed in as"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name}
              <span className="hidden text-muted-foreground sm:inline">({user.role})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
