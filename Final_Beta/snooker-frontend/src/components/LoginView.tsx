import { useState } from 'react';
import { db, type User } from '../db/schema';
import { Lock, User as UserIcon, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginViewProps {
    onLogin: (user: User) => void;
}

export const LoginView = ({ onLogin }: LoginViewProps) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const user = await db.users.where('username').equals(username.toLowerCase()).first();

            if (user && user.password === password) {
                onLogin(user);
            } else {
                setError('Invalid username or password');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="glass p-12 rounded-[3.5rem] border border-white/5 relative z-10 shadow-2xl">
                    <div className="flex flex-col items-center mb-12">
                        <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20 mb-6">
                            <ShieldCheck size={40} />
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">CueOmni</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Staff Portal Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Username</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-4 rounded-2xl text-xs font-bold border border-rose-500/20 animate-in shake duration-300">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-5 rounded-3xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm mt-8"
                        >
                            {isLoading ? 'Verifying...' : 'Unlock Terminal'}
                        </button>
                    </form>

                    <p className="text-center text-slate-600 text-[10px] font-bold mt-12 uppercase tracking-widest">
                        CueOmni Snooker Management • v2.0.4
                    </p>
                </div>
            </div>
        </div>
    );
};
