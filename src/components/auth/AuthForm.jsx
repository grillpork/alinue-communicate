'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useSignInMutation, useSignUpMutation, authService } from '@/services/auth';

/**
 * Reusable AuthForm Component
 * รองรับทั้งโหมด 'sign-in' และ 'sign-up' เชื่อมโยงกับ TanStack Query และ Backend อัตโนมัติ
 * @param {'sign-in' | 'sign-up'} type - รูปแบบฟอร์ม
 * @param {Function} onSubmit - ฟังก์ชัน Callback เมื่อกดยืนยันฟอร์ม (ถ้าไม่ส่งจะใช้ TanStack Query Mutation อัตโนมัติ)
 */
export default function AuthForm({ type = 'sign-in', onSubmit }) {
  const router = useRouter();
  const isSignIn = type === 'sign-in';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // 1. TanStack Query Mutations
  const signInMutation = useSignInMutation({
    onSuccess: () => {
      router.push('/');
    },
    onError: (err) => {
      setError(err?.message || 'Invalid email or password');
    },
  });

  const signUpMutation = useSignUpMutation({
    onSuccess: () => {
      router.push('/');
    },
    onError: (err) => {
      setError(err?.message || 'Failed to create account');
    },
  });

  const isSubmitting = signInMutation.isPending || signUpMutation.isPending;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || (!isSignIn && !formData.name)) {
      setError('Please fill in all required fields.');
      return;
    }

    if (onSubmit) {
      try {
        await onSubmit(formData);
      } catch (err) {
        setError(err?.message || 'Something went wrong');
      }
      return;
    }

    if (isSignIn) {
      signInMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      signUpMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const apiUrl = authService.getGoogleAuthUrl();
      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      if (data?.url) {
        window.location.href = data.url;
      } else {
        window.location.href = apiUrl;
      }
    } catch {
      window.location.href = authService.getGoogleAuthUrl();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Brand Header: Logo + Title */}
      <div className="flex flex-col items-center text-center mb-6">
        <Link href="/" className="group mb-3 transition-transform active:scale-95">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100/90 shadow-2xs group-hover:scale-105 transition-transform">
            <Image
              src="/logos/LogoAlinue.png"
              alt="Alinue Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          {isSignIn ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          {isSignIn
            ? 'Sign in to access your portfolio and feed'
            : 'Join the community of top creative designers'}
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-medium text-red-600 animate-in fade-in duration-150">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (Sign Up only) */}
          {!isSignIn && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className="w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                Password
              </label>
              {isSignIn && (
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-medium text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Forgot?
                </Link>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 bg-transparent py-2.5 pl-9 pr-9 text-xs text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                <span>{isSignIn ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-white px-2 font-medium text-gray-400">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-2">
          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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
            <span>Google</span>
          </button>

          {/* GitHub */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-2 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
            <span>GitHub</span>
          </button>
        </div>
      </div>

      {/* Switch between Sign in and Sign up */}
      <p className="mt-5 text-center text-xs text-gray-500">
        {isSignIn ? "Don't have an account? " : 'Already have an account? '}
        <Link
          href={isSignIn ? '/sign-up' : '/sign-in'}
          className="font-semibold text-gray-900 underline underline-offset-4 hover:text-black transition-colors"
        >
          {isSignIn ? 'Sign up' : 'Sign in'}
        </Link>
      </p>
    </div>
  );
}
