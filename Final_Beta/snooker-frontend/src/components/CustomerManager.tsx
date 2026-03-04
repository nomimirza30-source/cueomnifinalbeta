import { useState, useEffect } from 'react';
import { db, type Customer, type Payment } from '../db/schema';
import { Users, UserPlus, Search, Phone, Mail, Award, History, ArrowLeft, Trash2, Edit2, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface CustomerManagerProps {
    onClose: () => void;
}

export const CustomerManager = ({ onClose }: CustomerManagerProps) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        email: '',
        phone: ''
    });

    useEffect(() => {
        loadCustomers();
    }, []);

    const loadCustomers = async () => {
        setCustomers(await db.customers.toArray());
    };

    const loadCustomerDetails = async (customer: Customer) => {
        setSelectedCustomer(customer);
        const payments = await db.payments.where('customerId').equals(customer.id).toArray();
        setCustomerPayments(payments);
    };

    const addCustomer = async () => {
        const customer: Customer = {
            id: uuidv4(),
            name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone,
            points: 0,
            createdAt: Date.now(),
            isSynced: 0
        };
        await db.customers.add(customer);
        await loadCustomers();
        setShowAddModal(false);
        setNewCustomer({ name: '', email: '', phone: '' });
    };

    const deleteCustomer = async (id: string) => {
        if (confirm('Are you sure you want to delete this customer?')) {
            await db.customers.delete(id);
            setSelectedCustomer(null);
            await loadCustomers();
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    return (
        <div className="fixed inset-0 z-50 glass backdrop-blur-3xl p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto flex gap-8 h-full min-h-[80vh]">

                {/* Left Sidebar: Customer List */}
                <div className="w-1/3 glass rounded-[2.5rem] border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <ArrowLeft size={20} />
                            </button>
                            <h2 className="text-xl font-black uppercase tracking-tighter">CRM Database</h2>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="p-2 bg-emerald-500 rounded-xl text-white hover:bg-emerald-600 transition-all"
                            >
                                <UserPlus size={20} />
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Search database..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredCustomers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => loadCustomerDetails(c)}
                                className={`w-full p-4 rounded-3xl flex items-center justify-between transition-all group ${selectedCustomer?.id === c.id ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'hover:bg-white/5 text-slate-400'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${selectedCustomer?.id === c.id ? 'bg-white/20' : 'bg-white/5 text-emerald-400'}`}>
                                        {c.name[0]}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold truncate max-w-[120px]">{c.name}</div>
                                        <div className={`text-[10px] uppercase font-bold tracking-widest ${selectedCustomer?.id === c.id ? 'text-white/60' : 'text-slate-600'}`}>
                                            ID: {c.id.slice(0, 8)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black italic">{c.points}</div>
                                    <div className="text-[8px] uppercase font-bold opacity-60">Pts</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Content: Details */}
                <div className="flex-1 glass rounded-[2.5rem] border border-white/5 p-12 overflow-y-auto relative">
                    {selectedCustomer ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-start mb-12">
                                <div className="flex items-center gap-8">
                                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-sky-500 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                                        {selectedCustomer.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-white mb-2">{selectedCustomer.name}</h3>
                                        <div className="flex gap-4 text-slate-400">
                                            <span className="flex items-center gap-2 text-sm"><Award size={16} className="text-emerald-500" /> Member since {format(selectedCustomer.createdAt, 'MMM yyyy')}</span>
                                            <span className="flex items-center gap-2 text-sm"><ShieldCheck size={16} className="text-sky-500" /> Loyalty Tier: Gold</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-3 glass rounded-2xl hover:bg-white/10 text-slate-400"><Edit2 size={20} /></button>
                                    <button onClick={() => deleteCustomer(selectedCustomer.id)} className="p-3 glass rounded-2xl hover:bg-rose-500/10 text-rose-500"><Trash2 size={20} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-12">
                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Phone size={14} /> Contact Details
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="text-[10px] text-slate-600 uppercase font-black mb-1">Phone Number</div>
                                            <div className="text-lg font-bold text-white">{selectedCustomer.phone || 'Not provided'}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-600 uppercase font-black mb-1">Email Address</div>
                                            <div className="text-lg font-bold text-white">{selectedCustomer.email || 'Not provided'}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 bg-gradient-to-br from-emerald-500/20 to-sky-500/20 rounded-[2rem] border border-white/5">
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Award size={14} /> Points Balance
                                    </h4>
                                    <div className="text-5xl font-black text-white mb-2">{selectedCustomer.points}</div>
                                    <div className="text-emerald-400/80 text-xs font-medium">Equal to ~ £{(selectedCustomer.points / 10).toFixed(2)} in rewards</div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <History size={14} /> Recent Transactions
                                </h4>
                                <div className="space-y-4">
                                    {customerPayments.length === 0 ? (
                                        <div className="p-12 text-center text-slate-600 italic glass rounded-3xl">No transaction history found for this member</div>
                                    ) : (
                                        customerPayments.reverse().map(p => (
                                            <div key={p.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                                <div className="flex items-center gap-6">
                                                    <div className={`p-4 rounded-2xl ${p.method === 'Cash' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'}`}>
                                                        {p.method === 'Cash' ? 'CASH' : 'CARD'}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-white">£{p.amount.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500">{format(p.timestamp, 'EEEE, MMM do HH:mm')}</div>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase text-emerald-500 tracking-tighter">Paid Success</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                            <Users size={80} strokeWidth={1} />
                            <p className="font-bold text-lg uppercase tracking-widest">Select a customer to view profile</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Customer Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2rem] p-8 shadow-2xl scale-in-center">
                        <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tighter">New Customer Profile</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Full Name</label>
                                <input
                                    type="text"
                                    value={newCustomer.name}
                                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Phone Number</label>
                                <input
                                    type="text"
                                    value={newCustomer.phone}
                                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. +44 123 456789"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Email Address</label>
                                <input
                                    type="email"
                                    value={newCustomer.email}
                                    onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="e.g. john@example.com"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <button onClick={() => setShowAddModal(false)} className="py-4 rounded-2xl font-bold uppercase tracking-widest text-xs text-slate-500 border border-white/10 hover:bg-white/5">Cancel</button>
                                <button onClick={addCustomer} className="py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white bg-emerald-500 shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all">Create Profile</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
