const BLOCK = "h[1-6]|ul|ol|li|p|div|blockquote|section|table|tr|td|th";
const BR = "(<br\\s*/?>)";

export function cleanHtml(html) {
  if (!html) return "";
  let out = html;
  // remove <br> immediately after opening block tag: <ul><br><li> → <ul><li>
  out = out.replace(new RegExp(`(<(?:${BLOCK})[^>]*>)(\\s*${BR})+`, "gi"), "$1");
  // remove <br> immediately before closing block tag: <br></ul> → </ul>
  out = out.replace(new RegExp(`(${BR}\\s*)+(<\\/(?:${BLOCK})>)`, "gi"), "$3");
  // remove <br> between closing and opening block tags: </li><br><li> → </li><li>
  out = out.replace(
    new RegExp(`(<\\/(?:${BLOCK})>)(\\s*${BR}\\s*)+(<(?:${BLOCK})[^>]*)>`, "gi"),
    "$1$4>"
  );
  // collapse remaining consecutive <br>
  out = out.replace(/(<br\s*\/?>\s*){2,}/gi, "<br>");
  // remove empty <p>
  out = out.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, "");
  return out;
}
