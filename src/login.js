// src/Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { FcGoogle } from "react-icons/fc";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-check session
  useEffect(() => {
    const savedUser = localStorage.getItem("admin");
    if (savedUser) {
      navigate("/dashboard"); // already logged in
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      if (res.status === 200) {
        setMessage("Login successful! Redirecting to admin dashboard...");
        localStorage.setItem("admin", JSON.stringify(res.data.user)); // Save session
        setLoading(false);

        setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="wrapper">
        <div className="col1">
          <div className="circle">
            <div className="circle-inner">
              <img src={require("./images/logo_ez.png")} alt="Logo" />
            </div>
          </div>
        </div>

        <div className="col2">
          <h2>Log In</h2>
          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {loading && (
            <p style={{ marginTop: "1rem", color: "blue" }}>
              Checking credentials...
            </p>
          )}
          {message && (
            <p
              style={{
                marginTop: "1rem",
                color: message.includes("successful") ? "green" : "red",
              }}
            >
              {message}
            </p>
          )}

          <p className="forgot-password">
            <Link to="/forgotPassword">Forgot password?</Link>
          </p>

          <div className="lines">
            <div className="line"></div>
            <div className="or">
              <p>Or</p>
            </div>
            <div className="line"></div>
          </div>

          <div className="social-login">
            <button className="google">
              <FcGoogle style={{ marginRight: "10px", fontSize: "25px" }} />
              Continue with Google
            </button>
          </div>

          {/* ❌ Remove this if you only want admin login */}
          <div className="signup">
            <p>
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
