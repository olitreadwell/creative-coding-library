"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Knob =
  | {
      kind: "number";
      key: string;
      label: string;
      min: number;
      max: number;
      step?: number;
      value: number;
    }
  | { kind: "select"; key: string; label: string; options: string[]; value: string }
  | { kind: "toggle"; key: string; label: string; value: boolean };

export type KnobsPanelProps = {
  knobs: Knob[];
  onChange: (key: string, value: number | string | boolean) => void;
  title?: string;
};

export function KnobsPanel({ knobs, onChange, title = "Controls" }: KnobsPanelProps) {
  return (
    <Card className="w-full shrink-0 sm:w-64">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {knobs.map((knob) => {
          if (knob.kind === "number") {
            const labelId = `knob-label-${knob.key}`;
            return (
              <div key={knob.key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label id={labelId} htmlFor={`knob-${knob.key}`}>
                    {knob.label}
                  </Label>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {Number.isInteger(knob.step ?? 1) ? knob.value : knob.value.toFixed(4)}
                  </span>
                </div>
                <Slider
                  id={`knob-${knob.key}`}
                  aria-labelledby={labelId}
                  min={knob.min}
                  max={knob.max}
                  step={knob.step ?? 1}
                  value={[knob.value]}
                  onValueChange={(vals) => {
                    const arr = vals as readonly number[];
                    const next = arr[0];
                    if (next !== undefined) {
                      onChange(knob.key, next);
                    }
                  }}
                />
              </div>
            );
          }

          if (knob.kind === "select") {
            const labelId = `knob-label-${knob.key}`;
            return (
              <div key={knob.key} className="flex flex-col gap-1.5">
                <Label id={labelId} htmlFor={`knob-${knob.key}`}>
                  {knob.label}
                </Label>
                <Select
                  id={`knob-${knob.key}`}
                  value={knob.value}
                  onValueChange={(val) => {
                    if (val !== null) {
                      onChange(knob.key, val);
                    }
                  }}
                >
                  <SelectTrigger aria-labelledby={labelId} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {knob.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          }

          if (knob.kind === "toggle") {
            const switchId = `knob-${knob.key}`;
            return (
              <div key={knob.key} className="flex items-center gap-3">
                <Switch
                  id={switchId}
                  checked={knob.value}
                  onCheckedChange={(val) => onChange(knob.key, val)}
                />
                <Label htmlFor={switchId}>{knob.label}</Label>
              </div>
            );
          }

          return null;
        })}
      </CardContent>
    </Card>
  );
}
