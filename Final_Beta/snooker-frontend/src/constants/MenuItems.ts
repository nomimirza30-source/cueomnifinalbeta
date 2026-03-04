export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: 'Drink' | 'Snack' | 'Hot Food';
}

export const MENU_ITEMS: MenuItem[] = [
    { id: '1', name: 'Coke / Pepsi', price: 1.50, category: 'Drink' },
    { id: '2', name: 'Mineral Water', price: 1.00, category: 'Drink' },
    { id: '3', name: 'Fresh Tea', price: 1.20, category: 'Drink' },
    { id: '4', name: 'Cappuccino', price: 2.50, category: 'Drink' },
    { id: '5', name: 'Crisps', price: 0.80, category: 'Snack' },
    { id: '6', name: 'Chocolate Bar', price: 1.00, category: 'Snack' },
    { id: '7', name: 'Sandwich', price: 3.50, category: 'Hot Food' },
    { id: '8', name: 'Samosa (2pcs)', price: 2.00, category: 'Hot Food' },
];
