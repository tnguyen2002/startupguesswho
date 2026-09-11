import { useState } from 'react';

export default function InviteBox({ code }: { code: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const link = `${window.location.origin}/room/${code}`;
  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? code : link);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  return (
    <div className="panel p-5">
      <p className="text-xs uppercase tracking-wider text-ink-3">Invite code</p>
      <div className="display mt-1 select-all text-5xl font-extrabold tracking-[0.15em] sm:text-6xl">{code}</div>
      <p className="mt-2 break-all text-xs text-ink-2">{link}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn btn-sm" onClick={() => copy('code')}>{copied === 'code' ? 'Copied!' : 'Copy code'}</button>
        <button className="btn btn-sm btn-ink" onClick={() => copy('link')}>{copied === 'link' ? 'Copied!' : 'Copy link'}</button>
      </div>
    </div>
  );
}
