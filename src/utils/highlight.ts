import hljs from "highlight.js/lib/common";

const languageAliases: Record<string, string> = {
  html: "xml",
};

function resolveLanguage(language: string): string {
  return languageAliases[language] ?? language;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderHighlightedCode(code: string, language: string): string {
  if (!code) return "";

  const resolved = resolveLanguage(language);
  if (!resolved) {
    return escapeHtml(code);
  }

  try {
    let html = hljs.highlight(code, { language: resolved }).value;
    if (code.endsWith("\n")) {
      html += " ";
    }
    return html;
  } catch {
    return escapeHtml(code);
  }
}

export function syncCodeHighlight(
  textarea: HTMLTextAreaElement,
  codeEl: HTMLElement,
  language: string,
): void {
  const value = textarea.value;
  codeEl.className = language ? `hljs language-${language}` : "hljs";
  codeEl.innerHTML = renderHighlightedCode(value, language);
}
