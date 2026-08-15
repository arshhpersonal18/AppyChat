import React, { useState } from 'react';
import { Icons } from '../services/icons';
import { UserProfile } from '../types';
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onLoginSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name (1-20 characters).');
          setIsLoading(false);
          return;
        }
        if (!agreedTerms) {
          setErrorMsg('Please accept the Terms of Service to continue.');
          setIsLoading(false);
          return;
        }

        const user = await signUpWithEmail(email, password, name, bio);
        onLoginSuccess(user);
      } else {
        const user = await signInWithEmail(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      let message = 'Authentication failed. Please check your credentials and try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists. Please sign in instead.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email. Please create an account.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password is too weak. Must be at least 6 characters.';
      } else if (err.message) {
        message = err.message;
      }
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div
      id="auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0A] select-none"
    >
      <div className="w-full max-w-sm bg-[#121212] border border-[#2C2C2C] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#00A878] text-[#121212] mx-auto flex items-center justify-center shadow-lg mb-3">
            <Icons.phone className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#FFFFFF] tracking-tight">AppyChat</h1>
          <p className="text-xs text-[#A0A0A0] mt-1">
            Realtime Chat, Voice & WebRTC Video Calling
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#1E1E1E] p-1 rounded-xl mb-5 border border-[#2C2C2C]">
          <button
            id="auth-tab-signin"
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              !isSignUp ? 'bg-[#00A878] text-[#121212] shadow' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
            }`}
          >
            Sign In
          </button>
          <button
            id="auth-tab-signup"
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              isSignUp ? 'bg-[#00A878] text-[#121212] shadow' : 'text-[#A0A0A0] hover:text-[#FFFFFF]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Google Sign In */}
        <button
          id="btn-google-auth"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full mb-4 py-2.5 px-4 bg-[#1E1E1E] hover:bg-[#282828] border border-[#2C2C2C] text-white text-xs font-medium rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm"
        >
          {isGoogleLoading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-[#2C2C2C]" />
          <span className="text-[10px] uppercase font-mono text-[#757575]">or with email</span>
          <div className="flex-1 h-px bg-[#2C2C2C]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                Full Name <span className="text-[#FF5252]">*</span>
              </label>
              <input
                id="input-auth-name"
                type="text"
                placeholder="e.g. Jordan Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={25}
                className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878]"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Email Address</label>
            <input
              id="input-auth-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A0A0A0] mb-1">Password</label>
            <input
              id="input-auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878]"
              required
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-[#A0A0A0] mb-1">
                Bio / Status (Optional)
              </label>
              <input
                id="input-auth-bio"
                type="text"
                placeholder="Hey there! I am using AppyChat."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={100}
                className="w-full bg-[#282828] text-sm text-[#FFFFFF] placeholder-[#757575] px-3.5 py-2.5 rounded-xl border border-[#2C2C2C] focus:outline-none focus:border-[#00A878]"
              />
            </div>
          )}

          {isSignUp && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                id="checkbox-auth-terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="w-4 h-4 rounded text-[#00A878] focus:ring-0 bg-[#282828] border-[#2C2C2C]"
              />
              <span className="text-[11px] text-[#A0A0A0]">
                I agree to the Terms of Service & Privacy Policy
              </span>
            </label>
          )}

          {errorMsg && (
            <p className="text-xs text-[#FF5252] flex items-center gap-1.5 p-2 rounded-lg bg-[#FF5252]/10 border border-[#FF5252]/20">
              <Icons.info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          <button
            id="btn-auth-submit"
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-[#00A878] hover:bg-[#008F65] text-[#121212] font-semibold text-xs py-3 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-[#121212] border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
