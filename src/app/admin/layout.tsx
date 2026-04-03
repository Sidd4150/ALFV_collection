export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border/30 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#4a1258]">Admin</span>
          <span className="text-border/50 text-xs">·</span>
          <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-widest">ALFV</span>
        </div>
      </div>
      {children}
    </div>
  )
}
