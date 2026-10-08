import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTRPC } from "@/lib/trpc";
import { editAccessHint } from "@/proofs/can-edit-account";
import { type Account, AccountPatch } from "@/schemas/account";
import type { User } from "@/schemas/user";

export function EditAccountDialog({ account, viewer }: { account: Account; viewer: User }) {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const update = useMutation(
    trpc.accounts.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.accounts.pathKey() });
        setOpen(false);
      },
    }),
  );

  const form = useForm({
    defaultValues: { name: account.name, creditLimit: account.creditLimit } as AccountPatch,
    validators: { onChange: AccountPatch },
    onSubmit: ({ value }) => update.mutateAsync({ accountId: account.id, patch: value }),
  });

  // UI hint only. The real check is the gdp-ts proof demanded by the mutation.
  const hint =
    account.status === "closed"
      ? "Closed accounts cannot be edited."
      : editAccessHint(viewer, account);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          form.reset();
          update.reset();
        }
      }}
    >
      {hint ? (
        // Stays focusable (aria-disabled, not disabled) so the tooltip is reachable by keyboard.
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" aria-disabled="true" className="opacity-50">
              <PencilIcon />
              Edit
            </Button>
          </TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <PencilIcon />
            Edit
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit account</DialogTitle>
          <DialogDescription>
            Rename the account{account.type === "credit" ? " or adjust its limit" : ""}.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => {
              const error = field.state.meta.isTouched
                ? field.state.meta.errors[0]?.message
                : undefined;
              return (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Name</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? `${field.name}-error` : undefined}
                    autoComplete="off"
                  />
                  {error ? (
                    <p id={`${field.name}-error`} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            }}
          </form.Field>
          {account.type === "credit" ? (
            <form.Field name="creditLimit">
              {(field) => {
                const error = field.state.meta.isTouched
                  ? field.state.meta.errors[0]?.message
                  : undefined;
                return (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Credit limit ({account.currency})</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={100}
                      value={field.state.value ?? ""}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(
                          event.target.value === "" ? null : Number(event.target.value),
                        )
                      }
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${field.name}-error` : undefined}
                    />
                    {error ? (
                      <p id={`${field.name}-error`} className="text-xs text-destructive">
                        {error}
                      </p>
                    ) : null}
                  </div>
                );
              }}
            </form.Field>
          ) : null}
          {update.error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {update.error.message}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
