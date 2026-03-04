import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { db } from '../db/schema';

const HUB_URL = (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5277') + '/hubs/tables';

export const useSignalR = (onDataChanged?: (type: string) => void) => {
    const connectionRef = useRef<signalR.HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .withAutomaticReconnect()
            .build();

        connection.on("ReceiveTableStatusUpdate", async (tableId: string, status: string) => {
            console.log('SignalR: Table Status Update', tableId, status);
            await db.snookerTables.update(tableId, { status: status as any });
        });

        connection.on("OnSessionStarted", async (session: any) => {
            console.log('SignalR: Session Started', session);
            const parsedSession = {
                ...session,
                startTime: typeof session.startTime === 'string' ? new Date(session.startTime).getTime() : session.startTime,
                endTime: session.endTime && typeof session.endTime === 'string' ? new Date(session.endTime).getTime() : session.endTime,
                isSynced: 1
            };
            await db.sessions.put(parsedSession);
            await db.snookerTables.update(session.tableId, { status: 'Occupied' });
        });

        connection.on("OnSessionEnded", async (session: any) => {
            console.log('SignalR: Session Ended', session);
            const parsedSession = {
                ...session,
                startTime: typeof session.startTime === 'string' ? new Date(session.startTime).getTime() : session.startTime,
                endTime: session.endTime && typeof session.endTime === 'string' ? new Date(session.endTime).getTime() : session.endTime,
                isSynced: 1
            };
            await db.sessions.put(parsedSession);
            await db.snookerTables.update(session.tableId, { status: 'Available' });
        });

        connection.on("OnDataChanged", (type: string) => {
            console.log('SignalR: Data Changed', type);
            if (onDataChanged) onDataChanged(type);
        });

        connection.onreconnecting(() => setIsConnected(false));
        connection.onreconnected(() => setIsConnected(true));

        connection.start()
            .then(() => {
                console.log('SignalR Connected');
                setIsConnected(true);
                if (onDataChanged) onDataChanged('InitialConnection');
            })
            .catch(err => {
                console.error('SignalR Connection Error: ', err);
                setIsConnected(false);
            });

        connectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, []);

    return { connection: connectionRef.current, isConnected };
};
