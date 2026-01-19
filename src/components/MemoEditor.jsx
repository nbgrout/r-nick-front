//MemoEditor.jsx
import React, { useState } from "react";
import { useVault } from "../VaultContext.jsx";

export default function MemoEditor({ onSaved }) {
  const { writeFileAtPath, ensureDir, isReady } = useVault();

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const save = async () => {
    if (!title || !text) {
      alert("Title and memo text are required.");
      return;
    }

    await ensureDir("Vault/Memos");

    const id = `memo-${Date.now()}`;
    const path = `Vault/Memos/${id}.json`;

    const memo = {
      id,
      kind: "memo",
      title,
      text,
      created_at: new Date().toISOString()
    };

    await writeFileAtPath(path, JSON.stringify(memo, null, 2));

    setTitle("");
    setText("");

    if (onSaved) onSaved();
  };

  return (
    <div style={{ padding: 12 }}>
      <h3>New Memo</h3>

      <label>Title</label>
      <input
        style={{ width: "100%", marginBottom: 8 }}
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <label>Memo</label>
      <textarea
        rows={8}
        style={{ width: "100%", marginBottom: 12 }}
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <button onClick={save} disabled={!isReady}>
        Save Memo
      </button>
    </div>
  );
}
