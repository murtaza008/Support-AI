/** Simple paragraph-aware chunker. Target ~1000 chars, ~150 char overlap. */
export function chunkText(text: string, target = 1000, overlap = 150): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= target) return [clean];

  const paragraphs = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let buf = "";

  const flush = () => {
    if (buf.trim()) chunks.push(buf.trim());
    buf = "";
  };

  for (const p of paragraphs) {
    if (p.length > target) {
      flush();
      // Hard-split long paragraph
      for (let i = 0; i < p.length; i += target - overlap) {
        chunks.push(p.slice(i, i + target));
      }
      continue;
    }
    if ((buf + "\n\n" + p).length > target) {
      flush();
      // Seed next buffer with tail overlap
      const prev = chunks[chunks.length - 1] ?? "";
      buf = prev.slice(-overlap) + "\n\n" + p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  flush();
  return chunks;
}
