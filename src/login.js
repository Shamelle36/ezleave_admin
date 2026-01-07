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
  const [googleLoading, setGoogleLoading] = useState(false);
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

  // Initialize Google Sign-In
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // Handle Google Login
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setMessage("");
    
    // Create Google Sign-In button
    const googleSignInDiv = document.createElement('div');
    googleSignInDiv.id = 'google-signin-btn';
    document.body.appendChild(googleSignInDiv);

    // Initialize Google Sign-In
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "182363231574-dv7l7sng49p1v71cf6rjoblng2a76al9.apps.googleusercontent.com",
        callback: handleGoogleResponse,
      });
      
      // Render the button
      window.google.accounts.id.renderButton(
        googleSignInDiv,
        {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
        }
      );
      
      // Programmatically click the button
      const googleButton = googleSignInDiv.querySelector('div[role="button"]');
      if (googleButton) {
        googleButton.click();
      } else {
        setMessage("Google Sign-In button failed to load");
        setGoogleLoading(false);
      }
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(googleSignInDiv);
      }, 1000);
    } else {
      setMessage("Google Sign-In is not available. Please try again later.");
      setGoogleLoading(false);
    }
  };

  // Handle Google OAuth response - Try both endpoints
  const handleGoogleResponse = async (response) => {
    setGoogleLoading(true);
    setMessage("");
    
    try {
      // First try main admin Google login (useradmin table)
      let res = await axios.post(`${API_URL}/api/auth/google-login`, {
        credential: response.credential,
      });

      if (res.status === 200) {
        // Main admin login successful
        localStorage.setItem("admin", JSON.stringify(res.data.user));
        localStorage.setItem("role", res.data.user.role);
        if (res.data.user.profile_picture) {
          localStorage.setItem("profile_picture", res.data.user.profile_picture);
        }
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        navigate("/dashboard");
        return;
      }
    } catch (err) {
      // If main admin Google login fails, try department admin Google login
      try {
        const res = await axios.post(`${API_URL}/api/authAdmin/google-login`, {
          credential: response.credential,
        });

        if (res.status === 200) {
          // Department admin login successful
          localStorage.setItem("admin", JSON.stringify(res.data.user));
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("role", res.data.user.role);
          localStorage.setItem("department", res.data.user.department);
          if (res.data.user.profile_picture) {
            localStorage.setItem("profile_picture", res.data.user.profile_picture);
          }
          navigate("/dashboard");
          return;
        }
      } catch (err2) {
        console.error("Department admin Google login error:", err2);
        
        // Both Google logins failed
        if (err2.response?.status === 401) {
          setMessage("Google account not registered in any system. Please use email/password.");
        } else if (err2.response?.status === 400) {
          setMessage("Account not fully set up. Please check your email for setup link.");
        } else {
          setMessage(err2.response?.data?.message || "Google login failed for both account types.");
        }
        setGoogleLoading(false);
        return;
      }
    }

    // Generic error if we reach here
    setMessage("Google authentication failed");
    setGoogleLoading(false);
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

          <div className="lines">
            <div className="line"></div>
            <div className="or">
              <p>Or</p>
            </div>
            <div className="line"></div>
          </div>

          <div className="social-login">
            <button 
              className="google" 
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              type="button"
            >
              <FcGoogle style={{ marginRight: "10px", fontSize: "25px" }} />
              {googleLoading ? "Connecting to Google..." : "Continue with Google"}
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