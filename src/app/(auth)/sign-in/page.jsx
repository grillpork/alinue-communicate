import AuthForm from '@/components/auth/AuthForm';

export const metadata = {
  title: 'Sign In - Alinue',
  description: 'Sign in to your Alinue account',
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gray-50/50">
      <AuthForm type="sign-in" />
    </div>
  );
}

