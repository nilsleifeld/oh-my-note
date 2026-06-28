import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useBlockHistory } from "../../features/blocks/history/BlockHistoryProvider";
import { useBlockNavigation } from "../../features/blocks/navigation/BlockNavigationProvider";
import { rescheduleBlockByNavigation } from "../../features/blocks/navigation/rescheduleBlockByNavigation";
import { useRescheduleModal } from "../../features/blocks/reschedule/RescheduleModalProvider";
import { useFeedJump } from "../../features/search/FeedJumpProvider";
import { jumpToBlock } from "../../features/search/jumpToBlock";
import {
  isFutureDate,
  rescheduleDateFromShortcut,
  shiftDate,
  todayISO,
} from "../../utils/date";
import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
} from "../ui/Modal";

export function RescheduleModal() {
  const { isOpen, blockId, close } = useRescheduleModal();
  const { getFeedController } = useFeedJump();
  const { navigateToBlock } = useBlockNavigation();
  const { pushHistory, isApplyingHistory } = useBlockHistory();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const today = todayISO();
  const minDate = shiftDate(today, 1);
  const canSubmit = isFutureDate(selectedDate, today) && !isSubmitting;

  const reset = useCallback(() => {
    setSelectedDate(minDate);
    setIsSubmitting(false);
  }, [minDate]);

  const handleClose = useCallback(() => {
    close();
    reset();
  }, [close, reset]);

  const applyShortcut = useCallback(
    (days: number) => {
      setSelectedDate(rescheduleDateFromShortcut(days, today));
    },
    [today],
  );

  const submit = useCallback(async () => {
    if (!blockId || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const change = await rescheduleBlockByNavigation(
        queryClient,
        blockId,
        selectedDate,
      );
      if (!change) return;

      if (!isApplyingHistory()) {
        pushHistory(change);
      }

      await jumpToBlock({
        queryClient,
        blockId,
        feedController: getFeedController(),
        navigateToBlock,
      });

      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    blockId,
    canSubmit,
    getFeedController,
    handleClose,
    isApplyingHistory,
    navigateToBlock,
    pushHistory,
    queryClient,
    selectedDate,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    reset();
    requestAnimationFrame(() => {
      panelRef.current?.focus();
    });
  }, [isOpen, reset]);

  const onShortcutKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      applyShortcut(Number(event.key));
    }
  };

  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();

    if (event.metaKey && event.key === "Enter") {
      event.preventDefault();
      void submit();
      return;
    }

    onShortcutKeyDown(event);
  };

  const onDateInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.metaKey && event.key === "Enter") {
      event.preventDefault();
      void submit();
      return;
    }

    onShortcutKeyDown(event);
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      ariaLabel="Wiedervorlage"
      className="reschedule-modal"
      panelRef={panelRef}
      onKeyDown={onPanelKeyDown}
    >
      <ModalHeader
        title="Wiedervorlage"
        subtitle="Block auf ein zukünftiges Datum verschieben"
      />

      <ModalBody>
        <label className="reschedule-modal__field">
          <span className="reschedule-modal__label">Datum</span>
          <input
            className="reschedule-modal__date-input"
            type="date"
            value={selectedDate}
            min={minDate}
            aria-label="Wiedervorlage-Datum"
            onChange={(event) => setSelectedDate(event.target.value)}
            onKeyDown={onDateInputKeyDown}
          />
        </label>
      </ModalBody>

      <ModalFooter>
        <ModalButton onClick={handleClose}>Abbrechen</ModalButton>
        <ModalButton
          variant="primary"
          disabled={!canSubmit}
          onClick={() => void submit()}
        >
          Setzen
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
}
