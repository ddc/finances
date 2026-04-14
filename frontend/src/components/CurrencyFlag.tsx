import { Box } from "@mui/material";

const CURRENCY_COUNTRY: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  BRL: "br",
  CAD: "ca",
  AUD: "au",
  JPY: "jp",
  CHF: "ch",
};

interface CurrencyFlagProps {
  readonly code: string;
  readonly size?: number;
}

export default function CurrencyFlag({ code, size = 18 }: CurrencyFlagProps) {
  const country = CURRENCY_COUNTRY[code];
  if (!country) return null;
  return (
    <Box
      component="img"
      src={`https://flagcdn.com/w40/${country}.png`}
      alt={code}
      sx={{
        width: size,
        height: "auto",
        display: "inline-block",
        verticalAlign: "middle",
        ml: 0.5,
        borderRadius: 0.25,
      }}
    />
  );
}
