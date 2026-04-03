import { DataGrid, type DataGridProps } from "@mui/x-data-grid";

export default function StyledDataGrid(props: DataGridProps) {
  return (
    <DataGrid
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
