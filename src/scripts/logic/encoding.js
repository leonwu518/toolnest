/* 编码工具纯逻辑（浏览器与 Node 均可运行） */

export function urlEncode(text, component = true) {
  return component ? encodeURIComponent(text) : encodeURI(text);
}
export function urlDecode(text, component = true) {
  return component ? decodeURIComponent(text) : decodeURI(text);
}

/** UTF-8 安全的 Base64：先转字节再 btoa，中文与 emoji 可正确往返 */
export function base64Encode(text) {
  const bytes = new TextEncoder().encode(String(text));
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64Decode(encoded) {
  const clean = String(encoded).replace(/\s+/g, '');
  const binary = atob(clean);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
