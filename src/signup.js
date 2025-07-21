import React, { useState, useEffect } from 'react';
import './App.css';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
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
    setMessage('');

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        const newUserId = authData.user.id;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: newUserId,
              full_name: fullName,
              email: email,
              is_admin: true,
              gender: null,
              department: null,
              position: null,
              employee_type: null,
              employment_start_date: null,
            },
          ]);

        if (profileError) {
          console.error('Error creating profile entry:', profileError.message);
          setMessage('Account created, but failed to set up profile. Please contact support.');
          return;
        }

        setMessage("Admin account created! We've sent a confirmation email. Please verify to activate your account.");
        setTimeout(() => navigate("/"), 5000);
      } else {
        setMessage('Signup initiated. Please check your email for a verification link.');
        setTimeout(() => navigate("/"), 5000);
      }

    } catch (error) {
      setMessage(error.message);
      console.error('Signup error:', error);
    }
  };

  return (
    <div className="container">

      {message && (
        <div className='popupMessage'>
          <FontAwesomeIcon icon={faEnvelopeCircleCheck} className='msgIcon' />
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

          <div className='signup'>
            <p>Already have an account? <Link to="/">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
