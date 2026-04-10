import { useState } from "react";
import { TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

interface CurrencyFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
  readonly error?: boolean;
  readonly decimalPlaces?: number;
}

function formatForDisplay(raw: string, locale: string, decimalPlaces: number): string {
  const num = Number(raw);
  if (!raw || Number.isNaN(num)) return raw;
  return num.toLocaleString(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
}

function parseToRaw(display: string, locale: string): string {
  if (!display) return "";
  if (locale === "pt-BR") {
    return display.replaceAll(".", "").replace(",", ".");
  }
  return display.replaceAll(",", "");
}

export default function CurrencyField({ label, value, onChange, required, error, decimalPlaces = 2 }: CurrencyFieldProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const [display, setDisplay] = useState(() => formatForDisplay(value, locale, decimalPlaces));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDisplay(formatForDisplay(value, locale, decimalPlaces));
  }

  const handleBlur = () => {
    const raw = parseToRaw(display, locale);
    const num = Number(raw);
    const formatted = raw && !Number.isNaN(num) ? formatForDisplay(raw, locale, decimalPlaces) : display;
    onChange(raw);
    setDisplay(formatted);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value);
  };

  return (
    <TextField
      label={label}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      error={error}
      slotProps={{ htmlInput: { inputMode: "decimal" } }}
    />
  );
}
