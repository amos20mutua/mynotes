import { siteConfig } from "@/constants/site";

export function Footer() {
  return (
    <footer className="border-t border-white/8 bg-slate-950/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">{siteConfig.name}</h3>
          <p className="max-w-sm text-sm leading-6 text-slate-400">
            Local-first notes, lightweight structure, and room to shape the vault into your own workflow.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Start with</h4>
          <div className="space-y-2 text-sm text-slate-400">
            <p>Inbox note</p>
            <p>Projects note</p>
            <p>Daily notes folder</p>
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Writing hints</h4>
          <div className="space-y-2 text-sm text-slate-400">
            <p>Use Markdown headings</p>
            <p>Keep notes short at first</p>
            <p>Link ideas as they emerge</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
