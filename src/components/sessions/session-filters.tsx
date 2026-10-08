import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Country, countryName } from "@/schemas/partner";
import { Browser, Device, Outcome, outcomeLabel, SkinTone } from "@/schemas/session";
import type { SessionFilters } from "@/server/routers/sessions";

const ANY = "any";

interface Field<K extends keyof SessionFilters> {
  key: K;
  label: string;
  options: { value: NonNullable<SessionFilters[K]>; label: string }[];
}

const fields: [
  Field<"country">,
  Field<"device">,
  Field<"browser">,
  Field<"skinTone">,
  Field<"outcome">,
] = [
  {
    key: "country",
    label: "Country",
    options: Country.options.map((c) => ({ value: c, label: countryName[c] })),
  },
  { key: "device", label: "Device", options: Device.options.map((d) => ({ value: d, label: d })) },
  {
    key: "browser",
    label: "Browser",
    options: Browser.options.map((b) => ({ value: b, label: b })),
  },
  {
    key: "skinTone",
    label: "Skin tone",
    options: SkinTone.options.map((t) => ({ value: t, label: `Tone ${t}` })),
  },
  {
    key: "outcome",
    label: "Outcome",
    options: Outcome.options.map((o) => ({ value: o, label: outcomeLabel[o] })),
  },
];

export const emptyFilters: SessionFilters = {
  country: null,
  device: null,
  browser: null,
  skinTone: null,
  outcome: null,
};

export function SessionFiltersBar({
  filters,
  onChange,
}: {
  filters: SessionFilters;
  onChange: (next: SessionFilters) => void;
}) {
  const active = Object.values(filters).some((v) => v !== null);
  return (
    <div className="flex flex-wrap items-end gap-3">
      {fields.map((field) => (
        <div key={field.key} className="grid gap-1">
          <Label htmlFor={`filter-${field.key}`} className="text-xs text-muted-foreground">
            {field.label}
          </Label>
          <Select
            value={filters[field.key] ?? ANY}
            onValueChange={(value) =>
              onChange({ ...filters, [field.key]: value === ANY ? null : value })
            }
          >
            <SelectTrigger id={`filter-${field.key}`} size="sm" className="min-w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any</SelectItem>
              {field.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      {active ? (
        <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)}>
          <XIcon />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
