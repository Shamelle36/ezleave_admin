// Login.js
import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate } from 'react-router-dom';

function Login() {

  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate('/dashboard');
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
          <form>
            <input type="text" placeholder="Enter email address" required />
            <input type="password" placeholder="Enter password" required />
            <button type="submit" onClick={goToDashboard}>Sign In</button>
          </form>

          <p className="forgot-password"><Link to="">Forgot password?</Link></p>

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
