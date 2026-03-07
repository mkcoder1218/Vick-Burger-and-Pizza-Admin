import { MenuItem, Order, Business, User } from './types';

export const MOCK_BUSINESSES: Business[] = [
  {
    id: 'biz-1',
    name: 'The Burger Joint',
    location: 'Downtown',
    totalSales: 15420.50,
    activeOrders: 8,
    staffCount: 12,
    performance: 92,
  },
  {
    id: 'biz-2',
    name: 'Pizza Palace',
    location: 'Uptown',
    totalSales: 12840.00,
    activeOrders: 5,
    staffCount: 8,
    performance: 88,
  },
  {
    id: 'biz-3',
    name: 'Dessert Heaven',
    location: 'Westside',
    totalSales: 8900.25,
    activeOrders: 3,
    staffCount: 6,
    performance: 95,
  },
];

export const MOCK_USERS: User[] = [
  { id: 'u-1', name: 'Super Admin', email: 'super@dineqr.com', role: 'super_admin' },
  { id: 'u-2', name: 'John Doe', email: 'john@burgerjoint.com', role: 'admin', businessId: 'biz-1' },
  { id: 'u-3', name: 'Jane Smith', email: 'jane@pizzapalace.com', role: 'admin', businessId: 'biz-2' },
  { id: 'u-4', name: 'Chef Mike', email: 'mike@burgerjoint.com', role: 'staff', businessId: 'biz-1' },
  { id: 'u-5', name: 'Waiter Sam', email: 'sam@burgerjoint.com', role: 'waiter', businessId: 'biz-1' },
];

export const MOCK_MENU: MenuItem[] = [
  {
    id: 'b1',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with cheddar cheese, lettuce, tomato, and our secret sauce.',
    price: 12.99,
    category: 'Burgers',
    image: 'https://leitesculinaria.com/wp-content/uploads/2020/02/classic-cheeseburger-1200.jpg',
    available: true,
  },
  {
    id: 'b2',
    name: 'Bacon BBQ Burger',
    description: 'Smoky bacon, crispy onions, and tangy BBQ sauce on a brioche bun.',
    price: 14.50,
    category: 'Burgers',
    image: 'https://potatorolls.com/wp-content/uploads/Maple-Bacon-Burger4-960x640.jpg',
    available: true,
  },
  {
    id: 'p1',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, basil, and tomato sauce on a thin crust.',
    price: 15.00,
    category: 'Pizzas',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqobAq9KzHOv_XO619kK8fN_MAbmYcgIIDBw&s',
    available: true,
  },
  {
    id: 'p2',
    name: 'Pepperoni Feast',
    description: 'Loaded with spicy pepperoni and extra mozzarella.',
    price: 17.50,
    category: 'Pizzas',
    image: 'https://thumbs.dreamstime.com/b/bbq-meat-feast-gourmet-pizza-24699928.jpg',
    available: true,
  },
  {
    id: 'd1',
    name: 'Iced Latte',
    description: 'Smooth espresso with cold milk and a hint of vanilla.',
    price: 4.50,
    category: 'Drinks',
    image: 'https://kalejunkie.com/wp-content/uploads/2025/05/KJ-Viral-Caramelized-Banana-Iced-Coffee-4.jpg',
    available: true,
  },
  {
    id: 'd2',
    name: 'Fresh Lemonade',
    description: 'Hand-squeezed lemons with a touch of mint.',
    price: 3.99,
    category: 'Drinks',
    image: 'https://myincrediblerecipes.com/wp-content/uploads/2023/02/set-2-Lemonade-15-scaled.jpg',
    available: true,
  },
  {
    id: 'ds1',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with a gooey center, served with vanilla ice cream.',
    price: 8.50,
    category: 'Desserts',
    image: 'https://images.getrecipekit.com/20250325120225-how-20to-20make-20chocolate-20molten-20lava-20cake-20in-20the-20microwave.png?width=650&quality=90&',
    available: true,
  },
  {
    id: 'ds2',
    name: 'New York Cheesecake',
    description: 'Creamy cheesecake with a graham cracker crust and berry compote.',
    price: 7.99,
    category: 'Desserts',
    image: 'https://www.onceuponachef.com/images/2017/12/cheesecake.jpg',
    available: false,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-001',
    tableNumber: '5',
    businessId: 'biz-1',
    items: [
      { menuItemId: 'b1', quantity: 2, name: 'Classic Cheeseburger', price: 12.99 },
      { menuItemId: 'd1', quantity: 1, name: 'Iced Latte', price: 4.50 },
    ],
    total: 30.48,
    status: 'delivered',
    timestamp: '2024-03-05T12:30:00Z',
  },
  {
    id: 'ORD-002',
    tableNumber: '12',
    businessId: 'biz-1',
    items: [
      { menuItemId: 'p2', quantity: 1, name: 'Pepperoni Feast', price: 17.50 },
    ],
    total: 17.50,
    status: 'preparing',
    timestamp: '2024-03-05T13:15:00Z',
  },
  {
    id: 'ORD-003',
    tableNumber: '3',
    businessId: 'biz-1',
    items: [
      { menuItemId: 'ds1', quantity: 1, name: 'Chocolate Lava Cake', price: 8.50 },
    ],
    total: 8.50,
    status: 'pending',
    timestamp: '2024-03-05T13:45:00Z',
  },
  {
    id: 'ORD-004',
    tableNumber: '8',
    businessId: 'biz-1',
    items: [
      { menuItemId: 'b2', quantity: 1, name: 'Bacon BBQ Burger', price: 14.50 },
      { menuItemId: 'd2', quantity: 2, name: 'Fresh Lemonade', price: 3.99 },
    ],
    total: 22.48,
    status: 'ready',
    timestamp: '2024-03-05T14:00:00Z',
  },
];
