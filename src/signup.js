// src/Signup.js
import React, { useState, useEffect } from "react";
import "./App.css";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelopeCircleCheck } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

function Signup() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        email,
        fullName,
        password,
      });

      if (res.status === 201) {
        setMessage("Admin account created! Please log in.");
        setTimeout(() => navigate("/"), 3000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="container">
      {(message || error) && (
        <div className="popupMessage">
          <FontAwesomeIcon
            icon={faEnvelopeCircleCheck}
            className="msgIcon"
          />
          <p className="txtMessage" style={{ color: error ? "red" : "green" }}>
            {message || error}
          </p>
        </div>
      )}

      <div className={`wrapper ${message ? "blurred" : ""}`}>
        <div className="col1">
          <div className="circle">
            <div className="circle-inner">
              <img src={require("./images/logo_ez.png")} alt="Logo" />
            </div>
          </div>
        </div>

        <div className="col2">
          <h2>Sign Up (Admin)</h2>
          <form onSubmit={handleSignup}>
            <input
              type="email"
              placeholder="Enter email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              placeholder="Full Name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit">Sign Up</button>
          </form>

          <div className="signup">
            <p>
              Already have an account? <Link to="/">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
