import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './lib/supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function checkSession() {
      setLoading(true); // begin loading state
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error || !profile?.is_admin) {
          console.error('Session admin check failed:', error?.message);
          setMessage('You are not authorized for this area. Logging out.');
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        setMessage('Already logged in as admin! Redirecting...');
        setLoading(false);
        setTimeout(() => navigate("/dashboard"), 500);
      } else {
        setLoading(false); // no session, reset loading
      }
    }

    checkSession();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data?.user) {
        setMessage(error?.message || 'Login failed.');
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setMessage('You do not have administrative access. Logging out.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setMessage('Login successful! Redirecting to admin dashboard...');
      setLoading(false);
      setTimeout(() => navigate("/dashboard"), 500);

    } catch (err) {
      console.error('Unexpected error:', err);
      setMessage('An unexpected error occurred: ' + err.message);
      setLoading(false);
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
          <h2>Admin Log In</h2>
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
            <button type="submit">Sign In</button>
          </form>

          {loading && <p style={{ marginTop: '1rem', color: 'blue' }}>Checking admin status...</p>}
          {message && (
            <p style={{ marginTop: '1rem', color: message.includes('successful') || message.includes('Attempting') ? 'green' : 'red' }}>
              {message}
            </p>
          )}

          <p className="forgot-password"><Link to="/forgotPassword">Forgot password?</Link></p>

          <div className='lines'>
            <div className='line'></div>
            <div className='or'><p>Or</p></div>
            <div className='line'></div>
          </div>

          <div className='social-login'>
            <button className='google'>
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
