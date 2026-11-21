import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface TrainingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
}

interface Props {
  confirmation: TrainingConfirmation | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TrainingConfirmationDialog({ confirmation, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={Boolean(confirmation)} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="max-w-md overflow-hidden rounded-2xl border-border bg-card p-0">
        <div className="flex gap-3 border-b border-border/70 px-5 py-5 sm:px-6">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <DialogHeader className="gap-1.5 pt-0.5">
            <DialogTitle className="text-base">{confirmation?.title}</DialogTitle>
            <DialogDescription className="leading-5">{confirmation?.description}</DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="gap-2 px-5 py-4 sm:px-6">
          <Button type="button" variant="outline" onClick={onCancel} className="min-h-10 rounded-lg">Cancelar</Button>
          <Button type="button" variant={confirmation?.variant ?? "default"} onClick={onConfirm} className="min-h-10 rounded-lg">
            {confirmation?.confirmLabel ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
