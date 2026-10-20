"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="landing-page">
      <style dangerouslySetInnerHTML={{ __html: `
        .landing-page {
          --bg: #FFFFFF;
          --sheet: #FFFFFF;
          --ink: #000000;
          --soft: #595959;
          --rule: #D6D6D6;
          --accent: #000000;
          --accent-ink: #FFFFFF;
          --font-ui: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
          
          background: var(--bg);
          color: var(--ink);
          font-family: var(--font-ui);
          font-size: 16px;
          line-height: 1.55;
          padding-inline: clamp(16px, 4vw, 40px);
          padding-block: 0 56px;
          min-height: 100vh;
        }

        .landing-page * { box-sizing: border-box; }
        .landing-page .wrap { max-width: 1180px; margin-inline: auto; }
        .landing-page h1, .landing-page h2 { text-wrap: balance; font-weight: 600; line-height: 1.15; margin: 0; }
        .landing-page p { margin: 0; }
        .landing-page a { color: var(--accent); }

        /* header */
        .landing-page .top { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-block: 20px; flex-wrap: wrap; }
        .landing-page .brand { font-weight: 600; font-size: 1.15rem; letter-spacing: -.01em; }
        .landing-page .nav { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .landing-page .nav a { color: var(--soft); text-decoration: none; font-size: .95rem; }
        .landing-page .nav a:hover { color: var(--ink); }

        /* hero */
        .landing-page .hero { padding-block: 80px 60px; display: grid; gap: 24px; max-width: 800px; margin: 0 auto; text-align: center; justify-items: center; }
        .landing-page .hero h1 { font-size: clamp(2.5rem, 1.5rem + 4vw, 4rem); letter-spacing: -.02em; }
        .landing-page .lede { color: var(--soft); font-size: 1.25rem; max-width: 60ch; }
        .landing-page .cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
        .landing-page .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; border: 1px solid var(--rule); color: var(--ink); text-decoration: none; font-weight: 500; font-size: 1rem; transition: all 150ms ease; }
        .landing-page .btn:hover { border-color: var(--soft); }
        .landing-page .btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
        .landing-page .btn.primary:hover { opacity: .88; }

        /* sections */
        .landing-page .sec { padding-top: 72px; display: grid; gap: 28px; }
        .landing-page .sec h2 { font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.2rem); letter-spacing: -.01em; max-width: 24ch; }
        .landing-page .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; counter-reset: s; }
        .landing-page .steps li { border-top: 1px solid var(--rule); padding-top: 14px; counter-increment: s; }
        .landing-page .steps li::before { content: counter(s); font-weight: 600; color: var(--accent); display: block; margin-bottom: 6px; }
        .landing-page .steps b, .landing-page .feat dt { display: block; font-weight: 600; margin-bottom: 4px; }
        .landing-page .steps span, .landing-page .feat dd { color: var(--soft); margin: 0; }
        .landing-page .feat { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 48px; }
        .landing-page .feat div { border-top: 1px solid var(--rule); padding-block: 16px 20px; }
        .landing-page .priv p { color: var(--soft); max-width: 62ch; font-size: 1.05rem; }
        .landing-page footer { margin-top: 72px; padding-top: 20px; border-top: 1px solid var(--rule); color: var(--soft); font-size: .88rem; display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

        @media (max-width: 768px) {
          .landing-page .steps { grid-template-columns: minmax(0, 1fr); gap: 20px; }
          .landing-page .feat { grid-template-columns: minmax(0, 1fr); }
        }
      `}} />

      <div className="wrap">
        <header className="top">
          <div className="brand">PaperInsight AI</div>
          <nav className="nav" aria-label="Page">
            <a href="#how">How it works</a>
            <a href="#inside">What is inside</a>
          </nav>
        </header>

        <section className="hero">
          <h1>Read your papers.<br/>Check every answer.</h1>
          <p className="lede">PaperInsight answers questions about your research PDFs and shows the exact passage behind each claim.</p>
          <div className="cta">
            <Link className="btn primary" href="/dashboard">Go to App</Link>
            <Link className="btn" href="/demo">Try the demo</Link>
          </div>
        </section>

        <section className="sec" id="how">
          <h2>From a folder of PDFs to a checked answer</h2>
          <ol className="steps">
            <li><b>Add your PDFs</b><span>Each paper is read and indexed on your computer.</span></li>
            <li><b>Ask a question</b><span>The answer is written from your papers only, with a confidence level.</span></li>
            <li><b>Check the source</b><span>Click any citation to open the page with the passage highlighted.</span></li>
          </ol>
        </section>

        <section className="sec" id="inside">
          <h2>What you get beyond a chat box</h2>
          <dl className="feat">
            <div><dt>Confidence on every answer</dt><dd>High, medium or low, with the number of passages behind it.</dd></div>
            <div><dt>Reasoning you can open</dt><dd>See which rules fired and why a warning appeared.</dd></div>
            <div><dt>Deep research with a visible plan</dt><dd>Watch the plan fill in: find papers, extract methods, compare, draft, verify.</dd></div>
            <div><dt>Agents that show their work</dt><dd>Retriever, summarizer, critic and writer log each step, including model fallbacks.</dd></div>
            <div><dt>One card per paper</dt><dd>Method, dataset, metrics and limitations side by side.</dd></div>
            <div><dt>Your choice of AI</dt><dd>Connect a local OmniRoute gateway, or paste your own API key.</dd></div>
          </dl>
        </section>

        <section className="sec priv">
          <h2>Your papers stay on your computer</h2>
          <p>Papers are stored and indexed locally. Questions go only to the AI provider you choose in Settings. Your API key is kept encrypted and unlocked with a master password that is never stored.</p>
        </section>

        <footer>
          <span>PaperInsight AI, a course project</span>
        </footer>
      </div>
    </div>
  );
}
