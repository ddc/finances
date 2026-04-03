import { Box, Typography } from "@mui/material";
import { useMonthNames } from "../hooks/useMonthNames";

interface PageHeaderProps {
  readonly title: string;
  readonly monthFilter: string;
  readonly yearFilter: string;
  readonly children?: React.ReactNode;
}

export default function PageHeader({ title, monthFilter, yearFilter, children }: PageHeaderProps) {
  const monthNames = useMonthNames();

  const monthIndex = Number(monthFilter) - 1;
  const monthLabel = monthFilter && monthNames[monthIndex] ? ` — ${monthNames[monthIndex]}` : "";
  const label = `${title}${monthLabel}${yearFilter ? ` ${yearFilter}` : ""}`;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h5">{label}</Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {children}
      </Box>
    </Box>
  );
}
