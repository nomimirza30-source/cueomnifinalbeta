import { useState, useEffect } from 'react';

export const DebugPanel = () => {
    const [logs, setLogs] = useState<{ type: string; msg: string; time: string }[]>([]);

    useEffect(() => {
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            setLogs(prev => [...prev.slice(-49), { type: 'log', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), time: new Date().toISOString() }]);
        };

        console.error = (...args) => {
            originalError(...args);
            setLogs(prev => [...prev.slice(-49), { type: 'error', msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '), time: new Date().toISOString() }]);
        };

        return () => {
            console.log = originalLog;
            console.error = originalError;
        };
    }, []);

    if (logs.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-black/90 text-white text-xs p-4 rounded-xl shadow-2xl overflow-y-auto z-[9999] border border-white/20 select-text">
            <h3 className="font-bold mb-2">Debug Logs (Last 50)</h3>
            <div className="flex flex-col gap-1">
                {logs.map((log, i) => (
                    <div key={i} className={`font-mono break-words ${log.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        <span className="opacity-50 text-[10px] mr-2">[{log.time.split('T')[1].split('.')[0]}]</span>
                        {log.msg}
                    </div>
                ))}
            </div>
        </div>
    );
};
