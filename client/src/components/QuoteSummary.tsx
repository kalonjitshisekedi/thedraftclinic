import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SERVICE_TYPES, TURNAROUND_OPTIONS } from "@shared/schema";

interface QuoteSummaryProps {
  serviceType: keyof typeof SERVICE_TYPES;
  turnaround: keyof typeof TURNAROUND_OPTIONS;
  wordCount: number;
  currency?: "ZAR" | "USD" | "EUR" | "GBP";
  showVat?: boolean;
}

const BASE_PRICES = {
  proofreading: 0.08,
  editing: 0.15,
  formatting: 0.10,
};

const CURRENCY_SYMBOLS = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const EXCHANGE_RATES = {
  ZAR: 1,
  USD: 0.055,
  EUR: 0.050,
  GBP: 0.043,
};

export function QuoteSummary({
  serviceType,
  turnaround,
  wordCount,
  currency = "ZAR",
  showVat = true,
}: QuoteSummaryProps) {
  const service = SERVICE_TYPES[serviceType];
  const turnaroundOption = TURNAROUND_OPTIONS[turnaround];
  const basePrice = BASE_PRICES[serviceType];
  const exchangeRate = EXCHANGE_RATES[currency];
  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const baseTotal = wordCount * basePrice;
  const turnaroundTotal = baseTotal * turnaroundOption.multiplier;
  const minPrice = 50;
  const subtotal = Math.max(turnaroundTotal, minPrice) * exchangeRate;
  const vatRate = currency === "ZAR" ? 0.15 : 0;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  const formatPrice = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  return (
    <Card data-testid="quote-summary">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Quote Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Service</span>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Turnaround</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{turnaroundOption.label}</span>
              {turnaroundOption.multiplier > 1 && (
                <Badge variant="secondary" className="text-xs">
                  +{Math.round((turnaroundOption.multiplier - 1) * 100)}%
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Word Count</span>
            <span className="font-medium">{wordCount.toLocaleString()}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              Base ({formatPrice(basePrice * exchangeRate)}/word)
            </span>
            <span>{formatPrice(baseTotal * exchangeRate)}</span>
          </div>
          {turnaroundOption.multiplier > 1 && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                Express fee ({turnaroundOption.label})
              </span>
              <span>
                +{formatPrice((turnaroundTotal - baseTotal) * exchangeRate)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between gap-2 text-sm font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          {showVat && vatRate > 0 && (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">VAT ({(vatRate * 100).toFixed(0)}%)</span>
              <span>{formatPrice(vatAmount)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
            {formatPrice(total)}
          </span>
        </div>

        {wordCount < 1000 && (
          <p className="text-xs text-muted-foreground text-center">
            Minimum order: {formatPrice(minPrice * exchangeRate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
