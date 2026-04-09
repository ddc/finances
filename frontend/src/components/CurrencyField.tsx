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
  if (!raw || isNaN(num)) return raw;
  return num.toLocaleString(locale, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
}

function parseToRaw(display: string, locale: string): string {
  if (!display) return "";
  if (locale === "pt-BR") {
    return display.replace(/\./g, "").replace(",", ".");
  }
  return display.replace(/,/g, "");
}

export default function CurrencyField({ label, value, onChange, required, error, decimalPlaces = 2 }: CurrencyFieldProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "pt-BR" ? "pt-BR" : "en-US";
  const [display, setDisplay] = useState(() => formatForDisplay(value, locale, decimalPlaces));
  const [focused, setFocused] = useState(false);

  const handleFocus = () => {
    setFocused(true);
    setDisplay(value);
  };

  const handleBlur = () => {
    setFocused(false);
    const raw = parseToRaw(display, locale);
    const num = Number(raw);
    if (raw && !isNaN(num)) {
      onChange(raw);
      setDisplay(formatForDisplay(raw, locale, decimalPlaces));
    } else {
      onChange(raw);
      setDisplay(display);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDisplay(v);
    if (focused) {
      const raw = parseToRaw(v, locale);
      onChange(raw);
    }
  };

  return (
    <TextField
      label={label}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      required={required}
      error={error}
      slotProps={{ htmlInput: { inputMode: "decimal" } }}
    />
  );
}