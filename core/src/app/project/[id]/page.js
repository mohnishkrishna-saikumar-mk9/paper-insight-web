"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Topbar from "../../../components/Navbar";

// ── Markdown renderer ─────────────────────────────────────────────
function CitationChip({ children, onClick }) {
  return (
    <button
      className="citation-chip"
      onClick={onClick}
      title="View source passage"
      type="button"
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
      {children}
    </button>
  );
}

function MdContent({ content, onCitationClick }) {
  return (
    <div className="read-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => {
            if (href === "citation") {
              return (
                <CitationChip onClick={() => onCitationClick?.(String(children))}>
                  {children}
                </CitationChip>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
          },
          p: ({ children }) => <p style={{ marginBottom: 12 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 20, marginBottom: 12 }}>{children}</ol>,
          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
          h1: ({ children }) => <h3 style={{ marginTop: 20, marginBottom: 8 }}>{children}</h3>,
          h2: ({ children }) => <h3 style={{ marginTop: 20, marginBottom: 8 }}>{children}</h3>,
          h3: ({ children }) => <h3 style={{ marginTop: 16, marginBottom: 8 }}>{children}</h3>,
          table: ({ children }) => (
            <div style={{ marginBottom: 16 }}>
              <table className="data-table" style={{ width: "100%", tableLayout: "fixed", border: "1px solid var(--rule)" }}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead style={{ background: "var(--hover)" }}>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr style={{ borderBottom: "1px solid var(--rule)" }}>{children}</tr>,
          th: ({ children }) => <th style={{ border: "1px solid var(--rule)", padding: "8px 12px", wordWrap: "break-word" }}>{children}</th>,
          td: ({ children }) => <td style={{ border: "1px solid var(--rule)", padding: "8px 12px", wordWrap: "break-word", verticalAlign: "top" }}>{children}</td>,
          code: ({ inline, children }) =>
            inline
              ? <code style={{ fontFamily: "monospace", fontSize: 13, background: "var(--rule)", padding: "2px 4px", borderRadius: 4 }}>{children}</code>
              : <pre style={{ background: "var(--sheet)", border: "1px solid var(--rule)", borderRadius: 6, padding: 12, overflowX: "auto", marginBottom: 12, fontFamily: "monospace", fontSize: 13 }}><code>{children}</code></pre>,
          blockquote: ({ children }) => <blockquote style={{ borderLeft: "2px solid var(--ink)", paddingLeft: 12, color: "var(--ink-soft)", marginBottom: 12 }}>{children}</blockquote>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// ── Confidence meter ──────────────────────────────────────────────
function ConfidenceMeter({ level, sources }) {
  const levels = { High: 3, Medium: 2, Low: 1 };
  const filled = levels[level] || 2;
  return (
    <div className="confidence-row">
      <div
        className="confidence-bar"
        role="meter"
        aria-label={`Confidence: ${level}`}
        aria-valuenow={filled}
        aria-valuemin={1}
        aria-valuemax={3}
        title={sources ? `${sources} supporting sources` : undefined}
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className={`confidence-seg${i <= filled ? " filled" : ""}`} />
        ))}
      </div>
      <span className="confidence-label" style={{ fontSize: 13, color: "var(--ink)" }}>
        {level}
      </span>
      {sources && (
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          {sources} {sources === 1 ? "source" : "sources"}
        </span>
      )}
      {level === "Low" && (
        <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
          · Few matching passages. Check the sources.
        </span>
      )}
    </div>
  );
}

// ── Agent log ─────────────────────────────────────────────────────
function AgentLog({ logs }) {
  if (!logs?.length) return null;
  return (
    <div className="agent-log">
      {logs.map((log, i) => {
        const parts = typeof log === "string" ? log.split("] ") : [];
        const label = parts.length > 1 ? parts[1] : log;
        const state = typeof log === "string" && log.includes("✓") ? "done" : typeof log === "string" && log.includes("✗") ? "retried" : "done";
        return (
          <div key={i} className="agent-step">
            <div className={`agent-dot ${state}`} aria-hidden="true" />
            <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Plan tree ─────────────────────────────────────────────────────
function PlanTree({ plan, logs }) {
  if (!plan) return null;
  const steps = typeof plan === "string" ? plan.split("\n").filter(Boolean) : Array.isArray(plan) ? plan : [];
  
  let currentStepIndex = -1;
  let isSynthesizing = false;
  if (logs) {
    for (const log of logs) {
       const match = typeof log === "string" && log.match(/--- Investigating Sub-Query (\d+):/);
       if (match) {
         currentStepIndex = Math.max(currentStepIndex, parseInt(match[1], 10) - 1);
       }
       if (typeof log === "string" && log.includes("Synthesizing Final Report")) {
         isSynthesizing = true;
       }
    }
  }

  return (
    <div className="plan-tree">
      {steps.map((step, i) => {
        const isIndent = typeof step === "string" && (step.startsWith("  ") || step.startsWith("\t"));
        const label = typeof step === "string" ? step.trim() : step.label || JSON.stringify(step);
        
        const done = (typeof step === "object" && step.done) || isSynthesizing || currentStepIndex > i;
        const inProgress = currentStepIndex === i && !isSynthesizing;
        
        return (
          <div key={i} className={`plan-step${isIndent ? " indent" : ""}`} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <span className="plan-num" style={{ minWidth: 20, color: "var(--ink-soft)" }}>{isIndent ? "↳" : `${i + 1}.`}</span>
            <span className="plan-label" style={{ color: done ? "var(--ink-soft)" : "var(--ink)", flex: 1 }}>{label}</span>
            {done && (
              <span className="plan-icon" style={{ color: "var(--ink)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            )}
            {inProgress && <span className="loading-dots" style={{ alignSelf: "center", transform: "translateY(2px)" }}><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /></span>}
          </div>
        );
      })}
      {isSynthesizing && (
        <div className="plan-step" style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 12 }}>
          <span className="plan-num" style={{ minWidth: 20, color: "var(--ink-soft)" }}>★</span>
          <span className="plan-label" style={{ color: "var(--ink)", flex: 1, fontWeight: 600 }}>Synthesizing final report...</span>
          <span className="loading-dots" style={{ alignSelf: "center", transform: "translateY(2px)" }}><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /></span>
        </div>
      )}
    </div>
  );
}

// ── Frames (paper frame cards) ────────────────────────────────────
function FrameCard({ frame }) {
  const fields = [
    ["Title", frame.title],
    ["Authors", frame.authors],
    ["Year", frame.year],
    ["Method", frame.method],
    ["Dataset", frame.dataset],
    ["Metrics", frame.metrics],
    ["Limitations", frame.limitations],
  ];
  return (
    <div className="frame-card">
      <dl>
        {fields.map(([key, val]) => (
          <><dt key={`dt-${key}`}>{key}</dt><dd key={`dd-${key}`}>{val || <em style={{ color: "var(--ink-soft)" }}>Not stated in paper</em>}</dd></>
        ))}
      </dl>
    </div>
  );
}

// ── Debate view ───────────────────────────────────────────────────
function DebateView({ debate }) {
  if (!debate) return null;
  return (
    <div>
      <div className="debate-grid">
        <div>
          <p className="debate-col-header debate-col-for">For</p>
          {(debate.for_args || debate.for || []).map((arg, i) => (
            <p key={i} style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              {typeof arg === "string" ? arg : arg.argument}
            </p>
          ))}
        </div>
        <div>
          <p className="debate-col-header debate-col-against">Against</p>
          {(debate.against_args || debate.against || []).map((arg, i) => (
            <p key={i} style={{ fontSize: 14, marginBottom: 8, lineHeight: 1.5 }}>
              {typeof arg === "string" ? arg : arg.argument}
            </p>
          ))}
        </div>
      </div>
      {(debate.verdict || debate.judge) && (
        <div className="debate-judge">
          <strong style={{ fontSize: 13 }}>Verdict: </strong>
          <span style={{ fontSize: 14 }}>{debate.verdict || debate.judge}</span>
        </div>
      )}
    </div>
  );
}

// ── Main project page ─────────────────────────────────────────────
export default function ProjectPage() {
  const { id: projectId } = useParams();

  // Papers state
  const [papers, setPapers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Chat state
  const [messages, setMessages] = useState([{
    role: "ai",
    content: "Hello! I have access to all your indexed papers. Ask me anything!",
  }]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // Source pane
  const [activeCitation, setActiveCitation] = useState(null);

  // Advanced tabs
  const [activeTab, setActiveTab] = useState("chat");

  // Gaps
  const [gaps, setGaps] = useState(null);
  const [gapsLoading, setGapsLoading] = useState(false);

  // Literature review
  const [litReview, setLitReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Deep research
  const [deepTopic, setDeepTopic] = useState("");
  const [deepTaskId, setDeepTaskId] = useState(null);
  const [deepTaskStatus, setDeepTaskStatus] = useState(null);
  const [deepLogs, setDeepLogs] = useState([]);
  const [deepReport, setDeepReport] = useState(null);
  const [deepPlan, setDeepPlan] = useState(null);

  // Frames
  const [frames, setFrames] = useState(null);
  const [framesLoading, setFramesLoading] = useState(false);

  // Tuning
  const [tuneResult, setTuneResult] = useState(null);
  const [tuneLoading, setTuneLoading] = useState(false);

  // Debate
  const [debateTopic, setDebateTopic] = useState("");
  const [debateData, setDebateData] = useState(null);
  const [debateLoading, setDebateLoading] = useState(false);

  // History
  const [historyTasks, setHistoryTasks] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(null);

  // Mobile pane
  const [mobPane, setMobPane] = useState("chat");

  // Resizable sidebar
  const [railWidth, setRailWidth] = useState(260);

  const handleMouseMoveResizer = useCallback((e) => {
    setRailWidth(Math.max(200, Math.min(e.clientX, 600)));
  }, []);

  const handleMouseUpResizer = useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMoveResizer);
    document.removeEventListener("mouseup", handleMouseUpResizer);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, [handleMouseMoveResizer]);

  const handleMouseDownResizer = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMoveResizer);
    document.addEventListener("mouseup", handleMouseUpResizer);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // ── Fetch project data ─────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/project/${projectId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        if (d.papers?.length) setPapers(d.papers);
        if (d.chat_history?.length) {
          setMessages((prev) => [prev[0], ...d.chat_history]);
        }
      })
      .catch(() => {});

    // Also fetch tasks to auto-resume Deep Research
    fetch(`/api/project/${projectId}/tasks`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d || !d.tasks) return;
        
        // Auto-resume Literature Review
        const litTask = d.tasks.find(t => t.topic === "Literature Review");
        if (litTask && litTask.status.toLowerCase() === "completed") {
          fetch(`/api/tasks/${litTask.task_id}`)
            .then(tr => tr.ok ? tr.json() : null)
            .then(td => {
              if (td && td.report) {
                setLitReview(td.report);
              }
            });
        }

        // Find the most recent deep research task
        const drTask = d.tasks.find(t => t.topic !== "Literature Review");
        if (drTask) {
          const status = drTask.status.toLowerCase();
          if (status === "pending" || status === "running" || status === "in_progress") {
            setDeepTopic(drTask.topic);
            setDeepTaskId(drTask.task_id);
            setDeepTaskStatus(status);
            setActiveTab("research"); // Optionally switch to it
          } else if (status === "completed") {
            setDeepTopic(drTask.topic);
            setDeepTaskId(drTask.task_id);
            setDeepTaskStatus("completed");
            // Fetch the full report for this completed task
            fetch(`/api/tasks/${drTask.task_id}`)
              .then(tr => tr.ok ? tr.json() : null)
              .then(td => {
                if (td && td.report) {
                  setDeepReport(td.report);
                  if (td.plan) setDeepPlan(td.plan);
                  if (td.logs) setDeepLogs(td.logs);
                }
              });
          }
        }
      })
      .catch(() => {});
  }, [projectId]);

  // ── Auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    if (autoScroll && messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 80);
  };

  // ── Deep research polling ──────────────────────────────────────
  useEffect(() => {
    if (!deepTaskId || deepTaskStatus === "completed" || deepTaskStatus === "failed") return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`http://localhost:8000/api/tasks/${deepTaskId}`);
        if (!r.ok) return;
        const task = await r.json();
        const status = task.status.toLowerCase();
        setDeepTaskStatus(status);
        if (task.logs) setDeepLogs(task.logs);
        if (task.plan) setDeepPlan(task.plan);
        if (status === "completed") { setDeepReport(task.report); clearInterval(iv); }
      } catch {}
    }, 2000);
    return () => clearInterval(iv);
  }, [deepTaskId, deepTaskStatus]);

  // ── Upload ─────────────────────────────────────────────────────
  const doUpload = async (files) => {
    const arr = Array.from(files).slice(0, 10);
    setUploading(true);
    
    const fd = new FormData();
    fd.append("projectId", projectId);
    for (const file of arr) {
      fd.append("files", file);
      setUploadProgress((p) => ({ ...p, [file.name]: "uploading" }));
    }
    
    try {
      const r = await fetch("http://localhost:8000/api/upload", { method: "POST", body: fd });
      if (r.ok) {
        const d = await r.json();
        if (d.results?.length) setPapers((prev) => [...prev, ...d.results]);
        for (const file of arr) setUploadProgress((p) => ({ ...p, [file.name]: "done" }));
      } else {
        for (const file of arr) setUploadProgress((p) => ({ ...p, [file.name]: "failed" }));
      }
    } catch {
      for (const file of arr) setUploadProgress((p) => ({ ...p, [file.name]: "failed" }));
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileInput = (e) => { if (e.target.files?.length) doUpload(e.target.files); };
  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length) doUpload(files);
  };

  // ── Delete paper ───────────────────────────────────────────────
  const handleDeletePaper = async (filename) => {
    const fd = new FormData();
    fd.append("projectId", projectId);
    fd.append("filename", filename);
    const r = await fetch("/api/paper/delete", { method: "POST", body: fd }).catch(() => null);
    if (r?.ok) setPapers((p) => p.filter((x) => x.filename !== filename));
  };

  // ── Chat ───────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || chatLoading) return;
    const msg = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setInput("");
    setAutoScroll(true);
    setChatLoading(true);
    try {
      const fd = new FormData();
      fd.append("projectId", projectId);
      fd.append("message", msg);
      const r = await fetch("/api/chat", { method: "POST", body: fd });
      const d = r.ok ? await r.json() : null;
      setMessages((prev) => [...prev, {
        role: "ai",
        content: d?.response || "I couldn't generate a response. Please try again.",
        citations: d?.citations,
        confidence: d?.confidence,
        confidence_sources: d?.confidence_sources,
        reasoning: d?.reasoning,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: "ai",
        content: "Something went wrong. Check that the backend is running.",
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Advanced features ──────────────────────────────────────────
  const handleGenerateGaps = async () => {
    setGapsLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/generate_gaps`, { method: "POST" });
      if (r.ok) setGaps((await r.json()).gaps);
    } catch {}
    setGapsLoading(false);
  };

  const handleFetchFrames = async () => {
    setFramesLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/frames`);
      if (r.ok) setFrames((await r.json()).frames);
    } catch {}
    setFramesLoading(false);
  };

  const handleExportBackup = () => {
    window.location.href = `http://localhost:8000/api/project/${projectId}/export`;
  };

  const handleRunTuning = async () => {
    setTuneLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/tune`, { method: "POST" });
      if (r.ok) setTuneResult((await r.json()).result);
    } catch {}
    setTuneLoading(false);
  };

  const handleRunDebate = async () => {
    if (!debateTopic.trim()) return;
    setDebateLoading(true);
    try {
      const fd = new FormData();
      fd.append("topic", debateTopic);
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/debate`, { method: "POST", body: fd });
      if (r.ok) setDebateData((await r.json()).debate);
    } catch {}
    setDebateLoading(false);
  };

  const handleGenerateReview = async () => {
    setReviewLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/generate_review`, { method: "POST" });
      if (r.ok) setLitReview((await r.json()).review);
    } catch {}
    setReviewLoading(false);
  };

  const handleStartDeepResearch = async () => {
    if (!deepTopic.trim()) return;
    setDeepTaskStatus("starting");
    setDeepLogs([]); setDeepReport(null); setDeepPlan(null);
    try {
      const fd = new FormData();
      fd.append("topic", deepTopic);
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/deep_research`, { method: "POST", body: fd });
      if (r.ok) setDeepTaskId((await r.json()).task_id);
      else setDeepTaskStatus("error");
    } catch { setDeepTaskStatus("error"); }
  };

  const handleGetHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/tasks`);
      if (r.ok) setHistoryTasks((await r.json()).tasks || []);
    } catch {}
    setHistoryLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (activeTab === "history") { handleGetHistory(); setSelectedReport(null); }
  }, [activeTab, handleGetHistory]);

  const loadReport = async (taskId) => {
    try {
      const r = await fetch(`http://localhost:8000/api/tasks/${taskId}`);
      if (r.ok) setSelectedReport(await r.json());
    } catch {}
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Delete this report? This can't be undone.")) return;
    const r = await fetch(`http://localhost:8000/api/tasks/${taskId}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) {
      setHistoryTasks((p) => p.filter((t) => t.task_id !== taskId));
      if (selectedReport?.task_id === taskId) setSelectedReport(null);
    }
  };

  const handleSaveToHistory = async (topic, report) => {
    setSaveLoading(true);
    try {
      const r = await fetch(`http://localhost:8000/api/project/${projectId}/save_to_history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, report }),
      });
      setSavedMsg(r.ok ? { ok: true, text: "Report saved to history." } : { ok: false, text: "Failed to save report." });
      setTimeout(() => setSavedMsg(null), 3000);
    } catch {
      setSavedMsg({ ok: false, text: "Error saving report." });
    }
    setSaveLoading(false);
  };

  const downloadMd = (content, name) => {
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([content], { type: "text/markdown" })),
      download: name || "report.md",
    });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  // ── Determine if source pane is open ──────────────────────────
  const sourceOpen = !!activeCitation;
  const statusClass = sourceOpen ? "workspace source-open" : "workspace";

  // ── Paper status ───────────────────────────────────────────────
  const getPaperStatus = (p) => {
    if (p.status === "indexing" || p.relevance === "Indexing") return "loading";
    if (p.status === "failed" || p.relevance === "Error") return "failed";
    return "ready";
  };

  const getRelevanceLabel = (p) => p.relevance || p.status || "Ready";

  return (
    <>
      <Topbar />
      <div className={statusClass} style={{ "--rail-w": `${railWidth}px` }}>

        {/* ── Papers rail ─────────────────────────────────────── */}
        <aside className={`rail${mobPane === "papers" ? " mob-active" : ""}`} aria-label="Papers">
          <div className="rail-resizer" onMouseDown={handleMouseDownResizer} />
          <div className="rail-header">
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
              {papers.length} paper{papers.length !== 1 ? "s" : ""}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Adding…" : "+ Add"}
            </button>
            <input type="file" multiple accept=".pdf" style={{ display: "none" }} ref={fileInputRef} onChange={handleFileInput} />
          </div>

          <div className="rail-body">
            {/* Drop zone */}
            <div
              className={`upload-zone${dragOver ? " dragging" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Drop PDF files here or click to choose"
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <span>Drop PDFs here or click to choose</span>
            </div>

            {papers.length === 0 ? (
              <div style={{ padding: "24px 16px", fontSize: 13, color: "var(--ink-soft)" }}>
                No papers yet. Drop a PDF here or choose files.
              </div>
            ) : (
              papers.map((paper, i) => {
                const st = getPaperStatus(paper);
                return (
                  <div key={i} className="rail-paper" title={paper.filename}>
                    <input
                      type="checkbox"
                      defaultChecked
                      style={{ accentColor: "var(--accent)", flexShrink: 0, marginTop: 2 }}
                      aria-label={`Include ${paper.filename} in next question`}
                    />
                    <div className="rail-paper-info">
                      <p className="rail-paper-name">{paper.title || paper.filename}</p>
                      <p className="rail-paper-meta">{paper.year || ""}</p>
                    </div>
                    <span className={`paper-status-badge status-${st}`}>
                      {st === "loading" ? "Indexing" : st === "failed" ? "Failed" : getRelevanceLabel(paper)}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => { e.stopPropagation(); handleDeletePaper(paper.filename); }}
                      aria-label={`Remove ${paper.filename}`}
                      style={{ fontSize: 14, padding: "2px 6px" }}
                    >
                      ×
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Conversation pane ────────────────────────────────── */}
        <div className={`conv-pane${mobPane !== "chat" && mobPane !== "research" && mobPane !== "review" && mobPane !== "history" ? "" : ""}`} style={{ display: mobPane !== "chat" && mobPane !== "research" && mobPane !== "review" && mobPane !== "history" ? "none" : "flex" }}>

          {/* Tabs */}
          <div className="conv-tabs" role="tablist" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              {[
                ["chat", "Chat"],
                ["research", "Deep research"],
                ["review", "Literature review"],
                ["history", "History"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeTab === id}
                  className={`conv-tab${activeTab === id ? " active" : ""}`}
                  onClick={() => { setActiveTab(id); setMobPane(id); }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportBackup}
              title="Download full project backup (Chat, Papers, Research History)"
              style={{ marginRight: 16 }}
            >
              Export Backup
            </button>
          </div>

          {/* ── Chat tab ──────────────────────────────────────── */}
          {activeTab === "chat" && (
            <>
              <div
                className="conv-messages"
                ref={messagesRef}
                onScroll={handleScroll}
                aria-live="polite"
                aria-label="Conversation"
              >
                <div style={{ maxWidth: 860, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
                  {messages.map((msg, i) =>
                    msg.role === "user" ? (
                      <div key={i} className="msg-user">
                        <p style={{ fontSize: 15 }}>{msg.content}</p>
                      </div>
                    ) : (
                      <MessageAI key={i} msg={msg} onCitationClick={setActiveCitation} />
                    )
                  )}
                  {chatLoading && (
                    <div style={{ display: "flex", gap: 4, padding: "4px 0" }} aria-label="Generating answer">
                      <span className="loading-dots">
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                        <span className="loading-dot" />
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Composer */}
              <div className="composer-bar">
                <form onSubmit={handleSend}>
                  <div className="composer-inner" style={{ maxWidth: 860, width: "100%", margin: "0 auto" }}>
                    <textarea
                      ref={inputRef}
                      className="composer-textarea"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = Math.min(e.target.scrollHeight, 144) + "px";
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about your papers… (Shift+Enter for new line)"
                      aria-label="Chat message"
                      rows={1}
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !input.trim()}
                      aria-label="Send message"
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: (chatLoading || !input.trim()) ? "var(--rule)" : "var(--ink)",
                        color: "var(--bg)", border: "none", cursor: (chatLoading || !input.trim()) ? "default" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        transition: "background var(--t)"
                      }}
                    >
                      {chatLoading ? (
                        <div style={{ width: 10, height: 10, background: "currentColor", borderRadius: 2 }} />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="19" x2="12" y2="5"></line>
                          <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* ── Deep research tab ─────────────────────────────── */}
          {activeTab === "research" && (
            <div className="conv-messages">
              <div style={{ maxWidth: "100%", padding: "0 20px" }}>
                <h3 style={{ marginBottom: 8 }}>Deep research</h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
                  The agent will plan, search and write a comprehensive report grounded in your papers.
                </p>

                {!deepTaskStatus ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label htmlFor="deep-topic">Research topic</label>
                      <textarea
                        id="deep-topic"
                        rows={2}
                        value={deepTopic}
                        onChange={(e) => setDeepTopic(e.target.value)}
                        placeholder="What do you want to investigate deeply?"
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleStartDeepResearch}
                      disabled={!deepTopic.trim()}
                      style={{ alignSelf: "flex-start" }}
                    >
                      Start research
                    </button>
                  </div>
                ) : deepTaskStatus === "completed" && deepReport ? (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => downloadMd(deepReport, `${deepTopic}.md`)}>
                        Download .md
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSaveToHistory(deepTopic, deepReport)}
                        disabled={saveLoading}
                      >
                        {saveLoading ? "Saving…" : "Save to history"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setDeepTaskStatus(null); setDeepReport(null); }}>
                        New research
                      </button>
                    </div>
                    {savedMsg && <p className={`inline-result ${savedMsg.ok ? "ok" : "err"}`} style={{ marginBottom: 12 }}>{savedMsg.text}</p>}
                    
                    {deepPlan && (
                      <details style={{ marginBottom: 24 }}>
                        <summary style={{ fontSize: 14, color: "var(--ink-soft)", cursor: "pointer", userSelect: "none" }}>
                          View research plan & steps
                        </summary>
                        <div style={{ marginTop: 12, padding: 16, background: "var(--paper)", borderRadius: "var(--r-control)", border: "1px solid var(--rule)" }}>
                          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                            Research Plan
                          </p>
                          <PlanTree plan={deepPlan} logs={deepLogs} />
                        </div>
                      </details>
                    )}

                    <MdContent content={deepReport} onCitationClick={setActiveCitation} />
                  </div>
                ) : (
                  <div>
                    {deepTaskStatus === "error" || deepTaskStatus === "failed" ? (
                      <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 12 }}>Research failed. Try again.</p>
                    ) : (
                      <div style={{ marginBottom: 16 }}>
                        <details>
                          <summary style={{ fontSize: 14, color: "var(--ink-soft)", cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center" }}>
                            <span className="loading-dots" style={{ marginRight: 8 }}>
                              <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
                            </span>
                            Running... (click to view internal steps)
                          </summary>
                          <div style={{ marginTop: 12 }}>
                            {deepPlan ? (
                              <div style={{ padding: 16, background: "var(--paper)", borderRadius: "var(--r-control)", border: "1px solid var(--rule)" }}>
                                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
                                  </svg>
                                  Research Plan
                                </p>
                                <PlanTree plan={deepPlan} logs={deepLogs} />
                              </div>
                            ) : (
                              <div style={{ padding: 12, background: "var(--paper)", borderRadius: "var(--r-control)", border: "1px solid var(--rule)" }}>
                                <p style={{ fontSize: 13, color: "var(--ink-soft)" }}>Initializing research agent...</p>
                              </div>
                            )}
                          </div>
                        </details>
                        <div style={{ marginTop: 12 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setDeepTaskStatus(null); setDeepReport(null); setDeepTaskId(null); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Literature review tab ─────────────────────────── */}
          {activeTab === "review" && (
            <div className="conv-messages">
              <div style={{ maxWidth: "100%", padding: "0 20px" }}>
                <h3 style={{ marginBottom: 8 }}>Literature review</h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 20 }}>
                  Generate a structured review of all indexed papers.
                </p>
                {!litReview ? (
                  <button className="btn btn-primary" onClick={handleGenerateReview} disabled={reviewLoading}>
                    {reviewLoading ? (
                      <><span className="loading-dots"><span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" /></span> Reviewing papers…</>
                    ) : "Generate review"}
                  </button>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => downloadMd(litReview, "Literature_Review.md")}>
                        Download .md
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleSaveToHistory("Literature Review", litReview)} disabled={saveLoading}>
                        {saveLoading ? "Saving…" : "Save to history"}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setLitReview(null)}>Regenerate</button>
                    </div>
                    {savedMsg && <p className={`inline-result ${savedMsg.ok ? "ok" : "err"}`} style={{ marginBottom: 12 }}>{savedMsg.text}</p>}
                    <MdContent content={litReview} onCitationClick={setActiveCitation} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── History tab ───────────────────────────────────── */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
              {/* List */}
              <div style={{ width: 260, borderRight: "1px solid var(--rule)", overflowY: "auto", background: "var(--sheet)" }}>
                {historyLoading ? (
                  <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>Loading…</div>
                ) : historyTasks.length === 0 ? (
                  <div style={{ padding: 24, fontSize: 13, color: "var(--ink-soft)" }}>
                    No saved reports. Run Deep research or a Literature review and save it.
                  </div>
                ) : (
                  historyTasks.map((task) => (
                    <div
                      key={task.task_id}
                      className={`history-item${selectedReport?.task_id === task.task_id ? " active" : ""}`}
                      onClick={() => loadReport(task.task_id)}
                    >
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>
                          {task.topic || "Untitled report"}
                        </p>
                        <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                          {task.created_at ? new Date(task.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"}
                          {task.papers_count ? ` · ${task.papers_count} papers` : ""}
                        </p>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.task_id); }}
                        aria-label="Delete report"
                        style={{ fontSize: 14 }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Report reader */}
              <div className="conv-messages" style={{ flex: 1 }}>
                {selectedReport ? (
                  <>
                    <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => downloadMd(selectedReport.report, `${selectedReport.topic}.md`)}>
                        Download .md
                      </button>
                    </div>
                    <MdContent content={selectedReport.report || selectedReport.content || ""} onCitationClick={setActiveCitation} />
                  </>
                ) : (
                  <div className="empty-state" style={{ paddingTop: 48 }}>
                    <p>Select a report from the list to read it.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Source pane ──────────────────────────────────────── */}
        {sourceOpen && (
          <div className={`source-pane${mobPane === "source" ? " mob-active" : ""}`} aria-label="Source passage">
            <div className="source-header">
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Source</p>
                <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>{activeCitation}</p>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setActiveCitation(null)}
                aria-label="Close source pane"
              >
                × Close
              </button>
            </div>
            <div className="source-body">
              {/* Plain text passage (accessibility) */}
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 12 }}>Cited passage:</p>
              <blockquote
                style={{
                  background: "var(--highlight)",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.65,
                  fontFamily: "var(--font-read)",
                  borderLeft: "none",
                }}
                aria-label="Highlighted passage"
              >
                <p style={{ margin: 0, color: "var(--ink)" }}>
                  Passage from <strong>{activeCitation}</strong> will appear here when your backend returns full citation text.
                </p>
              </blockquote>
              <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12 }}>
                The full PDF viewer will open at the relevant page when the backend returns a page number.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile bottom tab bar ────────────────────────────────── */}
      <div className="mob-tabs" role="navigation" aria-label="Mobile navigation">
        {[
          ["papers", "📄", "Papers"],
          ["chat", "💬", "Chat"],
          ["research", "🔬", "Research"],
          ["source", "📌", "Source"],
        ].map(([id, icon, label]) => (
          <button
            key={id}
            className={`mob-tab${mobPane === id ? " active" : ""}`}
            onClick={() => setMobPane(id)}
            aria-label={label}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

// ── AI message with all sub-components ───────────────────────────
function MessageAI({ msg, onCitationClick }) {
  const [showReasoning, setShowReasoning] = useState(false);

  const extractCitations = (content) => {
    const matches = [];
    const re = /\[([^\]]+)\]\(citation\)/g;
    let m;
    while ((m = re.exec(content)) !== null) matches.push(m[1]);
    return matches;
  };

  const chips = msg.citations || extractCitations(msg.content || "");

  return (
    <div className="msg-ai">
      <MdContent content={msg.content} onCitationClick={onCitationClick} />

      {chips.length > 0 && (
        <div className="citation-chips">
          {chips.map((c, i) => (
            <CitationChip key={i} onClick={() => onCitationClick?.(c)}>{c}</CitationChip>
          ))}
        </div>
      )}

      {msg.confidence && (
        <ConfidenceMeter
          level={msg.confidence}
          sources={msg.confidence_sources}
        />
      )}

      {msg.reasoning && (
        <>
          <button
            className="reasoning-toggle"
            onClick={() => setShowReasoning((s) => !s)}
            aria-expanded={showReasoning}
          >
            <span aria-hidden="true">{showReasoning ? "▾" : "▸"}</span>
            {showReasoning ? "Hide reasoning" : "Show reasoning"}
          </button>
          {showReasoning && (
            <div className="reasoning-panel">
              {(Array.isArray(msg.reasoning) ? msg.reasoning : [msg.reasoning]).map((r, i) => (
                <div key={i} className="reasoning-step">
                  <span style={{ color: "var(--ink-soft)" }}>{typeof r === "string" ? r : `${r.rule} → ${r.conclusion}`}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

