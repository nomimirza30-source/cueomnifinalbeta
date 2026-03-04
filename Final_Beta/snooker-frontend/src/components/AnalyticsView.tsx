import { useState, useEffect } from 'react';
import { db, type Payment, type LocalSession } from '../db/schema';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Clock, ArrowLeft, Download, Filter } from 'lucide-react';
import { format, startOfDay, subDays, isWithinInterval } from 'date-fns';

interface AnalyticsViewProps {
    onClose: () => void;
}

export const AnalyticsView = ({ onClose }: AnalyticsViewProps) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [sessions, setSessions] = useState<LocalSession[]>([]);
    const [timeRange, setTimeRange] = useState(7); // default 7 days

    useEffect(() => {
        const loadData = async () => {
            const p = await db.payments.toArray();
            const s = await db.sessions.toArray();
            setPayments(p);
            setSessions(s);
        };
        loadData();
    }, []);

    // Process data for charts
    const getRevenueData = () => {
        const data = [];
        for (let i = timeRange - 1; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = startOfDay(date).getTime();
            const dayEnd = dayStart + 86400000;

            const dayRevenue = payments
                .filter(p => p.timestamp >= dayStart && p.timestamp < dayEnd)
                .reduce((sum, p) => sum + p.amount, 0);

            data.push({
                name: format(date, 'MMM dd'),
                revenue: dayRevenue
            });
        }
        return data;
    };

    const getMethodData = () => {
        const cash = payments.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0);
        const card = payments.filter(p => p.method === 'Card').reduce((sum, p) => sum + p.amount, 0);
        return [
            { name: 'Cash', value: cash },
            { name: 'Card', value: card }
        ];
    };

    const COLORS = ['#10b981', '#0ea5e9'];

    const stats = {
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
        totalSessions: sessions.length,
        avgSessionValue: payments.length > 0 ? payments.reduce((sum, p) => sum + p.amount, 0) / payments.length : 0,
        peakTable: 'Table 4' // Mock for now
    };

    return (
        <div className="fixed inset-0 z-50 glass backdrop-blur-3xl p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-6">
                        <button onClick={onClose} className="p-3 glass rounded-2xl hover:bg-white/10 transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Business Analytics</h2>
                            <p className="text-slate-400 font-medium">Financial performance & insights</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="glass px-2 py-1 rounded-xl flex">
                            {[7, 30, 90].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setTimeRange(d)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === d ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {d}D
                                </button>
                            ))}
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 glass rounded-2xl font-bold text-sm hover:bg-white/10 transition-colors">
                            <Download size={18} /> Export CSV
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Revenue', value: `£${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Total Sessions', value: stats.totalSessions, icon: Clock, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                        { label: 'Avg. Transaction', value: `£${stats.avgSessionValue.toFixed(2)}`, icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Top Customer', value: 'Nauman B.', icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' }
                    ].map((stat, i) => (
                        <div key={i} className="glass p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`}></div>
                            <div className="relative z-10">
                                <stat.icon className={`${stat.color} mb-4`} size={28} />
                                <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                                <div className="text-3xl font-black text-white">{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                            Revenue Timeline <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">+12% vs LW</span>
                        </h3>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={getRevenueData()}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-xl font-bold mb-8">Payment Methods</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={getMethodData()}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {getMethodData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-8 mt-4">
                            {getMethodData().map((m, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                                    <span className="text-sm font-bold text-slate-400 capitalize">{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
                        <div className="space-y-4">
                            {payments.slice(-5).reverse().map(p => (
                                <div key={p.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${p.method === 'Cash' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
                                            {p.method === 'Cash' ? <Banknote size={20} /> : <CreditCard size={20} />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white uppercase text-xs tracking-wider">{p.method} Payment</div>
                                            <div className="text-xs text-slate-500">{format(p.timestamp, 'HH:mm')} • {format(p.timestamp, 'MMM dd')}</div>
                                        </div>
                                    </div>
                                    <div className="text-lg font-black text-white">£{p.amount.toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-xl font-bold mb-4">Table Efficiency</h3>
                        <p className="text-sm text-slate-500 mb-8">Utilization rate per table over the selected period.</p>
                        {/* Mock table visualization */}
                        <div className="grid grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="w-full bg-white/5 rounded-2xl h-24 relative overflow-hidden flex items-end">
                                        <div className="w-full bg-emerald-500/40" style={{ height: `${Math.random() * 80 + 20}%` }}></div>
                                        <span className="absolute inset-0 flex items-center justify-center font-black text-white text-xl">T{i}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">78%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Banknote = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>;
const CreditCard = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>;
