"use client";
import { useEffect, useState } from "react";

const MODES = {
  omniroute: {
    label: "Local API Hoster",
    hint: "Connect securely to your Local API Hoster instance.",
    urlLabel: "Local API Base URL",
    urlPlaceholder: "http://127.0.0.1:20128/v1",
    modelLabel: "Combo Name",
    modelPlaceholder: "Research Paper",
    defaultUrl: "http://127.0.0.1:20128/v1",
  },
  direct: {
    label: "Direct API Key",
    hint: "Use any OpenAI-compatible provider with your API key.",
    urlLabel: "Provider Base URL",
    urlPlaceholder: "https://api.openai.com/v1",
    modelLabel: "Model Name",
    modelPlaceholder: "gemini-1.5-pro",
    defaultUrl: "https://api.openai.com/v1",
  },
};

function PinPad({ label, onSubmit, busy, error, onCancel }) {
  const [pin, setPin] = useState("");

  const handleDigit = (d) => {
    if (pin.length < 4) {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          onSubmit(next);
          setPin("");
        }, 150);
      }
    }
  };

  const handleBack = () => setPin((p) => p.slice(0, -1));

  const dots = Array(4).fill(null).map((_, i) => (
    <div key={i} style={{
      width: 14, height: 14, borderRadius: "50%",
      background: i < pin.length ? "var(--accent)" : "transparent",
      border: "1px solid var(--accent)",
      transition: "background var(--t)"
    }} />
  ));

  const digits = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{
      position: "absolute", inset: 0,
      backdropFilter: "blur(6px)", background: "rgba(255, 255, 255, 0.8)",
      zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 24, borderRadius: "var(--r-panel)"
    }}>
      <style>{`
        [data-theme="dark"] .pin-overlay-bg { background: rgba(14, 22, 32, 0.8) !important; }
      `}</style>
      <div className="pin-overlay-bg" style={{ position: "absolute", inset: 0, zIndex: -1 }} />

      <div style={{ textAlign: "center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12, color: "var(--accent)" }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h3 style={{ fontSize: 17, marginBottom: 4 }}>{label}</h3>
        <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Enter 4-digit PIN</p>
      </div>

      <div style={{ display: "flex", gap: 12 }}>{dots}</div>
      {error && <div style={{ color: "var(--conf-low)", fontSize: 13, fontWeight: 500 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {digits.map((d, i) => {
          if (d === "") return <div key={i} />;
          const isBack = d === "⌫";
          return (
            <button
              key={i}
              onClick={() => isBack ? handleBack() : handleDigit(d)}
              disabled={busy}
              style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "var(--paper)",
                border: "1px solid var(--rule)",
                color: isBack ? "var(--conf-low)" : "var(--ink)",
                fontSize: isBack ? 16 : 20,
                fontWeight: 600, fontFamily: "var(--font-ui)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background var(--t), border-color var(--t)"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--sheet)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--rule)"; e.currentTarget.style.background = "var(--paper)"; }}
            >
              {d}
            </button>
          );
        })}
      </div>

      {busy && <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>Verifying…</div>}
      
      {onCancel && (
        <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ marginTop: 8 }}>
          Cancel
        </button>
      )}
    </div>
  );
}

