/**
 * Still image of the story's last stage (answer + cited sources). Shown while
 * the 3D scene loads and permanently when WebGL is unavailable.
 */
export function SceneFallback() {
  const dots = Array.from({ length: 42 }, (_, i) => {
    const a = i * 2.39996;
    const r = 0.55 + ((i * 37) % 10) / 22;
    // Rounded: server (Node) and browser trig differ in the last digits, which breaks hydration.
    return { x: Math.round(300 + Math.cos(a) * r * 230), y: Math.round(210 + Math.sin(a) * r * 150) };
  });
  return (
    <svg viewBox="0 0 600 440" role="img" aria-label="An answer card citing two of six retrieved help-doc passages" className="h-full w-full">
      {dots.map((d, i) => (
        <rect key={i} x={d.x - 14} y={d.y - 9} width="28" height="18" rx="3" fill="var(--sunken)" stroke="var(--border)" />
      ))}
      <rect x="120" y="70" width="360" height="62" rx="12" fill="var(--surface)" stroke="var(--border-strong)" />
      <text x="140" y="94" fontSize="10" fontFamily="var(--font-mono)" fill="var(--fg-subtle)">
        CUSTOMER QUESTION
      </text>
      <text x="140" y="118" fontSize="15" fontWeight="600" fill="var(--fg)">
        Can I get a refund on my annual plan?
      </text>
      <rect x="110" y="150" width="380" height="150" rx="14" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="132" y="178" fontSize="10" fontFamily="var(--font-mono)" fill="var(--accent-text)">
        ANSWER · 2 SOURCES CITED
      </text>
      {[
        "Yes. Annual plans get a full refund within",
        "30 days of purchase or renewal [1]. Cancel",
        "first under Settings › Billing, then email",
        "billing from the owner's address [2].",
      ].map((l, i) => (
        <text key={l} x="132" y={206 + i * 22} fontSize="14" fill="var(--fg)">
          {l}
        </text>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <g key={i}>
          <rect x={138 + i * 56} y="322" width="46" height="30" rx="5" fill="var(--accent-soft)" stroke="var(--accent)" />
          <text x={161 + i * 56} y="342" fontSize="12" textAnchor="middle" fontFamily="var(--font-mono)" fill="var(--accent-text)">
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
