import { DataGrid, type DataGridProps } from "@mui/x-data-grid";
import { ptBR, enUS } from "@mui/x-data-grid/locales";
import { useTranslation } from "react-i18next";

export default function StyledDataGrid(props: DataGridProps) {
  const { i18n } = useTranslation();
  const localeText = i18n.language === "pt-BR"
    ? ptBR.components.MuiDataGrid.defaultProps.localeText
    : enUS.components.MuiDataGrid.defaultProps.localeText;

  return (
    <DataGrid
      pageSizeOptions={[10, 25, 50, 75, 100]}
      localeText={localeText}
      {...props}
      sx={{
        "& .MuiDataGrid-columnHeader": {
          backgroundColor: "#1e293b",
          color: "#fff",
          fontWeight: 700,
        },
        "& .MuiDataGrid-sortIcon": { color: "#fff" },
        "& .MuiDataGrid-menuIconButton": { color: "#fff" },
        "& .MuiDataGrid-columnSeparator": { color: "rgba(255,255,255,0.3)" },
        "& .MuiDataGrid-row:nth-of-type(even)": {
          backgroundColor: "action.hover",
        },
        ...(props.sx ? (props.sx as object) : undefined),
      }}
    />
  );
}
