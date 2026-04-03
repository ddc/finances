import { useTranslation } from "react-i18next";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function useMonthNames() {
  const { t } = useTranslation();
  return MONTH_KEYS.map((k) => t(`months.${k}`));
}
