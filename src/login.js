// Login.jsx (Revised for Admin Check)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './App.css';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './lib/supabase';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Check if the logged-in user is an admin
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error.message);
            setMessage('Failed to load user profile. Please try again.');
            supabase.auth.signOut(); // Log out if profile check fails
            return;
          }

          if (profile?.is_admin) {
            setMessage('Login successful! Redirecting to admin dashboard...');
            setTimeout(() => navigate("/dashboard"), 500);
          } else {
            setMessage('You do not have administrative access. Logging out.');
            supabase.auth.signOut(); // Log out non-admin users
          }
        }
      }
    );

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Perform the same admin check on initial session load
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error || !profile?.is_admin) {
          console.error('Existing session is not admin or profile error:', error?.message);
          setMessage('You are not authorized for this area. Logging out.');
          supabase.auth.signOut(); // Log out non-admin users
          return;
        }

        setMessage('Already logged in as admin! Redirecting...');
        setTimeout(() => navigate("/dashboard"), 500);
      }
    }
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setMessage(error.message);
        console.error('Login error:', error.message);
        return;
      }
      // If login is successful, the onAuthStateChange listener above will handle the admin check and navigation
      if (data.user) {
        setMessage('Attempting to log in...'); // Message while admin status is checked
      }

    } catch (error) {
      setMessage('An unexpected error occurred: ' + error.message);
      console.error('Unexpected login error:', error);
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
          <h2>Admin Log In</h2> {/* Added (Admin) to title */}
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Enter email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Enter password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Sign In</button>
          </form>

          {message && <p style={{ marginTop: '1rem', color: message.includes('successful') || message.includes('Attempting') ? 'green' : 'red' }}>{message}</p>}

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