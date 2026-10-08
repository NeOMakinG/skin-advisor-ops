import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCount, formatMoney, formatPercent } from "@/lib/format";
import type { Currency } from "@/schemas/partner";

export interface StallingProduct {
  productId: string;
  name: string;
  partnerName: string;
  currency: Currency;
  price: number;
  served: number;
  clickRate: number;
  avgMatch: number;
  outOfStockDays: number;
}

// Recommendations that get served but rarely clicked. A stock-out is the usual explanation.
export function StallingProducts({
  rows,
  showPartner,
}: {
  rows: StallingProduct[];
  showPartner: boolean;
}) {
  return (
    <div className="overflow-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Served</TableHead>
            <TableHead className="text-right">Click rate</TableHead>
            <TableHead className="text-right">Avg match</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.productId}>
              <TableCell>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {showPartner ? `${p.partnerName}, ` : ""}
                  {formatMoney(p.price, p.currency)}
                  {p.outOfStockDays > 0 ? (
                    <span className="text-status-critical">
                      {" "}
                      · out of stock {p.outOfStockDays} days
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="tabular text-right">{formatCount(p.served)}</TableCell>
              <TableCell className="tabular text-right font-medium">
                {formatPercent(p.clickRate)}
              </TableCell>
              <TableCell className="tabular text-right">{p.avgMatch.toFixed(0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
