type FolderGateProps = {
  state: "pick" | "unsupported" | "error";
  message?: string;
  onSelectFolder: () => void;
};

export function FolderGate({
  state,
  message,
  onSelectFolder,
}: FolderGateProps) {
  return (
    <div className="folder-gate">
      <div className="folder-gate__card">
        <h1 className="folder-gate__title">oh-my-note</h1>

        {state === "pick" ? (
          <>
            <p className="folder-gate__text">
              Wähle einen Ordner für deine Notizen. Jeder Tag wird als eigene
              JSON-Datei gespeichert (z. B. <code>2026-06-14.json</code>).
            </p>
            <button
              type="button"
              className="folder-gate__button"
              onClick={onSelectFolder}
            >
              Ordner auswählen
            </button>
          </>
        ) : null}

        {state === "unsupported" ? (
          <>
            <p className="folder-gate__text folder-gate__text--error">
              Dein Browser unterstützt keine lokale Ordnerauswahl. Bitte Chrome
              oder Edge verwenden.
            </p>
          </>
        ) : null}

        {state === "error" ? (
          <>
            <p className="folder-gate__text folder-gate__text--error">
              {message ?? "Der Notizen-Ordner konnte nicht geöffnet werden."}
            </p>
            <button
              type="button"
              className="folder-gate__button"
              onClick={onSelectFolder}
            >
              Ordner auswählen
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
