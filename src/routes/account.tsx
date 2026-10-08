import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon, CircleAlertIcon, InfoIcon } from "lucide-react";
import { BalanceChart } from "@/components/accounts/balance-chart";
import { EditAccountDialog } from "@/components/accounts/edit-account-dialog";
import { StatusBadge } from "@/components/accounts/status-badge";
import { FadeIn } from "@/components/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { userStore } from "@/data/account-store";
import { AccountId } from "@/lib/ids";
import { useViewerId } from "@/lib/session";
import { useTRPC } from "@/lib/trpc";
import { formatMoney } from "@/lib/utils";
import { accountRoute } from "@/router";
import type { Account } from "@/schemas/account";

export function AccountPage() {
  const { accountId } = accountRoute.useParams();
  const parsed = AccountId.safeParse(accountId);
  if (!parsed.success) return <AccountMissing id={accountId} />;
  return <AccountLoader accountId={parsed.data} />;
}

function AccountLoader({ accountId }: { accountId: AccountId }) {
  const trpc = useTRPC();
  const viewerId = useViewerId();
  const viewer = userStore.byId(viewerId);
  const query = useQuery(trpc.accounts.byId.queryOptions({ accountId }));

  if (query.isPending) return <AccountSkeleton />;
  if (query.isError) return <AccountMissing id={accountId} message={query.error.message} />;
  if (!viewer) return <AccountMissing id={accountId} message="Unknown viewer." />;
  return <AccountDetail account={query.data} viewer={viewer} />;
}

function AccountDetail({
  account,
  viewer,
}: {
  account: Account;
  viewer: NonNullable<ReturnType<typeof userStore.byId>>;
}) {
  const owner = userStore.byId(account.ownerId);
  const utilization =
    account.type === "credit" && account.creditLimit
      ? Math.min(100, Math.round((account.balance / account.creditLimit) * 100))
      : null;
  const history = [...account.history].reverse();

  return (
    <FadeIn className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/">
            <ArrowLeftIcon />
            All accounts
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{account.name}</h1>
            <StatusBadge status={account.status} />
            {account.status === "frozen" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="rounded-full text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    aria-label="Why is this account frozen?"
                  >
                    <InfoIcon className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  Frozen accounts keep their balance but reject all movements until released.
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{account.type}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{account.currency}</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Owner: {owner?.name ?? account.ownerId}</span>
            <Separator orientation="vertical" className="h-4" />
            <span className="font-mono text-xs">{account.id}</span>
          </div>
        </div>
        <EditAccountDialog account={account} viewer={viewer} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 py-5 lg:col-span-1 lg:self-start">
          <CardHeader className="px-5">
            <CardDescription>
              {account.type === "credit" ? "Amount owed" : "Current balance"}
            </CardDescription>
            <CardTitle className="tabular text-3xl tracking-tight">
              {formatMoney(account.balance, account.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-5">
            {utilization !== null && account.creditLimit ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Utilization</span>
                  <span className="tabular font-medium">{utilization}%</span>
                </div>
                <Progress value={utilization} aria-label="Credit utilization" />
                <p className="text-xs text-muted-foreground">
                  Limit {formatMoney(account.creditLimit, account.currency)}
                </p>
              </div>
            ) : null}
            <Separator />
            <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
              <dt className="text-muted-foreground">Opened</dt>
              <dd className="text-right">{formatDate(account.openedAt)}</dd>
              <dt className="text-muted-foreground">12-month change</dt>
              <dd className="tabular text-right">{twelveMonthChange(account)}</dd>
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="text-right">{owner?.name ?? account.ownerId}</dd>
            </dl>
            {account.ownerId === viewer.id ? (
              <Badge variant="secondary" className="w-fit">
                You own this account
              </Badge>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Balance history</CardTitle>
            <CardDescription>Month-end balances for the last twelve months.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Chart</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
              <TabsContent value="chart">
                <BalanceChart data={account.history} currency={account.currency} />
              </TabsContent>
              <TabsContent value="table">
                <div className="max-h-56 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((point) => (
                        <TableRow key={point.month}>
                          <TableCell>{point.month}</TableCell>
                          <TableCell className="tabular text-right">
                            {formatMoney(point.balance, account.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </FadeIn>
  );
}

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function twelveMonthChange(account: Account) {
  const first = account.history[0]?.balance ?? account.balance;
  const diff = account.balance - first;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${formatMoney(diff, account.currency)}`;
}

function AccountMissing({ id, message }: { id: string; message?: string }) {
  return (
    <Card className="items-center py-12 text-center">
      <CircleAlertIcon className="size-8 text-muted-foreground" aria-hidden="true" />
      <CardTitle>Account not found</CardTitle>
      <CardDescription>{message ?? `There is no account with id "${id}".`}</CardDescription>
      <Button asChild variant="outline">
        <Link to="/">
          <ArrowLeftIcon />
          Back to overview
        </Link>
      </Button>
    </Card>
  );
}

function AccountSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-busy="true"
      aria-label="Loading account"
    >
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-56" />
        <Skeleton className="h-80 lg:col-span-2" />
      </div>
    </div>
  );
}
