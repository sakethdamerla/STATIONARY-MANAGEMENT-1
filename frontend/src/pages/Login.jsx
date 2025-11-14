import { useEffect, useState } from 'react';
import { Shield, LogIn, User, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { apiUrl } from '../utils/api';

const defaultBranding = {
  header: 'PYDAH COLLEGE OF ENGINEERING',
  subheader: 'Stationery Management System',
};

const Login = ({ onLogin }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('login-theme') || 'dark';
  });
  const [branding, setBranding] = useState(defaultBranding);

  useEffect(() => {
    localStorage.setItem('login-theme', theme);
  }, [theme]);

  useEffect(() => {
    let isMounted = true;
    const fetchBranding = async () => {
      try {
        const res = await fetch(apiUrl('/api/settings'));
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        // Use appName/appSubheader for application branding, fallback to receipt fields for backward compatibility
        setBranding({
          header: (typeof data.appName === 'string' && data.appName.trim()) 
            ? data.appName.trim() 
            : (data.receiptHeader || defaultBranding.header),
          subheader: (typeof data.appSubheader === 'string' && data.appSubheader.trim())
            ? data.appSubheader.trim()
            : (data.receiptSubheader || defaultBranding.subheader),
        });
      } catch (error) {
        console.warn('Failed to load branding settings for login:', error);
      }
    };

    fetchBranding();
    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = theme === 'dark';

  const backgroundClass = isDark
    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950'
    : 'bg-gradient-to-br from-white via-slate-50 to-blue-50';

  const cardClass = isDark
    ? 'bg-white/5 backdrop-blur-md border-white/10 shadow-2xl shadow-black/40'
    : 'bg-white border border-slate-200 shadow-2xl shadow-slate-300/50';

  const headingClass = isDark ? 'text-white' : 'text-slate-900';
  const subHeadingClass = isDark ? 'text-slate-300' : 'text-slate-600';
  const labelClass = isDark ? 'text-slate-200' : 'text-slate-700';
  const inputClass = isDark
    ? 'bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-blue-500'
    : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:ring-blue-500';
  const buttonClass = 'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-200';
  const primaryButtonClass = isDark
    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40 hover:shadow-blue-900/60 hover:from-blue-500 hover:to-indigo-500'
    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-300/60 hover:shadow-blue-400/70 hover:from-blue-500 hover:to-indigo-500';
  const errorClass = isDark
    ? 'bg-red-500/20 border border-red-500/30 text-red-200'
    : 'bg-red-100 border border-red-200 text-red-700';
  const textMutedClass = isDark ? 'text-slate-400' : 'text-slate-500';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await onLogin(id, password);
      if (!success) {
        setError('Invalid credentials. Please check your ID and password.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${backgroundClass} flex items-center justify-center p-6 transition-colors duration-300`}>
      <div className="flex items-center justify-center w-full">
        <div className="max-w-xl w-full mx-auto">
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-white/5 border border-white/10 text-blue-100 hover:bg-white/10'
                  : 'bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          {/* Login Card */}
          <div className={`${cardClass} rounded-3xl p-10 transition-colors duration-300`}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 ${isDark ? 'bg-green-400 border-slate-900' : 'bg-green-500 border-white'}`}></div>
                </div>
              </div>
              <h2 className={`text-3xl font-bold mb-2 ${headingClass}`}>
                {branding.header}
              </h2>
              <p className={subHeadingClass}>{branding.subheader}</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User ID Field */}
              <div className="space-y-2">
                <label htmlFor="id" className={`block text-sm font-medium ${labelClass}`}>
                  User ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type="text"
                    id="id"
                    className={`block w-full pl-10 pr-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${inputClass}`}
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="Enter your user ID"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className={`block text-sm font-medium ${labelClass}`}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`block w-full pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${inputClass}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className={`h-5 w-5 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-500'} transition-colors`} />
                    ) : (
                      <Eye className={`h-5 w-5 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-slate-400 hover:text-slate-500'} transition-colors`} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`${errorClass} px-4 py-3 rounded-xl text-sm backdrop-blur-sm transition-colors duration-300`}>
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`${buttonClass} ${primaryButtonClass} ${isDark ? 'focus:ring-offset-slate-900' : 'focus:ring-offset-white'} disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Access Portal</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Note */}
            <div className="mt-6 text-center">
              <p className={`${textMutedClass} text-sm`}>
                Secure admin access • Trusted by educational institutions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;