import { useState, useEffect } from 'react';
import { Play, Square, Coffee } from 'lucide-react';
import { db, type LocalTable, type LocalSession } from '../db/schema';
import { v4 as uuidv4 } from 'uuid';

interface TableCardProps {
    table: LocalTable;
    onSessionStop: (session: LocalSession) => void;
    onConsumablesClick: (session: LocalSession) => void;
}

import { useLiveQuery } from 'dexie-react-hooks';
import { useOfflineSync } from '../hooks/useOfflineSync';

export const TableCard = ({ table, onSessionStop, onConsumablesClick }: TableCardProps) => {
    const { syncNow } = useOfflineSync(false);
    const activeSession = useLiveQuery(
        () => db.sessions
            .where('tableId').equals(table.id)
            .and(s => s.endTime === null)
            .first(),
        [table.id]
    );

    const [elapsed, setElapsed] = useState(0);
    const rate = table.hourlyRate || 10;

    useEffect(() => {
        let interval: number;
        if (activeSession) {
            setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - activeSession.startTime) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [activeSession]);

    const startSession = async () => {
        const newSession: LocalSession = {
            id: uuidv4(),
            tableId: table.id,
            startTime: Date.now(),
            endTime: null,
            billingType: 'PerMinute',
            totalAmount: 0,
            syncId: uuidv4(),
            isSynced: 0,
            items: []
        };
        await db.sessions.add(newSession);
        await db.snookerTables.update(table.id, { status: 'Occupied' });
        syncNow();
    };

    const itemsCost = activeSession?.items.reduce((sum, item) => sum + (item.quantity * item.pricePerItem), 0) || 0;
    const tableCost = (elapsed / 3600) * rate;
    const totalCurrentCost = tableCost + itemsCost;

    const stopSession = async () => {
        if (!activeSession) return;

        const endTime = Date.now();
        const durationMinutes = (endTime - activeSession.startTime) / (1000 * 60);
        const finalTableCost = (durationMinutes / 60) * rate;
        const totalAmount = finalTableCost + itemsCost;

        const updatedSession = { ...activeSession, endTime, totalAmount };
        onSessionStop(updatedSession);
        setTimeout(() => syncNow(), 500); // Small delay to let onSessionStop finish
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const statusColors = {
        Available: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        Occupied: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
        Reserved: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        Cleaning: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    };

    return (
        <div className={`glass p-6 rounded-2xl border transition-all duration-300 ${statusColors[table.status]} flex flex-col items-center gap-4`}>
            <div className="text-2xl font-bold">Table {table.tableNumber}</div>
            <div className="text-xs uppercase tracking-widest font-semibold opacity-70">{table.status}</div>

            {activeSession && (
                <div className="flex flex-col items-center gap-1">
                    <div className="text-3xl font-mono font-bold tracking-tighter tabular-nums">
                        {formatTime(elapsed)}
                    </div>
                    <div className="text-sm font-medium opacity-80">
                        Est. £{totalCurrentCost.toFixed(2)}
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-2">
                {!activeSession ? (
                    <button
                        onClick={startSession}
                        className="p-3 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Play size={20} fill="currentColor" />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={stopSession}
                            className="p-3 rounded-full bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                        >
                            <Square size={20} fill="currentColor" />
                        </button>
                        <button
                            onClick={() => onConsumablesClick(activeSession)}
                            className={`p-3 rounded-full transition-colors ${itemsCost > 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Coffee size={20} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
