"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Topbar from "../../components/Navbar";
import ProviderSettings from "../../components/ProviderSettings";

function RelativeTime({ iso }) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs === 1 ? "1 hour" : hrs + " hours"} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function ConfirmDialog({ project, onConfirm, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(255, 255, 255, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="panel" style={{ padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
        <h3 id="confirm-title" style={{ marginBottom: 12 }}>
          Delete "{project.topic}"?
        </h3>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", marginBottom: 24 }}>
          This will remove the project and its {project.papers_count || 0} papers permanently. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn" style={{ color: "red", borderColor: "red" }} onClick={onConfirm} autoFocus>Delete project</button>
        </div>
      </div>
    </div>
  );
}

function OverflowMenu({ project, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        className="btn btn-ghost btn-sm"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        ···
      </button>
      {open && (
        <div className="panel" role="menu" style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, padding: 4, zIndex: 150, minWidth: 140, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
          <button role="menuitem" className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", border: "none" }} onClick={() => { setOpen(false); onRename(); }}>
            Rename project
          </button>
          <button role="menuitem" className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", border: "none" }} onClick={() => { setOpen(false); onDelete(); }}>
            Delete project
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardContent() {
  const [showSettings, setShowSettings] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerStatus, setProviderStatus] = useState(null);
  const [creating, setCreating] = useState(false);
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("create") === "true") setCreating(true);
    fetchProjects();
    fetchProvider();
  }, [searchParams]);

  const fetchProjects = async () => {
    try {
      const r = await fetch("/api/projects");
      if (r.ok) {
        const d = await r.json();
        setProjects(d.projects || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProvider = async () => {
    try {
      const r = await fetch("/api/llm/settings");
      if (r.ok) {
        const d = await r.json();
        setProviderStatus(d);
      }
    } catch {}
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!topic.trim() || !context.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("topic", topic);
      fd.append("context", context);
      const r = await fetch("/api/project/create", { method: "POST", body: fd });
      if (!r.ok) throw new Error();
      const d = await r.json();
      router.push(`/project/${d.projectId}`);
    } catch {
      setSubmitting(false);
      alert("Could not create project. Make sure the backend is running.");
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const fd = new FormData();
    fd.append("projectId", toDelete.id);
    await fetch("/api/project/delete", { method: "POST", body: fd });
    setToDelete(null);
    fetchProjects();
  };

  const doRename = async () => {
    if (!renaming || !renameVal.trim()) return;
    await fetch(`/api/project/${renaming.id}/rename`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: renameVal.trim() }),
    }).catch(() => {});
    setRenaming(null);
    fetchProjects();
  };

  // Provider status label
  const providerLabel = providerStatus
    ? providerStatus.mode === "omniroute"
      ? "Local API Hoster"
      : "Direct API key"
    : null;

  return (
    <>
      <Topbar />
      <main className="page-main">
        <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 }}>
            <h1>Projects</h1>
            <button
              className="btn btn-primary"
              onClick={() => setCreating(true)}
              id="new-project-btn"
            >
              New project
            </button>
          </div>

          {providerLabel && (
            <p style={{ fontSize: 13, color: "var(--ink-soft)", paddingBottom: 16, borderBottom: "1px solid var(--rule)", marginBottom: 32 }}>
              AI provider: <strong>{providerLabel}</strong>
              {providerStatus?.base_url ? ` · ${providerStatus.base_url}` : ""}
              {" · "}
              <button 
                onClick={() => setShowSettings(true)}
                style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer", padding: 0, font: "inherit" }}
              >
                Change in settings
              </button>
            </p>
          )}

          {loading ? (
            <div className="empty-state">
              <span className="loading-dots">
                <span className="loading-dot" /><span className="loading-dot" /><span className="loading-dot" />
              </span>
              {" "}Loading projects…
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. Create one, then add your first PDF.</p>
              <button className="btn btn-primary" onClick={() => setCreating(true)} style={{ marginTop: 12 }}>
                Create a project
              </button>
            </div>
          ) : (
            <div className="panel" style={{ overflow: "visible" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "100%" }}>Name</th>
                    <th style={{ whiteSpace: "nowrap" }}>Papers</th>
                    <th style={{ whiteSpace: "nowrap" }}>Last activity</th>
                    <th style={{ width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj.id}>
                      <td>
                        {renaming?.id === proj.id ? (
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              value={renameVal}
                              onChange={(e) => setRenameVal(e.target.value)}
                              style={{ flex: 1 }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") doRename();
                                if (e.key === "Escape") setRenaming(null);
                              }}
                            />
                            <button className="btn btn-primary btn-sm" onClick={doRename}>Save changes</button>
                            <button className="btn btn-sm" onClick={() => setRenaming(null)}>Cancel</button>
                          </div>
                        ) : (
                          <Link
                            href={`/project/${proj.id}`}
                            style={{ color: "var(--ink)", fontWeight: 600, textDecoration: "none" }}
                          >
                            {proj.topic}
                          </Link>
                        )}
                      </td>
                      <td style={{ color: "var(--ink-soft)" }}>
                        {proj.papers_count || 0}
                      </td>
                      <td style={{ color: "var(--ink-soft)" }}>
                        <RelativeTime iso={proj.updated_at || proj.created_at} />
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                          <Link
                            href={`/project/${proj.id}`}
                            className="btn btn-sm"
                          >
                            Open project
                          </Link>
                          <OverflowMenu
                            project={proj}
                            onRename={() => { setRenaming(proj); setRenameVal(proj.topic); }}
                            onDelete={() => setToDelete(proj)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* New project sheet */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(255, 255, 255, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} role="dialog" aria-modal="true" aria-labelledby="create-title">
          <div className="panel" style={{ padding: 32, width: "100%", maxWidth: 560, boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
            <h2 id="create-title" style={{ marginBottom: 24 }}>New project</h2>
            <form onSubmit={createProject}>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="proj-topic">Topic</label>
                <input
                  id="proj-topic"
                  type="text"
                  placeholder="e.g. Traffic sign detection with YOLO"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: 32 }}>
                <label htmlFor="proj-context">Research goal</label>
                <textarea
                  id="proj-context"
                  rows={3}
                  placeholder="What specifically are you trying to find or understand?"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn" onClick={() => setCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          project={toDelete}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 24
        }}>
          <div style={{
            background: "var(--bg)",
            borderRadius: "var(--r-panel)",
            width: "100%", maxWidth: 688,
            maxHeight: "90vh", overflowY: "auto",
            boxShadow: "0 24px 48px rgba(0,0,0,0.2)",
            position: "relative"
          }}>
            <div style={{
              position: "sticky", top: 0, zIndex: 2,
              background: "var(--bg)",
              padding: "16px 24px", borderBottom: "1px solid var(--rule)",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>API Settings</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => {
                setShowSettings(false);
                fetchProvider();
              }}>Close</button>
            </div>
            <div style={{ padding: 24 }}>
              <ProviderSettings />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="empty-state" style={{ paddingLeft: 24 }}>Loading…</div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
