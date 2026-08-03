// Tiny in-place product UI mockups used in the features section.
// Real product surfaces — not abstract icons.

export function MockKnowledge() {
  const docs = [
    { name: "refund-policy.pdf", status: "READY", chunks: 42 },
    { name: "shipping-faq.docx", status: "READY", chunks: 28 },
    { name: "api-reference", status: "PROCESSING", chunks: 0 },
  ];
  return (
    <div className="bg-paper-raised hairline rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono-caps text-muted-foreground">Knowledge base</span>
        <span className="font-mono text-[11px] text-muted-foreground">3 sources</span>
      </div>
      <div className="space-y-2">
        {docs.map((d) => (
          <div
            key={d.name}
            className="flex items-center justify-between p-3 rounded-md border border-line bg-paper/50"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded bg-ink/5 flex items-center justify-center text-xs">
                📄
              </div>
              <div>
                <div className="text-sm text-ink">{d.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {d.chunks ? `${d.chunks} chunks` : "indexing…"}
                </div>
              </div>
            </div>
            <span
              className="font-mono-caps px-2 py-0.5 rounded"
              style={{
                backgroundColor: d.status === "READY" ? "var(--moss-dim)" : "var(--signal-dim)",
                color: d.status === "READY" ? "var(--moss)" : "var(--signal)",
              }}
            >
              {d.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockAnswer() {
  return (
    <div className="bg-paper-raised hairline rounded-lg p-5 shadow-sm">
      <p className="text-sm text-ink leading-relaxed mb-4">
        Yes — orders over $75 ship free in the US. International is calculated at checkout.
      </p>
      <div className="border-t border-line pt-3">
        <div className="font-mono-caps text-muted-foreground mb-2">Sources</div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-mono text-ink">shipping-faq.docx · §4</span>
            <span className="font-mono text-muted-foreground">0.94</span>
          </div>
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-mono text-ink">refund-policy.pdf · §1</span>
            <span className="font-mono text-muted-foreground">0.81</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockAnalytics() {
  const bars = [40, 65, 52, 78, 91, 70, 88];
  return (
    <div className="bg-paper-raised hairline rounded-lg p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono-caps text-muted-foreground">Conversations · 7d</span>
        <span className="font-mono text-[11px] text-moss">+24%</span>
      </div>
      <div className="font-display text-3xl font-semibold text-ink mb-4 tracking-tight">
        2,184
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: `${h}%`,
              backgroundColor: i === bars.length - 1 ? "var(--signal)" : "var(--ink)",
              opacity: i === bars.length - 1 ? 1 : 0.15,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground">
        <span>MON</span>
        <span>TUE</span>
        <span>WED</span>
        <span>THU</span>
        <span>FRI</span>
        <span>SAT</span>
        <span>SUN</span>
      </div>
    </div>
  );
}

export function MockTeam() {
  const members = [
    { name: "Alex Chen", email: "alex@acme.co", role: "Owner", initials: "AC" },
    { name: "Priya Shah", email: "priya@acme.co", role: "Admin", initials: "PS" },
    { name: "Jordan Lee", email: "jordan@acme.co", role: "Member", initials: "JL" },
  ];
  return (
    <div className="bg-paper-raised hairline rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono-caps text-muted-foreground">Team · Acme Co.</span>
        <span className="font-mono text-[11px] text-muted-foreground">3 members</span>
      </div>
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m.email}
            className="flex items-center justify-between p-2 rounded-md hover:bg-paper/50"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-ink text-paper flex items-center justify-center text-[11px]">
                {m.initials}
              </div>
              <div>
                <div className="text-sm text-ink">{m.name}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{m.email}</div>
              </div>
            </div>
            <span className="font-mono-caps text-muted-foreground">{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
