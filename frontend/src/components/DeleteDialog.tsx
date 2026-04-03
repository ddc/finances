import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface DeleteDialogProps {
  readonly open: boolean;
  readonly message: string;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export default function DeleteDialog({ open, message, onClose, onConfirm }: DeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" color="error" onClick={onConfirm}>{t("common.delete")}</Button>
      </DialogActions>
    </Dialog>
  );
}
