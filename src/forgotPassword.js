import React, { useState } from 'react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      // Example: call your backend API for password reset
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Reset email sent! Please check your inbox.');
      } else {
        const data = await response.json();
        setMessage(data.error || "Something went wrong. Try again.");
      }
    } catch (error) {
      setMessage("Network error. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleReset}>
      <h2>Reset Password</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send Reset Email</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default ForgotPassword;
