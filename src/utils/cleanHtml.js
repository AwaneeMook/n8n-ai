const LIST = "ul|ol|li";
const BR = "(<br\\s*/?>)";

export function cleanHtml(html) {
  if (!html) return "";
  let out = html;
  // remove <br> after opening list tag: <ul><br><li> → <ul><li>
  out = out.replace(new RegExp(`(<(?:${LIST})[^>]*>)(\\s*${BR})+`, "gi"), "$1");
  // remove <br> before closing list tag: <br></ul> → </ul>
  out = out.replace(new RegExp(`(${BR}\\s*)+(</(?:${LIST})>)`, "gi"), "$3");
  // remove <br> between list items: </li><br><li> → </li><li>
  out = out.replace(new RegExp(`(<\\/(?:${LIST})>)(\\s*${BR}\\s*)+(\\s*<(?:${LIST})[^>]*>)`, "gi"), "$1$4");
  // collapse 3+ consecutive <br> down to 2 (keep 1–2 for readability)
  out = out.replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");
  // remove empty <p>
  out = out.replace(/<p[^>]*>(\s|&nbsp;)*<\/p>/gi, "");
  return out;
}
