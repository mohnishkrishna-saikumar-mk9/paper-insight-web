"use client";

import { useState } from "react";
import Link from "next/link";
import Topbar from "../../components/Navbar";
import ReactMarkdown from "react-markdown";

export default function DemoPage() {
  const [messages, setMessages] = useState([
    { role: "ai", content: "Hello! I have access to the sample papers below. Ask me a question and I'll cite my sources." }
  ]);
  const [streaming, setStreaming] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);

  const demoPapers = [
    { title: "YOLOv9: Learning What You Want to Learn Using Programmable Gradient Information", relevance: "High" },
    { title: "Attention Is All You Need", relevance: "High" },
    { title: "Deep Residual Learning for Image Recognition", relevance: "Med" }
  ];

  const suggestedQuestions = [
    "What is Programmable Gradient Information (PGI)?",
    "How does the Transformer architecture avoid recurrence?",
    "Why do deep residual networks perform better than plain networks?"
  ];

  const handleSuggest = (q) => {
    if (streaming) return;
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setStreaming(true);
    
    // Fake streaming
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", content: "Programmable Gradient Information (PGI) is a concept introduced in YOLOv9 to solve the information bottleneck problem in deep neural networks. It provides complete input information for the target task to calculate a reliable objective function, yielding reliable gradient information to update network weights.", citations: ["[1]"], confidence: "High" }]);
      setStreaming(false);
    }, 1000);
  };

  return (
    <>
      <Topbar />
      <div className={`workspace ${activeCitation ? "source-open" : ""}`}>
        
        {/* Rail */}
        <aside className="rail">
          <div className="rail-header">
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>Sample Papers</span>
          </div>
          <div className="rail-body">
            <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--ink-soft)" }}>These are fictional samples for the demo.</p>
            {demoPapers.map((p, i) => (
              <div key={i} className="doc-item">
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, marginBottom: 4 }}>{p.title}</p>
                  <span className={`badge ${p.relevance === "High" ? "high" : "med"}`}>{p.relevance} match</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Pane */}
        <main className="conv-pane">
          <div className="conv-header">
            <span style={{ fontWeight: 600, fontSize: 15 }}>Interactive Demo</span>
          </div>
          <div className="conv-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.role === "user" ? "msg-user" : "msg-ai"}`}>
                <div className="msg-bubble">
                  {m.role === "user" ? (
                    <p>{m.content}</p>
                  ) : (
                    <div className="read-text">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                      {m.citations && (
                        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                          {m.citations.map((c, j) => (
                            <button key={j} className="btn btn-sm" onClick={() => setActiveCitation(c)}>View {c}</button>
                          ))}
                        </div>
                      )}
                      {m.confidence && (
                        <div style={{ marginTop: 16, borderTop: "1px solid var(--rule)", paddingTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>Confidence: {m.confidence}</span>
                          <div style={{ display: "flex", gap: 2, height: 6, width: 40 }}>
                            <div style={{ flex: 1, background: "var(--ink)" }}></div>
                            <div style={{ flex: 1, background: "var(--ink)" }}></div>
                            <div style={{ flex: 1, background: m.confidence === "High" ? "var(--ink)" : "var(--rule)" }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {streaming && (
              <div className="msg msg-ai">
                <div className="msg-bubble">
                  <span className="loading-dots">
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                    <span className="loading-dot"></span>
                  </span>
                </div>
              </div>
            )}
            
            {messages.length === 1 && (
              <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 8 }}>
                {suggestedQuestions.map((q, i) => (
                  <button key={i} className="btn" style={{ justifyContent: "flex-start", textAlign: "left" }} onClick={() => handleSuggest(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="composer-bar">
            <div className="composer-inner" style={{ opacity: 0.6, pointerEvents: "none" }}>
              <textarea className="composer-textarea" rows={1} placeholder="Type a question..." disabled />
              <button className="btn btn-primary btn-sm" disabled>Send</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Link href="/dashboard" className="btn btn-primary">Create a real project</Link>
            </div>
          </div>
        </main>

        {/* Source Pane */}
        {activeCitation && (
          <aside className="source-pane">
            <div className="source-header">
              <span style={{ fontWeight: 600, fontSize: 14 }}>Source Passage</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveCitation(null)}>Close</button>
            </div>
            <div className="source-body">
              <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 12 }}>From YOLOv9: Learning What You Want to Learn...</p>
              <div style={{ padding: 16, background: "var(--highlight)", border: "1px solid var(--rule)" }}>
                <p style={{ fontSize: 14, lineHeight: 1.6, fontFamily: "var(--font-read)" }}>
                  ...we propose the concept of <strong>Programmable Gradient Information (PGI)</strong>. PGI aims to provide complete input information for the target task to calculate a reliable objective function, yielding reliable gradient information to update network weights...
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
