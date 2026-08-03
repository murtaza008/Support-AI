export function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="size-7 rounded-md bg-ink flex items-center justify-center text-paper text-sm">
              ✦
            </div>
            <span className="font-display text-lg font-semibold text-ink">SupportAI</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">
            The AI support agent that actually reads your docs.
          </p>
        </div>
        <div>
          <h4 className="font-mono-caps text-ink mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#features" className="hover:text-ink">
                Features
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-ink">
                Pricing
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-ink">
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono-caps text-ink mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Contact</li>
            <li>Privacy</li>
            <li>Terms</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono">© 2026 SupportAI Labs</span>
          <span className="font-mono-caps">Made for support teams who care</span>
        </div>
      </div>
    </footer>
  );
}
