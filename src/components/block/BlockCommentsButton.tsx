import { useRef } from "react";
import { Popover } from "../ui/Popover";
import { BlockCommentsThread } from "./BlockCommentsThread";

function CommentIcon() {
  return (
    <svg
      className="block__comments-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

type BlockCommentsButtonProps = {
  blockId: string;
  commentCount: number;
};

export function BlockCommentsButton({
  blockId,
  commentCount,
}: BlockCommentsButtonProps) {
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const focusReply = () => {
    requestAnimationFrame(() => replyRef.current?.focus());
  };

  return (
    <Popover
      className="block__comments-popover"
      onOpen={focusReply}
      trigger={(controls) => (
        <div
          className={`block__comments-btn${controls.open() ? " block__comments-btn--active" : ""}`}
        >
          {commentCount > 0 ? (
            <span className="block__comments-count" aria-hidden="true">
              {commentCount}
            </span>
          ) : null}
          <button
            type="button"
            className="block__comments-trigger"
            aria-label={
              commentCount > 0
                ? `Open ${commentCount} comment${commentCount === 1 ? "" : "s"}`
                : "Open comments"
            }
            aria-expanded={controls.open()}
            onClick={controls.toggle}
          >
            <CommentIcon />
          </button>
        </div>
      )}
    >
      <BlockCommentsThread blockId={blockId} replyRef={replyRef} />
    </Popover>
  );
}
