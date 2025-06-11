import React from 'react';
import './App.css';
import './images/logo_ez.png';
import { Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';

function Signup() {
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
          <h2>Sign Up</h2>
          <form>
            <input type="text" placeholder="Enter email address" required />
            <input type="text" placeholder="Full Name" required />
            <input type="text" placeholder="Position" required />
            <input type="password" placeholder="Enter password" required />
            <button type="submit">Sign Up</button>
          </form>


          <div className='lines'>
            <div className='line'></div>
            <div className='or'>
              <p>Or</p>
            </div>
            <div className='line'></div>
          </div>

          <div className='social-login'>
            <button className='google'>
                <FcGoogle style={{ marginRight: '10px', fontSize: '20px' }} />
                Continue with Google
                </button>
          </div>

          <div className='signup'>
            <p>Don't have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
