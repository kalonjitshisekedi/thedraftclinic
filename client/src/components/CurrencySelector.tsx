import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Currency = "ZAR" | "USD" | "EUR" | "GBP";

const CURRENCIES: { value: Currency; label: string; flag: string }[] = [
  { value: "ZAR", label: "South African Rand", flag: "🇿🇦" },
  { value: "USD", label: "US Dollar", flag: "🇺🇸" },
  { value: "EUR", label: "Euro", flag: "🇪🇺" },
  { value: "GBP", label: "British Pound", flag: "🇬🇧" },
];

interface CurrencySelectorProps {
  value: Currency;
  onChange: (value: Currency) => void;
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const selectedCurrency = CURRENCIES.find((c) => c.value === value);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]" data-testid="select-currency">
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{selectedCurrency?.flag}</span>
            <span>{value}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem
            key={currency.value}
            value={currency.value}
            data-testid={`option-currency-${currency.value}`}
          >
            <span className="flex items-center gap-2">
              <span>{currency.flag}</span>
              <span>{currency.value}</span>
              <span className="text-muted-foreground text-xs">
                {currency.label}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
