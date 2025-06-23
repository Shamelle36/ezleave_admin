import React, {useState} from 'react';
import './App.css';
import './images/logo_ez.png';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

function Signup() {

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

   const handleSignup = async (e) => {
      e.preventDefault();
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

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      console.log('Google sign-in success:', user);

      if (user.emailVerified) {
        navigate("/dashboard"); 
      }

    } catch (error) {
      console.error("Google sign-in error:", error.message);
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
          <h2>Sign Up</h2>
          <form onSubmit={handleSignup}>
            <input type="email" placeholder="Enter email address" required value={email} onChange={(e) => setEmail(e.target.value)}  />
            <input type="text" placeholder="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)}/>
            <input type="text" placeholder="Position" required value={position} onChange={(e) => setPosition(e.target.value)} />
            <input type="password" placeholder="Enter password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Sign Up</button>
          </form>

          {message && <p style={{ color: '#333', marginTop: '1rem' }}>{message}</p>}


          <div className='lines'>
            <div className='line'></div>
            <div className='or'>
              <p>Or</p>
            </div>
            <div className='line'></div>
          </div>

          <div className='social-login'>
            <button className='google' onClick={handleGoogleLogin}>
                <FcGoogle style={{ marginRight: '10px', fontSize: '20px' }} />
                Continue with Google
                </button>
          </div>

          <div className='signup'>
            <p>Don't have an account? <Link to="/">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
