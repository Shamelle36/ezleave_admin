import React, { useState, useEffect } from 'react';
import './App.css';
import './images/logo_ez.png';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth } from './firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeCircleCheck } from '@fortawesome/free-solid-svg-icons';

function Signup() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }
}, [message]);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName
      });

      await sendEmailVerification(user);
      setMessage("We've sent a confirmation email to your address. Please verify your email to activate your account.");

      const checkEmailVerified = setInterval(async () => {
        await user.reload();
        if (user.emailVerified) {
          clearInterval(checkEmailVerified);
          setMessage("Email Verified. Redirecting to sign in...");
          setTimeout(() => navigate("/"), 3000);
        }
      }, 3000);

    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="container">

          {message && (
              <div className='popupMessage'>
              <FontAwesomeIcon icon={faEnvelopeCircleCheck} className='msgIcon'/>       
                <p className='txtMessage'>{message}</p>
              </div>
          )}

      <div className={`wrapper ${message ? 'blurred' : ''} `}>

        <div className='col1'>
          <div className='circle'>
            <div className='circle-inner'>
              <img src={require('./images/logo_ez.png')} alt="Logo" />
            </div>
          </div>
        </div>

        <div className='col2'>
          <h2>Sign Up</h2>
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

          <div className='signup'>
            <p>Already have an account? <Link to="/">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
