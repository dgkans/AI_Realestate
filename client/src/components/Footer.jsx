export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80">
      <div className="container-pad flex flex-col items-center justify-between gap-3 py-6 text-sm text-slate-400 md:flex-row">
        <p>© 2026 GD Realty. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>
      </div>
    </footer>
  )
}
