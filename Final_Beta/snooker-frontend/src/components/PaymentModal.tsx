import { useState, useEffect } from 'react';
import { db, type LocalTable, type LocalSession, type Payment, type Customer } from '../db/schema';
import { CreditCard, Banknote, User, X, CheckCircle2, UserPlus, Search } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PaymentModalProps {
    session: LocalSession;
    onComplete: () => void;
    onCancel: () => void;
}

export const PaymentModal = ({ session, onComplete, onCancel }: PaymentModalProps) => {
    const [method, setMethod] = useState<'Cash' | 'Card'>('Cash');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const loadCustomers = async () => {
            setCustomers(await db.customers.toArray());
        };
        loadCustomers();
    }, []);

    const handlePayment = async () => {
        setIsProcessing(true);

        const payment: Payment = {
            id: uuidv4(),
            sessionId: session.syncId,
            customerId: selectedCustomerId,
            amount: session.totalAmount,
            method: method,
            timestamp: Date.now(),
            isSynced: 0
        };

        try {
            await db.payments.add(payment);

            // If customer assigned, reward points (1 point per £1)
            if (selectedCustomerId) {
                const customer = await db.customers.get(selectedCustomerId);
                if (customer) {
                    await db.customers.update(selectedCustomerId, {
                        points: customer.points + Math.floor(session.totalAmount)
                    });
                }
            }

            // Mark session as ended and update table status
            await db.sessions.update(session.syncId, {
                endTime: Date.now(),
                isSynced: 0
            });
            await db.snookerTables.update(session.tableId, { status: 'Available' });

            onComplete();
        } catch (error) {
            console.error('Payment failed', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-8 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-bold text-white">Finalize Payment</h3>
                        <p className="text-slate-400">Session Summary</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8">
                    {/* Bill Breakdown */}
                    <div className="bg-white/5 rounded-3xl p-6 mb-8 border border-white/5">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Table Session</span>
                                <span className="text-white font-bold">£{(session.totalAmount - (session.items?.reduce((s, i) => s + (i.quantity * i.pricePerItem), 0) || 0)).toFixed(2)}</span>
                            </div>
                            {session.items && session.items.length > 0 && (
                                <div className="pt-3 border-t border-white/5 space-y-2">
                                    <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Drinks & Snacks</div>
                                    {session.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="text-slate-400">{item.quantity}x Item</span>
                                            <span className="text-slate-300">£{(item.quantity * item.pricePerItem).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Amount Display */}
                    <div className="text-center mb-10">
                        <div className="text-sm uppercase tracking-[0.2em] font-bold text-slate-500 mb-2">Total Amount Due</div>
                        <div className="text-6xl font-black text-white">
                            <span className="text-emerald-500 mr-2 text-4xl">£</span>
                            {session.totalAmount.toFixed(2)}
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div className="mb-8">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 block">Link Customer (Optional)</label>
                        {!selectedCustomerId ? (
                            <button
                                onClick={() => setShowCustomerSearch(true)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3 text-slate-300">
                                    <User size={20} />
                                    <span>Select or Add Customer</span>
                                </div>
                                <Search size={18} className="text-slate-500" />
                            </button>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {customers.find(c => c.id === selectedCustomerId)?.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">{customers.find(c => c.id === selectedCustomerId)?.name}</div>
                                        <div className="text-xs text-emerald-400 font-medium tracking-wide">+ {Math.floor(session.totalAmount)} Reward Points</div>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomerId(undefined)} className="text-xs font-bold text-rose-500 hover:text-rose-400">REMOVE</button>
                            </div>
                        )}
                    </div>

                    {/* Payment Methods */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <button
                            onClick={() => setMethod('Cash')}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${method === 'Cash' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                        >
                            <Banknote size={32} />
                            <span className="font-bold tracking-wide uppercase text-xs">Cash Payment</span>
                        </button>
                        <button
                            onClick={() => setMethod('Card')}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${method === 'Card' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                        >
                            <CreditCard size={32} />
                            <span className="font-bold tracking-wide uppercase text-xs">Card Payment</span>
                        </button>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handlePayment}
                        disabled={isProcessing}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black py-5 rounded-3xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isProcessing ? 'Processing...' : (
                            <>
                                <CheckCircle2 size={24} />
                                CONFIRM & CLOSE SESSION
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Customer Search Overlay */}
            {showCustomerSearch && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search customers by name or phone..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-2">
                            {filteredCustomers.map(customer => (
                                <button
                                    key={customer.id}
                                    onClick={() => {
                                        setSelectedCustomerId(customer.id);
                                        setShowCustomerSearch(false);
                                    }}
                                    className="w-full p-4 hover:bg-white/5 rounded-xl flex items-center justify-between text-left transition-colors"
                                >
                                    <div className="font-bold text-white">{customer.name}</div>
                                    <div className="text-sm text-slate-500">{customer.phone}</div>
                                </button>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <div className="p-8 text-center text-slate-500 italic">No customers found</div>
                            )}
                        </div>

                        <div className="p-4 bg-white/5 border-t border-white/5">
                            <button
                                onClick={() => {
                                    // Add logic for adding new customer quickly
                                    setShowCustomerSearch(false);
                                }}
                                className="w-full py-3 text-emerald-500 flex items-center justify-center gap-2 font-bold hover:bg-emerald-500/10 rounded-xl transition-colors"
                            >
                                <UserPlus size={18} /> Create New Profile
                            </button>
                            <button onClick={() => setShowCustomerSearch(false)} className="w-full py-2 mt-2 text-slate-500 text-sm font-bold uppercase tracking-widest">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
