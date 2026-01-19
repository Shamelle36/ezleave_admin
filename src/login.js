// src/Login.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./App.css";
import { FcGoogle } from "react-icons/fc";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyATHtZYzpJWI752_8EcFn1QCwxPavOJXEM",
  authDomain: "ezleave-admin.firebaseapp.com",
  projectId: "ezleave-admin",
  storageBucket: "ezleave-admin.firebasestorage.app",
  messagingSenderId: "1016228054768",
  appId: "1:1016228054768:web:e0ec3759df6341ef0b2435",
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);


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
    // 1️⃣ TRY MAIN ADMIN LOGIN (BACKEND)
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password,
    });

    if (res.status === 200) {
      localStorage.setItem("admin", JSON.stringify(res.data.user));
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
      return;
    }
  } catch (err) {
    console.log("Main admin login failed, trying Firebase...");
  }

  try {
    // 2️⃣ FALLBACK: Firebase Auth
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const user = userCredential.user;
    const firebaseToken = await user.getIdToken();

    // 3️⃣ FETCH USER INFO FROM DATABASE BY EMAIL
    const resDb = await fetch(`${API_URL}/api/authAdmin/user-email/${email}`);
    if (!resDb.ok) {
      throw new Error("Failed to fetch user info from database");
    }
    const userData = await resDb.json();

    // 4️⃣ Check if account is inactive
    if (userData.status === "inactive") {
      setMessage("Account is inactive. Please contact administrator.");
      setLoading(false);
      return;
    }

    // 5️⃣ Store user info in localStorage
    localStorage.setItem("admin", JSON.stringify(userData));
    localStorage.setItem("role", userData.role);
    localStorage.setItem("token", firebaseToken);

    navigate("/dashboard");
  } catch (firebaseErr) {
    console.error("Firebase login error:", firebaseErr);

    if (firebaseErr.code) {
      switch (firebaseErr.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
          setMessage("Invalid credentials.");
          break;
        case "auth/too-many-requests":
          setMessage("Too many attempts. Try again later.");
          break;
        case "auth/network-request-failed":
          setMessage("Network error. Check your internet connection.");
          break;
        default:
          setMessage("Login failed.");
      }
    } else {
      setMessage(firebaseErr.message || "Login failed.");
    }
  } finally {
    setLoading(false);
  }
};


const handleForgotPassword = async () => {
  if (!email) {
    setMessage("Please enter your email address first.");
    return;
  }

  setMessage("");
  setLoading(true);

  console.log(`Forgot password attempt for: ${email}`);

  // Create axios instance with timeout
  const axiosWithTimeout = axios.create({
    timeout: 10000, // 10 seconds timeout
  });

  // Try main admin endpoint
  try {
    console.log("Trying main admin endpoint...");
    const res1 = await axiosWithTimeout.post(`${API_URL}/api/auth/forgot-password`, { email });
    console.log("Main admin response:", res1.data);
    
    // Check if this is the "generic" response
    if (res1.data.message && !res1.data.message.includes("If your email exists")) {
      setMessage(res1.data.message);
      setLoading(false);
      return;
    }
  } catch (err1) {
    console.log("Main admin error:", err1.message, err1.code);
  }

  // Try department admin endpoint WITH timeout
  try {
    console.log("Trying department admin endpoint with timeout...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const res2 = await fetch(`${API_URL}/api/authAdmin/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (res2.ok) {
      const data = await res2.json();
      console.log("Department admin response:", data);
      setMessage(data.message || "Password reset instructions sent.");
      setLoading(false);
      return;
    } else {
      console.log("Department admin HTTP error:", res2.status);
    }
  } catch (err2) {
    if (err2.name === 'AbortError') {
      console.log("Department admin endpoint timed out after 8 seconds");
    } else {
      console.log("Department admin error:", err2.message);
    }
  }

  // Show appropriate message
  setMessage("Password reset request received. If you don't receive an email within 15 minutes, please check your spam folder or contact your administrator.");
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
            
            {/* Forgot Password Text */}
            <div style={{ textAlign: 'right', marginBottom: '20px', marginTop: '-10px' }}>
              <button 
                type="button" 
                onClick={handleForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4285f4',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '5px 0',
                  fontFamily: 'inherit'
                }}
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
            
            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {loading && (
            <p style={{ marginTop: "1rem", color: "blue" }}>
              Processing...
            </p>
          )}
          {message && (
            <p
              style={{
                marginTop: "1rem",
                color: message.includes("successful") || message.includes("sent") ? "green" : "red",
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