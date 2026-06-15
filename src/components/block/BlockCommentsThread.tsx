import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type Ref,
} from "react";
import type { BlockComment } from "../../types/models";
import { useBlockQuery } from "../../features/blocks/queries/useBlockQuery";
import { useAddBlockComment } from "../../features/blocks/mutations/useAddBlockComment";
import { useUpdateBlockComment } from "../../features/blocks/mutations/useUpdateBlockComment";
import { useDeleteBlockComment } from "../../features/blocks/mutations/useDeleteBlockComment";
import { formatCommentRelative } from "../../utils/date";

function SubmitIcon() {
  return (
    <svg
      className="block__comments-submit-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      className="block__comments-delete-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

type CommentItemProps = {
  blockId: string;
  comment: BlockComment;
};

function CommentItem({ blockId, comment }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const updateComment = useUpdateBlockComment();
  const deleteComment = useDeleteBlockComment();
  const skipBlurSaveRef = useRef(false);

  const saveEdit = async () => {
    const text = draft.trim();
    if (!text) {
      setDraft(comment.text);
      setIsEditing(false);
      return;
    }
    if (text === comment.text) {
      setIsEditing(false);
      return;
    }
    await updateComment.mutateAsync({ blockId, commentId: comment.id, text });
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setDraft(comment.text);
    setIsEditing(false);
  };

  const onEditKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void saveEdit();
    }
  };

  const onDelete = () => {
    skipBlurSaveRef.current = true;
    void deleteComment.mutateAsync({ blockId, commentId: comment.id });
  };

  return (
    <article className="block__comments-item">
      <div className="block__comments-marker" aria-hidden="true">
        <span className="block__comments-dot" />
      </div>
      <div className="block__comments-body">
        <div className="block__comments-item-header">
          <time
            className="block__comments-item-date"
            dateTime={comment.createdAt}
          >
            {formatCommentRelative(comment.createdAt)}
          </time>
          <button
            type="button"
            className="block__comments-item-delete"
            aria-label="Delete comment"
            disabled={deleteComment.isPending}
            onMouseDown={() => {
              skipBlurSaveRef.current = true;
            }}
            onClick={onDelete}
          >
            <DeleteIcon />
          </button>
        </div>
        {isEditing ? (
          <textarea
            className="block__comments-item-input"
            value={draft}
            rows={2}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onEditKeyDown}
            onBlur={() => {
              if (skipBlurSaveRef.current) {
                skipBlurSaveRef.current = false;
                return;
              }
              void saveEdit();
            }}
          />
        ) : (
          <button
            type="button"
            className="block__comments-item-text"
            onClick={() => {
              setDraft(comment.text);
              setIsEditing(true);
            }}
          >
            {comment.text}
          </button>
        )}
      </div>
    </article>
  );
}

type BlockCommentsThreadProps = {
  blockId: string;
  replyRef?: Ref<HTMLTextAreaElement>;
};

export function BlockCommentsThread({
  blockId,
  replyRef,
}: BlockCommentsThreadProps) {
  const query = useBlockQuery(blockId);
  const addComment = useAddBlockComment();
  const [draft, setDraft] = useState("");

  const comments = query.data?.comments ?? [];
  const showList = query.isLoading || comments.length > 0;

  const submitComment = async () => {
    const text = draft.trim();
    if (!text) return;
    await addComment.mutateAsync({ blockId, text });
    setDraft("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitComment();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitComment();
    }
  };

  return (
    <aside className="block__comments-thread" aria-label="Block comments">
      {showList ? (
        <div className="block__comments-list">
          {query.isLoading ? (
            <p className="block__comments-empty">Loading…</p>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                blockId={blockId}
                comment={comment}
              />
            ))
          )}
        </div>
      ) : null}

      <form className="block__comments-form" onSubmit={onSubmit}>
        <textarea
          ref={replyRef}
          className="block__comments-reply"
          value={draft}
          rows={1}
          placeholder="Reply…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          type="submit"
          className="block__comments-submit"
          aria-label="Add comment"
          disabled={!draft.trim() || addComment.isPending}
        >
          <SubmitIcon />
        </button>
      </form>
    </aside>
  );
}
