import {
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  className?: string;
  panelClassName?: string;
  panelRef?: Ref<HTMLDivElement>;
  onCancel?: (event: Event) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
};

export function Modal({
  open,
  onClose,
  ariaLabel,
  className,
  panelClassName,
  panelRef,
  onCancel,
  onKeyDown,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const internalPanelRef = useRef<HTMLDivElement>(null);
  const resolvedPanelRef =
    (panelRef as React.RefObject<HTMLDivElement | null> | undefined) ??
    internalPanelRef;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (event: Event) => {
      onCancel?.(event);
      if (event.defaultPrevented) return;

      event.preventDefault();
      onClose();
    };

    dialog.addEventListener("cancel", handleCancel);
    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onCancel, onClose]);

  const dialogClassName = ["modal", open && "modal--open", className]
    .filter(Boolean)
    .join(" ");

  const panelClasses = ["modal__panel", panelClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <dialog
      ref={dialogRef}
      className={dialogClassName}
      aria-label={ariaLabel}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={resolvedPanelRef}
        className={panelClasses}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </dialog>
  );
}

type ModalHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ModalHeader({ title, subtitle }: ModalHeaderProps) {
  return (
    <header className="modal__header">
      <h2 className="modal__title">{title}</h2>
      {subtitle ? <p className="modal__subtitle">{subtitle}</p> : null}
    </header>
  );
}

type ModalBodyProps = {
  children: ReactNode;
  className?: string;
};

export function ModalBody({ children, className }: ModalBodyProps) {
  const classes = ["modal__body", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

type ModalFooterProps = {
  children: ReactNode;
  className?: string;
};

export function ModalFooter({ children, className }: ModalFooterProps) {
  const classes = ["modal__footer", className].filter(Boolean).join(" ");
  return <footer className={classes}>{children}</footer>;
}

type ModalButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
};

export function ModalButton({
  children,
  variant = "secondary",
  disabled,
  onClick,
}: ModalButtonProps) {
  const classes = [
    "modal__button",
    variant === "primary"
      ? "modal__button--primary"
      : "modal__button--secondary",
  ].join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function isModalOpen(selector = ".modal--open"): boolean {
  return document.querySelector(selector) !== null;
}
