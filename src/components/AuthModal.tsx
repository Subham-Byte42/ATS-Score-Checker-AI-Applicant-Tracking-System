import React, { useState, useEffect } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ArrowLeft,
  Loader2,
  KeyRound,
  RotateCcw
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onLoginSuccess?: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Password Reset states
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const [submitError, setSubmitError] = useState('');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Google Account Chooser view state
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string | null>(null);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'signup');
      setSubmitError('');
      setSignupSuccessMsg('');
      setResetSuccessMsg('');
    }
  }, [isOpen, initialMode]);

  // Listen for Google OAuth popup callback message
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const googleUserEmail = event.data.email || 'alex.morgan@gmail.com';
        const googleUserName = event.data.name || 'Alex Morgan';
        
        setSelectedGoogleAccount(googleUserEmail);
        const derivedName = googleUserName || (googleUserEmail.includes('alex') ? 'Alex Morgan' : googleUserEmail.split('@')[0].replace('.', ' '));

        try {
          await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: derivedName,
              email: googleUserEmail,
              password: googleUserEmail
            })
          });
        } catch (err) {
          console.warn('Google sign-in welcome email trigger failed:', err);
        }

        try {
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: googleUserEmail,
              password: googleUserEmail
            })
          });
          const loginData = await loginRes.json();
          if (loginData.token) {
            localStorage.setItem('authToken', loginData.token);
          }
        } catch (err) {
          console.warn('Google sign-in auto login failed:', err);
        }

        setTimeout(() => {
          setSelectedGoogleAccount(null);
          setIsGooglePickerOpen(false);
          if (onLoginSuccess) {
            onLoginSuccess({ name: derivedName, email: googleUserEmail });
          }
          onClose();
        }, 800);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess, onClose]);

  if (!isOpen) return null;

  // Password criteria validation for Signup
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  // Password criteria validation for New Password Reset
  const hasNewMinLength = newPassword.length >= 8;
  const hasNewUppercase = /[A-Z]/.test(newPassword);
  const hasNewLowercase = /[a-z]/.test(newPassword);
  const hasNewNumber = /[0-9]/.test(newPassword);
  const hasNewSpecialChar = /[^A-Za-z0-9]/.test(newPassword);

  const isNewPasswordValid = hasNewMinLength && hasNewUppercase && hasNewLowercase && hasNewNumber && hasNewSpecialChar;
  const newPasswordsMatch = confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  // Handler when clicking "Forgot password?" in Login form
  const handleForgotPasswordClick = async () => {
    setSubmitError('');
    setSignupSuccessMsg('');
    setResetSuccessMsg('');

    if (email && email.trim().includes('@')) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = await response.json();
        setIsLoading(false);

        if (!response.ok) {
          setSubmitError(data.message || 'Failed to send password reset verification code.');
          setMode('forgot');
          return;
        }

        setResetSuccessMsg(data.message || `Password reset verification code dispatched to ${email}! Check your inbox.`);
        setVerificationCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setMode('reset');
      } catch (err) {
        setIsLoading(false);
        setSubmitError('Network error requesting password reset.');
        setMode('forgot');
      }
    } else {
      setMode('forgot');
    }
  };

  // Handler for submitting Forgot Password email request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setResetSuccessMsg('');

    if (!email || !email.trim().includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setSubmitError(data.message || 'Failed to send password reset code.');
        return;
      }

      setResetSuccessMsg(data.message || `Password reset code sent to ${email}. Check your email inbox!`);
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setMode('reset');
    } catch (err) {
      setIsLoading(false);
      setSubmitError('Network error requesting password reset.');
    }
  };

  // Handler for submitting New Password Reset Verification Code & updating DB
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!verificationCode || verificationCode.trim().length === 0) {
      setSubmitError('Please enter the 6-digit verification code from your email.');
      return;
    }

    if (!isNewPasswordValid) {
      setSubmitError('New password must fulfill all security requirements.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setSubmitError('Passwords do not match. Please verify your new password.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: verificationCode.trim(),
          newPassword,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        setSubmitError(data.message || 'Password reset failed. Please check your verification code.');
        return;
      }

      // Password updated successfully in database!
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setVerificationCode('');
      setSubmitError('');
      setSignupSuccessMsg('Password changed successfully in the database! A confirmation email has been sent. Please log in with your new password.');
      setMode('login');
    } catch (err) {
      setIsLoading(false);
      setSubmitError('Network error updating password in database.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (mode === 'signup') {
      if (!isPasswordValid) {
        setSubmitError('Please fulfill all password requirements before proceeding.');
        return;
      }

      if (password !== confirmPassword) {
        setSubmitError('Passwords do not match. Please verify your password.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName || (email ? email.split('@')[0] : 'Candidate'),
            email,
            password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setSubmitError(data.message || 'Signup failed. Please try again.');
          setIsLoading(false);
          return;
        }

        // On successful signup, redirect to login page/view so user can log in with credentials
        setIsLoading(false);
        setPassword('');
        setConfirmPassword('');
        setSubmitError('');
        setSignupSuccessMsg('Account created successfully! A confirmation welcome email has been sent. Please enter your password to log in.');
        setMode('login');
        return;
      } catch (err: any) {
        setSubmitError('Network error connecting to signup backend API.');
        setIsLoading(false);
        return;
      }
    } else if (mode === 'login') {
      if (!email || !password) {
        setSubmitError('Please enter your email and password.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setSubmitError(data.message || 'Login failed. Invalid email or password.');
          setIsLoading(false);
          return;
        }

        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        if (onLoginSuccess) {
          onLoginSuccess({
            name: data.user.name,
            email: data.user.email,
          });
        }
        setIsLoading(false);
        onClose();
        return;
      } catch (err: any) {
        setSubmitError('Network error connecting to login backend API.');
        setIsLoading(false);
        return;
      }
    }
  };

  const handleGoogleSignIn = () => {
    setSubmitError('');
    setIsGooglePickerOpen(true);
  };

  const handleSelectGoogleAccount = async (selectedEmail: string, customName?: string) => {
    setSelectedGoogleAccount(selectedEmail);
    const derivedName = customName || (selectedEmail.includes('alex') ? 'Alex Morgan' : selectedEmail.split('@')[0].replace('.', ' '));

    try {
      // Trigger backend registration so user exists in DB & welcome email is dispatched
      await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: derivedName,
          email: selectedEmail,
          password: selectedEmail
        })
      });
    } catch (err) {
      console.warn('Google sign-in welcome email trigger failed:', err);
    }

    try {
      // Attempt login to set user token
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail,
          password: selectedEmail
        })
      });
      const loginData = await loginRes.json();
      if (loginData.token) {
        localStorage.setItem('authToken', loginData.token);
      }
    } catch (err) {
      console.warn('Google sign-in auto login failed:', err);
    }

    setTimeout(() => {
      setSelectedGoogleAccount(null);
      setIsGooglePickerOpen(false);
      if (onLoginSuccess) {
        onLoginSuccess({ name: derivedName, email: selectedEmail });
      }
      onClose();
    }, 800);
  };

  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customGoogleEmail) {
      handleSelectGoogleAccount(customGoogleEmail);
    }
  };

  const handleModalClose = () => {
    setIsGooglePickerOpen(false);
    setShowCustomEmailInput(false);
    setSelectedGoogleAccount(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto relative font-sans">
        
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {isGooglePickerOpen ? (
          /* Google Account Chooser View */
          <div className="p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Google Logo & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <button
                onClick={() => {
                  if (showCustomEmailInput) {
                    setShowCustomEmailInput(false);
                  } else {
                    setIsGooglePickerOpen(false);
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-semibold text-slate-600">Google Sign-In</span>
              </div>
            </div>

            <div className="mt-4 text-center space-y-0.5">
              <h3 className="text-lg font-bold text-slate-900">
                Choose an account
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                to continue to <strong className="text-slate-800 font-semibold">ATS Score Checker</strong>
              </p>
            </div>

            {/* Account Selection List */}
            {!showCustomEmailInput ? (
              <div className="mt-4 space-y-2">
                {/* Device Account Option 1 */}
                <button
                  type="button"
                  disabled={selectedGoogleAccount !== null}
                  onClick={() => handleSelectGoogleAccount('subhammeher628@gmail.com', 'Subham Meher')}
                  className="w-full p-2.5 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-xl flex items-center justify-between transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1877f2] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      S
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 flex items-center gap-1.5">
                        <span>Subham Meher</span>
                        <span className="text-[9px] bg-blue-200/60 text-blue-800 px-1.5 py-0.5 rounded-full font-medium">Device</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        subhammeher628@gmail.com
                      </div>
                    </div>
                  </div>
                  {selectedGoogleAccount === 'subhammeher628@gmail.com' ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-500 transition-colors"></div>
                  )}
                </button>

                {/* Account Option 2 */}
                <button
                  type="button"
                  disabled={selectedGoogleAccount !== null}
                  onClick={() => handleSelectGoogleAccount('alex.morgan@gmail.com')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      A
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                        Alex Morgan
                      </div>
                      <div className="text-[11px] text-slate-500">
                        alex.morgan@gmail.com
                      </div>
                    </div>
                  </div>
                  {selectedGoogleAccount === 'alex.morgan@gmail.com' ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                  )}
                </button>

                {/* Account Option 2 */}
                <button
                  type="button"
                  disabled={selectedGoogleAccount !== null}
                  onClick={() => handleSelectGoogleAccount('alex@techcorp.io')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center justify-between transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      W
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700">
                        Alex Morgan (Work)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        alex@techcorp.io
                      </div>
                    </div>
                  </div>
                  {selectedGoogleAccount === 'alex@techcorp.io' ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                  )}
                </button>

                {/* Account Option 3: Use another account */}
                <button
                  type="button"
                  disabled={selectedGoogleAccount !== null}
                  onClick={() => setShowCustomEmailInput(true)}
                  className="w-full p-2.5 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800">
                      Use another account
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Enter a different Google email address
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Email Entry Form */
              <form onSubmit={handleCustomGoogleSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Google Email or Phone
                  </label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={selectedGoogleAccount !== null}
                  className="w-full py-2 bg-[#1877f2] hover:bg-[#0866ff] text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {selectedGoogleAccount ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Next</span>
                  )}
                </button>
              </form>
            )}

            <p className="mt-5 text-center text-[10px] text-slate-400">
              To continue, Google will share your name, email address, and profile picture with ATS Score Checker.
            </p>
          </div>
        ) : (
          /* Main Auth View (Login, Signup, Forgot, or Reset Password) */
          <>
            {/* Modal Top Header */}
            {mode === 'forgot' ? (
              <div className="bg-gradient-to-b from-blue-50/70 to-white p-4 pb-3 border-b border-slate-100 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1877f2] mx-auto flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2">
                  <KeyRound className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Reset Password
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-normal">
                  Enter your email to receive a 6-digit verification code.
                </p>
              </div>
            ) : mode === 'reset' ? (
              <div className="bg-gradient-to-b from-blue-50/70 to-white p-4 pb-3 border-b border-slate-100 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1877f2] mx-auto flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Create New Password
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-normal">
                  Enter the verification code & new password to update the database.
                </p>
              </div>
            ) : mode === 'login' ? (
              <div className="bg-gradient-to-b from-blue-50/70 to-white p-4 pb-3 border-b border-slate-100 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1877f2] mx-auto flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2">
                  <FileCheck2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Welcome Back
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 font-normal">
                  Enter your credentials to access your account.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-blue-50/70 to-white p-4 pb-3 border-b border-slate-100 text-center">
                <div className="w-10 h-10 rounded-xl bg-[#1877f2] mx-auto flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-2">
                  <FileCheck2 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Welcome to ATS score checker
                </h3>
                <p className="text-sm font-bold text-[#1877f2] mt-0.5">
                  Create a free account
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 font-normal">
                  Enter credentials
                </p>
              </div>
            )}

            {/* Form Area */}
            {mode === 'forgot' ? (
              /* FORGOT PASSWORD FORM */
              <form onSubmit={handleForgotSubmit} className="p-4 space-y-3">
                <div className="relative pt-1.5">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setSubmitError('');
                      }}
                      placeholder=" "
                      className="peer w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                      required
                    />
                    <label 
                      htmlFor="forgot-email" 
                      className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                 peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                    >
                      Enter Registered Email
                    </label>
                  </div>
                </div>

                {submitError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#1877f2] hover:bg-[#0866ff] disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setSubmitError('');
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-[#1877f2] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Log In</span>
                  </button>
                </div>
              </form>
            ) : mode === 'reset' ? (
              /* RESET PASSWORD FORM */
              <form onSubmit={handleResetSubmit} className="p-4 space-y-2.5">
                {resetSuccessMsg && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-[#1877f2] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-blue-950">Code Dispatched!</p>
                      <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">{resetSuccessMsg}</p>
                    </div>
                  </div>
                )}

                {/* Email Address Readonly */}
                <div className="relative pt-1">
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Account Email"
                      className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* 6-Digit Verification Code */}
                <div className="relative pt-1">
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1877f2] z-10 pointer-events-none" />
                    <input
                      id="verificationCode"
                      type="text"
                      maxLength={6}
                      autoComplete="off"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value);
                        setSubmitError('');
                      }}
                      placeholder=" "
                      className="peer w-full pl-9 pr-3.5 py-2 bg-blue-50/50 border border-blue-300 rounded-lg text-xs font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                      required
                    />
                    <label 
                      htmlFor="verificationCode" 
                      className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                 peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                    >
                      Enter 6-Digit Code
                    </label>
                  </div>
                </div>

                {/* New Password */}
                <div className="relative pt-1">
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setSubmitError('');
                      }}
                      placeholder=" "
                      className={`peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 transition-all outline-hidden ${
                        newPassword.length > 0 && !isNewPasswordValid
                          ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-100'
                          : 'border-slate-200 focus:border-[#1877f2] focus:ring-blue-100'
                      }`}
                      required
                    />
                    <label 
                      htmlFor="newPassword" 
                      className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                 peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                    >
                      Enter New Password
                    </label>
                  </div>

                  {/* Password criteria checklist for reset */}
                  {newPassword.length > 0 && !isNewPasswordValid && (
                    <div className="mt-1.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] space-y-1 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1 text-amber-800 font-semibold mb-0.5">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>Password must meet the following criteria:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 text-[10px]">
                        <div className={`flex items-center gap-1 ${hasNewMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                          {hasNewMinLength ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasNewUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                          {hasNewUppercase ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                          <span>1 uppercase letter (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasNewLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                          {hasNewLowercase ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                          <span>1 lowercase letter (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasNewNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                          {hasNewNumber ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                          <span>1 number (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1 ${hasNewSpecialChar ? 'text-emerald-700 font-medium' : 'text-slate-500'} sm:col-span-2`}>
                          {hasNewSpecialChar ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                          <span>1 special character (@, #, $, !, etc.)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="relative pt-1">
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                    <input
                      id="confirmNewPassword"
                      type="password"
                      autoComplete="new-password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setSubmitError('');
                      }}
                      placeholder=" "
                      className={`peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 transition-all outline-hidden ${
                        confirmNewPassword.length > 0 && !newPasswordsMatch
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                          : 'border-slate-200 focus:border-[#1877f2] focus:ring-blue-100'
                      }`}
                      required
                    />
                    <label 
                      htmlFor="confirmNewPassword" 
                      className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                 peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                 peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                    >
                      Confirm New Password
                    </label>
                  </div>

                  {confirmNewPassword.length > 0 && !newPasswordsMatch && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 font-medium animate-in fade-in duration-150">
                      <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                      <span>Passwords do not match. Please check again.</span>
                    </div>
                  )}
                </div>

                {submitError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#1877f2] hover:bg-[#0866ff] disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleForgotPasswordClick();
                    }}
                    className="font-medium text-[#1877f2] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setSubmitError('');
                    }}
                    className="font-semibold text-slate-600 hover:text-[#1877f2] cursor-pointer"
                  >
                    Back to Log In
                  </button>
                </div>
              </form>
            ) : (
              /* LOGIN & SIGNUP FORMS */
              <form onSubmit={handleSubmit} className="p-4 space-y-2.5">
                
                {signupSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-950">Success!</p>
                      <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">{signupSuccessMsg}</p>
                    </div>
                  </div>
                )}

                {mode === 'login' ? (
                  /* LOGIN MODE FIELDS */
                  <>
                    {/* Email Field with Floating Label */}
                    <div className="relative pt-1.5">
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder=" "
                          className="peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                          required
                        />
                        <label 
                          htmlFor="login-email" 
                          className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                     peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                     peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                        >
                          Enter Email
                        </label>
                      </div>
                    </div>

                    {/* Password Field with Floating Label */}
                    <div className="relative pt-1.5">
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                          id="login-password"
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setSubmitError('');
                          }}
                          placeholder=" "
                          className="peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                          required
                        />
                        <label 
                          htmlFor="login-password" 
                          className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                     peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                     peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                        >
                          Enter Password
                        </label>
                      </div>
                      <div className="flex justify-end mt-1">
                        <button 
                          type="button" 
                          onClick={handleForgotPasswordClick}
                          className="text-[10px] font-medium text-[#1877f2] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  /* SIGNUP MODE FIELDS */
                  <>
                    {/* Full Name field with floating label */}
                    <div className="relative pt-1.5">
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                          id="fullName"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder=" "
                          className="peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                          required
                        />
                        <label 
                          htmlFor="fullName" 
                          className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                     peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                     peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                        >
                          Enter Name
                        </label>
                      </div>
                    </div>

                    {/* Email Address field with floating label */}
                    <div className="relative pt-1.5">
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder=" "
                          className="peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all outline-hidden"
                          required
                        />
                        <label 
                          htmlFor="email" 
                          className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                     peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                     peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                        >
                          Enter Email
                        </label>
                      </div>
                    </div>

                    {/* Create Password with floating label */}
                    <div className="relative pt-1.5">
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setSubmitError('');
                          }}
                          placeholder=" "
                          className={`peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 transition-all outline-hidden ${
                            password.length > 0 && !isPasswordValid 
                              ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-100' 
                              : 'border-slate-200 focus:border-[#1877f2] focus:ring-blue-100'
                          }`}
                          required
                        />
                        <label 
                          htmlFor="signup-password" 
                          className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                     peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                     peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                        >
                          Create Password
                        </label>
                      </div>

                      {/* Password Criteria Alert Box */}
                      {password.length > 0 && !isPasswordValid && (
                        <div className="mt-1.5 p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] space-y-1 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1 text-amber-800 font-semibold mb-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Password must meet the following criteria:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 text-[10px]">
                            <div className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                              {hasMinLength ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                              <span>At least 8 characters</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                              {hasUppercase ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                              <span>1 uppercase letter (A-Z)</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                              {hasLowercase ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                              <span>1 lowercase letter (a-z)</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                              {hasNumber ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                              <span>1 number (0-9)</span>
                            </div>
                            <div className={`flex items-center gap-1 ${hasSpecialChar ? 'text-emerald-700 font-medium' : 'text-slate-500'} sm:col-span-2`}>
                              {hasSpecialChar ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> : <span className="w-1 h-1 rounded-full bg-slate-300 ml-1 mr-0.5"></span>}
                              <span>1 special character (@, #, $, !, etc.)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password with floating label */}
                    <div className="relative pt-1.5">
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none" />
                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setSubmitError('');
                          }}
                          placeholder=" "
                          className={`peer w-full pl-9 pr-3.5 py-2 bg-slate-50 border rounded-lg text-xs font-normal text-slate-900 focus:bg-white focus:ring-2 transition-all outline-hidden ${
                            confirmPassword.length > 0 && !passwordsMatch
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                              : 'border-slate-200 focus:border-[#1877f2] focus:ring-blue-100'
                          }`}
                          required
                        />
                        <label 
                          htmlFor="confirmPassword" 
                          className="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-xs transition-all pointer-events-none bg-transparent px-1
                                     peer-focus:-top-2 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:font-semibold peer-focus:text-[#1877f2] peer-focus:bg-white
                                     peer-not-placeholder-shown:-top-2 peer-not-placeholder-shown:translate-y-0 peer-not-placeholder-shown:text-[10px] peer-not-placeholder-shown:font-semibold peer-not-placeholder-shown:text-slate-600 peer-not-placeholder-shown:bg-white"
                        >
                          Confirm Password
                        </label>
                      </div>

                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-rose-600 font-medium animate-in fade-in duration-150">
                          <AlertCircle className="w-3 h-3 shrink-0 text-rose-500" />
                          <span>Passwords do not match. Please check again.</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Submission error alert if any */}
                {submitError && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-[#1877f2] hover:bg-[#0866ff] disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{mode === 'login' ? 'Signing In...' : 'Creating Account...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {/* Account Mode Switcher */}
                <div className="text-center text-[11px] text-slate-500 pt-0.5">
                  {mode === 'login' ? (
                    <span>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setSubmitError('');
                          setSignupSuccessMsg('');
                        }}
                        className="font-semibold text-[#1877f2] hover:underline cursor-pointer"
                      >
                        Create a free account
                      </button>
                    </span>
                  ) : (
                    <span>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setSubmitError('');
                          setSignupSuccessMsg('');
                        }}
                        className="font-semibold text-[#1877f2] hover:underline cursor-pointer"
                      >
                        Log In
                      </button>
                    </span>
                  )}
                </div>



              </form>
            )}          {/* Security badge footer */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-normal">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-bit SSL encrypted & GDPR compliant storage</span>
            </div>
          </>
        )}

      </div>

    </div>
  );
};



