import { useEffect, useCallback } from 'react';
import { db } from '../db/schema';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5277/api';

export const useOfflineSync = (autoSync: boolean = true) => {
    const syncData = useCallback(async () => {
        if (!navigator.onLine) return;
        console.log('useOfflineSync: Starting background sync...');

        // Sync Tables
        const unsyncedTables = await db.snookerTables.where('isSynced').equals(0).toArray();
        if (unsyncedTables.length > 0) {
            try {
                const response = await axios.post(`${API_URL}/sync/tables`, unsyncedTables);
                await db.snookerTables.bulkUpdate(response.data.syncedIds.map((id: string) => ({ key: id, changes: { isSynced: 1 } })));
            } catch (e) { console.error('Table sync failed', e); }
        }

        // Sync Sessions
        const unsyncedSessions = await db.sessions.where('isSynced').equals(0).toArray();
        if (unsyncedSessions.length > 0) {
            try {
                const response = await axios.post(`${API_URL}/sync/sessions`, unsyncedSessions);
                await db.sessions.bulkUpdate(response.data.syncedIds.map((id: string) => ({ key: id, changes: { isSynced: 1 } })));
            } catch (e) { console.error('Session sync failed', e); }
        }

        // Sync Customers
        const unsyncedCustomers = await db.customers.where('isSynced').equals(0).toArray();
        if (unsyncedCustomers.length > 0) {
            try {
                const response = await axios.post(`${API_URL}/sync/customers`, unsyncedCustomers);
                await db.customers.bulkUpdate(response.data.syncedIds.map((id: string) => ({ key: id, changes: { isSynced: 1 } })));
            } catch (e) { console.error('Customer sync failed', e); }
        }

        // Sync Rates
        const unsyncedRates = await db.rates.where('isSynced').equals(0).toArray();
        if (unsyncedRates.length > 0) {
            try {
                const response = await axios.post(`${API_URL}/sync/rates`, unsyncedRates);
                await db.rates.bulkUpdate(response.data.syncedIds.map((id: string) => ({ key: id, changes: { isSynced: 1 } })));
            } catch (e) { console.error('Rate sync failed', e); }
        }

        // Sync Reservations
        const unsyncedReservations = await db.reservations.where('isSynced').equals(0).toArray();
        if (unsyncedReservations.length > 0) {
            try {
                const response = await axios.post(`${API_URL}/sync/reservations`, unsyncedReservations);
                await db.reservations.bulkUpdate(response.data.syncedIds.map((id: string) => ({ key: id, changes: { isSynced: 1 } })));
            } catch (e) { console.error('Reservation sync failed', e); }
        }
    }, []);

    useEffect(() => {
        if (!autoSync) return;

        syncData(); // Initial sync on mount
        window.addEventListener('online', syncData);
        const interval = setInterval(syncData, 10000); // 10s background sync for better responsiveness

        return () => {
            window.removeEventListener('online', syncData);
            clearInterval(interval);
        };
    }, [syncData, autoSync]);

    return { syncNow: syncData };
};
