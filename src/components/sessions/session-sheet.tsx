import { useQuery } from "@tanstack/react-query";
import { OutcomeBadge } from "@/components/sessions/outcome-badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/dates";
import { formatDuration, formatMoney, formatMs } from "@/lib/format";
import type { SessionId } from "@/lib/ids";
import { useTRPC } from "@/lib/trpc";
import { countryName } from "@/schemas/partner";
import { concernLabel, failureLabel } from "@/schemas/session";

const failureHelp = {
  face_not_detected:
    "The vision model found no face in the frame. Usually the camera pointed away or the face was too small.",
  low_light:
    "The frame was too dark to score reliably. The advisor asked for more light and the shopper left.",
  camera_blocked: "The browser never granted camera access, so no selfie was captured.",
  timeout: "Analysis did not return within the 6 second budget.",
  low_confidence: "Analysis returned, but confidence was below the threshold for a recommendation.",
  other: "Uncategorised client error.",
} as const;

export function SessionSheet({
  sessionId,
  onClose,
}: {
  sessionId: SessionId | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={sessionId !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <SheetContent aria-describedby={undefined}>
        {sessionId ? <SessionDetail sessionId={sessionId} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function SessionDetail({ sessionId }: { sessionId: SessionId }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.sessions.byId.queryOptions({ sessionId }));

  if (query.isPending) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Session {sessionId}</SheetTitle>
          <SheetDescription>Loading session</SheetDescription>
        </SheetHeader>
        <SheetBody
          className="flex flex-col gap-4"
          role="status"
          aria-busy="true"
          aria-label="Loading session"
        >
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </SheetBody>
      </>
    );
  }
  if (query.isError) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Session {sessionId}</SheetTitle>
          <SheetDescription>Could not load this session.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p role="alert" className="text-sm text-destructive">
            {query.error.message}
          </p>
        </SheetBody>
      </>
    );
  }

  const s = query.data;
  return (
    <>
      <SheetHeader>
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <SheetTitle className="font-mono text-base">{s.id}</SheetTitle>
          <OutcomeBadge outcome={s.outcome} />
        </div>
        <SheetDescription>
          {s.partner.name}, {countryName[s.partner.country]}. Started {formatDateTime(s.startedAt)}{" "}
          UTC.
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="flex flex-col gap-6">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <Fact label="Device" value={s.device} />
          <Fact label="Browser" value={s.browser} />
          <Fact label="Skin tone" value={`Tone ${s.skinTone}`} />
          <Fact label="Duration" value={formatDuration(s.durationMs)} />
          <Fact label="Analysis" value={s.analysisMs === null ? "-" : formatMs(s.analysisMs)} />
          <Fact
            label="Recommendation"
            value={s.recommendMs === null ? "-" : formatMs(s.recommendMs)}
          />
        </dl>

        {s.failureReason ? (
          <section className="rounded-lg bg-status-critical-soft p-4 text-sm">
            <h3 className="font-medium text-status-critical">{failureLabel[s.failureReason]}</h3>
            <p className="mt-1 text-foreground/80">{failureHelp[s.failureReason]}</p>
          </section>
        ) : null}

        {s.outcome === "abandoned" ? (
          <section className="rounded-lg bg-status-warning-soft p-4 text-sm">
            <h3 className="font-medium text-status-warning">Left before analysis</h3>
            <p className="mt-1 text-foreground/80">
              The shopper closed the advisor before a selfie was analyzed. No error was raised.
            </p>
          </section>
        ) : null}

        {s.analysis ? (
          <section className="flex flex-col gap-3">
            <h3 className="font-medium">Analysis result</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Meter label="Lighting quality" value={s.analysis.lightingScore} />
              <Meter label="Model confidence" value={s.analysis.confidence} />
            </div>
            <Separator />
            <ul className="flex flex-col gap-2" aria-label="Detected concerns">
              {s.analysis.concerns.map((c) => (
                <li
                  key={c.concern}
                  className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm"
                >
                  <span>{concernLabel[c.concern]}</span>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-ramp-2"
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                  <span className="tabular text-right text-muted-foreground">{c.score}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {s.recommendations.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h3 className="font-medium">Recommendations served</h3>
            <ol className="divide-y rounded-lg border">
              {s.recommendations.map((r) => (
                <li
                  key={r.productId}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.product.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="capitalize">{r.product.category}</span>,{" "}
                      {formatMoney(r.product.price, s.partner.currency)}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="tabular font-semibold">{r.matchScore}</div>
                    <div className="text-xs text-muted-foreground">match</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </SheetBody>
    </>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular font-medium">{value}</span>
      </div>
      <Progress value={value} aria-label={label} />
    </div>
  );
}
