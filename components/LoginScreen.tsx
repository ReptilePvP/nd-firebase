import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { registerWithEmail, loginWithEmail, loginWithGoogle, loginWithGithub, logout, onAuthChange, User } from '../services/firebaseService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      if (user) {
        onLoginSuccess();
      }
    });
    return () => unsubscribe();
  }, [onLoginSuccess]);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setFullName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginMode) {
        await loginWithEmail(email, password);
      } else {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await registerWithEmail(email, password, username, fullName || undefined);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login with Google.');
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGithub();
    } catch (err) {
      console.error('GitHub login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login with GitHub.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to logout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <Icon path="M8.944 5.596l-.744 2.6-2.744.788a.506.506 0 0 0-.396.491.5.5 0 0 0 .143.396l1.98 1.932-.468 2.728a.513.513 0 0 0 .203.508.501.501 0 0 0 .541.054L10 13.328l2.444 1.286a.501.501 0 0 0 .541-.054.513.513 0 0 0 .203-.508l-.468-2.728 1.98-1.932a.5.5 0 0 0 .143-.396.506.506 0 0 0-.396-.491l-2.744-.788-1.256-2.536a.5.5 0 0 0-.902 0z" className="w-12 h-12 text-sky-400" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">{isLoginMode ? 'Welcome Back' : 'Create Account'}</h1>
          <p className="text-slate-400 mt-2">{isLoginMode ? 'Sign in to NDResells' : 'Join NDResells today'}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-3 text-sm animate-fadeIn">
            <div className="flex items-center">
              <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginMode && (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Choose a username"
                  required={!isLoginMode}
                />
              </div>
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1">Full Name (optional)</label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>
          {!isLoginMode && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Confirm your password"
                required={!isLoginMode}
                minLength={6}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-all duration-200 ease-in-out transform ${
              loading ? 'bg-sky-600/50 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? (isLoginMode ? 'Signing In...' : 'Creating Account...') : (isLoginMode ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="text-center text-sm text-slate-400">
            {isLoginMode ? 'Don\'t have an account?' : 'Already have an account?'}{' '}
            <button onClick={toggleMode} className="text-sky-400 hover:text-sky-300 font-medium">
              {isLoginMode ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          <div className="flex items-center justify-center mt-6">
            <div className="border-t border-slate-600 flex-grow"></div>
            <span className="text-slate-400 text-sm mx-2">or continue with</span>
            <div className="border-t border-slate-600 flex-grow"></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`flex items-center justify-center py-2 px-4 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-700 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon path="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h1.268a.75.75 0 0 1 .622 1.175l-2.25 3.425a.75.75 0 0 1-1.281-.542l1.99-7.303H11.15a.75.75 0 0 1-.629-1.163l2.646-4.017a.75.75 0 0 1 .898-.275Z" className="w-5 h-5 mr-2 text-sky-400" fill="currentColor" />
              Google
            </button>
            <button
              onClick={handleGithubLogin}
              disabled={loading}
              className={`flex items-center justify-center py-2 px-4 border border-slate-600 rounded-lg text-slate-200 hover:bg-slate-700 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Icon path="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.962 7.962 0 0 1 0 8c0-4.42 3.58-8 8-8Z" className="w-5 h-5 mr-2 text-slate-400" fill="currentColor" />
              GitHub
            </button>
          </div>
        </div>

        {currentUser && (
          <div className="mt-6 text-center">
            <p className="text-slate-300 text-sm">Signed in as {currentUser.email}</p>
            <button
              onClick={handleLogout}
              disabled={loading}
              className={`mt-2 py-1 px-3 text-sm text-white font-medium rounded-lg transition-all duration-200 ease-in-out transform ${
                loading ? 'bg-red-600/50 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95'
              }`}
            >
              {loading ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} NDResells. All rights reserved.</p>
      </div>
    </div>
  );
};

export default LoginScreen;
