import { useEffect, useRef, useState, type ReactNode } from "react";
import type { PopoverControls } from "../../types/ui";

type PopoverProps = {
  className?: string;
  trigger: (controls: PopoverControls) => ReactNode;
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

export function Popover({
  className,
  trigger,
  children,
  onOpen,
  onClose,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = () => {
    if (!open) return;
    setOpen(false);
    onClose?.();
  };

  const openPopover = () => {
    if (open) return;
    setOpen(true);
    onOpen?.();
  };

  const controls: PopoverControls = {
    open: () => open,
    toggle: () => (open ? close() : openPopover()),
    close,
  };

  useEffect(() => {
    const onDocumentPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener("pointerdown", onDocumentPointer);
    return () => document.removeEventListener("pointerdown", onDocumentPointer);
  }, [onClose]);

  const classes = ["popover", className, open && "popover--open"]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={classes}>
      {trigger(controls)}
      <div className="popover__panel" aria-hidden={!open}>
        {children}
      </div>
    </div>
  );
}
