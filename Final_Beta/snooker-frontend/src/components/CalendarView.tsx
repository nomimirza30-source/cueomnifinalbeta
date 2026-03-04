import { useState, useEffect } from 'react';
import { db, type Reservation, type LocalTable, type Customer } from '../db/schema';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ArrowLeft, Plus, Search, User } from 'lucide-react';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface CalendarViewProps {
    onClose: () => void;
}

export const CalendarView = ({ onClose }: CalendarViewProps) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [tables, setTables] = useState<LocalTable[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [customerSearch, setCustomerSearch] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [newBooking, setNewBooking] = useState({
        tableId: '',
        customerName: '',
        startTime: '12:00',
        duration: '60'
    });

    useEffect(() => {
        const loadData = async () => {
            const res = await db.reservations.toArray();
            setReservations(res);
            setTables(await db.snookerTables.toArray());
            setCustomers(await db.customers.toArray());
        };
        loadData();
    }, [selectedDate]);

    const addBooking = async () => {
        const start = startOfDay(selectedDate);
        const [hours, minutes] = newBooking.startTime.split(':');
        start.setHours(parseInt(hours), parseInt(minutes));

        const startTime = start.getTime();
        const endTime = startTime + parseInt(newBooking.duration) * 60000;

        const reservation: Reservation = {
            id: uuidv4(),
            tableId: newBooking.tableId,
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer ? selectedCustomer.name : newBooking.customerName,
            startTime,
            endTime,
            isSynced: 0
        };

        await db.reservations.add(reservation);
        setReservations([...reservations, reservation]);
        setShowBookingModal(false);
        // Reset CRM selection
        setSelectedCustomer(null);
        setCustomerSearch('');
        setNewBooking({ ...newBooking, customerName: '' });
    };

    const filteredCustomers = customers.filter((c: Customer) =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
    ).slice(0, 5);

    const timeSlots = Array.from({ length: 14 }, (_, i) => i + 10); // 10 AM to 12 AM

    return (
        <div className="fixed inset-0 z-50 glass backdrop-blur-3xl p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} /> Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} className="p-2 glass rounded-full hover:bg-white/10">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold min-w-48 text-center">
                            {format(selectedDate, 'EEEE, MMM do')}
                        </h2>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} className="p-2 glass rounded-full hover:bg-white/10">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2"
                    >
                        <Plus size={20} /> New Booking
                    </button>
                </header>

                {/* Calendar Grid */}
                <div className="glass rounded-3xl overflow-hidden border border-white/10">
                    <div className="grid grid-cols-[100px_repeat(8,1fr)] bg-white/5 border-b border-white/10">
                        <div className="p-4 border-r border-white/10 font-bold text-slate-400">TIME</div>
                        {tables.sort((a: LocalTable, b: LocalTable) => a.tableNumber - b.tableNumber).map((table: LocalTable) => (
                            <div key={table.id} className="p-4 text-center font-bold border-r border-white/5 last:border-r-0">
                                T{table.tableNumber}
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        {timeSlots.map(hour => (
                            <div key={hour} className="grid grid-cols-[100px_repeat(8,1fr)] h-20 border-b border-white/5 last:border-b-0">
                                <div className="p-4 border-r border-white/10 text-sm font-bold text-slate-500 flex items-center justify-center">
                                    {hour > 12 ? hour - 12 : hour}:00 {hour >= 12 ? 'PM' : 'AM'}
                                </div>
                                {tables.map((table: LocalTable) => {
                                    const dayRes = reservations.filter((r: Reservation) =>
                                        r.tableId === table.id &&
                                        isSameDay(new Date(r.startTime), selectedDate)
                                    );

                                    return (
                                        <div key={table.id} className="relative border-r border-white/5 last:border-r-0">
                                            {dayRes.map((res: Reservation) => {
                                                const start = new Date(res.startTime);
                                                const end = new Date(res.endTime);
                                                if (start.getHours() === hour) {
                                                    return (
                                                        <div
                                                            key={res.id}
                                                            className="absolute inset-x-1 top-2 bottom-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-2 z-10 overflow-hidden"
                                                        >
                                                            <div className="text-[10px] font-bold text-emerald-400 uppercase truncate">
                                                                {res.customerName}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showBookingModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
                        <h3 className="text-2xl font-bold mb-6">Create Reservation</h3>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="text-sm text-slate-400 block mb-2">Customer Selection</label>
                                {selectedCustomer ? (
                                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center font-bold">
                                                {selectedCustomer.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{selectedCustomer.name}</div>
                                                <div className="text-[10px] text-emerald-400 uppercase font-black">Linked CRM Profile</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCustomer(null)}
                                            className="text-slate-500 hover:text-white text-xs font-bold uppercase"
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 mb-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                            <input
                                                type="text"
                                                placeholder="Search existing members..."
                                                value={customerSearch}
                                                onChange={e => setCustomerSearch(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                        {customerSearch && filteredCustomers.length > 0 && (
                                            <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden shadow-2xl">
                                                {filteredCustomers.map((c: Customer) => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            setSelectedCustomer(c);
                                                            setCustomerSearch('');
                                                        }}
                                                        className="w-full p-3 flex items-center gap-3 hover:bg-white/5 text-left transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-400">
                                                            {c.name[0]}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{c.name}</div>
                                                            <div className="text-[10px] text-slate-500">{c.phone || 'No phone'}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-white/10 flex-1" />
                                            <span className="text-[10px] uppercase font-black text-slate-600">OR NEW CUSTOMER</span>
                                            <div className="h-px bg-white/10 flex-1" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Walk-in Guest Name"
                                            value={newBooking.customerName}
                                            onChange={e => setNewBooking({ ...newBooking, customerName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 block mb-2">Select Table</label>
                                <select
                                    value={newBooking.tableId}
                                    onChange={e => setNewBooking({ ...newBooking, tableId: e.target.value })}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Select a table...</option>
                                    {tables.map((t: LocalTable) => <option key={t.id} value={t.id}>Table {t.tableNumber}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-slate-400 block mb-2">Start Time</label>
                                    <input
                                        type="time"
                                        value={newBooking.startTime}
                                        onChange={e => setNewBooking({ ...newBooking, startTime: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 block mb-2">Duration (Min)</label>
                                    <select
                                        value={newBooking.duration}
                                        onChange={e => setNewBooking({ ...newBooking, duration: e.target.value })}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3"
                                    >
                                        <option value="30">30 Min</option>
                                        <option value="60">1 Hour</option>
                                        <option value="120">2 Hours</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-4">
                                <button
                                    onClick={() => setShowBookingModal(false)}
                                    className="flex-1 px-6 py-3 border border-white/10 rounded-xl font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={addBooking}
                                    className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
