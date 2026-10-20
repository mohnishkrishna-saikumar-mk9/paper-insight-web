"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { setIsAuthenticated } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [hasSetup, setHasSetup] = useState(true); // Default to true to prevent flash
  const [setupMode, setSetupMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPhrase, setNewPhrase] = useState("");
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        if (res.ok) {
          const data = await res.json();
          if (data.setup === false) {
            setHasSetup(false);
            setSetupMode(true);
          }
        }
      } catch (e) {
        console.error("Could not check auth status", e);
      }
    };
    checkStatus();
  }, []);

  const handleInitialSetup = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setSetupError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 12) {
      setSetupError("Password must be at least 12 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`Setup successful! IMPORTANT: Your recovery code is: ${data.recovery_code}\nPlease save this code securely. It is the ONLY way to recover your vault if you forget your master password.`);
        setSetupMode(false);
        setHasSetup(true);
      } else {
        const errData = await res.json();
        setSetupError(errData.detail || "Failed to complete setup.");
      }
    } catch (e) {
      setSetupError("Backend is not running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password })
      });
      
      if (res.ok) {
        setIsAuthenticated(true);
        router.push("/dashboard");
      } else {
        setError(true);
        setPassword("");
      }
    } catch (err) {
      console.error(err);
      setError(true);
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  if (setupMode) {
    return (
      <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
        <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "500px", textAlign: "center", borderTop: "4px solid #ef4444" }}>
          <div style={{ marginBottom: "2rem" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem" }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>First Time Setup</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Welcome to PaperInsight! Please set your master credentials.</p>
          </div>
          
          <form onSubmit={handleInitialSetup}>
            <input
              type="password"
              placeholder="Master Password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setSetupError(""); }}
              style={{
                width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: "1.1rem", marginBottom: "1rem", outline: "none"
              }}
              autoFocus
            />
            <input
              type="password"
              placeholder="Confirm Master Password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setSetupError(""); }}
              style={{
                width: "100%", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: "1.1rem", marginBottom: "1rem", outline: "none"
              }}
            />
            <div style={{ padding: "0.8rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", color: "#ef4444", fontSize: "0.85rem", textAlign: "left", marginBottom: "1rem" }}>
              <strong>WARNING:</strong> Make sure you remember your password! It is required to encrypt your data.
            </div>

            {setupError && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "1rem", textAlign: "left" }}>{setupError}</p>}
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: "100%", padding: "1rem", borderRadius: "12px", fontSize: "1.1rem", boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)", background: "#ef4444", borderColor: "#ef4444" }}
            >
              {loading ? "Saving..." : "Lock In Credentials"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 120px)" }}>
      <div className="glass-card" style={{ padding: "3rem", width: "100%", maxWidth: "450px", textAlign: "center", borderTop: "4px solid var(--primary-color)" }}>
        <div style={{ marginBottom: "2rem" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "1rem" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Private Access</h1>
          <p style={{ color: "var(--text-secondary)" }}>Please enter the master password to unlock your account and projects.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <input
            type="password"
            placeholder="Enter master password..."
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "12px",
              border: `1px solid ${error ? "#ef4444" : "var(--border-color)"}`,
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "1.1rem",
              marginBottom: "1rem",
              textAlign: "center",
              outline: "none",
              boxShadow: error ? "0 0 0 1px #ef4444" : "none",
              transition: "all 0.2s"
            }}
            autoFocus
          />
          {error && <p style={{ color: "#ef4444", fontSize: "0.9rem", marginBottom: "1.5rem", textAlign: "left" }}>Incorrect password. Please try again.</p>}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: "100%", padding: "1rem", borderRadius: "12px", fontSize: "1.1rem", marginTop: error ? "0" : "1rem", boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)" }}
          >
            {loading ? "Verifying..." : "Unlock Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
