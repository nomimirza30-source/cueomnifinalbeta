import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalTable, type LocalSession, type User } from './db/schema';
import { TableCard } from './components/TableCard';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useSignalR } from './hooks/useSignalR';
import axios from 'axios';
import { LayoutDashboard, Settings, History, Wifi, WifiOff, Calendar, TrendingUp, Users, LogOut, Activity } from 'lucide-react';
import { AdminPanel } from './components/AdminPanel';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { CustomerManager } from './components/CustomerManager';
import { ConsumablesMenu } from './components/ConsumablesMenu';
import { LoginView } from './components/LoginView';
import { DebugPanel } from './components/DebugPanel';
import { FIXED_TABLE_IDS } from './constants/TableConstants';

import { PaymentModal } from './components/PaymentModal';

import { MENU_ITEMS } from './constants/MenuItems';
import { v4 as uuidv4 } from 'uuid';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5277/api';

function App() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
    const [isCustomersOpen, setIsCustomersOpen] = useState(false);
    const [activePaymentSession, setActivePaymentSession] = useState<LocalSession | null>(null);
    const [activeConsumablesSession, setActiveConsumablesSession] = useState<LocalSession | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const tables = useLiveQuery(() => db.snookerTables.toArray(), []) || [];

    useOfflineSync();
    const { isConnected } = useSignalR(() => hydrateDB());

    const hydrateDB = async () => {
        if (!navigator.onLine) {
            console.warn('Cannot hydrate: Browser is offline');
            return;
        }
        try {
            console.log('Hydrating local database from server (Hard Sync)...');
            const response = await axios.get(`${API_URL}/sync/state`);
            const { tables: serverTables, activeSessions, customers, reservations, rates: serverRates } = response.data;

            await db.transaction('rw', [db.snookerTables, db.sessions, db.customers, db.reservations, db.rates], async () => {
                // HARD SYNC: Clear existing tables and sessions to ensure ID alignment
                await db.snookerTables.clear();
                await db.sessions.clear();
                await db.rates.clear();

                // Import Server State truth
                if (serverTables) await db.snookerTables.bulkPut(serverTables.map((t: any) => ({ ...t, isSynced: 1 })));
                if (activeSessions) {
                    const parsedSessions = activeSessions.map((s: any) => ({
                        ...s,
                        startTime: typeof s.startTime === 'string' ? new Date(s.startTime).getTime() : s.startTime,
                        endTime: s.endTime && typeof s.endTime === 'string' ? new Date(s.endTime).getTime() : s.endTime,
                        isSynced: 1
                    }));
                    await db.sessions.bulkPut(parsedSessions);
                }
                if (customers) await db.customers.bulkPut(customers.map((c: any) => ({ ...c, isSynced: 1 })));
                if (reservations) await db.reservations.bulkPut(reservations.map((r: any) => ({ ...r, isSynced: 1 })));
                if (serverRates) await db.rates.bulkPut(serverRates.map((r: any) => ({ ...r, isSynced: 1 })));
            });

            console.log('Hydration complete: Local state aligned with server master.');
        } catch (error) {
            console.error('Hydration failed. Check API connectivity at:', API_URL, error);
        }
    };

    useEffect(() => {
        const init = async () => {
            // Seed base configuration items (Staff/Admin/Menu)
            await seedBaseData();

            // If online, grab the master state from server
            if (currentUser && navigator.onLine) {
                await hydrateDB();
            } else if (!currentUser) {
                // If we don't have tables yet and are offline, we can't do much, 
                // but let's at least seed them once if they really don't exist
                if (await db.snookerTables.count() === 0) {
                    await seedDefaultTables();
                }
            }
        };
        init();
    }, [currentUser]);

    const seedBaseData = async () => {
        // Seed Menu Items
        if (await db.menuItems.count() === 0) {
            await db.menuItems.bulkAdd(MENU_ITEMS);
        }
        // Seed Admin
        if (await db.users.count() === 0) {
            await db.users.add({
                id: uuidv4(),
                username: 'admin',
                password: '123',
                displayName: 'System Admin',
                role: 'Admin',
                createdAt: Date.now()
            });
        }
    };

    const seedDefaultTables = async () => {
        const initialTables: LocalTable[] = Object.entries(FIXED_TABLE_IDS).map(([num, id]) => ({
            id,
            tableNumber: parseInt(num),
            status: 'Available',
            hourlyRate: 10.00,
            isSynced: 0
        }));
        await db.snookerTables.bulkAdd(initialTables);
    };

    const seedData = async () => {
        // This is now legacy/unused but keeping it to avoid breaking other parts if called
        await seedBaseData();
    };

    useEffect(() => {
        const handleStatus = () => setIsOnline(navigator.onLine);
        window.addEventListener('online', handleStatus);
        window.addEventListener('offline', handleStatus);
        return () => {
            window.removeEventListener('online', handleStatus);
            window.removeEventListener('offline', handleStatus);
        };
    }, []);

    const handlePaymentComplete = () => {
        setActivePaymentSession(null);
    };

    if (!currentUser) {
        return <LoginView onLogin={setCurrentUser} />;
    }

    return (
        <div className="min-h-screen bg-[#020817] text-slate-100 flex flex-col md:flex-row">
            {/* Sidebar / Topbar */}
            <div className="w-full md:w-20 lg:w-24 bg-[#0B1120]/80 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/5 flex flex-row md:flex-col items-center justify-between p-4 md:py-8 z-50">
                <div className="flex flex-row md:flex-col items-center gap-8">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Activity className="text-white" size={24} />
                        </div>
                        {/* Connection Status Dot */}
                        <button
                            onClick={() => hydrateDB()}
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#020817] shadow-sm transform transition-all duration-500 hover:scale-125 focus:outline-none ${isConnected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 animate-pulse'}`}
                            title={isConnected ? 'Connected. Click to refresh state.' : 'Offline. Click to retry connection.'}
                        />
                    </div>

                    <nav className="flex flex-row md:flex-col items-center gap-6">
                        <button
                            onClick={() => { setIsAdminOpen(false); setIsCalendarOpen(false); setIsAnalyticsOpen(false); setIsCustomersOpen(false); }}
                            className={`p-3 rounded-xl transition-all duration-300 ${(!isAdminOpen && !isCalendarOpen && !isAnalyticsOpen && !isCustomersOpen) ? 'bg-teal-500/10 text-teal-400 shadow-inner shadow-teal-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <LayoutDashboard size={24} />
                        </button>
                        <button
                            onClick={() => { setIsCalendarOpen(true); setIsAdminOpen(false); setIsAnalyticsOpen(false); setIsCustomersOpen(false); }}
                            className={`p-3 rounded-xl transition-all duration-300 ${isCalendarOpen ? 'bg-teal-500/10 text-teal-400 shadow-inner shadow-teal-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <Calendar size={24} />
                        </button>
                        <button
                            onClick={() => { setIsAnalyticsOpen(true); setIsAdminOpen(false); setIsCalendarOpen(false); setIsCustomersOpen(false); }}
                            className={`p-3 rounded-xl transition-all duration-300 ${isAnalyticsOpen ? 'bg-teal-500/10 text-teal-400 shadow-inner shadow-teal-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <TrendingUp size={24} />
                        </button>
                        <button
                            onClick={() => { setIsCustomersOpen(true); setIsAdminOpen(false); setIsCalendarOpen(false); setIsAnalyticsOpen(false); }}
                            className={`p-3 rounded-xl transition-all duration-300 ${isCustomersOpen ? 'bg-teal-500/10 text-teal-400 shadow-inner shadow-teal-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <Users size={24} />
                        </button>
                    </nav>
                </div>

                <div className="flex flex-row md:flex-col items-center gap-6">
                    {currentUser.role === 'Admin' && (
                        <button
                            onClick={() => { setIsAdminOpen(true); setIsCalendarOpen(false); setIsAnalyticsOpen(false); setIsCustomersOpen(false); }}
                            className={`p-3 rounded-xl transition-all duration-300 ${isAdminOpen ? 'bg-teal-500/10 text-teal-400 shadow-inner shadow-teal-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                        >
                            <Settings size={24} />
                        </button>
                    )}
                    <button
                        onClick={() => setCurrentUser(null)}
                        className="p-3 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all duration-300"
                    >
                        <LogOut size={24} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto max-h-screen">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            {isAdminOpen ? 'System Settings' : isCalendarOpen ? 'Reservations' : isAnalyticsOpen ? 'Performance' : isCustomersOpen ? 'Customer Directory' : 'Floor Layout'}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {isAdminOpen ? 'Manage tables, rates, and users' : isCalendarOpen ? 'Manage bookings and events' : isAnalyticsOpen ? 'View sales and usage data' : isCustomersOpen ? 'Customer management and history' : 'Live table overview and management'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-[#0B1120]/80 border border-white/5 px-4 py-2 rounded-2xl">
                        <div className="text-right">
                            <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">User Role: {currentUser.role}</p>
                            <p className="font-semibold text-slate-200">{currentUser.displayName}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 border border-white/5">
                            {currentUser.displayName[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex-1">
                    {isAdminOpen ? (
                        <AdminPanel onClose={() => setIsAdminOpen(false)} />
                    ) : isCalendarOpen ? (
                        <CalendarView onClose={() => setIsCalendarOpen(false)} />
                    ) : isAnalyticsOpen ? (
                        <AnalyticsView onClose={() => setIsAnalyticsOpen(false)} />
                    ) : isCustomersOpen ? (
                        <CustomerManager onClose={() => setIsCustomersOpen(false)} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {tables?.sort((a, b) => a.tableNumber - b.tableNumber).map(table => (
                                <TableCard
                                    key={table.id}
                                    table={table}
                                    onSessionStop={(session) => setActivePaymentSession(session as LocalSession)}
                                    onConsumablesClick={(session) => setActiveConsumablesSession(session as LocalSession)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {activePaymentSession && (
                <PaymentModal
                    session={activePaymentSession}
                    onComplete={handlePaymentComplete}
                    onCancel={() => setActivePaymentSession(null)}
                />
            )}

            {activeConsumablesSession && (
                <ConsumablesMenu
                    session={activeConsumablesSession}
                    onClose={() => setActiveConsumablesSession(null)}
                />
            )}
            <DebugPanel />
        </div>
    );
}

export default App;
