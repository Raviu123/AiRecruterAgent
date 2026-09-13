"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, MailCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from '@/app/provider'
import { signInWithEmail, signUpWithEmail } from '@/services/authService'

const MODES = { SIGN_IN: 'signin', SIGN_UP: 'signup' }
const EMPTY_FORM = { name: '', email: '', password: '', confirmPassword: '' }

const AuthPage = () => {
  const router = useRouter();
  const { session } = useUser();
  const [mode, setMode] = useState(MODES.SIGN_IN);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState(null);

  const isSignUp = mode === MODES.SIGN_UP;

  useEffect(() => {
    if (session) router.replace('/dashboard');
  }, [session, router]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setError(null);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError(null);
    setConfirmationEmail(null);
    setForm((prev) => ({ ...EMPTY_FORM, email: prev.email }));
  };

  const validate = () => {
    if (isSignUp && !form.name.trim()) return 'Please enter your name.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return 'Please enter a valid email address.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (isSignUp && form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    const email = form.email.trim();
    try {
      if (isSignUp) {
        const result = await signUpWithEmail({ name: form.name.trim(), email, password: form.password });
        if (result.emailConfirmationRequired) {
          setConfirmationEmail(email);
          setForm({ ...EMPTY_FORM, email });
          return;
        }
        toast.success('Account created! Welcome aboard.');
      } else {
        await signInWithEmail({ email, password: form.password });
        toast.success('Signed in');
      }
      // The provider picks up the new session and the effect above redirects.
    } catch (err) {
      console.error(`Error during ${isSignUp ? 'sign up' : 'sign in'}:`, err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='bg-white rounded-xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6'>
          <div className='flex flex-col items-center text-center space-y-2'>
            <Image src='/newlogo.png' width={180} height={90} alt="Logo" priority />
            <h2 className='text-2xl font-bold text-gray-900'>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className='text-gray-500 text-sm'>
              {isSignUp ? 'Sign up to start practicing AI mock interviews.' : 'Sign in to continue your interview prep.'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className='grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1'>
            {[[MODES.SIGN_IN, 'Sign In'], [MODES.SIGN_UP, 'Sign Up']].map(([value, label]) => (
              <button
                key={value}
                type='button'
                onClick={() => switchMode(value)}
                className={`rounded-md py-2 text-sm font-medium transition-all ${
                  mode === value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {confirmationEmail ? (
            <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-3'>
              <MailCheck className='h-10 w-10 text-emerald-600 mx-auto' />
              <h3 className='font-semibold text-emerald-900'>Check your inbox</h3>
              <p className='text-sm text-emerald-800'>
                We sent a confirmation link to <span className='font-semibold'>{confirmationEmail}</span>.
                Open it to activate your account, then sign in.
              </p>
              <Button variant='outline' onClick={() => switchMode(MODES.SIGN_IN)}>Go to Sign In</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4' noValidate>
              {isSignUp && (
                <div className='space-y-1'>
                  <label htmlFor='name' className='text-sm font-medium text-gray-700'>Full name</label>
                  <Input id='name' autoComplete='name' placeholder='Alex Johnson' value={form.name} onChange={updateField('name')} />
                </div>
              )}

              <div className='space-y-1'>
                <label htmlFor='email' className='text-sm font-medium text-gray-700'>Email</label>
                <Input id='email' type='email' autoComplete='email' placeholder='you@example.com' value={form.email} onChange={updateField('email')} />
              </div>

              <div className='space-y-1'>
                <label htmlFor='password' className='text-sm font-medium text-gray-700'>Password</label>
                <Input
                  id='password'
                  type='password'
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                  value={form.password}
                  onChange={updateField('password')}
                />
              </div>

              {isSignUp && (
                <div className='space-y-1'>
                  <label htmlFor='confirmPassword' className='text-sm font-medium text-gray-700'>Confirm password</label>
                  <Input
                    id='confirmPassword'
                    type='password'
                    autoComplete='new-password'
                    placeholder='Re-enter your password'
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                  />
                </div>
              )}

              {error && (
                <p role='alert' className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
                  {error}
                </p>
              )}

              <Button type='submit' disabled={submitting} className='w-full bg-blue-600 hover:bg-blue-700 text-white gap-2'>
                {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
          )}

          <p className='text-center text-sm text-gray-500'>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type='button'
              onClick={() => switchMode(isSignUp ? MODES.SIGN_IN : MODES.SIGN_UP)}
              className='font-medium text-blue-600 hover:underline'
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
