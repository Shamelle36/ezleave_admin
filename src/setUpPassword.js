import React, { useState } from "react";

export default function SetupPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const query = new URLSearchParams(window.location.search);
  const token = query.get("token");

  const API_URL = "https://ezleave-admin-api.onrender.com";


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return alert("Enter a password");

    try {
      const res = await fetch(`${API_URL}/api/authAdmin/setup-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Password set successfully! You can now log in.");
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error");
    }
  };

  return (
    <div style={{ padding: "50px" }}>
      <h2>Set Your Password</h2>
      {message && <p>{message}</p>}
      {!message && (
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Set Password</button>
        </form>
      )}
    </div>
  );
}
