"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LibraryPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleDownloadPDF = async (e, projectId) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/project/${projectId}`);
      const data = await res.json();
      
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.createElement('div');
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>Project: ${data.topic}</h1>
          <p><strong>Context:</strong> ${data.context}</p>
          <hr/>
          <h2>Uploaded Papers</h2>
          <ul>
            ${data.papers?.map(p => `<li><strong>${p.filename}</strong>: ${p.relevance} relevance - ${p.reason}</li>`).join('') || "<li>No papers</li>"}
          </ul>
          <hr/>
          <h2>Chat History</h2>
          ${data.chat_history?.map(msg => `<p><strong>${msg.role.toUpperCase()}:</strong> ${msg.content}</p>`).join('') || "<p>No chat history</p>"}
        </div>
      `;
      
      const opt = {
        margin: 1,
        filename: `Project_${projectId}_Details.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      
      html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error(err);
      alert("Failed to download PDF");
    }
  };

  const handleClearChat = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to clear the chat history for this project?")) return;
    
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      
      const res = await fetch("/api/project/clear-chat", {
        method: "POST",
        body: formData
      });
      if (res.ok) alert("Chat history cleared!");
      else alert("Failed to clear chat");
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? This cannot be undone.")) return;
    
    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      
      const res = await fetch("/api/project/delete", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== projectId));
      } else {
        alert("Failed to delete project");
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: "1200px" }}>
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Your Project Library</h1>
        <p style={{ color: "var(--text-secondary)" }}>Access your previous AI analysis sessions and chats.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>Loading your library...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h2 style={{ marginBottom: "1rem", color: "var(--text-primary)" }}>Your library is empty.</h2>
          <p style={{ marginBottom: "2rem", color: "var(--text-secondary)" }}>
            Start a new research session to evaluate your literature with AI.
          </p>
          <Link href="/dashboard" className="btn btn-primary" style={{ textDecoration: "none", padding: "0.8rem 1.5rem" }}>
            Create a New Project
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "2rem" }}>
          {projects.map((proj) => (
            <div 
              key={proj.id} 
              className="glass-card" 
              style={{ 
                padding: "2rem", 
                cursor: "pointer", 
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                position: "relative"
              }}
              onClick={() => router.push(`/project/${proj.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.borderColor = "var(--accent-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>ID: {proj.id.split("-")[0]}</div>
                <button 
                  onClick={(e) => handleDeleteProject(e, proj.id)}
                  style={{ 
                    background: "rgba(255,255,255,0.05)", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: "50%", 
                    color: "var(--text-secondary)", 
                    cursor: "pointer", 
                    width: "28px", 
                    height: "28px", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    fontSize: "1.4rem", 
                    lineHeight: "1",
                    transition: "all 0.2s",
                    padding: "0"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)"; e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                  title="Delete Project"
                >
                  ×
                </button>
              </div>

              <h3 style={{ fontSize: "1.4rem", color: "var(--text-primary)", marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {proj.topic}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", flex: "1" }}>
                {proj.context}
              </p>
              
              <div style={{ marginTop: "1.5rem", color: "var(--accent-primary)", fontWeight: "bold", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Resume Project →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
