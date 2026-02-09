import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentSettingsProps {
  profileId: string;
  initialBaseRate: number | null;
  initialRateType: string | null;
  initialCurrency: string | null;
  initialOpenToFreeCollabs: boolean;
}

const RATE_TYPES = [
  { value: "per_post", label: "Per Post" },
  { value: "per_story", label: "Per Story" },
  { value: "per_reel", label: "Per Reel" },
  { value: "per_video", label: "Per Video" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_project", label: "Per Project" },
  { value: "per_campaign", label: "Per Campaign" },
];

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "CAD", label: "CAD (C$)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "INR", label: "INR (₹)" },
  { value: "JPY", label: "JPY (¥)" },
  { value: "BRL", label: "BRL (R$)" },
];

export function PaymentSettings({
  profileId,
  initialBaseRate,
  initialRateType,
  initialCurrency,
  initialOpenToFreeCollabs,
}: PaymentSettingsProps) {
  const { toast } = useToast();
  const [baseRate, setBaseRate] = useState<string>(initialBaseRate?.toString() || "");
  const [rateType, setRateType] = useState<string>(initialRateType || "per_post");
  const [currency, setCurrency] = useState<string>(initialCurrency || "USD");
  const [openToFreeCollabs, setOpenToFreeCollabs] = useState<boolean>(initialOpenToFreeCollabs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBaseRate(initialBaseRate?.toString() || "");
    setRateType(initialRateType || "per_post");
    setCurrency(initialCurrency || "USD");
    setOpenToFreeCollabs(initialOpenToFreeCollabs);
  }, [initialBaseRate, initialRateType, initialCurrency, initialOpenToFreeCollabs]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        base_rate: baseRate ? parseFloat(baseRate) : null,
        rate_type: rateType,
        currency: currency,
        open_to_free_collabs: openToFreeCollabs,
      })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Error", description: "Failed to save payment settings", variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Payment settings updated successfully." });
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Payment Settings
        </CardTitle>
        <CardDescription>Set your rates and collaboration preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Base Rate</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Rate Type</Label>
          <Select value={rateType} onValueChange={setRateType}>
            <SelectTrigger>
              <SelectValue placeholder="Select rate type" />
            </SelectTrigger>
            <SelectContent>
              {RATE_TYPES.map((rt) => (
                <SelectItem key={rt.value} value={rt.value}>
                  {rt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">How you typically charge for collaborations</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label className="text-base">Open to Free Collaborations</Label>
            <p className="text-sm text-muted-foreground">
              Show brands you're open to product exchanges or exposure-based deals
            </p>
          </div>
          <Switch
            checked={openToFreeCollabs}
            onCheckedChange={setOpenToFreeCollabs}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="gradient-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Save Payment Settings</>}
        </Button>
      </CardContent>
    </Card>
  );
}
