import { useState } from 'react';
import { MAX_NAME_LENGTH } from 'shared';
import { rememberName } from '../api';

interface Props {
  name: string;
  onSave: (name: string) => Promise<void>;
  className?: string;
}

/** Click-to-edit display of the current player's own name. */
export default function NameEditor({ name, onSave, className = '' }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  if (!editing) {
    return (
      <button
        type="button"
        className={`group inline-flex items-center gap-1.5 ${className}`}
        onClick={() => { setDraft(name); setEditing(true); }}
        title="Change your name"
      >
        <span className="display font-semibold">{name}</span>
        <span className="text-[11px] text-ink-3 group-hover:text-ink">edit</span>
      </button>
    );
  }

  const submit = async () => {
    setEditing(false);
    const n = draft.trim();
    if (!n || n === name) return;
    rememberName(n);
    await onSave(n).catch(() => {});
  };

  return (
    <form className={`inline-flex items-center gap-1.5 ${className}`} onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      <input
        className="field w-36 px-2 py-1 text-sm"
        value={draft}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        placeholder="Your name"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void submit()}
        onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
      />
      <button className="btn btn-sm btn-ink" type="submit">Save</button>
    </form>
  );
}
