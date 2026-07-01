export function cleanHtml(html) {
  if (!html) return "";
  return html
    .replace(/(<br\s*\/?>\s*){2,}/gi, "<br>")
    .replace(/<p>(\s|&nbsp;)*<\/p>/gi, "")
    .replace(/<p>(<br\s*\/?>)+/gi, "<p>")
    .replace(/(<br\s*\/?>)+<\/p>/gi, "</p>");
}