export default function ProviderSettings() {
  const [mode, setMode] = useState("omniroute");
  const [saved, setSaved] = useState(null);
  const [url, setUrl] = useState(MODES.omniroute.defaultUrl);
  const [model, setModel] = useState("Research Paper");
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  
  const [hasPin, setHasPin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showSavePad, setShowSavePad] = useState(false);
  const [pinError, setPinError] = useState(null);

  const applyMode = (m, cfg) => {
    setMode(m);
    if (m === "omniroute") {
      setUrl(cfg?.omniroute?.base_url || MODES.omniroute.defaultUrl);
      setModel(cfg?.omniroute?.combo || "Research Paper");
    } else {
      setUrl(cfg?.direct?.base_url || MODES.direct.defaultUrl);
      setModel(cfg?.direct?.model || "");
    }
    setMsg(null);
  };

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((d) => setHasPin(d.has_pin))
      .catch(() => {});
    fetch("/api/llm/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((cfg) => {
        setSaved(cfg);
        setHasKey(cfg.has_key);
        applyMode(cfg.mode, cfg);
      })
      .catch(() => setMsg({ type: "err", text: "Could not load settings." }));
  }, []);

  const call = async (path, method, body) => {
    const r = await fetch(path, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.detail || "Request failed");
    return data;
  };

  const handleUnlockPin = async (pin) => {
    setBusy(true); setPinError(null);
    try {
      await call("/api/auth/pin/verify", "POST", { pin });
      setIsUnlocked(true);
    } catch {
      setPinError("Incorrect PIN");
    } finally {
      setBusy(false);
    }
  };

  const handleSavePin = async (pin) => {
    setBusy(true); setPinError(null);
    try {
      if (!hasPin) {
        await call("/api/auth/pin/set", "POST", { pin });
        setHasPin(true);
        setIsUnlocked(true);
      } else {
        await call("/api/auth/pin/verify", "POST", { pin });
      }
      
      const res = await call("/api/llm/settings", "PUT", {
        mode, base_url: url, model, api_key: key || null,
      });
      setHasKey(res.has_key);
      setKey("");
      setShowSavePad(false);
      setMsg({ type: "ok", text: "Settings saved." });
    } catch (e) {
      setPinError(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true); setMsg(null);
    try {
      const res = await call("/api/llm/test", "POST");
      setMsg({ type: "ok", text: `Connection successful: ${res.model}` });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const m = MODES[mode];
  const isLocked = hasPin && !isUnlocked;

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Mode Tabs */}
      <div className="seg-control" style={{ marginBottom: 24 }}>
        {Object.entries(MODES).map(([id, v]) => (
          <button
            key={id}
            className={`seg-btn${mode === id ? " active" : ""}`}
            onClick={() => applyMode(id, saved)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Settings Form Container */}
      <div className="panel" style={{ padding: 24, position: "relative", minHeight: 320 }}>
        
        {isLocked && !showSavePad && (
          <PinPad label="Unlock Settings" onSubmit={handleUnlockPin} busy={busy} error={pinError} />
        )}

        {showSavePad && (
          <PinPad
            label={hasPin ? "Confirm PIN to Save" : "Create PIN"}
            onSubmit={handleSavePin}
            busy={busy}
            error={pinError}
            onCancel={() => setShowSavePad(false)}
          />
        )}

        <div style={{
          filter: (isLocked || showSavePad) ? "blur(4px)" : "none",
          pointerEvents: (isLocked || showSavePad) ? "none" : "auto",
          transition: "filter var(--t)"
        }}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>{m.hint}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label>{m.urlLabel}</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={m.urlPlaceholder} />
            </div>

            <div>
              <label>
                API Key
                {hasKey && <span style={{ marginLeft: 8, color: "var(--ink-soft)", fontWeight: 400 }}>(Saved. Leave blank to keep.)</span>}
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type={showKey ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder={hasKey ? "••••••••••••••••" : "Paste API key"}
                  autoComplete="off"
                />
                <button type="button" className="btn btn-secondary" onClick={() => setShowKey(!showKey)}>
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label>{m.modelLabel}</label>
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder={m.modelPlaceholder} />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 32, alignItems: "center" }}>
            <button
              className="btn btn-primary"
              onClick={() => { setPinError(null); setShowSavePad(true); }}
              disabled={busy}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              {hasPin ? "Enter PIN & Save" : "Create PIN & Save"}
            </button>
            <button className="btn btn-secondary" onClick={test} disabled={busy}>
              {busy ? "Testing…" : "Test Connection"}
            </button>
            {msg && (
              <span className={`inline-result ${msg.type === "ok" ? "ok" : "err"}`} style={{ marginLeft: "auto" }}>
                {msg.text}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
