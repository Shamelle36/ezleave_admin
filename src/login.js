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
  
  const API_URL = "https://ezleave-admin-api.onrender.com";

  useEffect(() => {
    document.body.classList.add("login-no-scroll");

    return () => {
      document.body.classList.remove("login-no-scroll");
    };
  }, []);

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
    // First try the main admin login
    let res = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    // ✅ Admin login success
    if (res.status === 200) {
      localStorage.setItem("admin", JSON.stringify(res.data.user));
      localStorage.setItem("role", res.data.user.role);
      navigate("/dashboard");
      return;
    }
  } catch (err) {
    // If admin login fails, try the department account login
    try {
      const res = await axios.post(`${API_URL}/api/authAdmin/login`, {
        email,
        password,
      });

      if (res.status === 200) {
        localStorage.setItem("admin", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.user.role);
        localStorage.setItem("department", res.data.user.department);
        navigate("/dashboard");
        return;
      }
    } catch (err2) {
      console.error(err2);
      setMessage(err2.response?.data?.message || "Invalid credentials.");
      setLoading(false);
      return;
    }
  }

  setMessage("Invalid credentials.");
  setLoading(false);
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
