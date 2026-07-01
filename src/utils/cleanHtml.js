const BLOCK = "h[1-6]|ul|ol|li|p|div|blockquote|section|table|tr|td|th";

export function cleanHtml(html) {
  if (!html) return "";
  let out = html;
  // remove <br> after opening block tag: <ul><br><li> → <ul><li>
  out = out.replace(new RegExp(`(<(?:${BLOCK})[^>]*>)\\s*(<br\\s*/?>\\s*)+`, "gi"), "$1");
  // remove <br> before closing block tag: <br></ul> → </ul>
  out = out.replace(new RegExp(`(<br\\s*/?>\\s*)+(<\\/(?:${BLOCK})>)`, "gi"), "$2");
  // remove <br> between closing and opening block tags: </p><br><h4> → </p><h4>
  out = out.replace(
    new RegExp(`(<\\/(?:${BLOCK})>)\\s*(<br\\s*/?>\\s*)+\\s*(<(?:${BLOCK})[^>]*>)`, "gi"),
    "$1$3"
  );
  // collapse 3+ <br> in text content to max 2
  out = out.replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");
  // remove empty <p>
  out = out.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, "");
  // strip leading/trailing <br>
  out = out.replace(/^(\s*<br\s*\/?>\s*)+/gi, "").replace(/(\s*<br\s*\/?>\s*)+$/gi, "");
  return out;
}
