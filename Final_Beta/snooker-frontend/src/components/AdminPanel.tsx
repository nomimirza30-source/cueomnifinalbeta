import { useState, useEffect } from 'react';
import { db, type LocalTable, type MenuItem, type User } from '../db/schema';
import { Plus, Trash2, ArrowLeft, Coffee, Users, ScrollText, Table as TableIcon, Save, Edit3, ShieldAlert } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AdminPanelProps {
    onClose: () => void;
}

type AdminTab = 'Tables' | 'Menu' | 'Staff';

export const AdminPanel = ({ onClose }: AdminPanelProps) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('Tables');
    const [tables, setTables] = useState<LocalTable[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // State for new items
    const [newTableNumber, setNewTableNumber] = useState('');
    const [newMenuItem, setNewMenuItem] = useState({ name: '', price: '', category: 'Drink' as 'Drink' | 'Snack' | 'Hot Food' });
    const [newUser, setNewUser] = useState<{ username: string, password: string, displayName: string, role: 'Staff' | 'Admin' }>({ username: '', password: '', displayName: '', role: 'Staff' });

    useEffect(() => {
        const loadData = async () => {
            setTables(await db.snookerTables.toArray());
            setMenuItems(await db.menuItems.toArray());
            setUsers(await db.users.toArray());
        };
        loadData();
    }, []);

    // --- Table Management ---
    const addTable = async () => {
        if (!newTableNumber) return;
        const table: LocalTable = { id: uuidv4(), tableNumber: parseInt(newTableNumber), status: 'Available', hourlyRate: 10, isSynced: 0 };
        await db.snookerTables.add(table);
        setTables([...tables, table]);
        setNewTableNumber('');
    };

    const deleteTable = async (id: string) => {
        await db.snookerTables.delete(id);
        setTables(tables.filter(t => t.id !== id));
    };

    // --- Table Pricing Management ---
    const updateTableRate = async (tableId: string, rate: number) => {
        await db.snookerTables.update(tableId, { hourlyRate: rate, isSynced: 0 });
        setTables(tables.map(t => t.id === tableId ? { ...t, hourlyRate: rate, isSynced: 0 } : t));
    };

    // --- Menu Management ---
    const addMenuItem = async () => {
        if (!newMenuItem.name || !newMenuItem.price) return;
        const item: MenuItem = {
            id: uuidv4(),
            name: newMenuItem.name,
            price: parseFloat(newMenuItem.price),
            category: newMenuItem.category
        };
        await db.menuItems.add(item);
        setMenuItems([...menuItems, item]);
        setNewMenuItem({ name: '', price: '', category: 'Drink' });
    };

    const deleteMenuItem = async (id: string) => {
        await db.menuItems.delete(id);
        setMenuItems(menuItems.filter(i => i.id !== id));
    };

    // --- Staff Management ---
    const addStaff = async () => {
        if (!newUser.username || !newUser.password) return;
        const user: User = {
            id: uuidv4(),
            username: newUser.username.toLowerCase(),
            password: newUser.password,
            displayName: newUser.displayName || newUser.username,
            role: newUser.role,
            createdAt: Date.now()
        };
        await db.users.add(user);
        setUsers([...users, user]);
        setNewUser({ username: '', password: '', displayName: '', role: 'Staff' });
    };

    const deleteUser = async (id: string) => {
        if (users.find(u => u.id === id)?.username === 'admin') return; // Protect root admin
        await db.users.delete(id);
        setUsers(users.filter(u => u.id !== id));
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950 flex flex-col animate-in fade-in duration-300">
            {/* Nav Header */}
            <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 text-slate-400 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Administration</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Configure POS & Staff</p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-3xl border border-white/10">
                    {(['Tables', 'Menu', 'Staff'] as AdminTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-12 max-w-5xl mx-auto w-full">

                {/* Tables Tab */}
                {activeTab === 'Tables' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Table Layout</h3>
                                <p className="text-slate-500 text-sm">Add or remove snooker tables from the floor.</p>
                            </div>
                            <div className="flex gap-4">
                                <input
                                    type="number"
                                    placeholder="Table #"
                                    value={newTableNumber}
                                    onChange={(e) => setNewTableNumber(e.target.value)}
                                    className="w-32 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={addTable}
                                    className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                                >
                                    <Plus size={18} /> Add Table
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {tables.sort((a, b) => a.tableNumber - b.tableNumber).map(table => (
                                <div key={table.id} className="glass p-8 rounded-[2rem] border border-white/5 flex flex-wrap items-center justify-between group hover:border-emerald-500/30 transition-all gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                                            <TableIcon size={32} />
                                        </div>
                                        <div>
                                            <div className="text-2xl font-black text-white px-1">Table {table.tableNumber}</div>
                                            <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest px-1 mt-1">Status: {table.status}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 bg-white/5 px-8 py-4 rounded-3xl border border-white/10">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black text-slate-500 italic">£</span>
                                            <input
                                                type="number"
                                                value={table.hourlyRate || 10}
                                                onChange={(e) => updateTableRate(table.id, parseFloat(e.target.value))}
                                                className="w-24 bg-transparent text-2xl font-black text-emerald-500 outline-none focus:ring-0 text-center"
                                            />
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">/ hr</span>
                                        </div>
                                        <div className="h-8 w-px bg-white/10 mx-2"></div>
                                        <button onClick={() => deleteTable(table.id)} className="p-4 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all">
                                            <Trash2 size={24} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Menu Tab */}
                {activeTab === 'Menu' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Manage Items</h3>
                                <p className="text-slate-500 text-sm mb-8">Customize your drinks and snacks inventory.</p>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                    {menuItems.map(item => (
                                        <div key={item.id} className="glass p-4 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.category}</span>
                                                <span className="font-bold text-white">{item.name}</span>
                                                <span className="text-emerald-400 font-bold">£{item.price.toFixed(2)}</span>
                                            </div>
                                            <button onClick={() => deleteMenuItem(item.id)} className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass p-8 rounded-[2.5rem] border border-white/10 bg-white/5 h-fit sticky top-0">
                                <h4 className="text-lg font-black text-white uppercase tracking-widest mb-6">Add New Item</h4>
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Item Name (e.g. Samosa)"
                                        value={newMenuItem.name}
                                        onChange={e => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Price (£)"
                                        value={newMenuItem.price}
                                        onChange={e => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <select
                                        value={newMenuItem.category}
                                        onChange={e => setNewMenuItem({ ...newMenuItem, category: e.target.value as any })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="Drink">Drink</option>
                                        <option value="Snack">Snack</option>
                                        <option value="Hot Food">Hot Food</option>
                                    </select>
                                    <button
                                        onClick={addMenuItem}
                                        className="w-full bg-emerald-500 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                                    >
                                        <Plus size={18} /> Save Item
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Staff Tab */}
                {activeTab === 'Staff' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Staff Directory</h3>
                                <p className="text-slate-500 text-sm mb-8">Manage terminal access and user permissions.</p>

                                <div className="space-y-4">
                                    {users.map(user => (
                                        <div key={user.id} className="glass p-5 rounded-3xl border border-white/5 flex items-center justify-between group">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${user.role === 'Admin' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400'}`}>
                                                    {user.displayName[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white leading-tight">{user.displayName}</div>
                                                    <div className="text-[10px] uppercase font-black tracking-[0.15em] text-slate-500">@{user.username} • {user.role}</div>
                                                </div>
                                            </div>
                                            {user.username !== 'admin' && (
                                                <button onClick={() => deleteUser(user.id)} className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass p-8 rounded-[2.5rem] border border-white/10 bg-white/5 h-fit sticky top-0">
                                <h4 className="text-lg font-black text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Users size={20} className="text-emerald-500" /> Create User
                                </h4>
                                <p className="text-slate-500 text-xs mb-6">Staff roles cannot access system settings or analytics.</p>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        value={newUser.displayName}
                                        onChange={e => setNewUser({ ...newUser, displayName: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Username (login)"
                                        value={newUser.username}
                                        onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={newUser.password}
                                        onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setNewUser({ ...newUser, role: 'Staff' })}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUser.role === 'Staff' ? 'bg-white/10 border-white/20 text-white' : 'border-transparent text-slate-500 hover:text-white'}`}
                                        >
                                            Staff
                                        </button>
                                        <button
                                            onClick={() => setNewUser({ ...newUser, role: 'Admin' })}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${newUser.role === 'Admin' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-transparent text-slate-500 hover:text-white'}`}
                                        >
                                            Admin
                                        </button>
                                    </div>
                                    <button
                                        onClick={addStaff}
                                        className="w-full bg-emerald-500 py-5 rounded-3xl text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                                    >
                                        Save Staff Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
