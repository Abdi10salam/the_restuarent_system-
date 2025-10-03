import { Dish, Customer } from '../types';

export const mockDishes: Dish[] = [
  {
    id: '1',
    name: 'Grilled Salmon',
    description: 'Fresh Atlantic salmon grilled to perfection with herbs and lemon',
    price: 28.99,
    image: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Lunch',
    available: true
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Classic pizza with fresh tomatoes, mozzarella, and basil',
    price: 18.99,
    image: 'https://images.pexels.com/photos/2762942/pexels-photo-2762942.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Dinner',
    available: true
  },
  {
    id: '3',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with parmesan, croutons, and caesar dressing',
    price: 14.99,
    image: 'https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Lunch',
    available: true
  },
  {
    id: '4',
    name: 'Beef Burger',
    description: 'Juicy beef patty with lettuce, tomato, and special sauce',
    price: 16.99,
    image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Lunch',
    available: true
  },
  {
    id: '5',
    name: 'Pasta Carbonara',
    description: 'Creamy pasta with pancetta, eggs, and parmesan cheese',
    price: 22.99,
    image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Dinner',
    available: true
  },
  {
    id: '6',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with layered frosting and berries',
    price: 12.99,
    image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Supper',
    available: true
  },
  {
    id: '7',
    name: 'Fish Tacos',
    description: 'Grilled fish with cabbage slaw and chipotle mayo in corn tortillas',
    price: 19.99,
    image: 'https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Lunch',
    available: true
  },
  {
    id: '8',
    name: 'Greek Salad',
    description: 'Fresh vegetables with feta cheese, olives, and olive oil dressing',
    price: 15.99,
    image: 'https://images.pexels.com/photos/1211887/pexels-photo-1211887.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Lunch',
    available: true
  },
  {
    id: '9',
    name: 'Pancakes',
    description: 'Fluffy pancakes with maple syrup and fresh berries',
    price: 12.99,
    image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Breakfast',
    available: true
  },
  {
    id: '10',
    name: 'Eggs Benedict',
    description: 'Poached eggs on English muffins with hollandaise sauce',
    price: 15.99,
    image: 'https://images.pexels.com/photos/824635/pexels-photo-824635.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Breakfast',
    available: true
  },
  {
    id: '11',
    name: 'Orange Juice',
    description: 'Fresh squeezed orange juice',
    price: 4.99,
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Juices',
    available: true
  },
  {
    id: '12',
    name: 'Apple Juice',
    description: 'Pure apple juice with no added sugar',
    price: 4.99,
    image: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Juices',
    available: true
  },
  {
    id: '13',
    name: 'Mixed Berry Smoothie',
    description: 'Blend of strawberries, blueberries, and raspberries',
    price: 6.99,
    image: 'https://images.pexels.com/photos/775032/pexels-photo-775032.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Juices',
    available: true
  },
  {
    id: '14',
    name: 'Ice Cream Sundae',
    description: 'Vanilla ice cream with chocolate sauce and whipped cream',
    price: 8.99,
    image: 'https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg?auto=compress&cs=tinysrgb&w=300',
    category: 'Supper',
    available: true
  }
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'customer@test.com',
    paymentType: 'monthly',
    monthlyBalance: 45.67,
    totalSpent: 234.50,
    isFirstLogin: false,
    password: 'password',
    registeredAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@gmail.com',
    paymentType: 'cash',
    monthlyBalance: 0,
    totalSpent: 89.25,
    isFirstLogin: true,
    registeredAt: '2024-02-01T14:20:00Z'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@gmail.com',
    paymentType: 'monthly',
    monthlyBalance: 78.90,
    totalSpent: 456.75,
    isFirstLogin: false,
    password: 'mike123',
    registeredAt: '2024-01-20T09:15:00Z'
  }
];