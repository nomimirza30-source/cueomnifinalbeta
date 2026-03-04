import Dexie, { type Table } from 'dexie';

export interface LocalTable {
    id: string;
    tableNumber: number;
    status: 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
    hourlyRate: number;
    isSynced: number;
}

export interface LocalSession {
    id: string;
    tableId: string;
    startTime: number;
    endTime: number | null;
    billingType: 'PerFrame' | 'PerMinute';
    totalAmount: number;
    syncId: string;
    isSynced: number; // 0 or 1
    items: LocalSessionItem[];
}

export interface LocalSessionItem {
    inventoryItemId: string;
    quantity: number;
    pricePerItem: number;
}

export interface Rate {
    id: string;
    name: string;
    amountPerHour: number;
    isDefault: boolean;
    isSynced: number;
}

export interface Reservation {
    id: string;
    tableId: string;
    customerId?: string;
    customerName: string;
    startTime: number;
    endTime: number;
    isSynced: number;
}

export interface Customer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    points: number;
    createdAt: number;
    isSynced: number;
}

export interface Payment {
    id: string;
    sessionId: string;
    customerId?: string;
    amount: number;
    method: 'Cash' | 'Card' | 'Account';
    timestamp: number;
    isSynced: number;
}

export interface User {
    id: string;
    username: string;
    password: string; // Plain text for local-first simplicity, ideally hashed
    displayName: string;
    role: 'Admin' | 'Staff';
    createdAt: number;
}

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: 'Drink' | 'Snack' | 'Hot Food';
}

export class SnookerDatabase extends Dexie {
    snookerTables!: Table<LocalTable>;
    sessions!: Table<LocalSession>;
    rates!: Table<Rate>;
    reservations!: Table<Reservation>;
    customers!: Table<Customer>;
    payments!: Table<Payment>;
    users!: Table<User>;
    menuItems!: Table<MenuItem>;

    constructor() {
        super('SnookerDB');
        this.version(9).stores({
            snookerTables: 'id, tableNumber, status, hourlyRate, isSynced',
            sessions: 'syncId, id, tableId, isSynced',
            rates: 'id, name, isDefault, isSynced',
            reservations: 'id, tableId, startTime, isSynced, customerId',
            customers: 'id, name, email, isSynced',
            payments: 'id, sessionId, customerId, isSynced',
            users: 'id, username, role',
            menuItems: 'id, name, category'
        });
    }
}

export const db = new SnookerDatabase();
