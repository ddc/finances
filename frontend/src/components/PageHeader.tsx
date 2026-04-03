import { Box, Typography } from "@mui/material";
import { useMonthNames } from "../hooks/useMonthNames";

interface PageHeaderProps {
  title: string;
  monthFilter: string;
  yearFilter: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, monthFilter, yearFilter, children }: PageHeaderProps) {
  const monthNames = useMonthNames();

  const label = `${title}${monthFilter ? ` — ${monthNames[Number(monthFilter) - 1]}` : ""}${yearFilter ? ` ${yearFilter}` : ""}`;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
      <Typography variant="h5">{label}</Typography>
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {children}
      </Box>
    </Box>
  );
}
