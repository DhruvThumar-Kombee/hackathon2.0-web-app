import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import api from '@/lib/api';
import { formatError } from '@/lib/utils';

interface AuthFormProps {
  view: 'login' | 'register';
  onSuccess: () => void;
}

export function AuthForm({ view, onSuccess }: AuthFormProps) {
  const [authForm, setAuthForm] = useState({ email: '', username: '', password: '' });
  const [currentView, setCurrentView] = useState(view);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentView === 'login') {
        const { data } = await api.post('/api/auth/login', { 
          email: authForm.email, 
          password: authForm.password 
        });
        localStorage.setItem('token', data.access_token);
        toast.success("Welcome back!");
        onSuccess();
        navigate('/dashboard');
      } else {
        await api.post('/api/auth/register', authForm);
        toast.success("Registration successful! Please login.");
        setCurrentView('login');
        navigate('/login');
      }
    } catch (err: unknown) {
      toast.error(formatError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950">
      <Card className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <CardHeader className="space-y-1 relative z-10">
          <CardTitle className="text-2xl font-bold text-center">
            {currentView === 'login' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            {currentView === 'login' ? 'Identify yourself to the system' : 'Join the engineering grid'}
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleAuth} className="space-y-4">
            {currentView === 'register' && (
              <Input 
                placeholder="Username" 
                value={authForm.username} 
                onChange={e => setAuthForm({ ...authForm, username: e.target.value })} 
                className="bg-slate-800 border-slate-700 focus:ring-blue-500" 
                required 
              />
            )}
            <Input 
              type="email" 
              placeholder="Email" 
              value={authForm.email} 
              onChange={e => setAuthForm({ ...authForm, email: e.target.value })} 
              className="bg-slate-800 border-slate-700 focus:ring-blue-500" 
              required 
            />
            <Input 
              type="password" 
              placeholder="Password" 
              value={authForm.password} 
              onChange={e => setAuthForm({ ...authForm, password: e.target.value })} 
              className="bg-slate-800 border-slate-700 focus:ring-blue-500" 
              required 
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded shadow-lg shadow-blue-900/20">
              {currentView === 'login' ? 'Initialize' : 'Sync Account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button 
              onClick={() => {
                const next = currentView === 'login' ? 'register' : 'login';
                setCurrentView(next);
                navigate(`/${next}`);
              }} 
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {currentView === 'login' ? "Need access? Register" : "Already synced? Login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
