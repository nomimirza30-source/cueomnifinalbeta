import { useState } from 'react';
import { db, type LocalSession, type LocalSessionItem, type MenuItem } from '../db/schema';
import { X, Plus, Minus, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

interface ConsumablesMenuProps {
    session: LocalSession;
    onClose: () => void;
}

export const ConsumablesMenu = ({ session, onClose }: ConsumablesMenuProps) => {
    const [cart, setCart] = useState<LocalSessionItem[]>(session.items || []);
    const [isSaving, setIsSaving] = useState(false);

    const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];

    const updateQuantity = (item: MenuItem, delta: number) => {
        const existing = cart.find(i => i.inventoryItemId === item.id);
        if (existing) {
            const newQty = Math.max(0, existing.quantity + delta);
            if (newQty === 0) {
                setCart(cart.filter(i => i.inventoryItemId !== item.id));
            } else {
                setCart(cart.map(i => i.inventoryItemId === item.id ? { ...i, quantity: newQty } : i));
            }
        } else if (delta > 0) {
            setCart([...cart, { inventoryItemId: item.id, quantity: 1, pricePerItem: item.price }]);
        }
    };

    const saveOrders = async () => {
        setIsSaving(true);
        try {
            await db.sessions.update(session.syncId, { items: cart, isSynced: 0 });
            onClose();
        } catch (error) {
            console.error('Failed to save orders', error);
        } finally {
            setIsSaving(false);
        }
    };

    const getItemQty = (itemId: string) => cart.find(i => i.inventoryItemId === itemId)?.quantity || 0;

    const totalItemsCost = cart.reduce((sum, item) => sum + (item.quantity * item.pricePerItem), 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Drinks & Snacks</h3>
                        <p className="text-slate-400 text-sm font-medium">Table {session.tableId.slice(0, 2)} • Add items to bill</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Menu Body */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {menuItems.map((item) => (
                        <div key={item.id} className="glass p-4 rounded-3xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{item.category}</span>
                                <span className="font-bold text-white mb-1">{item.name}</span>
                                <span className="text-emerald-400 font-bold">£{item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {getItemQty(item.id) > 0 && (
                                    <>
                                        <button
                                            onClick={() => updateQuantity(item, -1)}
                                            className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 hover:border-rose-500/50 transition-all"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="font-black text-white w-4 text-center">{getItemQty(item.id)}</span>
                                    </>
                                )}
                                <button
                                    onClick={() => updateQuantity(item, 1)}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${getItemQty(item.id) > 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-500'}`}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-8 bg-black/20 border-t border-white/10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/5 rounded-2xl text-emerald-400">
                                <ShoppingBag size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-slate-500">Extra Items Cost</div>
                                <div className="text-2xl font-black text-white">£{totalItemsCost.toFixed(2)}</div>
                            </div>
                        </div>
                        <button
                            onClick={saveOrders}
                            disabled={isSaving}
                            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-2xl text-white font-black uppercase tracking-widest text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            {isSaving ? 'Saving...' : (
                                <>
                                    <CheckCircle2 size={18} /> Update Session
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
