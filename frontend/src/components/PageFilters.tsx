import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

interface MonthFilterProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export function MonthFilter({ value, onChange }: MonthFilterProps) {
  const { t } = useTranslation();
  const monthNames = MONTH_KEYS.map((k) => t(`months.${k}`));

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>{t("filters.month")}</InputLabel>
      <Select value={value} label={t("filters.month")} onChange={(e) => onChange(e.target.value)}>
        <MenuItem value="">{t("filters.all")}</MenuItem>
        {monthNames.map((name, i) => (
          <MenuItem key={i + 1} value={String(i + 1)}>{name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface YearFilterProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly years?: number;
}

export function YearFilter({ value, onChange, years = 5 }: YearFilterProps) {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <FormControl size="small" sx={{ minWidth: 100 }}>
      <InputLabel>{t("filters.year")}</InputLabel>
      <Select value={value} label={t("filters.year")} onChange={(e) => onChange(e.target.value)}>
        <MenuItem value="">{t("filters.all")}</MenuItem>
        {Array.from({ length: years }, (_, i) => currentYear - i).map((y) => (
          <MenuItem key={y} value={String(y)}>{y}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
