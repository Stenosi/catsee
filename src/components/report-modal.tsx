"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createReport } from "@/app/(app)/segnala/actions";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'post' | 'user';
  targetId: string;
}

const POST_REASONS = [
  { value: 'not_a_cat', label: 'Non è un gatto' },
  { value: 'inappropriate', label: 'Contenuto inappropriato' },
  { value: 'spam', label: 'Spam' },
  { value: 'offensive_text', label: 'Testo offensivo' },
  { value: 'other', label: 'Altro' },
] as const;

const USER_REASONS = [
  { value: 'inappropriate', label: 'Contenuto inappropriato' },
  { value: 'inappropriate_avatar', label: 'Foto profilo inappropriata' },
  { value: 'spam', label: 'Spam' },
  { value: 'offensive_text', label: 'Testo offensivo' },
  { value: 'other', label: 'Altro' },
] as const;

export default function ReportModal({ open, onClose, type, targetId }: ReportModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
      setSelected(null);
    }
  }

  async function handleSubmit() {
    if (!selected) return;
    setLoading(true);
    const result = await createReport(type, targetId, [selected]);
    setLoading(false);
    if ('error' in result) {
      toast.error(result.error);
      return;
    }
    toast.success('Segnalazione inviata');
    onClose();
  }

  const reasons = type === 'post' ? POST_REASONS : USER_REASONS;
  const title = type === 'post' ? 'Segnala avvistamento' : 'Segnala utente';

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-card text-foreground">
        <DrawerHeader className="text-left pb-2">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-2">
          <RadioGroup value={selected ?? ''} onValueChange={setSelected}>
            {reasons.map((reason) => (
              <label
                key={reason.value}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors",
                  selected === reason.value ? "bg-primary/10" : "hover:bg-accent"
                )}
              >
                <RadioGroupItem value={reason.value} />
                <span className={cn(
                  "text-sm",
                  selected === reason.value ? "text-primary font-medium" : "text-foreground"
                )}>
                  {reason.label}
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>

        <DrawerFooter className="pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <ButtonGroup className="w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!selected || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Invio…' : 'Segnala'}
            </Button>
          </ButtonGroup>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
