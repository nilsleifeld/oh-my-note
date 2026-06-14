type FolderGateProps = {
  state: "pick" | "unsupported" | "error";
  message?: string;
  showPermissionHint?: boolean;
  onSelectFolder: () => void;
};

function FolderIcon() {
  return (
    <svg
      className="folder-gate__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.19a1.5 1.5 0 0 1 1.06.44l1.06 1.06A1.5 1.5 0 0 0 11.87 8H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
    </svg>
  );
}

function PermissionSteps() {
  return (
    <ol className="folder-gate__steps">
      <li>Click the button below</li>
      <li>Select your notes folder in the dialog</li>
      <li>
        When your browser asks for access, choose <strong>Allow</strong>
      </li>
    </ol>
  );
}

export function FolderGate({
  state,
  message,
  showPermissionHint = false,
  onSelectFolder,
}: FolderGateProps) {
  return (
    <div className="folder-gate">
      <div className="folder-gate__card">
        <div className="folder-gate__badge">
          <FolderIcon />
        </div>

        <div className="folder-gate__body">
          <h1 className="folder-gate__title">
            {state === "error"
              ? "Couldn’t open the folder"
              : "Welcome to oh-my-note"}
          </h1>

          {state === "pick" ? (
            <>
              <p className="folder-gate__text">
                Choose a folder to store your notes. Everything stays on your
                device.
              </p>
              {showPermissionHint ? (
                <div className="folder-gate__hint">
                  <p className="folder-gate__hint-title">
                    Your browser will ask for permission
                  </p>
                  <PermissionSteps />
                </div>
              ) : null}
            </>
          ) : null}

          {state === "unsupported" ? (
            <p className="folder-gate__text folder-gate__text--error">
              Your browser doesn&apos;t support opening a local folder. Please
              use Chrome or Edge.
            </p>
          ) : null}

          {state === "error" ? (
            <p className="folder-gate__text folder-gate__text--error">
              {message ?? "The notes folder couldn’t be opened."}
            </p>
          ) : null}
        </div>

        {state !== "unsupported" ? (
          <button
            type="button"
            className="folder-gate__button"
            onClick={onSelectFolder}
          >
            <FolderIcon />
            {state === "error" ? "Try another folder" : "Open folder"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
