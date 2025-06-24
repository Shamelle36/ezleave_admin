import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import { FcGoogle } from 'react-icons/fc';
import { auth, googleProvider } from './firebase';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // 🔒 Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        navigate('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.emailVerified) {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => navigate("/dashboard"), 2000); 
      } else {
        setMessage('Please verify your email before logging in.');
        auth.signOut(); 
      }

    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Google user:", user);
      navigate("/dashboard");

    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="container">
      <div className="wrapper">
        <div className='col1'>
          <div className='circle'>
            <div className='circle-inner'>
              <img src={require('./images/logo_ez.png')} alt="Logo" />
            </div>
          </div>
        </div>

        <div className='col2'>
          <h2>Log In</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Enter email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Enter password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Sign In</button>
          </form>

          {message && <p style={{ marginTop: '1rem' }}>{message}</p>}

          <p className="forgot-password"><Link to="/forgotPassword">Forgot password?</Link></p>

          <div className='lines'>
            <div className='line'></div>
            <div className='or'><p>Or</p></div>
            <div className='line'></div>
          </div>

          <div className='social-login'>
            <button className='google' onClick={handleGoogleLogin}>
              <FcGoogle style={{ marginRight: '10px', fontSize: '25px' }} />
              Continue with Google
            </button>
          </div>

          <div className='signup'>
            <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Login;
