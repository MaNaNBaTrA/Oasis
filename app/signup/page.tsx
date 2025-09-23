'use client'

import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import LottieAnimation from '@/components/Animation'; 
import animationData from '@/public/Truck.json'; 
import Oasis from "@/public/Logo.svg";

const SignUpPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [role, setRole] = useState<'Worker' | 'Individual'>('Individual');
    const [passwordLoading, setPasswordLoading] = useState<boolean>(false);
    const [googleLoading, setGoogleLoading] = useState<boolean>(false);
    const [focusedInput, setFocusedInput] = useState<string>('');

    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                router.push('/');
            }
        };
        checkUser();
    }, [router]);

    const SigninClick = () => {
        router.push('/signin');
    };

    const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const getPasswordValidation = () => {
        const hasMinLength = password.length >= 8;
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);

        return {
            hasMinLength,
            hasSymbol,
            hasNumber,
            hasUpperCase,
            hasLowerCase,
            isValid: hasMinLength && hasSymbol && hasNumber && hasUpperCase && hasLowerCase
        };
    };

    const passwordValidation = getPasswordValidation();
    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

    async function checkUserExists(email: string): Promise<{ exists: boolean; error?: string }> {
        try {
            const res = await fetch('/api/user/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                return {
                    exists: false,
                    error: errorData.error || `Server error (${res.status}): Please try again later`
                };
            }

            const data = await res.json();
            return { exists: data.exists };

        } catch (error) {
            console.error('Network error in checkUserExists:', error);
            return {
                exists: false,
                error: `Connection failed: ${error instanceof Error ? error.message : 'Please check your internet connection'}`
            };
        }
    }

    async function addUserToMongoDB(email: string, role: 'Worker' | 'Individual'): Promise<{ success: boolean; user?: any; error?: string }> {
        try {
            const res = await fetch('/api/user/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    role,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return {
                    success: false,
                    error: data.error || `Server error (${res.status}): Failed to create profile`
                };
            }

            if (data.success && data.user) {
                return { success: true, user: data.user };
            }

            return {
                success: false,
                error: data.error || 'No user data returned from server'
            };

        } catch (error) {
            console.error('Network error in addUserToMongoDB:', error);
            return {
                success: false,
                error: `Profile creation failed: ${error instanceof Error ? error.message : 'Network connection error'}`
            };
        }
    }

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            showToast('Please fill in all required fields', 'warning');
            return;
        }

        if (!isValidEmail(email)) {
            showToast('Please enter a valid email address', 'warning');
            return;
        }

        if (!passwordValidation.isValid) {
            showToast('Password must meet all security requirements', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'warning');
            return;
        }

        setPasswordLoading(true);

        try {
            const userCheck = await checkUserExists(email.trim().toLowerCase());

            if (userCheck.error) {
                console.error('User check error:', userCheck.error);
                showToast(`User verification failed: ${userCheck.error}`, 'error');
                return;
            }

            if (userCheck.exists) {
                showToast('An account with this email already exists. Please sign in instead.', 'warning');
                return;
            }

            showToast('Creating your account...', 'info');

            const profileResult = await addUserToMongoDB(email.trim().toLowerCase(), role);

            if (!profileResult.success) {
                console.error('Profile creation error:', profileResult.error);
                showToast(`Profile setup failed: ${profileResult.error || 'Unknown error'}`, 'error');
                return;
            }

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        role: role,
                        user_id: profileResult.user.id
                    }
                }
            });

            if (authError) {
                console.error('Supabase auth error:', authError);
                let errorMessage = 'Account creation failed';

                if (authError.message.includes('Email rate limit exceeded')) {
                    errorMessage = 'Too many signup attempts. Please try again in a few minutes.';
                } else if (authError.message.includes('Password should be at least')) {
                    errorMessage = 'Password does not meet requirements';
                } else if (authError.message.includes('Unable to validate email address')) {
                    errorMessage = 'Invalid email address format';
                } else {
                    errorMessage = `Account creation failed: ${authError.message}`;
                }

                showToast(errorMessage, 'error');
                return;
            }

            if (!authData.user) {
                console.error('No user data returned from Supabase');
                showToast('Account creation failed: No user data received', 'error');
                return;
            }

            showToast('Account created successfully! Please check your email to verify your account before signing in.', 'success');

            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRole('Individual');

        } catch (error) {
            console.error('Unexpected error during signup:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            showToast(`Signup failed: ${errorMessage}. Please try again.`, 'error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setGoogleLoading(true);

        try {
            showToast('Redirecting to Google...', 'info');

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        role: role,
                    }
                },
            });

            if (error) {
                console.error('Google OAuth error:', error);
                let errorMessage = 'Google sign up failed';

                if (error.message.includes('popup')) {
                    errorMessage = 'Popup was blocked. Please allow popups and try again.';
                } else if (error.message.includes('network')) {
                    errorMessage = 'Network error. Please check your connection.';
                } else {
                    errorMessage = `Google sign up failed: ${error.message}`;
                }

                showToast(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Unexpected Google OAuth error:', error);
            showToast('Failed to sign up with Google. Please try again.', 'error');
        } finally {
            setGoogleLoading(false);
        }
    };

    const isAnyLoading = passwordLoading || googleLoading;

    return (
        <main className='flex justify-center min-h-screen lg:justify-start'>
            <section className='w-full max-w-md lg:w-2/5 lg:max-w-none bg-base-100 flex flex-col justify-center lg:justify-start'>
                <div className='w-full px-8 pt-4 pb-2'>
                     <Image src={Oasis} alt="Oasis" width={50} height={50} />
                </div>
                <div className='w-full flex-1 flex justify-center lg:px-0 pt-4'>
                    <div className='w-full sm:max-w-sm lg:max-w-none lg:w-7/10 flex flex-col max-w-none px-12 sm:px-0'>
                        <div className="flex flex-col gap-2">
                            <span className="text-3xl font-semibold">Create your account</span>
                            <span className="text-sm font-medium text-base-content/70">Sign up to get started</span>
                        </div>
                        <div className="flex flex-col gap-4 mt-8">
                            <div className="w-full flex flex-col gap-2">
                                <span className="font-medium text-sm">Email</span>
                                <div className="form-control">
                                    <input
                                        type="email"
                                        placeholder="mail@site.com"
                                        className="input input-bordered input-md w-full"
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        disabled={isAnyLoading}
                                        required
                                        value={email}
                                    />
                                </div>
                            </div>

                            <div className="w-full flex flex-col gap-2">
                                <span className="font-medium text-sm">Role</span>
                                <select
                                    className="select select-bordered select-md w-full"
                                    value={role}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'Worker' | 'Individual')}
                                    disabled={isAnyLoading}
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Worker">Worker</option>
                                </select>
                            </div>

                            <div className="w-full flex flex-col gap-2 relative">
                                <div>
                                    <span className="font-medium text-sm">Password</span>
                                </div>
                                <div className="form-control">
                                    <input
                                        type="password"
                                        placeholder="Enter your password"
                                        className="input input-bordered input-md w-full"
                                        value={password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedInput('password')}
                                        onBlur={() => setFocusedInput('')}
                                        disabled={isAnyLoading}
                                        required
                                    />
                                </div>
                                {password && focusedInput === 'password' && (
                                    <div className="absolute top-full mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full max-[920px]:top-full max-[920px]:mt-2 max-[920px]:w-full min-[921px]:left-full min-[921px]:ml-4 min-[921px]:top-12 min-[921px]:w-64">
                                        <div className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</div>
                                        <div className="space-y-1">
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasMinLength ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasMinLength ? '✓' : '✗'}</span>
                                                <span>At least 8 characters</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasSymbol ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasSymbol ? '✓' : '✗'}</span>
                                                <span>Contains a symbol (!@#$%^&*)</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasNumber ? '✓' : '✗'}</span>
                                                <span>Contains a number</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasUpperCase ? '✓' : '✗'}</span>
                                                <span>Contains uppercase letter</span>
                                            </div>
                                            <div className={`text-xs flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-red-600'}`}>
                                                <span>{passwordValidation.hasLowerCase ? '✓' : '✗'}</span>
                                                <span>Contains lowercase letter</span>
                                            </div>
                                        </div>
                                        <div className="hidden min-[921px]:block absolute left-[-6px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-gray-200"></div>
                                        <div className="hidden min-[921px]:block absolute left-[-5px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-white"></div>
                                        <div className="block min-[921px]:hidden absolute top-[-6px] left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-200"></div>
                                        <div className="block min-[921px]:hidden absolute top-[-5px] left-4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-white"></div>
                                    </div>
                                )}
                            </div>

                            <div className="w-full flex flex-col gap-2 relative">
                                <div>
                                    <span className="font-medium text-sm">Confirm Password</span>
                                </div>
                                <div className="form-control">
                                    <input
                                        type="password"
                                        placeholder="Confirm your password"
                                        className="input input-bordered input-md w-full"
                                        value={confirmPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                        onFocus={() => setFocusedInput('confirmPassword')}
                                        onBlur={() => setFocusedInput('')}
                                        disabled={isAnyLoading}
                                        required
                                    />
                                </div>
                                {confirmPassword && focusedInput === 'confirmPassword' && (
                                    <div className="absolute top-full mt-2 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full min-[920px]:left-full min-[920px]:ml-4 min-[920px]:top-12 min-[920px]:w-48">
                                        <div className={`text-xs flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                            <span>{passwordsMatch ? '✓' : '✗'}</span>
                                            <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                                        </div>
                                        <div className="hidden min-[920px]:block absolute left-[-6px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-gray-200"></div>
                                        <div className="hidden min-[920px]:block absolute left-[-5px] top-4 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent border-r-white"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-gray-500 my-6">
                            <hr className="flex-grow border-t border-gray-300" />
                            <span className="text-sm">or</span>
                            <hr className="flex-grow border-t border-gray-300" />
                        </div>
                        
                        <div className="space-y-4">
                            <button
                                className="btn btn-outline w-full"
                                onClick={handleGoogleSignUp}
                                disabled={isAnyLoading}
                            >
                                {googleLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <svg aria-label="Google logo" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <g>
                                            <path d="m0 0H512V512H0" fill="#fff"></path>
                                            <path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path>
                                            <path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path>
                                            <path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path>
                                            <path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path>
                                        </g>
                                    </svg>
                                )}
                                {googleLoading ? 'Signing up with Google...' : 'Sign up with Google'}
                            </button>
                            
                            <button
                                className="btn btn-primary w-full bg-brand"
                                onClick={handleSignUp}
                                disabled={isAnyLoading}
                            >
                                {passwordLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    <svg aria-label="Email icon" width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                        <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor">
                                            <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                                        </g>
                                    </svg>
                                )}
                                {passwordLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </div>
                        
                        <div className="text-sm font-medium flex gap-1 justify-center mt-8">
                            <span>Already have an account?</span>
                            <span className="link link-primary cursor-pointer text-brand" onClick={SigninClick}>
                                Sign In Now
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            
            <section className="hidden lg:flex relative w-3/5 bg-base-200">
                <div className="flex items-center justify-center w-full">
                    <div className="text-center">
                        <div className="mb-8">
                            <LottieAnimation
                                animationData={animationData}
                                width={500}
                                height={500}
                            />
                        </div>
                        <h2 className="text-2xl font-bold text-base-content/80 mb-4">
                            Join Our Community
                        </h2>
                        <p className="text-base-content/60 max-w-md mx-auto">
                            Create your account and start connecting with care workers and individuals in your area.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default SignUpPage;