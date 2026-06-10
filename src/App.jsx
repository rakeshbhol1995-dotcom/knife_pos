import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : window.location.origin);
import {
  Menu,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  IndianRupee,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShoppingBag,
  Printer,
  X,
  TrendingDown,
  Users,
  Calendar,
  Briefcase,
  AlertCircle,
  FileText,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  Home,
  Monitor,
  History,
  Pause,
  Bell,
  Headphones,
  LogOut,
  RotateCw,
  Eye,
  Save,
  Check,
  Store,
  ChefHat,
  UtensilsCrossed,
  ArrowLeft
} from 'lucide-react';

// --- Indian Food Symbols (FSSAI standard Veg / Non-Veg badges) ---
const VegBadge = () => (
  <div className="w-4.5 h-4.5 border-2 border-emerald-600 flex items-center justify-center bg-white p-0.5 rounded-sm shadow-xs shrink-0" title="Veg">
    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
  </div>
);

const NonVegBadge = () => (
  <div className="w-4.5 h-4.5 border-2 border-red-600 flex items-center justify-center bg-white p-0.5 rounded-sm shadow-xs shrink-0" title="Non-Veg">
    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-600"></div>
  </div>
);

// --- Category Style Map: colorful gradient + emoji for each food category ---
const getCategoryStyle = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('soup')) return { bg: 'bg-gradient-to-br from-amber-100 to-orange-200', emoji: '🍲', tag: 'Soup' };
  if (cat.includes('veg starter') || (cat.includes('starter') && cat.includes('veg'))) return { bg: 'bg-gradient-to-br from-green-100 to-emerald-200', emoji: '🥗', tag: 'Starter' };
  if (cat.includes('chicken starter') || (cat.includes('starter') && cat.includes('chicken'))) return { bg: 'bg-gradient-to-br from-orange-100 to-red-200', emoji: '🍗', tag: 'Starter' };
  if (cat.includes('starter')) return { bg: 'bg-gradient-to-br from-rose-100 to-pink-200', emoji: '🍢', tag: 'Starter' };
  if (cat.includes('tandoor') && cat.includes('veg')) return { bg: 'bg-gradient-to-br from-yellow-100 to-lime-200', emoji: '🫕', tag: 'Tandoor' };
  if (cat.includes('tandoor')) return { bg: 'bg-gradient-to-br from-red-100 to-rose-200', emoji: '🔥', tag: 'Tandoor' };
  if (cat.includes('veg main') || (cat.includes('main') && cat.includes('veg'))) return { bg: 'bg-gradient-to-br from-green-100 to-teal-200', emoji: '🥘', tag: 'Main' };
  if (cat.includes('chicken main') || (cat.includes('main') && cat.includes('chicken'))) return { bg: 'bg-gradient-to-br from-orange-100 to-amber-200', emoji: '🍛', tag: 'Main' };
  if (cat.includes('mutton main') || (cat.includes('main') && cat.includes('mutton'))) return { bg: 'bg-gradient-to-br from-red-100 to-orange-200', emoji: '🍖', tag: 'Main' };
  if (cat.includes('seafood') || cat.includes('fish')) return { bg: 'bg-gradient-to-br from-blue-100 to-cyan-200', emoji: '🐟', tag: 'Seafood' };
  if (cat.includes('bread') || cat.includes('roti') || cat.includes('naan')) return { bg: 'bg-gradient-to-br from-yellow-50 to-amber-200', emoji: '🫓', tag: 'Bread' };
  if (cat.includes('biryani') || cat.includes('rice')) return { bg: 'bg-gradient-to-br from-yellow-100 to-orange-200', emoji: '🍚', tag: 'Rice' };
  if (cat.includes('noodle') || cat.includes('fried rice')) return { bg: 'bg-gradient-to-br from-indigo-100 to-violet-200', emoji: '🍜', tag: 'Noodles' };
  if (cat.includes('dessert') || cat.includes('sweet') || cat.includes('ice')) return { bg: 'bg-gradient-to-br from-pink-100 to-fuchsia-200', emoji: '🍨', tag: 'Dessert' };
  if (cat.includes('drink') || cat.includes('beverage') || cat.includes('juice') || cat.includes('cold')) return { bg: 'bg-gradient-to-br from-sky-100 to-blue-200', emoji: '🥤', tag: 'Drink' };
  if (cat.includes('snack') || cat.includes('chaat')) return { bg: 'bg-gradient-to-br from-lime-100 to-green-200', emoji: '🥨', tag: 'Snack' };
  if (cat.includes('salad')) return { bg: 'bg-gradient-to-br from-emerald-50 to-green-200', emoji: '🥙', tag: 'Salad' };
  return { bg: 'bg-gradient-to-br from-slate-100 to-blue-100', emoji: '🍽️', tag: 'Food' };
};

// --- CSV / Excel Export Utility ---
const exportToCSV = (filename, headers, rows) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// --- Mock Data Definitions ---
const INITIAL_MENU_ITEMS = [
  { id: 1, name: "Tomato Soup", price: 120, category: "Soups", type: "Veg" },
  { id: 2, name: "Sweet Corn Veg Soup", price: 87, category: "Soups", type: "Veg" },
  { id: 3, name: "Hot & Sour Veg Soup", price: 81, category: "Soups", type: "Veg" },
  { id: 4, name: "Manchow Veg Soup", price: 97, category: "Soups", type: "Veg" },
  { id: 5, name: "Clear Veg Soup", price: 95, category: "Soups", type: "Veg" },
  { id: 6, name: "Lemon Coriander Soup", price: 94, category: "Soups", type: "Veg" },
  { id: 7, name: "Mushroom Soup", price: 88, category: "Soups", type: "Veg" },
  { id: 8, name: "Sweet Corn Chicken Soup", price: 206, category: "Soups", type: "Non-Veg" },
  { id: 9, name: "Hot & Sour Chicken Soup", price: 319, category: "Soups", type: "Non-Veg" },
  { id: 10, name: "Manchow Chicken Soup", price: 202, category: "Soups", type: "Non-Veg" },
  { id: 11, name: "Clear Chicken Soup", price: 331, category: "Soups", type: "Non-Veg" },
  { id: 12, name: "Chicken Sweet Corn Soup", price: 288, category: "Soups", type: "Non-Veg" },
  { id: 13, name: "Mutton Paya Soup", price: 308, category: "Soups", type: "Non-Veg" },
  { id: 14, name: "Seafood Clear Soup", price: 81, category: "Soups", type: "Non-Veg" },
  { id: 15, name: "Crab Meat Soup", price: 85, category: "Soups", type: "Non-Veg" },
  { id: 16, name: "Paneer Tikka", price: 177, category: "Veg Starters", type: "Veg" },
  { id: 17, name: "Paneer Malai Tikka", price: 179, category: "Veg Starters", type: "Veg" },
  { id: 18, name: "Paneer Chilli", price: 214, category: "Veg Starters", type: "Veg" },
  { id: 19, name: "Paneer 65", price: 227, category: "Veg Starters", type: "Veg" },
  { id: 20, name: "Paneer Manchurian", price: 153, category: "Veg Starters", type: "Veg" },
  { id: 21, name: "Mushroom Chilli", price: 171, category: "Veg Starters", type: "Veg" },
  { id: 22, name: "Mushroom 65", price: 125, category: "Veg Starters", type: "Veg" },
  { id: 23, name: "Baby Corn Chilli", price: 191, category: "Veg Starters", type: "Veg" },
  { id: 24, name: "Baby Corn Golden Fry", price: 183, category: "Veg Starters", type: "Veg" },
  { id: 25, name: "Crispy Chilli Potato", price: 189, category: "Veg Starters", type: "Veg" },
  { id: 26, name: "Honey Chilli Potato", price: 169, category: "Veg Starters", type: "Veg" },
  { id: 27, name: "Veg Manchurian", price: 153, category: "Veg Starters", type: "Veg" },
  { id: 28, name: "Gobi Manchurian", price: 128, category: "Veg Starters", type: "Veg" },
  { id: 29, name: "Gobi 65", price: 157, category: "Veg Starters", type: "Veg" },
  { id: 30, name: "Crispy Corn", price: 175, category: "Veg Starters", type: "Veg" },
  { id: 31, name: "Hara Bhara Kebab", price: 135, category: "Veg Starters", type: "Veg" },
  { id: 32, name: "Veg Seekh Kebab", price: 100, category: "Veg Starters", type: "Veg" },
  { id: 33, name: "Cheese Balls", price: 197, category: "Veg Starters", type: "Veg" },
  { id: 34, name: "French Fries", price: 120, category: "Veg Starters", type: "Veg" },
  { id: 35, name: "Masala Papad", price: 189, category: "Veg Starters", type: "Veg" },
  { id: 36, name: "Chicken Tikka", price: 288, category: "Chicken Starters", type: "Non-Veg" },
  { id: 37, name: "Chicken Malai Tikka", price: 267, category: "Chicken Starters", type: "Non-Veg" },
  { id: 38, name: "Chicken Reshmi Kebab", price: 251, category: "Chicken Starters", type: "Non-Veg" },
  { id: 39, name: "Chicken Seekh Kebab", price: 219, category: "Chicken Starters", type: "Non-Veg" },
  { id: 40, name: "Chicken Hariyali Kebab", price: 235, category: "Chicken Starters", type: "Non-Veg" },
  { id: 41, name: "Tandoori Chicken (Half)", price: 266, category: "Chicken Starters", type: "Non-Veg" },
  { id: 42, name: "Tandoori Chicken (Full)", price: 206, category: "Chicken Starters", type: "Non-Veg" },
  { id: 43, name: "Chicken Chilli", price: 203, category: "Chicken Starters", type: "Non-Veg" },
  { id: 44, name: "Chicken 65", price: 277, category: "Chicken Starters", type: "Non-Veg" },
  { id: 45, name: "Chicken Manchurian", price: 204, category: "Chicken Starters", type: "Non-Veg" },
  { id: 46, name: "Dragon Chicken", price: 271, category: "Chicken Starters", type: "Non-Veg" },
  { id: 47, name: "Chicken Lollipop", price: 268, category: "Chicken Starters", type: "Non-Veg" },
  { id: 48, name: "Chicken Drumstick", price: 334, category: "Chicken Starters", type: "Non-Veg" },
  { id: 49, name: "Crispy Chicken", price: 247, category: "Chicken Starters", type: "Non-Veg" },
  { id: 50, name: "Garlic Chicken", price: 191, category: "Chicken Starters", type: "Non-Veg" },
  { id: 51, name: "Ginger Chicken", price: 297, category: "Chicken Starters", type: "Non-Veg" },
  { id: 52, name: "Lemon Chicken", price: 317, category: "Chicken Starters", type: "Non-Veg" },
  { id: 53, name: "Pepper Chicken", price: 211, category: "Chicken Starters", type: "Non-Veg" },
  { id: 54, name: "Chicken Majestic", price: 276, category: "Chicken Starters", type: "Non-Veg" },
  { id: 55, name: "Chicken Spring Roll", price: 200, category: "Chicken Starters", type: "Non-Veg" },
  { id: 56, name: "Mutton Seekh Kebab", price: 441, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 57, name: "Mutton Boti Kebab", price: 375, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 58, name: "Mutton Pepper Fry", price: 392, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 59, name: "Mutton Sukka", price: 447, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 60, name: "Mutton Keema Balls", price: 349, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 61, name: "Fish Tikka", price: 267, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 62, name: "Fish Chilli", price: 261, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 63, name: "Fish 65", price: 308, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 64, name: "Fish Amritsari", price: 324, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 65, name: "Fish Finger", price: 270, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 66, name: "Prawn Chilli", price: 309, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 67, name: "Prawn 65", price: 275, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 68, name: "Prawn Pepper Fry", price: 347, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 69, name: "Golden Fried Prawns", price: 321, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 70, name: "Garlic Prawns", price: 366, category: "Mutton & Seafood Starters", type: "Non-Veg" },
  { id: 71, name: "Tandoori Aloo", price: 181, category: "Tandoor Veg", type: "Veg" },
  { id: 72, name: "Tandoori Mushroom", price: 146, category: "Tandoor Veg", type: "Veg" },
  { id: 73, name: "Tandoori Gobi", price: 120, category: "Tandoor Veg", type: "Veg" },
  { id: 74, name: "Tandoori Baby Corn", price: 147, category: "Tandoor Veg", type: "Veg" },
  { id: 75, name: "Tandoori Paneer", price: 195, category: "Tandoor Veg", type: "Veg" },
  { id: 76, name: "Paneer Achari Tikka", price: 176, category: "Tandoor Veg", type: "Veg" },
  { id: 77, name: "Paneer Pahadi Tikka", price: 235, category: "Tandoor Veg", type: "Veg" },
  { id: 78, name: "Mushroom Tikka", price: 134, category: "Tandoor Veg", type: "Veg" },
  { id: 79, name: "Veg Kathi Roll", price: 189, category: "Tandoor Veg", type: "Veg" },
  { id: 80, name: "Paneer Tikka Roll", price: 237, category: "Tandoor Veg", type: "Veg" },
  { id: 81, name: "Tandoori Momo", price: 182, category: "Tandoor Veg", type: "Veg" },
  { id: 82, name: "Afghani Soya Chaap", price: 109, category: "Tandoor Veg", type: "Veg" },
  { id: 83, name: "Malai Soya Chaap", price: 177, category: "Tandoor Veg", type: "Veg" },
  { id: 84, name: "Tandoori Soya Chaap", price: 181, category: "Tandoor Veg", type: "Veg" },
  { id: 85, name: "Stuffed Mushroom", price: 121, category: "Tandoor Veg", type: "Veg" },
  { id: 86, name: "Tangdi Kebab", price: 168, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 87, name: "Kalmi Kebab", price: 193, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 88, name: "Banjara Kebab", price: 131, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 89, name: "Pahadi Kebab", price: 120, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 90, name: "Achari Chicken Tikka", price: 298, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 91, name: "Garlic Chicken Tikka", price: 277, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 92, name: "Murg Lasooni Kebab", price: 249, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 93, name: "Murg Rozali Kebab", price: 343, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 94, name: "Murg Kasturi Kebab", price: 322, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 95, name: "Murg Nawabi Kebab", price: 236, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 96, name: "Tandoori Fish", price: 333, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 97, name: "Fish Hariyali Tikka", price: 264, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 98, name: "Fish Malai Tikka", price: 308, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 99, name: "Tandoori Prawns", price: 258, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 100, name: "Prawns Malai Tikka", price: 330, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 101, name: "Mutton Barra Kebab", price: 402, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 102, name: "Mutton Galouti Kebab", price: 368, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 103, name: "Mutton Kakori Kebab", price: 316, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 104, name: "Chicken Kathi Roll", price: 234, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 105, name: "Mutton Kathi Roll", price: 445, category: "Tandoor Non-Veg", type: "Non-Veg" },
  { id: 106, name: "Paneer Butter Masala", price: 241, category: "Veg Main Course", type: "Veg" },
  { id: 107, name: "Kadai Paneer", price: 190, category: "Veg Main Course", type: "Veg" },
  { id: 108, name: "Mutter Paneer", price: 177, category: "Veg Main Course", type: "Veg" },
  { id: 109, name: "Palak Paneer", price: 233, category: "Veg Main Course", type: "Veg" },
  { id: 110, name: "Shahi Paneer", price: 213, category: "Veg Main Course", type: "Veg" },
  { id: 111, name: "Paneer Tikka Masala", price: 200, category: "Veg Main Course", type: "Veg" },
  { id: 112, name: "Paneer Do Pyaza", price: 232, category: "Veg Main Course", type: "Veg" },
  { id: 113, name: "Paneer Bhurji", price: 208, category: "Veg Main Course", type: "Veg" },
  { id: 114, name: "Mushroom Masala", price: 118, category: "Veg Main Course", type: "Veg" },
  { id: 115, name: "Kadai Mushroom", price: 133, category: "Veg Main Course", type: "Veg" },
  { id: 116, name: "Mushroom Do Pyaza", price: 117, category: "Veg Main Course", type: "Veg" },
  { id: 117, name: "Mix Veg Curry", price: 131, category: "Veg Main Course", type: "Veg" },
  { id: 118, name: "Veg Kolhapuri", price: 195, category: "Veg Main Course", type: "Veg" },
  { id: 119, name: "Veg Kadai", price: 171, category: "Veg Main Course", type: "Veg" },
  { id: 120, name: "Veg Jalfrezi", price: 168, category: "Veg Main Course", type: "Veg" },
  { id: 121, name: "Aloo Gobi Masala", price: 133, category: "Veg Main Course", type: "Veg" },
  { id: 122, name: "Aloo Jeera", price: 195, category: "Veg Main Course", type: "Veg" },
  { id: 123, name: "Dum Aloo", price: 174, category: "Veg Main Course", type: "Veg" },
  { id: 124, name: "Bhindi Masala", price: 154, category: "Veg Main Course", type: "Veg" },
  { id: 125, name: "Malai Kofta", price: 174, category: "Veg Main Course", type: "Veg" },
  { id: 126, name: "Navratan Korma", price: 151, category: "Veg Main Course", type: "Veg" },
  { id: 127, name: "Dal Makhani", price: 126, category: "Veg Main Course", type: "Veg" },
  { id: 128, name: "Dal Tadka", price: 108, category: "Veg Main Course", type: "Veg" },
  { id: 129, name: "Dal Fry", price: 97, category: "Veg Main Course", type: "Veg" },
  { id: 130, name: "Chana Masala", price: 165, category: "Veg Main Course", type: "Veg" },
  { id: 131, name: "Chicken Butter Masala", price: 306, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 132, name: "Chicken Tikka Masala", price: 203, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 133, name: "Kadai Chicken", price: 192, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 134, name: "Chicken Curry", price: 208, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 135, name: "Chicken Do Pyaza", price: 219, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 136, name: "Chicken Kolhapuri", price: 340, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 137, name: "Chicken Chettinad", price: 220, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 138, name: "Chicken Mughlai", price: 288, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 139, name: "Chicken Korma", price: 332, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 140, name: "Chicken Patiala", price: 196, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 141, name: "Chicken Rara", price: 278, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 142, name: "Chicken Bharta", price: 277, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 143, name: "Chicken Lahori", price: 332, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 144, name: "Chicken Hyderabadi", price: 299, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 145, name: "Chicken Afghani", price: 315, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 146, name: "Chicken Handi", price: 244, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 147, name: "Chicken Masala", price: 321, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 148, name: "Chicken Rogan Josh", price: 182, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 149, name: "Chicken Kali Mirch", price: 209, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 150, name: "Chicken Lababdar", price: 317, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 151, name: "Chicken Saagwala", price: 248, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 152, name: "Chicken Dak Bungalow", price: 344, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 153, name: "Desi Chicken Curry", price: 267, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 154, name: "Chicken Kasha", price: 208, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 155, name: "Chicken Stew", price: 255, category: "Chicken Main Course", type: "Non-Veg" },
  { id: 156, name: "Mutton Curry", price: 411, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 157, name: "Mutton Rogan Josh", price: 340, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 158, name: "Mutton Kasha", price: 416, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 159, name: "Mutton Do Pyaza", price: 300, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 160, name: "Mutton Kadai", price: 367, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 161, name: "Mutton Rara", price: 428, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 162, name: "Mutton Keema Masala", price: 345, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 163, name: "Mutton Saagwala", price: 429, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 164, name: "Mutton Handi", price: 327, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 165, name: "Mutton Bhuna Gosht", price: 376, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 166, name: "Mutton Kolhapuri", price: 429, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 167, name: "Mutton Mughlai", price: 350, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 168, name: "Mutton Nalli Nihari", price: 339, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 169, name: "Mutton Stew", price: 395, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 170, name: "Desi Mutton Curry", price: 341, category: "Mutton Main Course", type: "Non-Veg" },
  { id: 171, name: "Fish Curry", price: 388, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 172, name: "Fish Masala", price: 385, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 173, name: "Fish Tikka Masala", price: 250, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 174, name: "Fish Goan Curry", price: 332, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 175, name: "Fish Mustard Curry", price: 375, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 176, name: "Maccha Besara", price: 254, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 177, name: "Prawn Curry", price: 278, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 178, name: "Prawn Masala", price: 342, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 179, name: "Prawn Malai Curry", price: 328, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 180, name: "Prawn Do Pyaza", price: 311, category: "Seafood Main Course", type: "Non-Veg" },
  { id: 181, name: "Tandoori Roti", price: 23, category: "Breads / Roti", type: "Veg" },
  { id: 182, name: "Butter Roti", price: 35, category: "Breads / Roti", type: 'Veg' },
  { id: 183, name: "Plain Naan", price: 76, category: "Breads / Roti", type: 'Veg' },
  { id: 184, name: "Butter Naan", price: 56, category: "Breads / Roti", type: 'Veg' },
  { id: 185, name: "Garlic Naan", price: 80, category: "Breads / Roti", type: 'Veg' },
  { id: 186, name: "Cheese Naan", price: 25, category: "Breads / Roti", type: 'Veg' },
  { id: 187, name: "Pudina Naan", price: 25, category: "Breads / Roti", type: 'Veg' },
  { id: 188, name: "Lachha Paratha", price: 66, category: "Breads / Roti", type: 'Veg' },
  { id: 189, name: "Pudina Paratha", price: 51, category: "Breads / Roti", type: 'Veg' },
  { id: 190, name: "Aloo Kulcha", price: 72, category: "Breads / Roti", type: 'Veg' },
  { id: 191, name: "Paneer Kulcha", price: 158, category: "Breads / Roti", type: "Veg" },
  { id: 192, name: "Onion Kulcha", price: 68, category: "Breads / Roti", type: "Veg" },
  { id: 193, name: "Steamed Rice", price: 256, category: "Rice & Biryani", type: "Veg" },
  { id: 194, name: "Jeera Rice", price: 152, category: "Rice & Biryani", type: "Veg" },
  { id: 195, name: "Veg Pulao", price: 152, category: "Rice & Biryani", type: "Veg" },
  { id: 196, name: "Peas Pulao", price: 241, category: "Rice & Biryani", type: "Veg" },
  { id: 197, name: "Kashmiri Pulao", price: 260, category: "Rice & Biryani", type: "Veg" },
  { id: 198, name: "Veg Biryani", price: 162, category: "Rice & Biryani", type: "Veg" },
  { id: 199, name: "Paneer Biryani", price: 183, category: "Rice & Biryani", type: "Veg" },
  { id: 200, name: "Mushroom Biryani", price: 255, category: "Rice & Biryani", type: "Veg" },
  { id: 201, name: "Chicken Biryani", price: 335, category: "Rice & Biryani", type: "Non-Veg" },
  { id: 202, name: "Mutton Biryani", price: 408, category: "Rice & Biryani", type: "Non-Veg" },
  { id: 203, name: "Fish Biryani", price: 304, category: "Rice & Biryani", type: "Non-Veg" },
  { id: 204, name: "Prawn Biryani", price: 388, category: "Rice & Biryani", type: "Non-Veg" },
  { id: 205, name: "Veg Fried Rice", price: 171, category: "Noodles & Fried Rice", type: "Veg" },
  { id: 206, name: "Egg Fried Rice", price: 199, category: "Noodles & Fried Rice", type: "Non-Veg" },
  { id: 207, name: "Chicken Fried Rice", price: 282, category: "Noodles & Fried Rice", type: "Non-Veg" },
  { id: 208, name: "Mixed Fried Rice", price: 215, category: "Noodles & Fried Rice", type: "Non-Veg" },
  { id: 209, name: "Schezwan Veg Fried Rice", price: 232, category: "Noodles & Fried Rice", type: "Veg" },
  { id: 210, name: "Veg Hakka Noodles", price: 252, category: "Noodles & Fried Rice", type: "Veg" },
  { id: 211, name: "Egg Hakka Noodles", price: 235, category: "Noodles & Fried Rice", type: "Non-Veg" },
  { id: 212, name: "Chicken Hakka Noodles", price: 210, category: "Noodles & Fried Rice", type: "Non-Veg" },
  { id: 213, name: "Mixed Hakka Noodles", price: 183, category: "Noodles & Fried Rice", type: "Non-Veg" },
  { id: 214, name: "Schezwan Chicken Noodles", price: 237, category: "Noodles & Fried Rice", type: "Non-Veg" }
].map(item => ({
  ...item,
  image: getFoodImage(item.category, item.name)
}));

const INITIAL_STAFF = [
  { id: 'ST-001', name: 'Hari Mishra', role: 'Head Chef', salary: 18000, contact: '9861234567', status: 'Active', joined: '2025-01-10' },
  { id: 'ST-002', name: 'Raju Pradhan', role: 'Kitchen Helper', salary: 12000, contact: '7008123456', status: 'Active', joined: '2025-03-15' },
  { id: 'ST-003', name: 'Sanjay Sahoo', role: 'Waiter', salary: 9000, contact: '9437123456', status: 'Active', joined: '2025-04-01' }
];

const INITIAL_EXPENSES = [
  { id: 'EXP-001', title: 'Weekly Vegetables & Groceries', amount: 3500, category: 'Raw Materials', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'Bought from wholesale market' },
  { id: 'EXP-002', title: 'Monthly Shop Rent', amount: 15000, category: 'Rent', date: new Date().toISOString().substring(0, 7) + '-01', notes: 'Paid to landlord' },
  { id: 'EXP-003', title: 'Electricity Bill', amount: 4800, category: 'Utilities', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'TPCODL online payment' },
  { id: 'EXP-004', title: 'Gas Cylinders Refill (x4)', amount: 4200, category: 'Utilities', date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: 'Indane Commercial LPG' }
];

// Generate active table grid lists
const diningTablesList = Array.from({ length: 20 }, (_, idx) => `T-${idx + 1}`);
const outsideTablesList = Array.from({ length: 5 }, (_, idx) => `O-${idx + 1}`);

// Mock order generator
const generateMockOrders = () => {
  const modes = ['Cash', 'UPI', 'Card'];
  const tables = ['T-1', 'T-2', 'T-3', 'T-4', 'Takeaway', 'Delivery'];
  const itemsList = [
    { name: 'Tomato Soup', price: 120, quantity: 1, type: 'Veg', category: 'Soups' },
    { name: 'Chicken Biryani', price: 335, quantity: 2, type: 'Non-Veg', category: 'Rice & Biryani' },
    { name: 'Paneer Tikka', price: 177, quantity: 1, type: 'Veg', category: 'Veg Starters' },
    { name: 'Butter Naan', price: 60, quantity: 3, type: 'Veg', category: 'Breads / Roti' },
    { name: 'Veg Fried Rice', price: 171, quantity: 1, type: 'Veg', category: 'Noodles & Fried Rice' },
    { name: 'Chicken Fried Rice', price: 282, quantity: 1, type: 'Non-Veg', category: 'Noodles & Fried Rice' }
  ];

  const mockOrders = [];
  const today = new Date();
  
  for (let i = 15; i >= 0; i--) {
    const orderDate = new Date(today);
    orderDate.setDate(today.getDate() - i);
    const dateStr = orderDate.toLocaleDateString('en-IN');
    const isodate = orderDate.toISOString().split('T')[0];

    const ordersCount = Math.floor(Math.random() * 3) + 2;
    for (let j = 0; j < ordersCount; j++) {
      const orderItems = [];
      const itemIndices = new Set();
      const itemsToSelect = Math.floor(Math.random() * 3) + 1;
      
      while (orderItems.length < itemsToSelect) {
        const randIdx = Math.floor(Math.random() * itemsList.length);
        if (!itemIndices.has(randIdx)) {
          itemIndices.add(randIdx);
          orderItems.push({
            ...itemsList[randIdx],
            quantity: Math.floor(Math.random() * 2) + 1
          });
        }
      }

      const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = Math.round(subtotal * 1.05);
      const orderId = `#ORD-${String(mockOrders.length + 1).padStart(3, '0')}`;
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const table = tables[Math.floor(Math.random() * tables.length)];

      mockOrders.push({
        id: orderId,
        table: table,
        customerName: 'Guest Customer',
        customerPhone: '9999999999',
        customerAddress: table === 'Delivery' ? 'Mahanadi Vihar, Cuttack' : '',
        paymentMode: mode,
        orderType: table.startsWith('T-') ? 'Dine In' : table,
        items: orderItems,
        status: 'Ready',
        total: total,
        time: `${12 + Math.floor(Math.random() * 8)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} PM`,
        date: dateStr,
        isodate: isodate
      });
    }
  }
  return mockOrders;
};

// ============================================================
// PREMIUM SVG CHART COMPONENTS
// ============================================================

// 1. Animated Gradient Bar Chart — for daily sales
const SVGBarChart = ({ data, colorFrom = '#ef4444', colorTo = '#f97316', label = '₹' }) => {
  if (!data || data.length === 0) return <div className="text-xs text-slate-400 py-12 text-center font-bold">No data available</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const BAR_W = Math.max(10, Math.floor(480 / data.length) - 4);
  const H = 200, W = 520, PAD = 40;
  const chartH = H - PAD - 20;
  const barGap = (W - PAD * 2) / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full font-sans">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorFrom} stopOpacity="1"/>
          <stop offset="100%" stopColor={colorTo} stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorFrom} stopOpacity="1"/>
          <stop offset="100%" stopColor={colorTo} stopOpacity="0.9"/>
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
        const y = PAD + chartH * r;
        return (
          <g key={i}>
            <line x1={PAD} y1={y} x2={W - 10} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4,3"/>
            <text x={PAD - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="700">{label}{Math.round(maxVal * (1 - r) / 1000)}k</text>
          </g>
        );
      })}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(2, (d.value / maxVal) * chartH);
        const x = PAD + i * barGap + (barGap - Math.min(BAR_W, barGap - 6)) / 2;
        const y = PAD + chartH - barH;
        const bw = Math.min(BAR_W, barGap - 6);
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={barH} rx="4" fill="url(#barGrad)" className="transition-all duration-300 hover:opacity-90">
              <title>{d.label}: {label}{d.value.toLocaleString()}</title>
            </rect>
            {d.value > 0 && barH > 16 && (
              <text x={x + bw/2} y={y - 4} textAnchor="middle" fontSize="8" fill={colorFrom} fontWeight="800">
                {d.value > 999 ? `${(d.value/1000).toFixed(1)}k` : d.value}
              </text>
            )}
            <text x={x + bw/2} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="700">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// 2. Payment Mode Donut Chart
const SVGPaymentPieChart = ({ cash = 0, upi = 0, card = 0 }) => {
  const total = cash + upi + card || 1;
  const segments = [
    { label: 'Cash', value: cash, color: '#f59e0b' },
    { label: 'UPI', value: upi, color: '#ef4444' },
    { label: 'Card', value: card, color: '#3b82f6' },
  ].filter(s => s.value > 0);

  const R = 55, cx = 85, cy = 75;
  let acc = -Math.PI / 2;

  const arc = (startAngle, endAngle, r) => {
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex items-center gap-4 justify-center">
      <svg viewBox="0 0 170 150" className="w-36 h-36">
        {segments.map((seg, i) => {
          const angle = (seg.value / total) * Math.PI * 2;
          const path = arc(acc, acc + angle, R);
          acc += angle;
          return <path key={i} d={path} fill={seg.color} opacity="0.9" className="hover:opacity-100 transition-opacity cursor-pointer"><title>{seg.label}: ₹{seg.value.toLocaleString()} ({Math.round(seg.value/total*100)}%)</title></path>;
        })}
        <circle cx={cx} cy={cy} r="33" fill="white"/>
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="8" fill="#64748b" fontWeight="900">Total</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="900">₹{(cash+upi+card).toLocaleString()}</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold">
            <span className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor: seg.color}}></span>
            <span className="text-slate-600">{seg.label}</span>
            <span className="text-slate-800 font-black ml-1">₹{seg.value.toLocaleString()}</span>
            <span className="text-slate-400">({Math.round(seg.value/total*100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const SVGLineChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 py-12 text-center font-bold font-sans">No data available</div>;
  }
  const maxVal = Math.max(...data.map(d => d.value), 100);
  const height = 180;
  const width = 500;
  const padding = 35;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;
  
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ` + points + ` ${width - padding},${height - padding}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-sans">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25"/>
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0"/>
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
        const y = padding + chartHeight * r;
        const val = Math.round(maxVal * (1 - r));
        return (
          <g key={idx}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-400 font-bold font-mono">₹{val}</text>
          </g>
        );
      })}
      <polygon points={areaPoints} fill="url(#chartGrad)" />
      <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" points={points} strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, index) => {
        const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
        const y = padding + chartHeight - (d.value / maxVal) * chartHeight;
        return (
          <circle key={index} cx={x} cy={y} r="3.5" className="fill-white stroke-red-600 stroke-[2px] cursor-pointer hover:r-5 transition-all">
            <title>{`${d.label}: ₹${d.value}`}</title>
          </circle>
        );
      })}
      {data.map((d, index) => {
        if (data.length > 15 && index % 3 !== 0) return null;
        const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
        return (
          <text key={index} x={x} y={height - 8} textAnchor="middle" className="text-[9px] fill-slate-400 font-bold font-mono">{d.label}</text>
        );
      })}
    </svg>
  );
};

const SVGDonutChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 py-12 text-center font-bold font-sans">No data available</div>;
  }
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let accumulatedAngle = 0;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      <svg width="150" height="150" viewBox="0 0 150 150" className="w-32 h-32">
        <circle cx="75" cy="75" r="50" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
        {data.map((d, index) => {
          if (d.value === 0) return null;
          const percentage = d.value / total;
          const strokeLength = percentage * 2 * Math.PI * 50;
          const strokeDash = `${strokeLength} ${2 * Math.PI * 50}`;
          const rotation = (accumulatedAngle * 360) / (2 * Math.PI * 50);
          accumulatedAngle += strokeLength;
          return (
            <circle
              key={index}
              cx="75"
              cy="75"
              r="50"
              fill="transparent"
              stroke={d.color || '#ef4444'}
              strokeWidth="16"
              strokeDasharray={strokeDash}
              strokeDashoffset="0"
              transform={`rotate(${rotation - 90} 75 75)`}
              className="transition-all duration-300 hover:stroke-[18px] cursor-pointer"
            >
              <title>{`${d.name}: ₹${d.value.toLocaleString()} (${Math.round(percentage * 100)}%)`}</title>
            </circle>
          );
        })}
        <circle cx="75" cy="75" r="41" fill="#ffffff" />
        <text x="75" y="70" textAnchor="middle" className="text-[10px] fill-slate-400 font-extrabold uppercase tracking-wider font-sans">Total</text>
        <text x="75" y="88" textAnchor="middle" className="text-sm font-black fill-slate-800 font-mono">₹{total > 9999 ? `${(total/1000).toFixed(1)}k` : total}</text>
      </svg>
      <div className="flex flex-col gap-2.5">
        {data.map((d, index) => (
          <div key={index} className="flex items-center gap-2.5 text-xs font-bold font-sans">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
            <span className="text-slate-600 truncate max-w-[120px]">{d.name}</span>
            <span className="text-slate-400 font-extrabold font-mono">({Math.round((d.value / (total || 1)) * 100)}%)</span>
            <span className="text-slate-800 font-black ml-auto font-mono">₹{d.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// 3. Premium Dual Path Trend Chart (Daily Sales vs Daily Expenses P&L)
const SVGDualTrendChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 py-12 text-center font-bold font-sans">No data available</div>;
  }
  const maxVal = Math.max(...data.map(d => Math.max(d.sales, d.expenses)), 100);
  const height = 200;
  const width = 520;
  const padding = 35;
  const chartHeight = height - padding * 2;
  const chartWidth = width - padding * 2;

  // Build points for Sales
  const salesPoints = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - (d.sales / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const salesAreaPoints = `${padding},${height - padding} ` + salesPoints + ` ${width - padding},${height - padding}`;

  // Build points for Expenses
  const expPoints = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - (d.expenses / maxVal) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const expAreaPoints = `${padding},${height - padding} ` + expPoints + ` ${width - padding},${height - padding}`;

  return (
    <div className="w-full h-full flex flex-col justify-between">
      <div className="flex justify-center gap-6 mb-2 text-xs font-bold font-sans select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span className="text-slate-650">Daily Sales (Revenue)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span className="text-slate-655">Daily Expenses</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full font-sans">
        <defs>
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
          </linearGradient>
          <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0"/>
          </linearGradient>
        </defs>
        
        {/* Y Axis Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((r, idx) => {
          const y = padding + chartHeight * r;
          const val = Math.round(maxVal * (1 - r));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3,3" />
              <text x={padding - 8} y={y + 3} textAnchor="end" className="text-[9px] fill-slate-450 font-extrabold font-mono">₹{val > 999 ? `${(val/1000).toFixed(1)}k` : val}</text>
            </g>
          );
        })}

        {/* Areas */}
        <polygon points={salesAreaPoints} fill="url(#salesGrad)" />
        <polygon points={expAreaPoints} fill="url(#expGrad)" />

        {/* Lines */}
        <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={salesPoints} strokeLinecap="round" strokeLinejoin="round" />
        <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="2,2" points={expPoints} strokeLinecap="round" strokeLinejoin="round" />

        {/* Interaction Circles */}
        {data.map((d, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
          const yS = padding + chartHeight - (d.sales / maxVal) * chartHeight;
          const yE = padding + chartHeight - (d.expenses / maxVal) * chartHeight;
          return (
            <g key={index} className="group cursor-pointer">
              {d.sales > 0 && (
                <circle cx={x} cy={yS} r="3.5" className="fill-white stroke-emerald-500 stroke-[2px] hover:r-5 transition-all">
                  <title>{`Day ${d.label}: Sales ₹${d.sales.toLocaleString()}`}</title>
                </circle>
              )}
              {d.expenses > 0 && (
                <circle cx={x} cy={yE} r="3" className="fill-white stroke-rose-500 stroke-[1.5px] hover:r-5 transition-all">
                  <title>{`Day ${d.label}: Expense ₹${d.expenses.toLocaleString()}`}</title>
                </circle>
              )}
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, index) => {
          if (data.length > 15 && index % 3 !== 0) return null;
          const x = padding + (index / (data.length - 1 || 1)) * chartWidth;
          return (
            <text key={index} x={x} y={height - 8} textAnchor="middle" className="text-[9px] fill-slate-400 font-black font-mono">Day {d.label}</text>
          );
        })}
      </svg>
    </div>
  );
};


// --- Top Brand Header & ToolBar (Petpooja Authentic Layout) ---
const TopBrandBar = ({ activeTab, onNewOrderClick, onSearchClick, onToolbarClick, isStoreClosed, zomatoSwiggyStatus, restaurant, onExit }) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex flex-col print:hidden font-sans border-b border-slate-300">
      {/* 1. Light Gray Top Name strip */}
      <div className="w-full bg-slate-100 px-4 py-1.5 flex justify-between items-center text-[11px] font-bold text-slate-600 border-b border-slate-200 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse inline-block"></span>
          <span>{restaurant ? `${restaurant.name.toUpperCase()} (${restaurant.id.toUpperCase()}) | UNIQUE SUPPORT ID: ${restaurant.uniqueId || 'N/A'}` : 'URMI KITCHEN (R391308)'} - The Finest Restaurant Management Platform</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          <span>Time: {time}</span>
        </div>
      </div>

      {/* 2. White Action Toolbar */}
      <div className="w-full bg-white px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto select-none shadow-xs">
        {/* Left Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer">
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Logo badge (KNIFE design with logo.png image) */}
          <div className="flex items-center gap-2 bg-slate-900 text-white pl-2 pr-3 py-1 rounded-xl shadow-md border border-slate-800 transition-all hover:border-rose-600 select-none">
            <img src="/logo.png" alt="KNIFE Logo" className="w-7 h-7 rounded-lg object-cover" />
            <div className="flex items-center gap-0.5 font-black tracking-tighter text-xs uppercase">
              <span>KNIFE</span>
              <span className="text-[9px] bg-[#ef4444] text-white px-1.5 py-0.5 rounded ml-1 font-black font-sans leading-none">POS</span>
            </div>
          </div>

          <button 
            onClick={onNewOrderClick}
            className="bg-[#d92121] hover:bg-[#b91c1c] text-white font-extrabold px-4 py-2 rounded-lg text-xs tracking-wider transition-all shadow-md flex items-center gap-1 uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Order
          </button>

          {/* Search inputs */}
          <div className="relative w-32">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Bill No" 
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500" 
              onKeyDown={(e) => e.key === 'Enter' && onSearchClick('bill', e.target.value)}
            />
          </div>

          <div className="relative w-32">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="KOT No" 
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-2 py-1.5 text-xs font-bold outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500" 
              onKeyDown={(e) => e.key === 'Enter' && onSearchClick('kot', e.target.value)}
            />
          </div>
        </div>

        {/* Middle Status Actions (stacked vertical icons) */}
        <div className="flex items-center gap-5 shrink-0 px-2">
          <div 
            onClick={() => onToolbarClick?.('item_on_off')}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-rose-600 transition-colors"
          >
            <ToggleLeft className="w-5 h-5 text-rose-500" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Item On/Off</span>
          </div>
          <div 
            onClick={() => onToolbarClick?.('store_settings')}
            className={`flex flex-col items-center cursor-pointer transition-colors ${isStoreClosed ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-605 hover:text-emerald-700'}`}
          >
            <Store className={`w-5 h-5 ${isStoreClosed ? 'text-rose-500' : 'text-emerald-600'}`} />
            <span className={`text-[9px] font-extrabold mt-0.5 tracking-tight ${isStoreClosed ? 'text-rose-500' : 'text-emerald-650'}`}>{isStoreClosed ? 'Closed' : 'Open'}</span>
          </div>
          <div 
            onClick={() => onToolbarClick?.('cash_drawer')}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Drawer</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-800 transition-colors">
            <span className="relative flex h-2 w-2 mb-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-extrabold tracking-tight text-emerald-600">Live View</span>
          </div>
          <div 
            onClick={() => onToolbarClick?.('orders_list')}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Monitor className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Orders</span>
          </div>
          <div 
            onClick={() => onToolbarClick?.('orders_list')}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Recent</span>
          </div>
          <div 
            onClick={() => onToolbarClick?.('alerts_list')}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5 text-amber-500" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight">Alerts</span>
          </div>
          <div 
            onClick={() => onToolbarClick?.('complaints_modal')}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-rose-500 transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight text-rose-500">Complain</span>
          </div>
          <div 
            onClick={() => onExit()}
            className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-5 h-5 text-[#ef4444]" />
            <span className="text-[9px] font-extrabold mt-0.5 tracking-tight text-[#ef4444]">Exit POS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Floor Map Table View Screen ---
const TableViewScreen = ({ 
  carts, 
  tableStates, 
  tableElapsedTimes, 
  onTableSelect, 
  onActionClick, 
  onQuickAction,
  moveKotActive,
  setMoveKotActive,
  moveSourceTable
}) => {

  // Status colors logic mapped to Petpooja Legend
  const getTableColorClass = (status) => {
    switch (status) {
      case 'running':
        // Running Table = Blue gradient
        return 'bg-gradient-to-br from-sky-400 to-blue-600 text-white border-blue-600 shadow-xs shadow-blue-500/10 hover:shadow-md hover:border-blue-700';
      case 'printed':
        // Printed Table = Green gradient
        return 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white border-emerald-600 shadow-xs shadow-emerald-500/10 hover:shadow-md hover:border-emerald-700';
      case 'paid':
        // Paid Table = Orange gradient
        return 'bg-gradient-to-br from-orange-400 to-amber-600 text-white border-orange-600 shadow-xs shadow-orange-500/10 hover:shadow-md hover:border-orange-700';
      case 'running_kot':
        // Running KOT Table = Yellow/Gold gradient
        return 'bg-gradient-to-br from-amber-300 to-yellow-500 text-slate-900 border-yellow-600 shadow-xs shadow-yellow-500/20 hover:shadow-md hover:border-yellow-700';
      default:
        // Vacant = Gray dotted border
        return 'bg-white border-slate-250 border-dashed hover:bg-rose-50/20 hover:border-rose-400 text-slate-800 shadow-2xs hover:shadow-xs';
    }
  };

  const calculateElapsedTime = (startTime) => {
    if (!startTime) return "";
    const diff = Math.floor((Date.now() - startTime) / 60000);
    return `${diff} Min`;
  };

  return (
    <div className="pos-table-view-screen flex-1 bg-[#f1f5f9] p-6 overflow-y-auto font-sans print:hidden select-none">
      
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-6">
        <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">Table View</h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onQuickAction('refresh')}
            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            <RotateCw className="w-4.5 h-4.5" />
          </button>
          
          <button 
            onClick={() => onQuickAction('Delivery')}
            className="bg-[#d92121] hover:bg-[#b91c1c] text-white font-extrabold px-4 py-2 rounded-lg text-xs tracking-wider transition-all shadow-md uppercase cursor-pointer"
          >
            Delivery
          </button>
          <button 
            onClick={() => onQuickAction('Pick Up')}
            className="bg-[#d92121] hover:bg-[#b91c1c] text-white font-extrabold px-4 py-2 rounded-lg text-xs tracking-wider transition-all shadow-md uppercase cursor-pointer"
          >
            Pick Up
          </button>
          <button 
            onClick={() => onQuickAction('add_table')}
            className="bg-[#d92121] hover:bg-[#b91c1c] text-white font-extrabold px-4 py-2 rounded-lg text-xs tracking-wider transition-all shadow-md uppercase cursor-pointer"
          >
            Add Table
          </button>
        </div>
      </div>

      {/* Legends & Toggle row */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between mb-8 text-xs font-bold text-slate-600">
        
        {/* Toggle option */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMoveKotActive(!moveKotActive)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-black cursor-pointer uppercase transition-all"
          >
            {moveKotActive ? <ToggleRight className="w-5.5 h-5.5 text-rose-600" /> : <ToggleLeft className="w-5.5 h-5.5 text-slate-400" />}
            <span>Move KOT / Items</span>
          </button>
        </div>

        {/* Legend color squares */}
        <div className="flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-350 border-dashed block"></span>
            <span>Blank Table</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-sky-500 block"></span>
            <span>Running Table</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 block"></span>
            <span>Printed Table</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-orange-500 block"></span>
            <span>Paid Table</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-yellow-400 block"></span>
            <span>Running KOT Table</span>
          </div>
        </div>
      </div>

      {/* Move mode instruction banner */}
      {moveKotActive && (
        <div className="bg-amber-50 border border-amber-200 text-amber-850 px-4 py-3 rounded-xl mb-6 text-xs font-black flex items-center justify-between animate-pulse select-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span>
              {moveSourceTable 
                ? `Move Mode Active: Table [${moveSourceTable.replace('T-', '').replace('O-', 'O')}] selected. Click a vacant table to transfer all items!` 
                : 'Move Mode Active: Click the table card you want to move items FROM.'}
            </span>
          </div>
          {moveSourceTable && (
            <button 
              onClick={() => onQuickAction('cancel_move')}
              className="text-amber-600 hover:text-amber-855 underline uppercase tracking-wider text-[10px] cursor-pointer"
            >
              Cancel Move
            </button>
          )}
        </div>
      )}

      {/* Grid Maps */}
      <div className="space-y-8">
        {/* 1. Dining Section */}
        <div>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 border-l-3 border-rose-600 pl-2">Dining</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {diningTablesList.map(tableKey => {
              const tableNum = tableKey.replace('T-', '');
              const status = tableStates[tableKey] || 'blank';
              const cartItems = carts[tableKey] || [];
              const elapsed = calculateElapsedTime(tableElapsedTimes[tableKey]);
              const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;

              const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div 
                  key={tableKey}
                  onClick={() => onTableSelect(tableKey)}
                  className={`h-26 rounded-xl border flex flex-col justify-between p-2.5 transition-all duration-300 cursor-pointer relative group ${getTableColorClass(status)}`}
                >
                  {/* Top Bar inside card */}
                  <div className="flex items-center justify-between w-full text-[9px] font-black tracking-wide leading-none select-none">
                    {status !== 'blank' ? (
                      <>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 opacity-85" />
                          <span>{elapsed || '0 min'}</span>
                        </span>
                        <span className="opacity-90">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      </>
                    ) : (
                      <>
                        <span className="opacity-35 uppercase text-[8px] tracking-widest font-black">Vacant</span>
                        <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
                      </>
                    )}
                  </div>

                  {/* Center Table label */}
                  <div className="flex flex-col items-center justify-center -mt-1">
                    <span className="text-xl font-black tracking-tight leading-none">
                      {tableNum.padStart(2, '0')}
                    </span>
                  </div>

                  {/* Bottom Bar inside card */}
                  <div className="w-full flex items-center justify-center select-none">
                    {status === 'blank' ? (
                      <span className="text-[9px] font-bold text-slate-400 leading-none">Dine In</span>
                    ) : (
                      <span className="text-[10px] font-black font-mono leading-none tracking-wide">
                        ₹{Math.round(cartTotal).toLocaleString('en-IN')}.00
                      </span>
                    )}
                  </div>

                  {/* Floating Action Bar on Hover */}
                  {status !== 'blank' && (
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-200 px-1.5 py-0.5 flex items-center gap-2 z-10 shrink-0 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onActionClick('print', tableKey); }}
                        className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded cursor-pointer transition-colors"
                        title="Print Bill"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onActionClick('view', tableKey); }}
                        className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded cursor-pointer transition-colors"
                        title="Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Outside Section */}
        <div>
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 border-l-3 border-rose-600 pl-2">Outside</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-4">
            {outsideTablesList.map(tableKey => {
              const tableNum = tableKey.replace('O-', 'O');
              const status = tableStates[tableKey] || 'blank';
              const cartItems = carts[tableKey] || [];
              const elapsed = calculateElapsedTime(tableElapsedTimes[tableKey]);
              const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;
              const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div 
                  key={tableKey}
                  onClick={() => onTableSelect(tableKey)}
                  className={`h-26 rounded-xl border flex flex-col justify-between p-2.5 transition-all duration-300 cursor-pointer relative group ${getTableColorClass(status)}`}
                >
                  {/* Top Bar inside card */}
                  <div className="flex items-center justify-between w-full text-[9px] font-black tracking-wide leading-none select-none">
                    {status !== 'blank' ? (
                      <>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 opacity-85" />
                          <span>{elapsed || '0 min'}</span>
                        </span>
                        <span className="opacity-90">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                      </>
                    ) : (
                      <>
                        <span className="opacity-35 uppercase text-[8px] tracking-widest font-black">Vacant</span>
                        <Plus className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500" />
                      </>
                    )}
                  </div>

                  {/* Center Table label */}
                  <div className="flex flex-col items-center justify-center -mt-1">
                    <span className="text-xl font-black tracking-tight leading-none">
                      {tableNum}
                    </span>
                  </div>

                  {/* Bottom Bar inside card */}
                  <div className="w-full flex items-center justify-center select-none">
                    {status === 'blank' ? (
                      <span className="text-[9px] font-bold text-slate-400 leading-none">Outside</span>
                    ) : (
                      <span className="text-[10px] font-black font-mono leading-none tracking-wide">
                        ₹{Math.round(cartTotal).toLocaleString('en-IN')}.00
                      </span>
                    )}
                  </div>

                  {/* Floating Action Bar on Hover */}
                  {status !== 'blank' && (
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg border border-slate-200 px-1.5 py-0.5 flex items-center gap-2 z-10 shrink-0 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onActionClick('print', tableKey); }}
                        className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded cursor-pointer transition-colors"
                        title="Print Bill"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onActionClick('view', tableKey); }}
                        className="p-1 hover:bg-rose-50 hover:text-rose-600 text-slate-700 rounded cursor-pointer transition-colors"
                        title="Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- POS Screen Component (With Menu & Cart Billing Pane) ---
const POSScreen = ({
  menuItems,
  carts,
  currentSession,
  sessionDetails,
  updateSessionDetail,
  addToCart,
  updateQuantity,
  removeFromCart,
  placeOrder,
  onBackToTables,
  onPrintBillClick,
  inactiveItems
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState('menu'); // 'menu' or 'cart'

  const cart = carts[currentSession] || [];
  const activeDetails = sessionDetails[currentSession] || { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
  const { customerName, customerPhone, customerAddress, paymentMode } = activeDetails;

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gst = cartTotal * 0.05;
  const grandTotal = cartTotal + gst;

  const displayLabel = currentSession.startsWith('T-') 
    ? `Table ${currentSession.replace('T-', '')}` 
    : currentSession.startsWith('O-') 
      ? `Outside ${currentSession.replace('O-', '')}` 
      : currentSession;

  const activeServiceType = currentSession.startsWith('T-') || currentSession.startsWith('O-') ? 'Dine In' : currentSession;

  return (
    <div className="pos-screen-container flex flex-col md:flex-row bg-slate-100 w-full h-full overflow-hidden print:hidden font-sans relative pb-16 md:pb-0">
      {/* Left: Menu Area */}
      <div className={`pos-menu-area flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200 ${mobileView === 'menu' ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Navigation Action strip (Petpooja style) */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between select-none shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToTables}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-950 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Back to Table Map"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-650 px-2.5 py-1 rounded-md border border-slate-200">
                {activeServiceType}
              </span>
              <span className="text-sm font-black text-slate-800 bg-rose-50 border border-rose-100 text-rose-700 px-2.5 py-0.5 rounded-md">
                {displayLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 font-black text-[10px] uppercase text-slate-400 tracking-wider">
            <span>Billing Panel</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Menu Search and Categories */}
        <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs z-5 select-none">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-2.5 h-6 bg-rose-600 rounded-full"></div>
            <h2 className="text-lg font-extrabold text-slate-850 uppercase tracking-wider">
              Menu Items
            </h2>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search items (e.g. Biryani, Naan)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white focus:border-rose-500 transition-all outline-none font-sans"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Carousel */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-hide select-none">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="pos-menu-grid-scroll flex-1 overflow-y-auto p-4 content-start">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const isInactive = inactiveItems.includes(item.id);
              const catStyle = getCategoryStyle(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isInactive) {
                      alert(`"${item.name}" is currently set to OUT OF STOCK from Item On/Off settings!`);
                      return;
                    }
                    addToCart(item);
                  }}
                  className={`bg-white rounded-xl shadow-xs border border-slate-200 p-3 hover:shadow-md hover:border-rose-400 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group flex flex-col justify-between h-28 relative ${isInactive ? 'opacity-55 cursor-not-allowed' : ''}`}
                >
                  {isInactive && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-10 select-none rounded-xl">
                      <span className="bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-md">
                        Sold Out
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 select-none">
                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase tracking-wider truncate max-w-[110px]" title={item.category}>
                        {item.category}
                      </span>
                      <div className="shrink-0 scale-90">
                        {item.type === 'Veg' ? <VegBadge /> : <NonVegBadge />}
                      </div>
                    </div>
                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug group-hover:text-rose-600 transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1 select-none">
                    <span className="text-rose-600 font-black text-sm sm:text-base font-mono">₹{item.price}</span>
                    <button className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all duration-150 cursor-pointer shadow-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <UtensilsCrossed className="w-12 h-12 mb-2 opacity-50 text-[#ef4444]" />
              <p className="font-semibold text-xs uppercase tracking-wider">No menu items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Floating Trigger Bar */}
      {mobileView === 'menu' && cart.length > 0 && (
        <div 
          onClick={() => setMobileView('cart')}
          className="md:hidden fixed bottom-18 left-4 right-4 bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between z-30 font-sans cursor-pointer active:scale-98 transition-all hover:bg-slate-850"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-1.5 -right-1.5 bg-white text-rose-600 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs border border-rose-100">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div>
              <span className="font-extrabold text-xs block leading-none uppercase tracking-wide">View Billing Cart</span>
              <span className="text-[9px] font-bold text-slate-400">Manage orders & settle bill</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-black text-sm text-[#ef4444]">
            <span>₹{grandTotal.toFixed(0)}</span>
            <ArrowLeft className="w-4 h-4 rotate-180 text-white" />
          </div>
        </div>
      )}

      {/* Right: Cart Panel */}
      <div className={`pos-cart-panel w-full md:w-[400px] bg-white flex flex-col h-full shadow-2xl border-l border-slate-200 relative z-20 shrink-0 ${mobileView === 'cart' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-4 bg-red-50 border-b border-red-150 space-y-2 select-none">
          {/* Mobile Back to Menu */}
          <div className="md:hidden flex items-center pb-1">
            <button 
              onClick={() => setMobileView('menu')}
              className="flex items-center gap-1 text-[9px] font-black text-rose-700 bg-white border border-rose-200 px-3 py-1.5 rounded-lg active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Menu Items
            </button>
          </div>
          <div className="flex justify-between items-center font-bold">
            <span className="text-xs font-black text-red-800 uppercase tracking-widest">
              Active Cart: {displayLabel}
            </span>
            <span className="text-[9px] font-black bg-[#ef4444] text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
              {activeServiceType}
            </span>
          </div>
        </div>

        {/* Customer Details Inputs */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 space-y-2 select-none">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Bunty"
                value={customerName}
                onChange={e => updateSessionDetail('customerName', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">WhatsApp No.</label>
              <input
                type="tel"
                placeholder="10-digit number"
                value={customerPhone}
                onChange={e => updateSessionDetail('customerPhone', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold"
              />
            </div>
          </div>
          {activeServiceType === 'Delivery' && (
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Delivery Address</label>
              <textarea
                placeholder="Enter complete address..."
                rows={1.5}
                value={customerAddress}
                onChange={e => updateSessionDetail('customerAddress', e.target.value)}
                className="w-full text-xs p-2 bg-white border border-slate-355 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none resize-none font-semibold leading-tight"
              />
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="pos-cart-items-scroll flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 select-none">
              <ShoppingBag className="w-12 h-12 opacity-35 text-[#ef4444]" />
              <p className="text-xs font-bold uppercase tracking-wider">Cart is empty for this session</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-red-200 transition-colors shadow-xs">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="flex items-center gap-1.5">
                      {item.type === 'Veg' ? <VegBadge /> : <NonVegBadge />}
                      <h4 className="font-extrabold text-slate-800 text-sm line-clamp-1">{item.name}</h4>
                    </div>
                    <span className="font-bold text-slate-900 text-sm font-mono">₹{item.price * item.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 select-none">
                    <span className="text-xs text-slate-500 font-bold font-mono">₹{item.price} x {item.quantity}</span>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-250 rounded transition-colors text-slate-650 cursor-pointer">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-250 rounded transition-colors text-slate-650 cursor-pointer">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Details */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-3.5">
          <div className="space-y-1.5 text-xs text-slate-600 font-bold select-none">
            <div className="flex justify-between font-mono">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between items-center select-none">
            <span className="font-black text-slate-800 text-sm uppercase tracking-wide">Total Amount</span>
            <span className="font-black text-rose-600 text-xl font-mono">₹{grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5 select-none font-sans">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Payment Mode</span>
            <div className="flex gap-1.5">
              {['Cash', 'UPI', 'Card'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateSessionDetail('paymentMode', mode)}
                  className={`flex-1 text-center py-2 rounded-lg text-xs font-black border transition-all cursor-pointer ${paymentMode === mode ? 'bg-red-50 border-red-500 text-red-700 shadow-xs' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                >
                  {mode === 'Cash' ? '💵 Cash' : mode === 'UPI' ? '📱 UPI' : '💳 Card'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onPrintBillClick()}
              disabled={cart.length === 0}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer uppercase tracking-wider text-xs shadow-sm"
              title="Print Customer Bill Receipt"
            >
              <Printer className="w-4.5 h-4.5" /> Print Bill
            </button>
            <button
              onClick={() => placeOrder()}
              disabled={cart.length === 0}
              className="flex-1 bg-[#d92121] hover:bg-[#b91c1c] text-white font-extrabold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer uppercase tracking-wider text-xs"
            >
              <CreditCard className="w-4.5 h-4.5" /> KOT & Settle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- KDS Screen Component ---
const KDS_Screen = ({ orders, markOrderReady }) => {
  const pendingOrders = orders.filter(o => o.status === 'Pending');
  
  return (
    <div className="pos-kds-screen p-6 bg-slate-50 h-full overflow-y-auto font-sans print:hidden">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-black text-slate-850 flex items-center gap-2">
          <ChefHat className="text-[#ef4444] w-7 h-7" /> Kitchen Display System
        </h2>
        <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-250 shadow-sm text-xs font-bold uppercase tracking-wider text-slate-700">
          Pending Orders: <span className="text-[#ef4444] font-black ml-1 text-base">{pendingOrders.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {orders.map(order => (
          <div key={order.id} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden flex flex-col transition-all ${order.status === 'Pending' ? 'border-[#ef4444]' : 'border-slate-300 opacity-60'}`}>
            <div className={`p-3 text-white flex justify-between items-center ${order.status === 'Pending' ? 'bg-[#ef4444]' : 'bg-slate-500'}`}>
              <span className="font-extrabold text-lg">{order.table.startsWith('T-') ? `Table ${order.table.replace('T-', '')}` : order.table.startsWith('O-') ? `Outside ${order.table.replace('O-', '')}` : order.table}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold font-mono">{order.time}</span>
            </div>
            <div className="p-4 flex-1">
              <div className="text-xs text-slate-400 mb-3 font-bold font-mono">{order.id}</div>
              <ul className="space-y-2.5">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-slate-100 pb-1.5 last:border-0 last:pb-0 font-bold">
                    <span className={order.status === 'Pending' ? 'text-slate-800' : 'text-slate-500 line-through'}>
                      {item.name}
                    </span>
                    <span className="font-black bg-slate-100 px-2 py-0.5 rounded text-slate-700">x{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100">
              {order.status === 'Pending' ? (
                <button
                  onClick={() => markOrderReady(order.id)}
                  className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-850 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs uppercase tracking-wider"
                >
                  <CheckCircle2 className="w-4 h-4 text-rose-500" /> Mark Ready
                </button>
              ) : (
                <div className="text-center text-slate-600 font-extrabold py-1.5 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Completed
                </div>
              )}
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 select-none">
            <ChefHat className="w-16 h-16 opacity-35 mb-2 text-[#ef4444]" />
            <p className="font-bold text-xs uppercase tracking-widest">No active orders in KDS</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Menu Manager Component ---
const DEFAULT_CATEGORIES = [
  'Soups', 'Veg Starters', 'Chicken Starters', 'Mutton & Seafood Starters',
  'Tandoor Veg', 'Tandoor Non-Veg', 'Veg Main Course', 'Chicken Main Course',
  'Mutton Main Course', 'Seafood Main Course', 'Breads / Roti',
  'Rice & Biryani', 'Noodles & Fried Rice', 'Desserts', 'Cold Drinks & Beverages'
];

const MenuManager = ({ menuItems, addMenuItem }) => {
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'Soups', type: 'Veg' });
  const [customCategories, setCustomCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem('knife_pos_custom_categories') || '[]'); } catch { return []; }
  });
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    addMenuItem({
      ...newItem,
      id: Date.now(),
      price: Number(newItem.price),
    });
    setNewItem({ name: '', price: '', category: newItem.category, type: newItem.type });
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const updated = [...customCategories, newCatName.trim()];
    setCustomCategories(updated);
    localStorage.setItem('knife_pos_custom_categories', JSON.stringify(updated));
    setNewItem(prev => ({ ...prev, category: newCatName.trim() }));
    setNewCatName('');
    setShowAddCat(false);
  };

  const catStyle = getCategoryStyle(newItem.category);

  return (
    <div className="pos-menu-manager flex h-full bg-slate-50 print:hidden font-sans select-none">
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-3">
          <UtensilsCrossed className="text-[#ef4444] w-7 h-7" /> Menu Management
        </h2>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl">
          <h3 className="text-base font-extrabold mb-4 text-slate-700 uppercase tracking-wider flex items-center gap-2">
            Add New Item
            <span className={`text-2xl ml-auto`}>{catStyle.emoji}</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Item Name *</label>
                <input
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-sm"
                  value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g. Kadai Paneer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Price (₹) *</label>
                <input
                  type="number"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-black font-mono text-sm"
                  value={newItem.price}
                  onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Category</label>
                  <button type="button" onClick={() => setShowAddCat(true)} className="text-[10px] text-rose-600 font-extrabold uppercase tracking-wider hover:text-rose-700 flex items-center gap-0.5 cursor-pointer">
                    <Plus className="w-3 h-3"/> New Category
                  </button>
                </div>
                <select
                  className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold cursor-pointer text-sm"
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                >
                  {allCategories.map(cat => <option key={cat}>{cat}</option>)}
                </select>
                {showAddCat && (
                  <form onSubmit={handleAddCategory} className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="e.g. Special Thali"
                      className="flex-1 p-2 text-xs border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    />
                    <button type="submit" className="bg-rose-600 text-white px-3 py-2 rounded-lg text-xs font-black cursor-pointer">Add</button>
                    <button type="button" onClick={() => setShowAddCat(false)} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-black cursor-pointer">✕</button>
                  </form>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Type</label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" checked={newItem.type === 'Veg'} onChange={() => setNewItem({ ...newItem, type: 'Veg' })} className="text-rose-600 focus:ring-rose-500 h-4 w-4"/>
                    <div className="flex items-center gap-1"><VegBadge /><span className="text-xs font-bold text-slate-700">Veg</span></div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" checked={newItem.type === 'Non-Veg'} onChange={() => setNewItem({ ...newItem, type: 'Non-Veg' })} className="text-rose-600 focus:ring-rose-500 h-4 w-4"/>
                    <div className="flex items-center gap-1"><NonVegBadge /><span className="text-xs font-bold text-slate-700">Non-Veg</span></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Category preview */}
            <div className={`rounded-xl h-14 flex items-center justify-center gap-3 ${catStyle.bg} border border-slate-200`}>
              <span className="text-2xl">{catStyle.emoji}</span>
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{newItem.category} — {newItem.type}</span>
            </div>

            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2 uppercase tracking-wider text-xs cursor-pointer shadow-sm">
              <Plus className="w-4 h-4 text-rose-400" /> Add Item to Menu
            </button>
          </form>
        </div>

        {customCategories.length > 0 && (
          <div className="mt-6 max-w-2xl bg-white rounded-xl border border-slate-200 p-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Custom Categories ({customCategories.length})</h4>
            <div className="flex flex-wrap gap-2">
              {customCategories.map((cat, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700">
                  <span>{getCategoryStyle(cat).emoji}</span>
                  <span>{cat}</span>
                  <button
                    onClick={() => {
                      const updated = customCategories.filter((_, idx) => idx !== i);
                      setCustomCategories(updated);
                      localStorage.setItem('knife_pos_custom_categories', JSON.stringify(updated));
                    }}
                    className="text-rose-400 hover:text-rose-600 cursor-pointer ml-1 font-black text-xs"
                  >✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="text-base font-extrabold mb-4 text-slate-700 uppercase tracking-wider">Current Menu Items ({menuItems.length})</h3>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Item Details</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Price</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Food Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {menuItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <img src={item.image} className="w-10 h-10 rounded object-cover shadow-xs border border-slate-200" />
                      <span className="font-extrabold text-slate-800 text-sm">{item.name}</span>
                    </td>
                    <td className="p-4 text-xs font-extrabold text-slate-400 uppercase tracking-wide">{item.category}</td>
                    <td className="p-4 text-sm font-black text-slate-900 font-mono">₹{item.price}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'Veg' ? <VegBadge /> : <NonVegBadge />}
                        <span className="text-xs font-bold text-slate-750">{item.type}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reports Screen Component ---
const ReportsScreen = ({ orders, expenses, onPrintReport }) => {
  const [subTab, setSubTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [searchQuery, setSearchQuery] = useState('');

  const formattedSelectedDate = new Date(selectedDate).toLocaleDateString('en-IN');
  const dailyOrders = orders.filter(o => o.date === formattedSelectedDate || o.isodate === selectedDate);
  const searchedDailyOrders = dailyOrders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const dailySalesTotal = dailyOrders.reduce((sum, o) => sum + o.total, 0);
  const dailyBillsCount = dailyOrders.length;
  const dailyAvgOrder = dailyBillsCount ? Math.round(dailySalesTotal / dailyBillsCount) : 0;
  
  const dailyCash = dailyOrders.filter(o => o.paymentMode === 'Cash').reduce((sum, o) => sum + o.total, 0);
  const dailyUPI = dailyOrders.filter(o => o.paymentMode === 'UPI').reduce((sum, o) => sum + o.total, 0);
  const dailyCard = dailyOrders.filter(o => o.paymentMode === 'Card').reduce((sum, o) => sum + o.total, 0);

  const monthlyOrders = orders.filter(o => o.isodate && o.isodate.startsWith(selectedMonth));
  const monthlyExpenses = expenses.filter(e => e.date && e.date.startsWith(selectedMonth));
  
  const monthlySalesTotal = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
  const monthlyExpensesTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = monthlySalesTotal - monthlyExpensesTotal;

  const getDailyProfitLossTrend = () => {
    const daysInMonth = new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1], 0).getDate();
    const trend = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${selectedMonth}-${dayStr}`;
      
      const daySales = orders
        .filter(o => o.isodate === dateKey)
        .reduce((sum, o) => sum + o.total, 0);

      const dayExpenses = expenses
        .filter(e => e.date === dateKey)
        .reduce((sum, e) => sum + e.amount, 0);

      trend.push({
        label: dayStr,
        sales: daySales,
        expenses: dayExpenses
      });
    }
    return trend;
  };

  const getCategoryShare = () => {
    const shares = {};
    monthlyOrders.forEach(o => {
      o.items.forEach(item => {
        const cat = item.category || 'Main Course';
        shares[cat] = (shares[cat] || 0) + (item.price * item.quantity * 1.05);
      });
    });

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#ec4899', '#f59e0b', '#8b5cf6'];
    return Object.keys(shares).map((cat, idx) => ({
      name: cat,
      value: Math.round(shares[cat]),
      color: colors[idx % colors.length]
    }));
  };

  const getTopItems = () => {
    const items = {};
    monthlyOrders.forEach(o => {
      o.items.forEach(item => {
        if (!items[item.name]) {
          items[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        items[item.name].quantity += item.quantity;
        items[item.name].revenue += item.price * item.quantity;
      });
    });
    return Object.values(items).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  };

  return (
    <div className="pos-reports-screen p-8 bg-slate-50 h-full overflow-y-auto font-sans print:hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3 w-full">
          <FileText className="text-[#ef4444] w-7 h-7" /> Business Reports & Analytics
        </h2>
        <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner shrink-0">
          <button
            onClick={() => setSubTab('daily')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${subTab === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
          >
            Daily Register
          </button>
          <button
            onClick={() => setSubTab('monthly')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${subTab === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
          >
            Monthly Performance
          </button>
        </div>
      </div>

      {subTab === 'daily' ? (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Select Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="p-2 border border-slate-355 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 cursor-pointer font-mono"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Bill ID or Guest..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-355 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none font-sans"
                />
              </div>
              <button
                onClick={() => {
                  exportToCSV(`daily-report-${selectedDate}.csv`,
                    ['Bill No','Time','Table','Customer','Payment Mode','Amount'],
                    dailyOrders.map(o => [o.id, o.time, o.table, o.customerName || 'Guest', o.paymentMode || 'Cash', o.total])
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shrink-0 shadow-sm"
              >
                📥 Excel
              </button>
              <button
                onClick={() => onPrintReport('daily', { date: selectedDate, orders: dailyOrders })}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shrink-0 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 select-none">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Total Sales</span>
              <h4 className="text-xl font-black text-slate-850 mt-1 font-mono">₹{dailySalesTotal.toLocaleString()}</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Bills Printed</span>
              <h4 className="text-xl font-black text-slate-850 mt-1 font-mono">{dailyBillsCount}</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Avg Bill Amt</span>
              <h4 className="text-xl font-black text-slate-850 mt-1 font-mono">₹{dailyAvgOrder}</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-red-500">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">UPI Collections</span>
              <h4 className="text-xl font-black text-red-600 mt-1 font-mono">₹{dailyUPI.toLocaleString()}</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Cash Register</span>
              <h4 className="text-xl font-black text-amber-600 mt-1 font-mono">₹{dailyCash.toLocaleString()}</h4>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-500">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Card Payments</span>
              <h4 className="text-xl font-black text-blue-600 mt-1 font-mono">₹{dailyCard.toLocaleString()}</h4>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between select-none">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Bills Generated for {selectedDate}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Bill No</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Table</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-750 font-bold">
                {searchedDailyOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-black text-slate-900 font-mono">{order.id}</td>
                    <td className="p-4 font-bold font-mono">{order.time}</td>
                    <td className="p-4 font-bold">{order.table.startsWith('T-') ? `Table ${order.table.replace('T-', '')}` : order.table.startsWith('O-') ? `Outside ${order.table.replace('O-', '')}` : order.table}</td>
                    <td className="p-4">
                      <div className="font-bold">{order.customerName}</div>
                      {order.customerPhone && <div className="text-[10px] text-slate-400 font-mono">{order.customerPhone}</div>}
                    </td>
                    <td className="p-4 font-black">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${order.paymentMode === 'UPI' ? 'bg-[#ef4444]/10 text-red-700' : order.paymentMode === 'Cash' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                        {order.paymentMode}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-slate-900 font-mono">₹{order.total}</td>
                  </tr>
                ))}
                {searchedDailyOrders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-slate-400 font-bold uppercase tracking-wide">
                      No matching records found for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4 select-none">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Select Month:</span>
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Month:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="p-2 border border-slate-355 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 cursor-pointer font-mono"
              />
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => {
                  exportToCSV(`monthly-report-${selectedMonth}.csv`,
                    ['Bill No','Date','Table','Customer','Payment Mode','Amount'],
                    monthlyOrders.map(o => [o.id, o.date, o.table, o.customerName || 'Guest', o.paymentMode || 'Cash', o.total])
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm"
              >
                📥 Excel Export
              </button>
              <button
                onClick={() => onPrintReport('monthly', { month: selectedMonth, orders: monthlyOrders, expenses: monthlyExpenses })}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wide">Monthly Revenue</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">₹{monthlySalesTotal.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-600 font-bold">Total Sales Bills: {monthlyOrders.length}</span>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-rose-500 border border-red-100">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wide">Monthly Expenses</span>
                <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">₹{monthlyExpensesTotal.toLocaleString()}</h3>
                <span className="text-[10px] text-rose-500 font-bold">Includes stock, salary & rent</span>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>

            <div className={`p-6 rounded-2xl border shadow-xs flex items-center justify-between text-white ${netProfit >= 0 ? 'bg-[#ef4444] border-red-650' : 'bg-rose-600 border-rose-650'}`}>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider opacity-75">Net Profit / Loss</span>
                <h3 className="text-2xl font-black mt-1 font-mono">₹{netProfit.toLocaleString()}</h3>
                <span className="text-[10px] font-bold opacity-85">
                  Margin: {monthlySalesTotal ? `${Math.round((netProfit / monthlySalesTotal) * 100)}%` : '0%'}
                </span>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* === PREMIUM ANALYTICS DASHBOARD === */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            {/* Dark header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400"><TrendingUp className="w-4 h-4"/></div>
              <div>
                <h3 className="font-black text-white text-sm uppercase tracking-wider">Analytics Dashboard</h3>
                <p className="text-[10px] text-slate-400 font-bold">{selectedMonth} — Profit, Sales & Revenue Trends</p>
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 bg-white">
              <div className="p-5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Revenue</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5 font-mono">₹{monthlySalesTotal.toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-600 font-bold">{monthlyOrders.length} bills</span>
              </div>
              <div className="p-5">
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Expenses</span>
                <h3 className="text-xl font-black text-rose-600 mt-0.5 font-mono">₹{monthlyExpensesTotal.toLocaleString()}</h3>
                <span className="text-[10px] text-rose-500 font-bold">Stock + Salary + Rent</span>
              </div>
              <div className={`p-5 ${netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Net Profit</span>
                <h3 className={`text-xl font-black mt-0.5 font-mono ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netProfit >= 0 ? '+' : ''}₹{netProfit.toLocaleString()}
                </h3>
                <span className={`text-[10px] font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Margin: {monthlySalesTotal ? `${Math.round((netProfit / monthlySalesTotal) * 100)}%` : '0%'}
                </span>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white border-t border-slate-200">
              {/* Dual Trend Chart - Daily Sales vs Daily Expenses */}
              <div className="lg:col-span-2 p-5 bg-slate-50/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">📊 Sales vs Expenses P&L Trend</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Hover dots for exact values</span>
                </div>
                <div className="h-52 w-full">
                  <SVGDualTrendChart data={getDailyProfitLossTrend()}/>
                </div>
              </div>
              {/* Payment Mode Pie */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">💳 Payment Split</span>
                </div>
                <div className="h-52 flex items-center justify-center">
                  <SVGPaymentPieChart
                    cash={monthlyOrders.filter(o => o.paymentMode === 'Cash' || !o.paymentMode).reduce((s,o) => s + o.total, 0)}
                    upi={monthlyOrders.filter(o => o.paymentMode === 'UPI').reduce((s,o) => s + o.total, 0)}
                    card={monthlyOrders.filter(o => o.paymentMode === 'Card' || o.paymentMode === 'Card/Bank').reduce((s,o) => s + o.total, 0)}
                  />
                </div>
              </div>
            </div>

            {/* Category + Top Items Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 bg-white border-t border-slate-200">
              {/* Category Donut */}
              <div className="p-5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-3">🍽️ Category Revenue Share</span>
                <div className="h-48 flex items-center justify-center">
                  <SVGDonutChart data={getCategoryShare()}/>
                </div>
              </div>
              {/* Top Items Leaderboard */}
              <div className="p-5">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wide block mb-3">🏆 Top Selling Items</span>
                <div className="space-y-3">
                  {getTopItems().slice(0, 5).map((item, idx) => {
                    const maxQ = getTopItems()[0]?.quantity || 1;
                    const pct = Math.round((item.quantity / maxQ) * 100);
                    const colors = ['bg-rose-500','bg-orange-500','bg-amber-500','bg-blue-500','bg-violet-500'];
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full ${colors[idx]} text-white flex items-center justify-center text-[9px] font-black shrink-0`}>{idx+1}</span>
                            {item.name}
                          </span>
                          <span className="font-black text-slate-500 font-mono">{item.quantity}x · ₹{item.revenue.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${colors[idx]} transition-all duration-500`} style={{width: `${pct}%`}}></div>
                        </div>
                      </div>
                    );
                  })}
                  {getTopItems().length === 0 && <div className="text-xs text-slate-400 font-bold py-8 text-center">No sales data for this month</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Expenses Manager Component ---
const ExpensesScreen = ({ expenses, orders, addExpense, deleteExpense }) => {
  const [showModal, setShowModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'Raw Materials', date: new Date().toISOString().split('T')[0], notes: '' });
  const [filterCat, setFilterCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const thisMonthString = new Date().toISOString().substring(0, 7);
  const thisMonthOrders = orders.filter(o => o.isodate && o.isodate.startsWith(thisMonthString));
  const totalRevenueThisMonth = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);

  const filteredExpenses = expenses.filter(e => {
    const matchesCat = filterCat === 'All' || e.category === filterCat;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const totalFilteredExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalMonthlyExpenses = expenses
    .filter(e => e.date && e.date.startsWith(thisMonthString))
    .reduce((sum, e) => sum + e.amount, 0);

  const netMonthlyProfit = totalRevenueThisMonth - totalMonthlyExpenses;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;
    addExpense({
      ...expenseForm,
      id: `EXP-${Date.now()}`,
      amount: Number(expenseForm.amount)
    });
    setExpenseForm({ title: '', amount: '', category: 'Raw Materials', date: new Date().toISOString().split('T')[0], notes: '' });
    setShowModal(false);
  };

  const categories = ['Raw Materials', 'Rent', 'Salaries', 'Utilities', 'Taxes', 'Maintenance', 'Other'];

  return (
    <div className="pos-expenses-screen p-8 bg-slate-50 h-full overflow-y-auto font-sans print:hidden relative select-none">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <IndianRupee className="text-rose-500 w-7 h-7" /> Expense Register & Ledger
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              exportToCSV(
                `expenses-${filterCat}-${new Date().toISOString().split('T')[0]}.csv`,
                ['Date', 'Expense ID', 'Title', 'Category', 'Amount', 'Notes'],
                filteredExpenses.map(exp => [exp.date, exp.id, exp.title, exp.category, exp.amount, exp.notes])
              );
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm active:scale-95"
          >
            📥 Excel Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-rose-450" /> Log Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Monthly Revenue</span>
          <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono">₹{totalRevenueThisMonth.toLocaleString()}</h3>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Period: {thisMonthString}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-r-4 border-r-rose-450">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Monthly Expenses</span>
          <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">₹{totalMonthlyExpenses.toLocaleString()}</h3>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold">Total: {expenses.length} records</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-xs text-white ${netMonthlyProfit >= 0 ? 'bg-[#ef4444] border-red-650' : 'bg-rose-600 border-rose-650'}`}>
          <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">Net Monthly Profit</span>
          <h3 className="text-2xl font-black mt-1 font-mono">₹{netMonthlyProfit.toLocaleString()}</h3>
          <span className="text-[9px] uppercase tracking-widest font-mono font-bold opacity-80">
            Net Margin: {totalRevenueThisMonth ? `${Math.round((netMonthlyProfit / totalRevenueThisMonth) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Filter Category:</span>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value)}
            className="p-2 border border-slate-355 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 cursor-pointer font-sans font-bold"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Title or Details..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-355 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-none font-sans font-bold"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">Expense Ledger Statement</span>
          <span className="bg-white border border-rose-300 text-[10px] font-black text-rose-600 px-2 py-0.5 rounded font-mono">
            Total Filtered: ₹{totalFilteredExpenseAmount.toLocaleString()}
          </span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="p-4">Date</th>
              <th className="p-4">ID</th>
              <th className="p-4">Title</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4">Notes</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-750 font-bold">
            {filteredExpenses.slice().reverse().map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold font-mono">{exp.date}</td>
                <td className="p-4 font-extrabold text-slate-400 font-mono">{exp.id}</td>
                <td className="p-4 font-black text-slate-850 text-sm">{exp.title}</td>
                <td className="p-4">
                  <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-650 border border-slate-200">
                    {exp.category}
                  </span>
                </td>
                <td className="p-4 text-right font-black text-rose-600 text-sm font-mono font-mono">₹{exp.amount.toLocaleString()}</td>
                <td className="p-4 font-semibold text-slate-500 max-w-[200px] truncate" title={exp.notes}>{exp.notes || '—'}</td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden font-sans">
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="w-4.5 h-4.5 text-rose-400" /> Log Business Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="hover:text-rose-455 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Expense Title</label>
                <input
                  type="text"
                  required
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  placeholder="e.g. Purchased Grocery & Spices"
                  className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    placeholder="₹0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-black text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs font-mono cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Category</label>
                <select
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-355 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-xs cursor-pointer"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Notes</label>
                <textarea
                  rows="2"
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Remarks..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-355 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-xs resize-none"
                />
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-3.5 rounded-xl transition-colors uppercase tracking-wider text-xs shadow-md">
                Add Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Staff Screen Component ---
const StaffScreen = ({ staff, addStaff, removeStaff, updateStaff, attendance, saveAttendance, addExpense, getStorageKey }) => {
  const [subTab, setSubTab] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', role: 'Kitchen Helper', salary: '', contact: '', joined: new Date().toISOString().split('T')[0] });
  
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'Kitchen Helper', salary: '', contact: '', joined: '', status: 'Active' });

  const [attendanceMonth, setAttendanceMonth] = useState(new Date().toISOString().substring(0, 7));
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7));
  
  const [paidSalaries, setPaidSalaries] = useState(() => {
    const saved = localStorage.getItem(getStorageKey ? getStorageKey('paid_salaries') : 'urmikitchen_paid_salaries');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem(getStorageKey ? getStorageKey('paid_salaries') : 'urmikitchen_paid_salaries', JSON.stringify(paidSalaries));
  }, [paidSalaries, getStorageKey]);

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.salary) return;
    addStaff({
      ...staffForm,
      id: `ST-${String(staff.length + 1).padStart(3, '0')}`,
      salary: Number(staffForm.salary),
      status: 'Active'
    });
    setStaffForm({ name: '', role: 'Kitchen Helper', salary: '', contact: '', joined: new Date().toISOString().split('T')[0] });
    setShowModal(false);
  };

  const handleUpdateStaffSubmit = (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.salary) return;
    updateStaff(editingMember.id || editingMember._id, {
      ...editForm,
      salary: Number(editForm.salary)
    });
    setEditingMember(null);
  };

  const getDaysInMonth = (monthString) => {
    const year = intStr => Number(intStr);
    const y = year(monthString.split('-')[0]);
    const m = year(monthString.split('-')[1]);
    return new Date(y, m, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(attendanceMonth);
  const calendarDays = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);

  const getAttendanceStatus = (staffId, dateKey) => {
    return (attendance[staffId] && attendance[staffId][dateKey]) || 'P';
  };

  const cycleAttendance = (staffId, dateKey) => {
    const current = getAttendanceStatus(staffId, dateKey);
    let next = 'P';
    if (current === 'P') next = 'A';
    else if (current === 'A') next = 'H';
    else if (current === 'H') next = 'L';
    else if (current === 'L') next = 'P';
    
    saveAttendance(staffId, dateKey, next);
  };

  const calculatePayroll = (employee) => {
    const days = getDaysInMonth(payrollMonth);
    let present = 0;
    let absent = 0;
    let half = 0;
    let leave = 0;

    for (let d = 1; d <= days; d++) {
      const dayStr = String(d).padStart(2, '0');
      const dateKey = `${payrollMonth}-${dayStr}`;
      const status = getAttendanceStatus(employee.id, dateKey);
      if (status === 'P') present++;
      else if (status === 'A') absent++;
      else if (status === 'H') half++;
      else if (status === 'L') leave++;
    }

    const unpaidDays = absent + (half * 0.5);
    const dailyWage = employee.salary / 30;
    const deductions = Math.round(unpaidDays * dailyWage);
    const netPayout = Math.max(0, employee.salary - deductions);

    const paidKey = `${employee.id}_${payrollMonth}`;
    const paidInfo = paidSalaries[paidKey];

    return {
      present, absent, half, leave,
      deductions,
      netPayout,
      isPaid: !!paidInfo,
      paidInfo
    };
  };

  const handlePaySalary = (employee, payrollInfo) => {
    const mode = prompt(`Confirm payment of ₹${payrollInfo.netPayout.toLocaleString()} to ${employee.name}. Enter payment mode (Cash / UPI / Bank):`, 'Cash');
    if (mode === null) return;
    
    const validMode = ['Cash', 'UPI', 'Bank', 'Bank Transfer'].includes(mode) ? mode : 'Cash';
    const paidKey = `${employee.id}_${payrollMonth}`;
    
    setPaidSalaries(prev => ({
      ...prev,
      [paidKey]: {
        amount: payrollInfo.netPayout,
        date: new Date().toISOString().split('T')[0],
        mode: validMode
      }
    }));

    addExpense({
      id: `EXP-SAL-${Date.now()}`,
      title: `Salary Payout - ${employee.name} (${payrollMonth})`,
      amount: payrollInfo.netPayout,
      category: 'Salaries',
      date: new Date().toISOString().split('T')[0],
      notes: `Attendance: Present: ${payrollInfo.present}d, Absent: ${payrollInfo.absent}d, Half: ${payrollInfo.half}d. Paid via ${validMode}`
    });

    alert("Salary payment logged and expense record added successfully!");
  };

  return (
    <div className="pos-staff-screen p-8 bg-slate-50 h-full overflow-y-auto font-sans print:hidden select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-200 pb-3 w-full">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <Users className="text-[#ef4444] w-7 h-7" /> Staff Salary & Attendance
        </h2>
        
        <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner shrink-0">
          <button
            onClick={() => setSubTab('list')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${subTab === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
          >
            Staff Directory
          </button>
          <button
            onClick={() => setSubTab('attendance')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${subTab === 'attendance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
          >
            Attendance Register
          </button>
          <button
            onClick={() => setSubTab('salary')}
            className={`px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${subTab === 'salary' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
          >
            Payroll Calculator
          </button>
        </div>
      </div>

      {subTab === 'list' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Employees: {staff.length}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  exportToCSV(
                    `staff-directory-${new Date().toISOString().split('T')[0]}.csv`,
                    ['Employee ID', 'Name', 'Role', 'Salary', 'Contact', 'Status', 'Joined Date'],
                    staff.map(member => [member.id, member.name, member.role, member.salary, member.contact, member.status, member.joined])
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm active:scale-95"
              >
                📥 Excel Export
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" /> Add Staff Member
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map(member => (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-250 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-4 right-4 flex gap-1.5 items-center">
                  {member.status === 'Inactive' && (
                    <span className="bg-slate-150 text-slate-500 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-slate-200 shadow-xs">
                      Inactive
                    </span>
                  )}
                  <div className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-red-100">
                    {member.role}
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-850">{member.name}</h4>
                  <div className="text-[10px] text-slate-400 font-extrabold font-mono mt-0.5">{member.id} • Joined: {member.joined}</div>
                  
                  <div className="mt-4 space-y-2 text-xs font-bold text-slate-650">
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5 font-mono">
                      <span>Salary structure</span>
                      <span className="text-slate-950 font-black">₹{member.salary.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between border-b border-dashed border-slate-100 pb-1.5">
                      <span>Contact</span>
                      <span className="text-slate-950 font-mono font-bold">{member.contact || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between">
                  <button
                    onClick={() => {
                      setEditingMember(member);
                      setEditForm({
                        name: member.name,
                        role: member.role,
                        salary: String(member.salary),
                        contact: member.contact || '',
                        joined: member.joined || '',
                        status: member.status || 'Active'
                      });
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={() => removeStaff(member.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Select Month:</span>
              <input
                type="month"
                value={attendanceMonth}
                onChange={e => setAttendanceMonth(e.target.value)}
                className="p-2 border border-slate-355 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 cursor-pointer font-mono font-bold"
              />
            </div>
            <div className="text-[10px] text-slate-500 font-bold uppercase leading-tight text-center sm:text-right font-sans">
              💡 Click cell to cycle: <span className="text-emerald-600 font-black">Present (P)</span> → <span className="text-rose-650 font-black">Absent (A)</span> → <span className="text-amber-600 font-black">Half (H)</span> → <span className="text-blue-600 font-black">Leave (L)</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-40 sticky left-0 bg-slate-50 border-r border-slate-200">Staff Name</th>
                  {calendarDays.map(day => (
                    <th key={day} className="p-1.5 text-center border-r border-slate-250 w-8">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold">
                {staff.map(member => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="p-3 font-black text-slate-800 border-r border-slate-250 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div>{member.name}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{member.role}</div>
                    </td>
                    {calendarDays.map(day => {
                      const dayStr = String(day).padStart(2, '0');
                      const dateKey = `${attendanceMonth}-${dayStr}`;
                      const status = getAttendanceStatus(member.id, dateKey);
                      
                      let cellColor = "";
                      if (status === 'P') cellColor = "bg-emerald-500 text-white";
                      else if (status === 'A') cellColor = "bg-rose-500 text-white";
                      else if (status === 'H') cellColor = "bg-amber-500 text-white";
                      else if (status === 'L') cellColor = "bg-blue-500 text-white";

                      return (
                        <td key={day} className="p-1 text-center border-r border-slate-100">
                          <button
                            onClick={() => cycleAttendance(member.id, dateKey)}
                            className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center mx-auto cursor-pointer transition-all shadow-xs active:scale-90 ${cellColor}`}
                          >
                            {status}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'salary' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Payroll Month:</span>
            <input
              type="month"
              value={payrollMonth}
              onChange={e => setPayrollMonth(e.target.value)}
              className="p-2 border border-slate-355 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 cursor-pointer font-mono font-bold"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Monthly Salary Statement ({payrollMonth})</span>
              <button
                onClick={() => {
                  const rows = staff.map(member => {
                    const p = calculatePayroll(member);
                    return [member.id, member.name, member.role, member.salary, p.present, p.absent, p.half, p.leave, p.deductions, p.netPayout, p.isPaid ? 'Paid' : 'Pending', p.isPaid ? p.paidInfo?.mode : '', p.isPaid ? p.paidInfo?.date : ''];
                  });
                  exportToCSV(`payroll-${payrollMonth}.csv`,
                    ['Staff ID','Name','Role','Base Salary','Present','Absent','Half','Leave','Deductions','Net Payable','Status','Payment Mode','Payment Date'],
                    rows
                  );
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider shadow-sm"
              >
                📥 Export Excel
              </button>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Name / Role</th>
                  <th className="p-4 text-center">P / A / H / L</th>
                  <th className="p-4 text-right">Base Salary</th>
                  <th className="p-4 text-right">Deductions</th>
                  <th className="p-4 text-right">Net Payable</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-750 font-bold">
                {staff.map(member => {
                  const payroll = calculatePayroll(member);
                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-black text-slate-900">
                        <div>{member.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{member.role}</div>
                      </td>
                      <td className="p-4 text-center font-mono font-black">
                        <span className="text-emerald-650">{payroll.present}</span> / <span className="text-rose-650">{payroll.absent}</span> / <span className="text-amber-500">{payroll.half}</span> / <span className="text-blue-500">{payroll.leave}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-800">₹{member.salary.toLocaleString()}</td>
                      <td className="p-4 text-right font-mono font-black text-rose-500">
                        {payroll.deductions > 0 ? `-₹${payroll.deductions.toLocaleString()}` : '₹0'}
                      </td>
                      <td className="p-4 text-right font-mono font-black text-slate-950 text-sm">₹{payroll.netPayout.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${payroll.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {payroll.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {payroll.isPaid ? (
                          <div className="text-[10px] text-slate-400 font-extrabold uppercase font-mono leading-tight">
                            Paid via {payroll.paidInfo.mode}
                            <div className="text-[8px] font-normal">{payroll.paidInfo.date}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePaySalary(member, payroll)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider shadow-xs cursor-pointer active:scale-95 transition-all"
                          >
                            💵 Settle Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-rose-450" /> Register New Employee
              </h3>
              <button onClick={() => setShowModal(false)} className="hover:text-rose-455 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="e.g. Hari Mishra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={staffForm.salary}
                    onChange={e => setStaffForm({ ...staffForm, salary: e.target.value })}
                    placeholder="₹15000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-black text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Role</label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-355 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-xs cursor-pointer font-bold"
                  >
                    <option>Head Chef</option>
                    <option>Kitchen Helper</option>
                    <option>Waiter</option>
                    <option>Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Contact Number</label>
                  <input
                    type="tel"
                    value={staffForm.contact}
                    onChange={e => setStaffForm({ ...staffForm, contact: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={staffForm.joined}
                    onChange={e => setStaffForm({ ...staffForm, joined: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs font-mono cursor-pointer"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-3.5 rounded-xl transition-colors uppercase tracking-wider text-xs shadow-md">
                Register employee
              </button>
            </form>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden font-sans">
            <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-rose-450" /> Edit Employee Profile
              </h3>
              <button onClick={() => setEditingMember(null)} className="hover:text-rose-455 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateStaffSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Hari Mishra"
                  className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    required
                    value={editForm.salary}
                    onChange={e => setEditForm({ ...editForm, salary: e.target.value })}
                    placeholder="₹15000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-black text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Role</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-355 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-xs cursor-pointer font-bold"
                  >
                    <option>Head Chef</option>
                    <option>Kitchen Helper</option>
                    <option>Waiter</option>
                    <option>Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Contact Number</label>
                  <input
                    type="tel"
                    value={editForm.contact}
                    onChange={e => setEditForm({ ...editForm, contact: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full p-2.5 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={editForm.joined}
                    onChange={e => setEditForm({ ...editForm, joined: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold text-xs font-mono cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wide">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-355 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-xs cursor-pointer font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-850 text-white font-extrabold py-3.5 rounded-xl transition-colors uppercase tracking-wider text-xs shadow-md">
                Save changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Report A4 Printable Preview Overlay ---
const ReportPrintModal = ({ type, data, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!data) return null;

  const title = type === 'daily' 
    ? `DAILY REGISTER REPORT - ${new Date(data.date).toLocaleDateString('en-IN')}`
    : `MONTHLY PERFORMANCE STATEMENT - ${data.month}`;

  const salesTotal = data.orders.reduce((sum, o) => sum + o.total, 0);
  const billsCount = data.orders.length;
  
  const cashTotal = data.orders.filter(o => o.paymentMode === 'Cash').reduce((sum, o) => sum + o.total, 0);
  const upiTotal = data.orders.filter(o => o.paymentMode === 'UPI').reduce((sum, o) => sum + o.total, 0);
  const cardTotal = data.orders.filter(o => o.paymentMode === 'Card').reduce((sum, o) => sum + o.total, 0);
  
  const totalExpense = type === 'monthly' ? data.expenses.reduce((sum, e) => sum + e.amount, 0) : 0;
  const netRevenue = type === 'monthly' ? salesTotal - totalExpense : salesTotal;

  return (
    <div className="print-modal-portal fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[800px] max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col border border-slate-100">
        
        <div className="p-4 bg-slate-950 text-white flex justify-between items-center sticky top-0 z-10 print:hidden font-sans">
          <h3 className="font-extrabold flex items-center gap-2 text-xs uppercase tracking-wider">
            <Printer className="w-4.5 h-4.5 text-rose-450" />
            Report Export Preview: {type === 'daily' ? 'Daily Register' : 'Monthly Statement'}
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="bg-rose-650 hover:bg-rose-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="hover:text-rose-450 p-1 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="receipt-content" className="p-10 font-sans text-xs bg-white text-black overflow-y-auto flex-1 select-text">
          <div className="border border-slate-300 p-8 rounded-lg space-y-6 print:border-0 print:p-0">
            
            <div className="flex justify-between items-start border-b border-slate-350 pb-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider text-slate-900">Urmi Kitchen</h2>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                  Sikhrpur Junction, Mahnadi Vihar, Cuttack - 753003<br/>
                  Phones: 7847912995, 7020416443 | POS Engine Admin Export
                </p>
              </div>
              <div className="text-right">
                <span className="bg-slate-100 text-slate-800 text-[9px] font-black uppercase px-2.5 py-1 rounded tracking-wider border border-slate-200">
                  {type === 'daily' ? 'Daily Register' : 'Monthly Performance'}
                </span>
                <p className="text-[9px] text-slate-400 font-bold font-mono mt-2">
                  Generated: {new Date().toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="text-center py-1">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-2">{title}</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-center">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">Gross Sales</span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5 font-mono">₹{salesTotal.toLocaleString()}</h4>
              </div>
              <div className="text-center border-l border-slate-200">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
                  {type === 'monthly' ? 'Total Expenses' : 'Bills Generated'}
                </span>
                <h4 className="text-lg font-black text-rose-650 mt-0.5 font-mono">
                  {type === 'monthly' ? `₹${totalExpense.toLocaleString()}` : billsCount}
                </h4>
              </div>
              <div className="text-center border-l border-slate-200">
                <span className="text-[9px] font-extrabold uppercase text-slate-500 tracking-wider">
                  {type === 'monthly' ? 'Net Cashflow' : 'Average Sale'}
                </span>
                <h4 className={`text-lg font-black mt-0.5 font-mono ${netRevenue >= 0 ? 'text-emerald-700' : 'text-rose-650'}`}>
                  ₹{type === 'monthly' ? netRevenue.toLocaleString() : Math.round(salesTotal / (billsCount || 1))}
                </h4>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Collections Breakdown</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Cash Register</span>
                  <div className="font-extrabold mt-0.5 text-slate-800">₹{cashTotal.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">UPI/M-Wallet</span>
                  <div className="font-extrabold mt-0.5 text-[#ef4444]">₹{upiTotal.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                  <span className="text-[8px] font-bold text-slate-400 uppercase">Card Swipe</span>
                  <div className="font-extrabold mt-0.5 text-blue-700">₹{cardTotal.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">
                {type === 'daily' ? 'Orders Audit Trail' : 'Monthly Summary Data'}
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase">
                    <tr>
                      <th className="p-2.5">Bill ID</th>
                      <th className="p-2.5">Table</th>
                      <th className="p-2.5">Details</th>
                      <th className="p-2.5">Payment</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10px] text-slate-700">
                    {data.orders.map(order => (
                      <tr key={order.id}>
                        <td className="p-2.5 font-bold font-mono text-slate-900">{order.id}</td>
                        <td className="p-2.5 font-bold">{order.table.startsWith('T-') ? `Table ${order.table.replace('T-', '')}` : order.table.startsWith('O-') ? `Outside ${order.table.replace('O-', '')}` : order.table}</td>
                        <td className="p-2.5 font-medium leading-snug">
                          {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                        </td>
                        <td className="p-2.5 font-black uppercase text-slate-500 text-[8px]">{order.paymentMode}</td>
                        <td className="p-2.5 text-right font-black text-slate-900 font-mono">₹{order.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {type === 'monthly' && data.expenses && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Operating Expenses Ledger</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[9px] font-black text-slate-500 uppercase">
                      <tr>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Title</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[10px] text-slate-700">
                      {data.expenses.map(exp => (
                        <tr key={exp.id}>
                          <td className="p-2.5 font-bold font-mono">{exp.date}</td>
                          <td className="p-2.5 font-black text-slate-800">{exp.title}</td>
                          <td className="p-2.5 font-semibold text-slate-500">{exp.category}</td>
                          <td className="p-2.5 text-right font-black text-rose-600 font-mono">₹{exp.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-16 flex justify-between items-end border-t border-slate-200 font-bold">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 pb-1 mx-auto"></div>
                <div className="text-[8px] text-slate-400 uppercase tracking-widest mt-1.5">Prepared By Biller</div>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 pb-1 mx-auto"></div>
                <div className="text-[8px] text-slate-400 uppercase tracking-widest mt-1.5">Authorized Signature</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root {
            display: none !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-modal-portal {
            position: static !important;
            display: block !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-modal-portal > div {
            max-width: 100% !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-modal-portal .print\:hidden,
          .print-modal-portal h3,
          .print-modal-portal button,
          .print-modal-portal .sticky {
            display: none !important;
          }
          #receipt-content {
            display: block !important;
            width: 100% !important;
            padding: 15mm !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          #receipt-content > div {
            border: none !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

// --- Receipt Modal Component (POS Print Preview & WhatsApp Billing) ---
const ReceiptModal = ({ type, data, onClose }) => {
  const [selectedQuote, setSelectedQuote] = useState('');
  const [customerName, setCustomerName] = useState(data?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(data?.customerPhone || '');
  const [customerAddress, setCustomerAddress] = useState(data?.customerAddress || '');

  const BILL_QUOTES = [
    "Good food is the foundation of genuine happiness. Hope to serve you again soon!",
    "There is no sincerer love than the love of food. Can't wait to see you at our table again!",
    "People who love to eat are always the best people. Thank you for dining with us!",
    "Taste the love in every bite. We look forward to serving you again soon!",
    "Made with fresh ingredients and lots of love. Visit us again for another tasty adventure!"
  ];

  useEffect(() => {
    if (data?.id) {
      const randomIndex = Math.floor(Math.random() * BILL_QUOTES.length);
      setSelectedQuote(BILL_QUOTES[randomIndex]);
    }
  }, [data?.id]);

  useEffect(() => {
    const handlePrint = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handlePrint);
    return () => window.removeEventListener('keydown', handlePrint);
  }, [onClose]);

  if (!data) return null;

  const handleSendWhatsApp = () => {
    if (!customerPhone) {
      alert("Please enter a WhatsApp number!");
      return;
    }

    let formattedPhone = customerPhone.replace(/\D/g, '');
    if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    const padRight = (str, len) => {
      str = String(str);
      return str.length >= len ? str.substring(0, len) : str + ' '.repeat(len - str.length);
    };

    const padLeft = (str, len) => {
      str = String(str);
      return str.length >= len ? str.substring(0, len) : ' '.repeat(len - str.length) + str;
    };

    const dineInVal = data.table ? data.table.replace('T-', '').replace('O-', 'O') : '1';
    const billNoVal = data.id ? data.id.replace('#ORD-', '') : '';

    const metaLine1 = padRight(`Date: ${data.date || new Date().toLocaleDateString('en-IN')}`, 25) + padLeft(`Dine In: ${dineInVal}`, 15);
    const metaLine2 = padRight(`Cashier: biller`, 25) + padLeft(`Bill No: ${billNoVal}`, 15);

    const headerLine = "No. Item             Qty  Price   Amount";
    const formatItemLine = (idx, name, qty, price, amt) => {
      const noStr = padRight(`${idx + 1}.`, 4);
      const nameStr = padRight(name.substring(0, 16), 17);
      const qtyStr = padLeft(qty, 3) + ' ';
      const priceStr = padLeft(price.toFixed(2), 7);
      const amtStr = padLeft(amt.toFixed(2), 8);
      return `${noStr}${nameStr}${qtyStr}${priceStr}${amtStr}`;
    };

    const itemsText = data.items.map((item, idx) =>
      formatItemLine(idx, item.name, item.quantity, item.price, item.price * item.quantity)
    ).join('\n');

    const totalQtyVal = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const subTotalVal = data.total ? (data.total / 1.05) : 0;
    const gstVal = data.total ? (data.total - subTotalVal) : 0;

    const totalQtyStr = padRight(`Total Qty: ${totalQtyVal}`, 18);
    const subTotalStr = padLeft(`Sub Total: ${subTotalVal.toFixed(2)}`, 22);
    const summaryLine = `${totalQtyStr}${subTotalStr}`;

    const gstLabelStr = padRight("", 18);
    const gstStr = padLeft(`GST (5%): ${gstVal.toFixed(2)}`, 22);
    const gstLine = `${gstLabelStr}${gstStr}`;

    const textInvoice = `*URMI KITCHEN*
_Sikhrpur Junction, Mahnadi Vihar, Cuttack - 753003_
_Ph: 7847912995, 7020416443_

\`\`\`
Name: ${customerName || 'Guest'}
${customerAddress ? `Address: ${customerAddress.replace(/\n/g, ' ')}
` : ''}${metaLine1}
${metaLine2}
----------------------------------------
${headerLine}
${itemsText}
----------------------------------------
${summaryLine}
${gstLine}
----------------------------------------
\`\`\`
*GRAND TOTAL: ₹${data.total ? data.total.toFixed(2) : '0.00'}*
*----------------------------------------*
*!!! Thank You, Visit Again !!!*
_"${selectedQuote}"_
_Urmi Kitchen - Made with love ❤️_`;

    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(textInvoice)}`;
    window.open(waUrl, '_blank');
  };

  const displayLabel = data.table.startsWith('T-') 
    ? `Table ${data.table.replace('T-', '')}` 
    : data.table.startsWith('O-') 
      ? `Outside ${data.table.replace('O-', '')}` 
      : data.table;

  return (
    <div className="print-modal-portal fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none">
      <div className="bg-white w-full max-w-[370px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col border border-slate-100">
        
        <div className="p-4 bg-slate-950 text-white flex justify-between items-center sticky top-0 z-10 border-b border-slate-900 print:hidden font-sans">
          <h3 className="font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider">
            <Printer className="w-4.5 h-4.5 text-rose-400" />
            Print Preview: {type === 'kot' ? 'Kitchen Ticket' : 'Customer Bill'}
          </h3>
          <button onClick={onClose} className="hover:text-rose-450 transition-colors p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {type === 'bill' && (
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 print:hidden font-sans">
            <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-wider">Customer & WhatsApp Info</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bunty"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-semibold"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">WhatsApp No.</label>
                <input
                  type="text"
                  placeholder="10-digit number"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-350 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none font-bold"
                />
              </div>
            </div>
            <button
              onClick={handleSendWhatsApp}
              className="w-full bg-[#d92121] hover:bg-[#b91c1c] text-white py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer uppercase tracking-wider"
            >
              Send WhatsApp Invoice
            </button>
          </div>
        )}

        <div id="receipt-content" className="p-6 font-mono text-xs bg-white overflow-y-auto flex-1 text-black select-text">
          <div className="border-2 border-slate-900 p-4 border-dashed rounded-lg space-y-4 print:border-0 print:p-0">
            
            <div className="text-center border-b border-dashed border-slate-400 pb-3 print:border-black">
              <h2 className={`font-black uppercase tracking-widest mb-1 ${type === 'kot' ? 'text-lg border-b-2 border-black pb-1' : 'text-md'}`}>
                {type === 'kot' ? 'KITCHEN ORDER TICKET' : 'URMI KITCHEN'}
              </h2>
              {type === 'bill' && (
                <div className="text-[10px] text-slate-700 mt-1 space-y-0.5 leading-tight font-sans font-bold">
                  <div>Sikhrpur Junction, Mahnadi Vihar, Cuttack 753003</div>
                  <div className="font-extrabold text-black">Ph: 7847912995, 7020416443</div>
                </div>
              )}
            </div>

            {type === 'bill' && (
              <div className="border-b border-dashed border-slate-400 py-2 text-[10px] text-left font-sans print:border-black font-bold space-y-0.5">
                <div><span className="text-slate-600">Name:</span> {customerName || 'Guest'}</div>
                {customerPhone && (
                  <div><span className="text-slate-600">Mobile:</span> {customerPhone}</div>
                )}
              </div>
            )}

            <div className={`border-b border-dashed border-slate-400 py-2 print:border-black ${type === 'kot' ? 'text-xs font-bold space-y-1' : 'text-[10px] space-y-1'}`}>
              <div className="flex justify-between font-sans text-slate-700 font-bold">
                <span>
                  <span className="font-extrabold text-black">Date:</span> {data.date || new Date().toLocaleDateString('en-IN')} {data.time}
                </span>
                <span>
                  <span className="font-extrabold text-black">Table:</span> {displayLabel}
                </span>
              </div>
              {type === 'bill' && (
                <>
                  <div className="flex justify-between font-sans text-slate-700 font-bold">
                    <span>
                      <span className="font-extrabold text-black">Cashier:</span> biller
                    </span>
                    <span>
                      <span className="font-extrabold text-black">Bill No:</span> {data.id ? data.id.replace('#ORD-', '') : ''}
                    </span>
                  </div>
                  <div className="flex justify-between font-sans text-slate-700 font-bold">
                    <span>
                      <span className="font-extrabold text-black">Pay Mode:</span> {data.paymentMode || 'Cash'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="border-b border-dashed border-slate-400 py-2 print:border-black">
              <div className={`flex justify-between font-black mb-2 uppercase font-sans text-black ${type === 'kot' ? 'text-xs border-b border-black pb-1' : 'text-[10px]'}`}>
                <span className="w-8 text-left">No.</span>
                <span className="flex-1 text-left">Item Name</span>
                <span className="w-8 text-center">Qty</span>
                {type === 'bill' && (
                  <>
                    <span className="w-14 text-right">Price</span>
                    <span className="w-14 text-right">Amt</span>
                  </>
                )}
              </div>
              {data.items.map((item, idx) => (
                <div key={idx} className={`flex justify-between items-start mb-1 font-sans leading-tight ${type === 'kot' ? 'text-sm font-black border-b border-dashed border-slate-200 py-1' : 'text-[10px] font-bold'}`}>
                  <span className="w-8 text-left text-slate-600">{idx + 1}.</span>
                  <span className="flex-1 text-left pr-1 text-black font-bold">{item.name}</span>
                  <span className="w-8 text-center text-black font-black font-mono">{item.quantity}</span>
                  {type === 'bill' && (
                    <>
                      <span className="w-14 text-right text-slate-650 font-mono">{item.price.toFixed(2)}</span>
                      <span className="w-14 text-right font-bold text-black font-mono">{(item.price * item.quantity).toFixed(2)}</span>
                    </>
                  )}
                </div>
              ))}
            </div>

            {type === 'bill' && (
              <div className="border-b border-dashed border-slate-400 py-2 space-y-1.5 print:border-black font-sans text-[11px] font-bold">
                <div className="flex justify-between text-slate-700">
                  <span>Total Qty: {data.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  <span>Sub Total: ₹{(data.total / 1.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5%)</span>
                  <span>₹{(data.total - (data.total / 1.05)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-dashed border-slate-300 print:border-black text-black">
                  <span>GRAND TOTAL</span>
                  <span className="font-mono">₹{data.total ? data.total.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            )}

            <div className="text-center text-xs text-slate-600 mt-4">
              {type === 'kot' ? (
                <div className="font-black border-t border-dashed border-slate-400 pt-2 print:border-black text-black text-center tracking-widest uppercase">
                  ** KITCHEN COPY **
                </div>
              ) : (
                <div className="space-y-1.5 border-t border-dashed border-slate-400 pt-2 print:border-black font-bold">
                  <div className="font-black text-black uppercase tracking-wide text-[10px]">!!! Thank You, Visit Again !!!</div>
                  <div className="italic text-slate-700 font-sans px-2 mt-1.5 leading-relaxed text-[10px]">
                    "{selectedQuote}"
                  </div>
                  <div className="text-[9px] text-slate-500 mt-2">Urmi Kitchen - Made with love ❤️</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-3 sticky bottom-0 bg-white z-10 print:hidden font-sans">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #receipt-content,
          #receipt-content * {
            color: #000000 !important;
            font-weight: 800 !important;
          }
          #receipt-content .font-black,
          #receipt-content h2,
          #receipt-content .font-extrabold {
            font-weight: 900 !important;
          }
          #root {
            display: none !important;
          }
          html, body {
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-modal-portal {
            position: static !important;
            display: block !important;
            background: transparent !important;
            backdrop-filter: none !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print-modal-portal > div {
            max-width: 100% !important;
            max-height: none !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .print-modal-portal h3,
          .print-modal-portal button,
          .print-modal-portal .print\:hidden,
          .print-modal-portal .sticky {
            display: none !important;
          }
          #receipt-content {
            visibility: visible;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 6mm !important;
            background: white !important;
            color: black !important;
            box-sizing: border-box !important;
            overflow: visible !important;
          }
          #receipt-content > div {
            border: none !important;
            padding: 0 !important;
          }
          @page {
            size: auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

// --- Sidebar Component ---
const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'pos', icon: Store, label: 'POS Billing' },
    { id: 'kds', icon: ChefHat, label: 'KDS Kitchen' },
    { id: 'menu', icon: UtensilsCrossed, label: 'Menu Items' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'expenses', icon: IndianRupee, label: 'Expenses' },
    { id: 'staff', icon: Users, label: 'Staff Hub' }
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex w-24 bg-slate-950 h-screen flex-col items-center py-6 shadow-2xl z-20 sticky top-0 border-r border-slate-900 print:hidden shrink-0 select-none">
        <div className="mb-8 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 overflow-hidden border border-slate-800 bg-slate-900">
          <img src="/logo.png" alt="KNIFE Logo" className="w-full h-full object-cover" />
        </div>
        <nav className="flex flex-col gap-4 w-full px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group cursor-pointer ${activeTab === item.id
                ? 'bg-rose-650 text-white shadow-lg shadow-rose-600/30 translate-x-1 font-bold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
            >
              <item.icon className="w-6 h-6 mb-1 transition-transform group-hover:scale-110" />
              <span className="text-[10px] font-bold tracking-wide text-center leading-tight">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto mb-2 text-slate-650 text-[9px] text-center font-bold tracking-widest font-mono">v3.0.0</div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-950 border-t border-slate-900 flex items-center justify-around z-30 print:hidden select-none px-1 shadow-2xl">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-200 group cursor-pointer ${activeTab === item.id
              ? 'bg-rose-650 text-white shadow-md font-bold'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            <item.icon className="w-4.5 h-4.5 mb-0.5" />
            <span className="text-[8px] font-bold tracking-wide text-center leading-none scale-95">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </>
  );
};

// --- Main POS Workspace Component ---
function POSWorkspace({ restaurant, onExit, user }) {
  const getStorageKey = (key) => restaurant.id === 'urmi_kitchen' ? `urmikitchen_${key}` : `knife_pos_${restaurant.id}_${key}`;

  const [socket, setSocket] = useState(null);
  
  // Live Support Chat states
  const [showChat, setShowChat] = useState(false);
  const [isChatVerified, setIsChatVerified] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'support', message: "Hello! Welcome to Knife POS Support. Please enter your numerical Unique Support ID to connect to our support team.", timestamp: new Date().toISOString() }
  ]);
  const [inputId, setInputId] = useState('');
  const [inputMsg, setInputMsg] = useState('');

  const messagesEndRef = React.useRef(null);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  const [activeTab, setActiveTab] = useState('pos');
  const [selectedTable, setSelectedTable] = useState(null); // null means Table Map Grid, key (e.g. 'T-1') means Billing Panel!
  const [printState, setPrintState] = useState({ view: null, data: null });
  const [reportPrintState, setReportPrintState] = useState({ type: null, data: null });

  // Lifted Toolbar & Custom States
  const [moveKotActive, setMoveKotActive] = useState(false);
  const [moveSourceTable, setMoveSourceTable] = useState(null);
  const [activeModal, setActiveModal] = useState(null); 
  const [complaintForm, setComplaintForm] = useState({ subject: 'Billing Issue', description: '' });
  const [complaintSubmitStatus, setComplaintSubmitStatus] = useState(null);
  const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);
  
  const [isStoreClosed, setIsStoreClosed] = useState(() => {
    return localStorage.getItem(getStorageKey('isStoreClosed')) === 'true';
  });

  const [cashDrawer, setCashDrawer] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('cashDrawer'));
    return saved ? JSON.parse(saved) : { openingBalance: 2000, safeDrops: [] };
  });

  const [zomatoSwiggyStatus, setZomatoSwiggyStatus] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('zomatoSwiggy'));
    return saved ? JSON.parse(saved) : { zomato: true, swiggy: true };
  });

  // Persistent States
  const [menuItems, setMenuItems] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('menuItems'));
    return saved ? JSON.parse(saved) : INITIAL_MENU_ITEMS;
  });

  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('orders'));
    return saved ? JSON.parse(saved) : generateMockOrders();
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('expenses'));
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('staff'));
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('attendance'));
    return saved ? JSON.parse(saved) : {};
  });

  // Table map status maps (Petpooja Legend States: blank, running, printed, paid, running_kot)
  const [tableStates, setTableStates] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('tableStates'));
    // Pre-populate some tables to match the user's reference image
    if (saved) return JSON.parse(saved);
    
    // Default mock status match:
    // Table 1: Green (printed), Table 2: Yellow (running_kot), Table 3: Green (printed)
    return {
      'T-1': 'printed',
      'T-2': 'running_kot',
      'T-3': 'printed'
    };
  });

  const [tableElapsedTimes, setTableElapsedTimes] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('tableElapsedTimes'));
    if (saved) return JSON.parse(saved);
    
    const now = Date.now();
    return {
      'T-1': now - 36 * 60000,
      'T-2': now - 1 * 60000,
      'T-3': now - 77 * 60000
    };
  });

  // POS Carts for T-1 to T-20, O-1 to O-5, Takeaway, Delivery
  const [carts, setCarts] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('carts'));
    if (saved) return JSON.parse(saved);
    
    const initial = {};
    diningTablesList.forEach(t => initial[t] = []);
    outsideTablesList.forEach(o => initial[o] = []);
    initial['Takeaway'] = [];
    initial['Delivery'] = [];
    
    // Add mock items to T-1, T-2, T-3 to make the demo active immediately
    initial['T-1'] = [
      { id: 1, name: 'Tomato Soup', price: 120, quantity: 1, category: 'Soups', type: 'Veg' },
      { id: 181, name: 'Tandoori Roti', price: 23, quantity: 5, category: 'Breads / Roti', type: 'Veg' }
    ];
    initial['T-2'] = [
      { id: 201, name: 'Chicken Biryani', price: 335, quantity: 1, category: 'Rice & Biryani', type: 'Non-Veg' },
      { id: 6, name: 'Lemon Coriander Soup', price: 94, quantity: 1, category: 'Soups', type: 'Veg' }
    ];
    initial['T-3'] = [
      { id: 58, name: 'Chicken Biryani', price: 335, quantity: 1, category: 'Rice & Biryani', type: 'Non-Veg' },
      { id: 184, name: 'Butter Naan', price: 56, quantity: 2, category: 'Breads / Roti', type: 'Veg' }
    ];
    
    return initial;
  });

  const [sessionDetails, setSessionDetails] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('sessionDetails'));
    if (saved) return JSON.parse(saved);
 
    const initial = {};
    diningTablesList.forEach(t => initial[t] = { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' });
    outsideTablesList.forEach(o => initial[o] = { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' });
    initial['Takeaway'] = { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
    initial['Delivery'] = { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
    return initial;
  });

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintForm.description.trim()) {
      setComplaintSubmitStatus({ success: false, message: 'Please describe your complaint!' });
      return;
    }
    setIsSubmittingComplaint(true);
    setComplaintSubmitStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          subject: complaintForm.subject,
          description: complaintForm.description
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComplaintSubmitStatus({ success: true, message: 'Complaint submitted successfully! Admin will review it shortly.' });
        setComplaintForm({ subject: 'Billing Issue', description: '' });
      } else {
        setComplaintSubmitStatus({ success: false, message: data.message || 'Failed to submit complaint.' });
      }
    } catch (err) {
      console.error(err);
      setComplaintSubmitStatus({ success: false, message: 'Connection error. Please try again.' });
    } finally {
      setIsSubmittingComplaint(false);
    }
  };

  // Derived state for inactive items (Out of Stock status in backend menuItems)
  const inactiveItems = menuItems.filter(item => item.status === 'Out of Stock').map(item => item._id || item.id);

  // Sync effects for custom states
  useEffect(() => { localStorage.setItem(getStorageKey('isStoreClosed'), String(isStoreClosed)); }, [isStoreClosed, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('cashDrawer'), JSON.stringify(cashDrawer)); }, [cashDrawer, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('zomatoSwiggy'), JSON.stringify(zomatoSwiggyStatus)); }, [zomatoSwiggyStatus, getStorageKey]);

  // State sync effects
  useEffect(() => { localStorage.setItem(getStorageKey('menuItems'), JSON.stringify(menuItems)); }, [menuItems, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('orders'), JSON.stringify(orders)); }, [orders, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('expenses'), JSON.stringify(expenses)); }, [expenses, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('staff'), JSON.stringify(staff)); }, [staff, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('attendance'), JSON.stringify(attendance)); }, [attendance, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('tableStates'), JSON.stringify(tableStates)); }, [tableStates, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('tableElapsedTimes'), JSON.stringify(tableElapsedTimes)); }, [tableElapsedTimes, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('carts'), JSON.stringify(carts)); }, [carts, getStorageKey]);
  useEffect(() => { localStorage.setItem(getStorageKey('sessionDetails'), JSON.stringify(sessionDetails)); }, [sessionDetails, getStorageKey]);

  // Setup Socket.io and load initial database data
  useEffect(() => {
    // 1. Establish Socket connection
    const s = io(API_BASE);
    setSocket(s);
    
    // Join room for this restaurant
    s.emit('join_restaurant', restaurant.id);
    
    // Listen for new orders
    s.on('order_created', (newOrder) => {
      setOrders(prev => {
        // Prevent duplicate orders
        if (prev.some(o => o.id === newOrder.id || o._id === newOrder._id)) return prev;
        return [newOrder, ...prev];
      });
    });

    // Listen for order status updates
    s.on('order_updated', (updatedOrder) => {
      setOrders(prev => prev.map(o => (o.id === updatedOrder.id || o._id === updatedOrder._id) ? updatedOrder : o));
    });

    // 2. Fetch Data from Backend API
    const loadData = async () => {
      try {
        // Load Menu Items
        const menuRes = await fetch(`${API_BASE}/api/menu/${restaurant.id}`);
        if (menuRes.ok) {
          const fetchedMenu = await menuRes.json();
          if (fetchedMenu.length === 0) {
            // Seeding backend with initial menu items
            console.log("Menu is empty on backend. Batch seeding menu items...");
            const seedRes = await fetch(`${API_BASE}/api/menu/batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ restaurantId: restaurant.id, items: INITIAL_MENU_ITEMS })
            });
            if (seedRes.ok) {
              const seededMenu = await seedRes.json();
              setMenuItems(seededMenu);
            }
          } else {
            setMenuItems(fetchedMenu);
          }
        }

        // Load Orders
        const ordersRes = await fetch(`${API_BASE}/api/orders/${restaurant.id}`);
        if (ordersRes.ok) {
          const fetchedOrders = await ordersRes.json();
          if (fetchedOrders.length > 0) {
            setOrders(fetchedOrders);
          }
        }

        // Load Expenses
        const expensesRes = await fetch(`${API_BASE}/api/expenses/${restaurant.id}`);
        if (expensesRes.ok) {
          const fetchedExpenses = await expensesRes.json();
          setExpenses(fetchedExpenses);
        }

        // Load Staff
        const staffRes = await fetch(`${API_BASE}/api/staff/${restaurant.id}`);
        if (staffRes.ok) {
          const fetchedStaff = await staffRes.json();
          setStaff(fetchedStaff);
        }
      } catch (err) {
        console.error("Error loading data from backend API:", err);
      }
    };

    loadData();

    // Cleanup socket on unmount
    return () => {
      s.disconnect();
    };
  }, [restaurant.id]);

  // Chat Socket listener for verified restaurant support
  useEffect(() => {
    if (socket && isChatVerified) {
      const handleNewSupportMessage = (msg) => {
        setChatMessages(prev => {
          if (prev.some(m => m._id === msg._id || (m.timestamp === msg.createdAt && m.message === msg.message))) return prev;
          return [...prev, { ...msg, timestamp: msg.createdAt }];
        });
      };
      
      socket.on('new_support_message', handleNewSupportMessage);
      
      return () => {
        socket.off('new_support_message', handleNewSupportMessage);
      };
    }
  }, [socket, isChatVerified]);

  const handleVerifyChat = async (e) => {
    e.preventDefault();
    if (!inputId.trim()) return;
    
    const submittedId = inputId.trim();
    const currentUniqueId = String(restaurant.uniqueId || '');
    
    // Add user message to state
    const userMsg = { sender: 'restaurant', message: inputId.trim(), timestamp: new Date().toISOString() };
    setChatMessages(prev => [...prev, userMsg]);
    
    if (submittedId === currentUniqueId) {
      const successMsg = { sender: 'support', message: "Support ID Verified! Connecting you to Knife POS Support...", timestamp: new Date().toISOString() };
      setChatMessages(prev => [...prev, successMsg]);
      setIsChatVerified(true);
      
      // Emit socket join support
      if (socket) {
        socket.emit('join_support', restaurant.id);
      }
      
      // Fetch chat history
      try {
        const res = await fetch(`${API_BASE}/api/chat/${restaurant.id}`);
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setChatMessages(prev => [
              ...prev,
              ...history.map(m => ({ ...m, timestamp: m.createdAt }))
            ]);
          }
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    } else {
      const failMsg = { sender: 'support', message: "Invalid Support ID. Please check your numerical Unique ID and try again.", timestamp: new Date().toISOString() };
      setChatMessages(prev => [...prev, failMsg]);
    }
    setInputId('');
  };

  const handleSendSupportMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    
    if (socket) {
      socket.emit('send_support_message', {
        restaurantId: restaurant.id,
        message: inputMsg.trim()
      });
      
      // Optimistically add message
      const optimisticMsg = {
        _id: 'opt_' + Date.now(),
        restaurantId: restaurant.id,
        sender: 'restaurant',
        message: inputMsg.trim(),
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, optimisticMsg]);
      
      setInputMsg('');
    }
  };

  const updateSessionDetail = (field, value) => {
    setSessionDetails(prev => ({
      ...prev,
      [selectedTable]: {
        ...prev[selectedTable],
        [field]: value
      }
    }));
  };

  const addToCart = (item) => {
    setCarts(prev => {
      const prevCart = prev[selectedTable] || [];
      const existing = prevCart.find(i => i.id === item.id);
      let newCart;
      if (existing) {
        newCart = prevCart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        newCart = [...prevCart, { ...item, quantity: 1 }];
      }
      return { ...prev, [selectedTable]: newCart };
    });

    // Mark table as running (blue) if it was blank
    setTableStates(prev => ({
      ...prev,
      [selectedTable]: prev[selectedTable] === 'blank' || !prev[selectedTable] ? 'running' : prev[selectedTable]
    }));
  };

  const updateQuantity = (itemId, change) => {
    setCarts(prev => {
      const prevCart = prev[selectedTable] || [];
      const newCart = prevCart.map(item => {
        if (item.id === itemId) {
          return { ...item, quantity: Math.max(0, item.quantity + change) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return { ...prev, [selectedTable]: newCart };
    });
  };

  const removeFromCart = (itemId) => {
    setCarts(prev => {
      const prevCart = prev[selectedTable] || [];
      const newCart = prevCart.filter(item => item.id !== itemId);
      return { ...prev, [selectedTable]: newCart };
    });
  };

  // Place order/KOT logic (sets status to running_kot - yellow)
  const placeOrder = () => {
    const activeCart = carts[selectedTable] || [];
    if (activeCart.length === 0) return;

    const details = sessionDetails[selectedTable] || { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
    const total = activeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;

    const newOrder = {
      id: `#ORD-${String(orders.length + 1).padStart(3, '0')}`,
      table: selectedTable,
      customerName: details.customerName || 'Guest',
      customerPhone: details.customerPhone || '',
      customerAddress: details.customerAddress || '',
      paymentMode: details.paymentMode || 'Cash',
      orderType: selectedTable.startsWith('T-') || selectedTable.startsWith('O-') ? 'Dine In' : selectedTable,
      items: activeCart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, category: i.category, type: i.type || 'Veg' })),
      status: 'Pending',
      total: Math.round(total),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-IN'),
      isodate: new Date().toISOString().split('T')[0]
    };

    setOrders(prev => [...prev, newOrder]);

    // Send order to backend
    fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newOrder,
        restaurantId: restaurant.id
      })
    })
    .then(async res => {
      if (res.ok) {
        const savedOrder = await res.json();
        // Update state with server version to get database _id
        setOrders(prev => prev.map(o => o.id === newOrder.id ? savedOrder : o));
      }
    })
    .catch(err => console.error("Error saving order to backend:", err));

    // Operational update:
    // Update table state to running_kot (yellow) and record elapsed timestamp!
    if (selectedTable !== 'Takeaway' && selectedTable !== 'Delivery') {
      setTableStates(prev => ({ ...prev, [selectedTable]: 'running_kot' }));
      setTableElapsedTimes(prev => ({ ...prev, [selectedTable]: Date.now() }));
    } else {
      // Clear cart immediately for takeaway/delivery since they don't occupy a table grid
      setCarts(prev => ({ ...prev, [selectedTable]: [] }));
      setSessionDetails(prev => ({
        ...prev,
        [selectedTable]: { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' }
      }));
    }

    setPrintState({ view: 'kot', data: newOrder });
    setSelectedTable(null); // return to main Floor Map!
  };

  // Settle bill payment (finalizes transaction, clears table cart, sets state to vacant)
  const settleBillPayment = (tableKey) => {
    const activeCart = carts[tableKey] || [];
    if (activeCart.length === 0) {
      alert("No active items on this table!");
      return;
    }

    const details = sessionDetails[tableKey] || { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
    const total = activeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;

    // Settle order
    const settledOrder = {
      id: `#ORD-SET-${Date.now().toString().slice(-4)}`,
      table: tableKey,
      customerName: details.customerName || 'Guest',
      customerPhone: details.customerPhone || '',
      customerAddress: details.customerAddress || '',
      paymentMode: details.paymentMode || 'Cash',
      orderType: 'Dine In',
      items: activeCart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price, category: i.category, type: i.type || 'Veg' })),
      status: 'Ready',
      total: Math.round(total),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-IN'),
      isodate: new Date().toISOString().split('T')[0]
    };

    setOrders(prev => [...prev, settledOrder]);

    // Send settled order to backend
    fetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...settledOrder,
        restaurantId: restaurant.id
      })
    })
    .then(async res => {
      if (res.ok) {
        const savedOrder = await res.json();
        setOrders(prev => prev.map(o => o.id === settledOrder.id ? savedOrder : o));
      }
    })
    .catch(err => console.error("Error saving settled order to backend:", err));

    // Clear Table States
    setCarts(prev => ({ ...prev, [tableKey]: [] }));
    setSessionDetails(prev => ({
      ...prev,
      [tableKey]: { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' }
    }));
    setTableStates(prev => ({ ...prev, [tableKey]: 'blank' }));
    setTableElapsedTimes(prev => {
      const copy = { ...prev };
      delete copy[tableKey];
      return copy;
    });

    alert(`Table ${tableKey.replace('T-', '').replace('O-', 'O')} has been settled successfully!`);
    setPrintState({ view: null, data: null });
  };

  // Print Bill Click (POS billing panel button)
  const handlePrintBillTrigger = () => {
    const activeCart = carts[selectedTable] || [];
    if (activeCart.length === 0) return;

    const details = sessionDetails[selectedTable] || { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
    const total = activeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;

    const billData = {
      id: `#BILL-${Date.now().toString().slice(-4)}`,
      table: selectedTable,
      customerName: details.customerName || 'Guest',
      customerPhone: details.customerPhone || '',
      customerAddress: details.customerAddress || '',
      paymentMode: details.paymentMode || 'Cash',
      items: activeCart,
      total: Math.round(total),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('en-IN')
    };

    // Update table state to printed (green)
    if (selectedTable !== 'Takeaway' && selectedTable !== 'Delivery') {
      setTableStates(prev => ({ ...prev, [selectedTable]: 'printed' }));
    }

    setPrintState({ view: 'bill', data: billData });
    setSelectedTable(null); // return to Floor Map!
  };

  const markOrderReady = async (orderId) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => (o.id === orderId || o._id === orderId) ? { ...o, status: 'Ready' } : o));

    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ready' })
      });
      if (!res.ok) {
        throw new Error("Failed to update order status on server");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to sync order status to server!");
    }
  };

  const addMenuItem = async (item) => {
    // Optimistic UI update
    setMenuItems(prev => [...prev, item]);

    try {
      const res = await fetch(`${API_BASE}/api/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          restaurantId: restaurant.id
        })
      });
      if (res.ok) {
        const savedItem = await res.json();
        setMenuItems(prev => prev.map(m => m.name === item.name ? savedItem : m));
      } else {
        throw new Error("Failed to save menu item on backend");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save menu item to database!");
    }
  };

  const toggleItemStatus = async (item) => {
    const isCurrentlyInactive = item.status === 'Out of Stock';
    const nextStatus = isCurrentlyInactive ? 'In Stock' : 'Out of Stock';

    // Optimistic UI update
    setMenuItems(prev => prev.map(m => (m._id === item._id || m.id === item.id) ? { ...m, status: nextStatus } : m));

    try {
      const targetId = item._id || item.id;
      const res = await fetch(`${API_BASE}/api/menu/item/${targetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        throw new Error("Failed to update status on server");
      }
    } catch (err) {
      console.error(err);
      // Revert status
      setMenuItems(prev => prev.map(m => (m._id === item._id || m.id === item.id) ? { ...m, status: item.status } : m));
      alert("Failed to update item availability on server.");
    }
  };

  const addExpense = async (newExp) => {
    // Optimistic UI update
    setExpenses(prev => [...prev, newExp]);

    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExp,
          restaurantId: restaurant.id
        })
      });
      if (res.ok) {
        const savedExpense = await res.json();
        setExpenses(prev => prev.map(e => e.id === newExp.id ? savedExpense : e));
      } else {
        throw new Error("Server error saving expense");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save expense to database!");
    }
  };

  const deleteExpense = async (expId) => {
    // Optimistic UI update
    setExpenses(prev => prev.filter(e => e.id !== expId && e._id !== expId));

    try {
      const res = await fetch(`${API_BASE}/api/expenses/${expId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error("Failed to delete expense from server");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete expense from database!");
    }
  };

  const addStaff = async (newStaff) => {
    // Optimistic UI update
    setStaff(prev => [...prev, newStaff]);

    try {
      const res = await fetch(`${API_BASE}/api/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStaff,
          restaurantId: restaurant.id
        })
      });
      if (res.ok) {
        const savedStaff = await res.json();
        setStaff(prev => prev.map(s => s.id === newStaff.id ? savedStaff : s));
      } else {
        throw new Error("Server error saving staff");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save staff member to database!");
    }
  };

  const removeStaff = async (staffId) => {
    // Optimistic UI update
    setStaff(prev => prev.filter(s => s.id !== staffId && s._id !== staffId));

    try {
      const res = await fetch(`${API_BASE}/api/staff/${staffId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error("Failed to delete staff member from server");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete staff member from database!");
    }
  };

  const updateStaff = async (staffId, updatedData) => {
    setStaff(prev => prev.map(s => (s.id === staffId || s._id === staffId) ? { ...s, ...updatedData } : s));
    try {
      const res = await fetch(`${API_BASE}/api/staff/${staffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const saved = await res.json();
        setStaff(prev => prev.map(s => (s.id === staffId || s._id === staffId) ? saved : s));
      } else {
        throw new Error("Failed to update staff member on server");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update staff member in database!");
    }
  };

  const saveAttendance = (staffId, dateKey, status) => {
    setAttendance(prev => ({
      ...prev,
      [staffId]: {
        ...(prev[staffId] || {}),
        [dateKey]: status
      }
    }));
  };

  // Table map grid callbacks
  const handleTableSelection = (tableKey) => {
    if (moveKotActive) {
      const status = tableStates[tableKey] || 'blank';
      if (!moveSourceTable) {
        if (status === 'blank') {
          alert("Selected table is vacant. Please click an active table (Blue, Green, Yellow, etc.) to move items FROM.");
          return;
        }
        setMoveSourceTable(tableKey);
      } else {
        if (tableKey === moveSourceTable) {
          setMoveSourceTable(null);
          return;
        }
        if (status !== 'blank') {
          alert("Target table must be vacant (Dotted Gray) to receive the moved items.");
          return;
        }

        const sourceCart = carts[moveSourceTable] || [];
        const sourceState = tableStates[moveSourceTable] || 'blank';
        const sourceTime = tableElapsedTimes[moveSourceTable];
        const sourceDetails = sessionDetails[moveSourceTable] || { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };

        setCarts(prev => ({
          ...prev,
          [tableKey]: sourceCart,
          [moveSourceTable]: []
        }));

        setTableStates(prev => ({
          ...prev,
          [tableKey]: sourceState,
          [moveSourceTable]: 'blank'
        }));

        setTableElapsedTimes(prev => ({
          ...prev,
          [tableKey]: sourceTime,
          [moveSourceTable]: null
        }));

        setSessionDetails(prev => ({
          ...prev,
          [tableKey]: sourceDetails,
          [moveSourceTable]: { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' }
        }));

        const srcName = moveSourceTable.replace('T-', 'Table ').replace('O-', 'Outside ');
        const tgtName = tableKey.replace('T-', 'Table ').replace('O-', 'Outside ');
        alert(`Successfully transferred all items and KOT from ${srcName} to ${tgtName}!`);

        setMoveSourceTable(null);
        setMoveKotActive(false);
      }
    } else {
      setSelectedTable(tableKey);
    }
  };

  const handleTableQuickAction = (type, tableKey) => {
    if (type === 'print') {
      const activeCart = carts[tableKey] || [];
      if (activeCart.length === 0) return;
      const details = sessionDetails[tableKey] || { customerName: '', customerPhone: '', customerAddress: '', paymentMode: 'Cash' };
      const total = activeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.05;

      const billData = {
        id: `#BILL-${Date.now().toString().slice(-4)}`,
        table: tableKey,
        customerName: details.customerName || 'Guest',
        customerPhone: details.customerPhone || '',
        customerAddress: details.customerAddress || '',
        paymentMode: details.paymentMode || 'Cash',
        items: activeCart,
        total: Math.round(total),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('en-IN')
      };

      setTableStates(prev => ({ ...prev, [tableKey]: 'printed' }));
      setPrintState({ view: 'bill', data: billData });
    } else if (type === 'view') {
      setSelectedTable(tableKey);
    }
  };

  const handleLegendToolbarAction = (type) => {
    if (type === 'Delivery') {
      setSelectedTable('Delivery');
    } else if (type === 'Pick Up') {
      setSelectedTable('Takeaway');
    } else if (type === 'add_table') {
      alert("Custom Table addition dialog triggered!");
    } else if (type === 'refresh') {
      alert("Refreshed Floor Status Map!");
    }
  };

  // Search input callbacks from Top Brand header toolbar
  const handleSearchTrigger = (searchType, searchVal) => {
    if (!searchVal) return;
    if (searchType === 'bill') {
      // Find matching order in database
      const found = orders.find(o => o.id.includes(searchVal));
      if (found) {
        setPrintState({ view: 'bill', data: found });
      } else {
        alert(`Bill No "${searchVal}" not found in system database!`);
      }
    } else if (searchType === 'kot') {
      const found = orders.find(o => o.id.includes(searchVal));
      if (found) {
        setPrintState({ view: 'kot', data: found });
      } else {
        alert(`KOT Ticket No "${searchVal}" not found!`);
      }
    }
  };

  return (
    <div className="pos-workspace-root flex w-full h-screen bg-[#f1f5f9] font-sans text-slate-900 overflow-hidden selection:bg-rose-100 selection:text-rose-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="pos-workspace-main flex-1 h-full overflow-hidden relative flex flex-col">
        {/* Authentic top gray strip and white toolbar bar */}
        <TopBrandBar 
          activeTab={activeTab}
          onNewOrderClick={() => {
            const vacant = diningTablesList.find(t => (carts[t] || []).length === 0) || 'T-1';
            setSelectedTable(vacant);
          }}
          onSearchClick={handleSearchTrigger}
          onToolbarClick={(modalType) => setActiveModal(modalType)}
          isStoreClosed={isStoreClosed}
          zomatoSwiggyStatus={zomatoSwiggyStatus}
          restaurant={restaurant}
          onExit={onExit}
        />
        
        <div className="pos-workspace-content flex-1 overflow-hidden relative">
          {activeTab === 'pos' && (
            selectedTable === null ? (
              <TableViewScreen 
                carts={carts}
                tableStates={tableStates}
                tableElapsedTimes={tableElapsedTimes}
                onTableSelect={handleTableSelection}
                onActionClick={handleTableQuickAction}
                onQuickAction={(type) => {
                  if (type === 'cancel_move') {
                    setMoveSourceTable(null);
                    setMoveKotActive(false);
                  } else {
                    handleLegendToolbarAction(type);
                  }
                }}
                moveKotActive={moveKotActive}
                setMoveKotActive={setMoveKotActive}
                moveSourceTable={moveSourceTable}
              />
            ) : (
              <POSScreen
                menuItems={menuItems}
                carts={carts}
                currentSession={selectedTable}
                sessionDetails={sessionDetails}
                updateSessionDetail={updateSessionDetail}
                addToCart={addToCart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                placeOrder={placeOrder}
                onBackToTables={() => setSelectedTable(null)}
                onPrintBillClick={handlePrintBillTrigger}
                inactiveItems={inactiveItems}
              />
            )
          )}
          {activeTab === 'kds' && (
            <KDS_Screen orders={orders} markOrderReady={markOrderReady} />
          )}
          {activeTab === 'menu' && (
            <MenuManager menuItems={menuItems} addMenuItem={addMenuItem} />
          )}
          {activeTab === 'reports' && (
            <ReportsScreen 
              orders={orders} 
              expenses={expenses} 
              onPrintReport={(type, reportData) => setReportPrintState({ type, data: reportData })} 
            />
          )}
          {activeTab === 'expenses' && (
            <ExpensesScreen 
              expenses={expenses} 
              orders={orders} 
              addExpense={addExpense} 
              deleteExpense={deleteExpense} 
            />
          )}
          {activeTab === 'staff' && (
            <StaffScreen 
              staff={staff} 
              addStaff={addStaff} 
              removeStaff={removeStaff} 
              updateStaff={updateStaff}
              attendance={attendance} 
              saveAttendance={saveAttendance}
              addExpense={addExpense}
              getStorageKey={getStorageKey}
            />
          )}

          {/* Print Modal Portal */}
          {printState.view && createPortal(
            <ReceiptModal
              type={printState.view}
              data={printState.data}
              onClose={() => {
                // Settle paid tables once printed receipt is closed
                if (printState.view === 'bill' && printState.data?.table) {
                  settleBillPayment(printState.data.table);
                } else {
                  setPrintState({ view: null, data: null });
                }
              }}
            />,
            document.body
          )}

          {/* Reports Modal Portal */}
          {reportPrintState.type && createPortal(
            <ReportPrintModal
              type={reportPrintState.type}
              data={reportPrintState.data}
              onClose={() => setReportPrintState({ type: null, data: null })}
            />,
            document.body
          )}

          {/* Lifted Settings & Drawer Modals Portals */}
          {activeModal === 'item_on_off' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ToggleLeft className="w-5 h-5 text-rose-500" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">Item Availability Selector (On/Off)</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Total Items: {menuItems.length}</span>
                  <span>Out of Stock: {inactiveItems.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
                  {menuItems.map(item => {
                    const isInactive = inactiveItems.includes(item.id);
                    return (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-0.5 rounded border border-slate-100 bg-white">
                            {item.type === 'Veg' ? <VegBadge /> : <NonVegBadge />}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-805">{item.name}</h4>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category} • ₹{item.price}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleItemStatus(item)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            isInactive 
                              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          {isInactive ? 'Out Of Stock' : 'Active'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {activeModal === 'store_settings' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">KNIFE POS - Store Settings</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-black text-slate-800 text-sm">Store Operating Status</h4>
                      <p className="text-[10px] text-slate-450 font-bold">Close store to pause all active operations</p>
                    </div>
                    <button
                      onClick={() => setIsStoreClosed(!isStoreClosed)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        isStoreClosed 
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25' 
                          : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      }`}
                    >
                      {isStoreClosed ? 'Closed' : 'Open'}
                    </button>
                  </div>
                  <div className="space-y-1.5 text-xs font-bold text-slate-600">
                    <div>Store Name: <span className="text-slate-900 font-extrabold font-sans">{restaurant.name.toUpperCase()}</span></div>
                    <div className="flex items-center gap-1.5">
                      <span>Unique Restaurant ID:</span>
                      <span className="text-rose-600 font-mono font-bold select-all bg-rose-50 px-1.5 py-0.5 rounded">{restaurant.id}</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(restaurant.id);
                          alert('Unique Restaurant ID copied to clipboard!');
                        }}
                        className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded ml-1 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                    <div>Tax System: <span className="text-slate-900 font-mono">GST ({restaurant.taxRate || 5}.00% Combined)</span></div>
                    <div>Terminal Type: <span className="text-slate-900 font-sans">Master Billing Terminal</span></div>
                    <div className="pt-2 text-[10px] text-slate-400 leading-normal font-medium">
                      Ensure to share your Unique Restaurant ID with Knife POS Live Support when requesting call callbacks.
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Done
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {activeModal === 'cash_drawer' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-sky-450" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">KNIFE POS - Cash Drawer Ledger</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  {(() => {
                    const todayISO = new Date().toISOString().split('T')[0];
                    const todayCashSales = orders
                      .filter(o => o.isodate === todayISO && o.paymentMode === 'Cash')
                      .reduce((sum, o) => sum + o.total, 0);

                    const todayCashExpenses = expenses
                      .filter(e => e.date === todayISO && (!e.notes || !e.notes.toLowerCase().includes('upi') && !e.notes.toLowerCase().includes('card')))
                      .reduce((sum, e) => sum + e.amount, 0);

                    const totalSafeDrops = cashDrawer.safeDrops.reduce((sum, d) => sum + d.amount, 0);
                    const currentCash = cashDrawer.openingBalance + todayCashSales - todayCashExpenses + totalSafeDrops;

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Opening Cash</span>
                            <span className="text-xl font-black text-slate-800 font-mono">₹{cashDrawer.openingBalance.toLocaleString()}</span>
                          </div>
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Cash Sales (Today)</span>
                            <span className="text-xl font-black text-emerald-805 font-mono">₹{todayCashSales.toLocaleString()}</span>
                          </div>
                          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Cash Payouts (Today)</span>
                            <span className="text-xl font-black text-rose-800 font-mono">₹{todayCashExpenses.toLocaleString()}</span>
                          </div>
                          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider">Safe Drops / Cash In</span>
                            <span className="text-xl font-black text-sky-800 font-mono">₹{totalSafeDrops.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-950 flex justify-between items-center shadow-md">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Cash in Drawer</div>
                            <div className="text-2xl font-black font-mono text-emerald-400">₹{currentCash.toLocaleString()}.00</div>
                          </div>
                          <button
                            onClick={() => {
                              const amountStr = prompt("Enter Safe Drop / Cash Drop amount (Enter negative values for drop, positive to add float):");
                              if (amountStr === null || isNaN(Number(amountStr)) || Number(amountStr) === 0) return;
                              const amt = Number(amountStr);
                              const note = prompt("Enter adjustment notes:", amt < 0 ? "Safe Drop to Safe Box" : "Additional Cash float");
                              
                              setCashDrawer(prev => {
                                const drops = [...prev.safeDrops, { amount: amt, time: new Date().toLocaleTimeString(), date: todayISO, notes: note || "" }];
                                return { ...prev, safeDrops: drops };
                              });
                            }}
                            className="bg-emerald-600 hover:bg-emerald-705 text-white font-extrabold px-3 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Adjust Float
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Close Drawer
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {activeModal === 'orders_list' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-slate-200 overflow-hidden flex flex-col h-[600px] animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-emerald-500" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">KNIFE POS - Order Ledger</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-550">
                  <span>Total Transactions: {orders.length}</span>
                  <span>Completed Today: {orders.filter(o => o.isodate === new Date().toISOString().split('T')[0]).length}</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3">ID / Date</th>
                        <th className="p-3">Source / Table</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3 text-right">Total Amount</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <div className="text-slate-900 font-extrabold">{o.id}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{o.date} • {o.time}</div>
                          </td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{o.orderType}</span>
                            <span className="ml-2 font-mono font-bold">{o.table}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              o.paymentMode === 'UPI' ? 'bg-indigo-50 text-indigo-750' :
                              o.paymentMode === 'Card' ? 'bg-amber-50 text-amber-705' : 'bg-emerald-50 text-emerald-700'
                            }`}>{o.paymentMode}</span>
                          </td>
                          <td className="p-3 text-right font-black font-mono text-slate-900 text-sm">₹{o.total.toLocaleString()}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setPrintState({ view: 'bill', data: { ...o, items: o.items || [] } });
                                setActiveModal(null);
                              }}
                              className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider cursor-pointer"
                            >
                              Re-print Bill
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {activeModal === 'alerts_list' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">KNIFE POS - Notifications</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-805 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  {(() => {
                    const alertsList = [];

                    if (inactiveItems.length > 0) {
                      alertsList.push({
                        type: 'warning',
                        message: `${inactiveItems.length} menu items are currently toggled OUT OF STOCK.`
                      });
                    }

                    if (isStoreClosed) {
                      alertsList.push({
                        type: 'danger',
                        message: `The billing terminal is currently set to CLOSED (Offline mode).`
                      });
                    }

                    if (cashDrawer.safeDrops.length > 0) {
                      alertsList.push({
                        type: 'info',
                        message: `${cashDrawer.safeDrops.length} adjustments/drops have been logged in the Cash Drawer today.`
                      });
                    }

                    const now = Date.now();
                    Object.keys(tableElapsedTimes).forEach(table => {
                      const start = tableElapsedTimes[table];
                      if (start && (now - start) > 40 * 60000) {
                        const min = Math.floor((now - start) / 60000);
                        const name = table.replace('T-', 'Table ').replace('O-', 'Outside ');
                        alertsList.push({
                          type: 'warning',
                          message: `${name} has been running for over ${min} minutes!`
                        });
                      }
                    });

                    if (alertsList.length === 0) {
                      return (
                        <div className="text-center py-6 text-slate-400 font-bold text-xs uppercase tracking-wider">
                          ✅ No active system warnings
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {alertsList.map((a, i) => (
                          <div 
                            key={i} 
                            className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-bold ${
                              a.type === 'danger' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                              a.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                              'bg-sky-50 border-sky-100 text-sky-700'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{a.message}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {activeModal === 'zomato_settings' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-red-500" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">KNIFE POS - Integrations Portal</h3>
                  </div>
                  <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-[11px] text-slate-400 leading-normal font-bold">Manage integration switch status for online food delivery partners:</p>
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Zomato integration</h4>
                      <p className="text-[9px] text-slate-400">Receive Zomato online orders automatically</p>
                    </div>
                    <button
                      onClick={() => setZomatoSwiggyStatus(prev => ({ ...prev, zomato: !prev.zomato }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        zomatoSwiggyStatus.zomato 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {zomatoSwiggyStatus.zomato ? 'Online' : 'Offline'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-1">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Swiggy integration</h4>
                      <p className="text-[9px] text-slate-400">Receive Swiggy online orders automatically</p>
                    </div>
                    <button
                      onClick={() => setZomatoSwiggyStatus(prev => ({ ...prev, swiggy: !prev.swiggy }))}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        zomatoSwiggyStatus.swiggy 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      {zomatoSwiggyStatus.swiggy ? 'Online' : 'Offline'}
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button onClick={() => setActiveModal(null)} className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
                    Done
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

          {activeModal === 'complaints_modal' && createPortal(
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h3 className="font-extrabold uppercase tracking-wide text-sm">File a Support Complaint</h3>
                  </div>
                  <button onClick={() => { setActiveModal(null); setComplaintSubmitStatus(null); }} className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4 text-left">
                  {complaintSubmitStatus && (
                    <div className={`p-4.5 rounded-xl border text-xs font-bold ${
                      complaintSubmitStatus.success ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                    }`}>
                      {complaintSubmitStatus.message}
                    </div>
                  )}

                  <form onSubmit={handleSubmitComplaint} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Restaurant Details</label>
                      <input 
                        type="text" 
                        disabled 
                        value={`${restaurant.name} (${restaurant.id})`}
                        className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 text-xs font-semibold outline-none cursor-not-allowed" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Subject / Category *</label>
                      <select 
                        value={complaintForm.subject}
                        onChange={e => setComplaintForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-rose-500 transition-all outline-none"
                      >
                        <option value="Billing Issue">Billing & Invoicing Issue</option>
                        <option value="KDS Broadcast">Kitchen Display System Lag</option>
                        <option value="Database Sync">Database & Local Caching Sync</option>
                        <option value="Hardware Print">Receipt Printing Issue</option>
                        <option value="Other">Other Operational Complaint</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Description *</label>
                      <textarea 
                        rows="4"
                        required
                        placeholder="Please describe your complaint in detail..."
                        value={complaintForm.description}
                        onChange={e => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-rose-500 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => { setActiveModal(null); setComplaintSubmitStatus(null); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-5 py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmittingComplaint}
                        className="bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-6 py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                      >
                        {isSubmittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Floating Live Chat Bubble */}
        <div className="fixed bottom-6 right-6 z-50 select-none print:hidden">
          {/* Chat Bubble Toggle Button */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 text-white rounded-full p-4.5 shadow-xl border border-rose-550/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center relative group"
            title="Knife POS Live Support"
          >
            <Headphones className="w-6 h-6 animate-pulse" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>
          </button>

          {/* Chat Panel */}
          {showChat && (
            <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[480px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-left font-sans text-slate-100 animate-in fade-in slide-in-from-bottom-5 duration-300">
              {/* Header */}
              <div className="p-4 bg-slate-955 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500 relative">
                    <Headphones className="w-4.5 h-4.5" />
                                        <h3 className="font-extrabold text-xs uppercase tracking-wide">Knife POS Support</h3>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Online • Support Team</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
 
              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-955/40 select-text">
                {chatMessages.map((msg, index) => {
                  const isUser = msg.sender === 'restaurant';
                  const isRobert = msg.sender === 'robert' || msg.sender === 'support';
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 text-xs font-semibold leading-relaxed shadow-sm ${
                        isUser 
                          ? 'bg-rose-600 text-white rounded-tr-none' 
                          : isRobert 
                            ? 'bg-slate-800 text-slate-100 border border-slate-750 rounded-tl-none'
                            : 'bg-emerald-600 text-white rounded-tl-none'
                      }`}>
                        {msg.message}
                        <span className={`block text-[8px] mt-1 text-right font-bold font-mono ${isUser || msg.sender === 'admin' ? 'text-rose-200' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
 
              {/* Chat Input Area */}
              <div className="p-3 bg-slate-955 border-t border-slate-850">
                {!isChatVerified ? (
                  <form onSubmit={handleVerifyChat} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter numerical Support ID..." 
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-rose-500 transition-all font-mono"
                      value={inputId}
                      onChange={e => setInputId(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-4.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                    >
                      Verify
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSendSupportMessage} className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Type message to Knife Support..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-rose-500 transition-all outline-none"
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-4.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                    >
                      Send
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  </div>
  );
}

// --- Premium Login Screen Component ---
// --- Premium Product Landing Page for knifepos.com ---
const LandingPage = ({ onEnterLogin }) => {
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantAddress: '',
    ownerName: '',
    ownerPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { success: true/false, message: '' }
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.restaurantName || !formData.restaurantAddress || !formData.ownerName || !formData.ownerPhone) {
      setStatus({ success: false, message: 'Please fill out all required fields!' });
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus({ success: true, message: 'Thank you! Your call has been booked. We will get in touch with you shortly.' });
        setFormData({ restaurantName: '', restaurantAddress: '', ownerName: '', ownerPhone: '' });
      } else {
        setStatus({ success: false, message: data.message || 'Failed to submit enquiry.' });
      }
    } catch (err) {
      console.error(err);
      setStatus({ success: false, message: 'Connection error. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page-root bg-[#0b0f19] min-h-screen text-slate-100 font-sans selection:bg-rose-500 selection:text-white relative overflow-x-hidden select-none text-left">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ef4444]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-[#0b0f19]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="KNIFE POS Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white uppercase block">
                KNIFE <span className="text-rose-500">POS</span>
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold uppercase tracking-wider text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <button 
            onClick={onEnterLogin}
            className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 hover:scale-105 active:scale-95 transition-all text-white font-extrabold text-[10px] px-5 py-2.5 rounded-xl uppercase tracking-wider shadow-md shadow-rose-900/25 cursor-pointer"
          >
            Launch POS Terminal
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 md:pt-28 pb-16 flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-full text-rose-500 font-extrabold text-[9px] uppercase tracking-widest animate-pulse">
            🔥 NOW ACTIVE ON KNIFEPOS.COM
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            The Razor-Sharp <br className="hidden md:inline" />
            POS System for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-red-600">Modern Outlets</span>
          </h1>
          <p className="text-sm md:text-base text-slate-400 font-semibold leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Lightning-fast 3-second checkout, real-time cloud analytics, multi-outlet management, and a live Kitchen Display System. Runs flawlessly in your browser, tablet, and natively on Android.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button 
              onClick={onEnterLogin}
              className="w-full sm:w-auto bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 hover:scale-103 active:scale-97 transition-all text-white font-extrabold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-rose-900/30 cursor-pointer text-center"
            >
              Access Billing System
            </button>
            <a 
              href="#contact"
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:scale-103 active:scale-97 transition-all text-slate-200 font-extrabold py-3.5 px-8 rounded-xl text-xs uppercase tracking-wider cursor-pointer text-center"
            >
              Book a Live Demo
            </a>
          </div>
        </div>

        {/* Hero Dashboard Visual Mockup */}
        <div className="flex-1 w-full max-w-lg lg:max-w-none">
          <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-2xl relative animate-in fade-in zoom-in duration-500">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              </div>
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest font-mono">live_preview_dashboard</span>
            </div>
            
            {/* Mock Analytics Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-2xl">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Today's Revenue</div>
                <div className="text-lg font-black text-white tracking-tight mt-0.5">₹24,850.00</div>
                <div className="text-[8px] font-extrabold text-emerald-400 mt-1 flex items-center gap-0.5">▲ +12% vs yesterday</div>
              </div>
              <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-2xl">
                <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Active KOT Tickets</div>
                <div className="text-lg font-black text-white tracking-tight mt-0.5">8 Orders</div>
                <div className="text-[8px] font-extrabold text-rose-500 mt-1 flex items-center gap-0.5">⏱️ 4 ready to serve</div>
              </div>
            </div>

            {/* Mock Charts */}
            <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-2xl">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-3">Weekly Sales Growth</div>
              <div className="h-24 flex items-end justify-between gap-2.5 pt-2 font-mono">
                <div className="flex-1 bg-slate-800 rounded-t-lg h-[40%] relative"><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400">10k</span></div>
                <div className="flex-1 bg-slate-800 rounded-t-lg h-[60%] relative"><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400">15k</span></div>
                <div className="flex-1 bg-slate-800 rounded-t-lg h-[50%] relative"><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400">12k</span></div>
                <div className="flex-1 bg-gradient-to-t from-rose-600 to-red-500 rounded-t-lg h-[85%] relative"><span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-rose-400">22k</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-20 border-t border-slate-900 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-rose-500 font-extrabold text-[9px] uppercase tracking-widest block">Core Infrastructure</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Fully Loaded with Premium POS Tools</h2>
          <p className="text-xs md:text-sm text-slate-400 font-semibold leading-relaxed">
            Everything your restaurant needs to automate billing, streamline kitchen operations, track finances, and scale to multiple outlets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Fast Billing */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 hover:border-rose-500/30 hover:bg-slate-900/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">3-Second Checkout</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Super-fast checkout interface. Log cash/UPI payments, track tables, split KOTs, and print receipts instantly.
            </p>
          </div>

          {/* Card 2: KDS */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 hover:border-rose-500/30 hover:bg-slate-900/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">Kitchen Display (KDS)</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Order updates broadcasted instantly to kitchen staff screens via Socket.io. Mark orders as ready with one click.
            </p>
          </div>

          {/* Card 3: Multi-Outlet */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 hover:border-rose-500/30 hover:bg-slate-900/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">Multi-Outlet Administrator</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Onboard new outlets, monitor credentials, update security keys, and manage suspension policies from a single dashboard.
            </p>
          </div>

          {/* Card 4: Analytics */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 hover:border-rose-500/30 hover:bg-slate-900/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">Daily Revenue Graphs</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Track category-wise sales, item performance, profit margins, and seasonal trends with advanced analytics tools.
            </p>
          </div>

          {/* Card 5: Staff Management */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 hover:border-rose-500/30 hover:bg-slate-900/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">Staff attendance & Salary</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Keep records of your kitchen helpers, waiters, and managers. Log monthly attendance, advances, and payroll parameters.
            </p>
          </div>

          {/* Card 6: Expense Book */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 hover:border-rose-500/30 hover:bg-slate-900/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-base text-white mb-2">Raw Materials & Rent Ledger</h3>
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              Monitor daily vegetable purchases, utility bills, shop rent, and gas expenses. Stay profitable with instant cost audits.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20 border-t border-slate-900 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-rose-500 font-extrabold text-[9px] uppercase tracking-widest block">Flexible Subscriptions</span>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">Fair Pricing for Restaurants of All Sizes</h2>
          <p className="text-xs md:text-sm text-slate-400 font-semibold leading-relaxed">
            Get started for free, then upgrade as your food brand expands.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Plan 3 (Enterprise - Now 100% Free) */}
          <div className="bg-[#0f1422] border-2 border-rose-500 rounded-3xl p-7 flex flex-col justify-between text-left shadow-xl shadow-rose-950/10 relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white font-black font-sans text-[8px] uppercase tracking-widest px-3 py-1 rounded-full border border-rose-500">
              1 YEAR FREE LICENSE
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Enterprise Edition</span>
              <div className="flex items-baseline gap-1.5 mt-3 mb-6">
                <span className="text-3xl font-black text-white">₹0</span>
                <span className="text-xs text-rose-400 font-bold">Free for 1st Year</span>
              </div>
              <p className="text-xs text-slate-400 font-semibold mb-6 leading-relaxed">
                Enjoy complete unrestricted access to all administrative modules, billing interfaces, KDS screens, and native Android APK compiles. No monthly subscription or hidden fees.
              </p>
              <ul className="space-y-3.5 text-xs text-slate-300 font-semibold mb-8 font-sans">
                <li className="flex items-center gap-2.5">✔️ Unlimited Outlet terminals</li>
                <li className="flex items-center gap-2.5">✔️ Complete Administrative multi-outlet portal</li>
                <li className="flex items-center gap-2.5">✔️ Full KDS screen socket broadcasts</li>
                <li className="flex items-center gap-2.5">✔️ Raw materials ledger & Expense trackers</li>
                <li className="flex items-center gap-2.5">✔️ Staff attendance & Salaries ledgers</li>
                <li className="flex items-center gap-2.5">✔️ Native Android APK sync & Build ready</li>
              </ul>
            </div>
            <a href="#contact" className="w-full text-center bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider block cursor-pointer transition-all shadow-md shadow-rose-900/20">
              Claim 1 Year Free License
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="max-w-6xl mx-auto px-4 py-20 border-t border-slate-900 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 lg:pr-8">
            <span className="text-rose-500 font-extrabold text-[10px] uppercase tracking-widest block font-sans">Connect With Us</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Request a demo for your restaurant
            </h2>
            <p className="text-xs md:text-sm text-slate-400 font-semibold leading-relaxed">
              Want to see how KNIFE POS can benefit your food brand? Send us a message, and our product team will get in touch with you.
            </p>
            <div className="pt-6 border-t border-slate-900/60 space-y-4">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Developed & Managed By</span>
              <div className="inline-flex items-center gap-3 bg-slate-900/40 border border-slate-800/80 px-4.5 py-2.5 rounded-2xl shadow-inner backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-white tracking-wide">cloudedge.tech</span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                📍 OMP Cuttack, Odisha
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl hover:border-rose-500/20 transition-all duration-300">
            {status && (
              <div className={`p-4 rounded-xl border mb-6 text-xs font-bold flex items-start gap-2.5 ${
                status.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {status.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <p>{status.message}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Restaurant / Brand Name *</label>
                  <input 
                    type="text" 
                    name="restaurantName"
                    required
                    placeholder="e.g. Bunty Biryani"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-all outline-none font-sans" 
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Restaurant Address *</label>
                  <input 
                    type="text" 
                    name="restaurantAddress"
                    required
                    placeholder="e.g. OMP, Cuttack"
                    value={formData.restaurantAddress}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-all outline-none font-sans" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Owner Name *</label>
                  <input 
                    type="text" 
                    name="ownerName"
                    required
                    placeholder="e.g. Bunty Sahoo"
                    value={formData.ownerName}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-all outline-none font-sans" 
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Owner Phone *</label>
                  <input 
                    type="tel" 
                    name="ownerPhone"
                    required
                    placeholder="e.g. 9861234567"
                    value={formData.ownerPhone}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/40 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-xs font-semibold focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/80 transition-all outline-none font-sans" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-rose-600 to-red-650 hover:from-rose-550 hover:to-red-600 text-white font-extrabold py-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-rose-955/50 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking Call...' : 'Book a Call'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 border-t border-slate-950 text-center text-[10px] text-slate-500 font-semibold relative z-10 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div>
          © 2026 KNIFE POS. All Rights Reserved. Developed by <span className="text-rose-500 font-bold">cloudedge.tech</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowTerms(true)} className="hover:text-slate-400 transition-colors cursor-pointer">Terms of Service</button>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-slate-400 transition-colors cursor-pointer">Privacy Policy</button>
        </div>
      </footer>

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Terms of Service</h3>
              <button onClick={() => setShowTerms(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 text-xs text-slate-300 font-semibold space-y-4 leading-relaxed scrollbar-thin select-text">
              <p className="text-rose-500 font-extrabold text-[10px]">Last Updated: June 2026</p>
              <p>Welcome to KNIFE POS. By using our POS platform, billing tools, and administrative services, you agree to comply with the terms below.</p>
              
              <h4 className="font-extrabold text-white text-xs mt-3 uppercase tracking-wider text-rose-400">1. Trial & Licensing</h4>
              <p>KNIFE POS grants a 1-year free trial license starting from the date of system onboarding. Access is valid for 365 days, after which account renewal is required. Data remains archived for safety and can be exported.</p>
              
              <h4 className="font-extrabold text-white text-xs mt-3 uppercase tracking-wider text-rose-400">2. Operational Responsibility</h4>
              <p>You are responsible for transactions, cash records, and tax filings executed using the POS. Under no circumstances is the developer platform liable for incorrect ledger balances, system outages, or print errors.</p>
              
              <h4 className="font-extrabold text-white text-xs mt-3 uppercase tracking-wider text-rose-400">3. Termination Policy</h4>
              <p>System access may be suspended if double-account creations, fraudulent billing profiles, or platform security violations are detected.</p>
            </div>
            <div className="border-t border-slate-800 pt-4 mt-4 text-right">
              <button onClick={() => setShowTerms(false)} className="bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Privacy Policy</h3>
              <button onClick={() => setShowPrivacy(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 text-xs text-slate-300 font-semibold space-y-4 leading-relaxed scrollbar-thin select-text">
              <p className="text-rose-500 font-extrabold text-[10px]">Last Updated: June 2026</p>
              <p>Your privacy and operational security are our top priority. This policy details how we secure your restaurant databases.</p>
              
              <h4 className="font-extrabold text-white text-xs mt-3 uppercase tracking-wider text-rose-400">1. Data Storage & Ownership</h4>
              <p>All transactions, menu lists, employee logs, and expenses inputted into KNIFE POS are owned by the respective outlet. Your records are protected by unique keys generated during onboarding.</p>
              
              <h4 className="font-extrabold text-xs mt-3 uppercase tracking-wider text-rose-400 text-rose-400">2. No Third-Party Selling</h4>
              <p>We do not lease, rent, or sell restaurant customer profiles, sales reports, or invoice records to third parties for advertisement or data mining.</p>
              
              <h4 className="font-extrabold text-white text-xs mt-3 uppercase tracking-wider text-rose-400">3. Support Transcripts</h4>
              <p>Live conversations with Knife support agents are archived solely for verification and resolving subscription inquiries.</p>
            </div>
            <div className="border-t border-slate-800 pt-4 mt-4 text-right">
              <button onClick={() => setShowPrivacy(false)} className="bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const LoginScreen = ({ onLogin, restaurants = [], onBackToLanding }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const inputUser = username.trim().toLowerCase();

    // 1. Check system admin
    if (inputUser === 'admin' && password === 'admin') {
      onLogin({ username: 'admin', name: 'System Administrator', role: 'admin' });
      return;
    }

    // 2. Authenticate against the backend API
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(data.user);
      } else {
        setError(data.message || 'Invalid username or password! (Tip: use admin/admin)');
      }
    } catch (err) {
      console.error("Login connection error, falling back to local verification:", err);
      // Fallback: Check restaurant specific login credentials
      const r = restaurants.find(
        rest => rest.username && rest.username.toLowerCase() === inputUser && rest.password === password
      );

      if (r) {
        if (r.status !== 'Active') {
          setError(`"${r.name}" is currently suspended. Please activate it first!`);
          return;
        }
        if (r.expiryDate && new Date() > new Date(r.expiryDate)) {
          setError(`Your 1-year free trial for "${r.name}" has expired on ${new Date(r.expiryDate).toLocaleDateString('en-IN')}. Please contact system administrator to renew.`);
          return;
        }
        onLogin({ 
          username: r.username, 
          name: r.owner, 
          role: 'restaurant', 
          restaurantId: r.id 
        });
        return;
      }

      setError('Invalid username or password! (Tip: use admin/admin)');
    }
  };

  return (
    <div className="bg-slate-950 flex items-center justify-center min-h-screen px-4 font-sans select-none relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 md:w-96 h-72 md:h-96 bg-rose-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 md:w-96 h-72 md:h-96 bg-[#ef4444]/10 rounded-full blur-3xl animate-pulse delay-700"></div>

      <div className="relative z-10 w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        
        {/* Logo block */}
        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-800 bg-slate-950 flex items-center justify-center transition-transform hover:scale-105 duration-300">
          <img src="/logo.png" alt="KNIFE POS Logo" className="w-full h-full object-cover" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">KNIFE POS</h2>
          <p className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest mt-1">THE NEXT-GEN RESTAURANT SUITE</p>
        </div>

        {error && (
          <div className="w-full bg-rose-955/60 border border-rose-800/50 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-semibold text-left">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
            <input 
              type="text" 
              placeholder="Enter username" 
              className="w-full bg-slate-900/60 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-none" 
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full bg-slate-900/60 border border-slate-800 text-white rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all outline-none" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer active:scale-98 mt-2"
          >
            Sign In to System
          </button>
          {onBackToLanding && (
            <button 
              type="button"
              onClick={onBackToLanding}
              className="w-full bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-98 mt-2"
            >
              Back to Home
            </button>
          )}
        </form>

        <div className="text-[10px] text-slate-500 font-semibold mt-2">
          Tip: Log in as <span className="text-slate-400 font-bold">admin / admin</span> or restaurant owner.
        </div>
      </div>
    </div>
  );
};

// --- Helper to get restaurant dynamic database analytics on-the-fly ---
const getRestaurantStats = (rest) => {
  if (!rest) return { revenue: 0, ordersCount: 0, expenses: 0, staffCount: 0 };
  const prefix = rest.id === 'urmi_kitchen' ? 'urmikitchen_' : `knife_pos_${rest.id}_`;
  
  // 1. Orders and Revenue
  let ordersCount = 0;
  let revenue = 0;
  try {
    const savedOrders = localStorage.getItem(`${prefix}orders`);
    let parsedOrders = null;
    if (savedOrders) {
      parsedOrders = JSON.parse(savedOrders);
    } else if (rest.id === 'urmi_kitchen') {
      parsedOrders = generateMockOrders();
    }
    if (Array.isArray(parsedOrders)) {
      ordersCount = parsedOrders.length;
      revenue = parsedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Expenses
  let expensesTotal = 0;
  try {
    const savedExpenses = localStorage.getItem(`${prefix}expenses`);
    let parsedExpenses = null;
    if (savedExpenses) {
      parsedExpenses = JSON.parse(savedExpenses);
    } else if (rest.id === 'urmi_kitchen') {
      parsedExpenses = INITIAL_EXPENSES;
    }
    if (Array.isArray(parsedExpenses)) {
      expensesTotal = parsedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    }
  } catch (e) {
    console.error(e);
  }

  // 3. Staff count
  let staffCount = 0;
  try {
    const savedStaff = localStorage.getItem(`${prefix}staff`);
    let parsedStaff = null;
    if (savedStaff) {
      parsedStaff = JSON.parse(savedStaff);
    } else if (rest.id === 'urmi_kitchen') {
      parsedStaff = INITIAL_STAFF;
    }
    if (Array.isArray(parsedStaff)) {
      staffCount = parsedStaff.length;
    }
  } catch (e) {
    console.error(e);
  }

  return {
    revenue,
    ordersCount,
    expenses: expensesTotal,
    staffCount
  };
};

// --- Premium Restaurant Details Modal / Drawer Component ---
const DetailsModal = ({ restaurant, stats, onClose, onUpdateCredentials }) => {
  const [username, setUsername] = useState(restaurant.username || '');
  const [password, setPassword] = useState(restaurant.password || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setUsername(restaurant.username || '');
    setPassword(restaurant.password || '');
    setIsSaved(false);
  }, [restaurant]);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateCredentials(restaurant.id, username, password);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-955/75 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-in fade-in duration-200">
      <div className="bg-[#0f1422] rounded-3xl shadow-2xl w-full max-w-lg border border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-slate-900 border-b border-slate-855 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
              <Store className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-extrabold uppercase tracking-wide text-xs">{restaurant.name}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Outlet Details & Security Management</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh] text-xs">
          
          {/* Section 1: Live POS Analytics */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500" /> Dynamic Live POS Analytics
            </h4>
            <div className="grid grid-cols-2 gap-3.5">
              {/* Revenue */}
              <div className="bg-slate-950/80 border border-slate-855/60 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Total Revenue</span>
                <span className="text-xl font-black text-emerald-400 font-mono block mt-1">
                  {restaurant.currency || '₹'}{stats.revenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Lifetime POS Billing</span>
              </div>

              {/* Orders */}
              <div className="bg-slate-950/80 border border-slate-855/60 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Orders Placed</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {stats.ordersCount}
                </span>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Total Transactions</span>
              </div>

              {/* Expenses */}
              <div className="bg-slate-950/80 border border-slate-855/60 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/5 rounded-full blur-xl pointer-events-none"></div>
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Total Expenses</span>
                <span className="text-xl font-black text-rose-500 font-mono block mt-1">
                  {restaurant.currency || '₹'}{stats.expenses.toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Raw Material & Bills</span>
              </div>

              {/* Staff Count */}
              <div className="bg-slate-950/80 border border-slate-855/60 rounded-2xl p-4 relative overflow-hidden shadow-inner">
                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider block">Staff Registry</span>
                <span className="text-xl font-black text-white font-mono block mt-1">
                  {stats.staffCount}
                </span>
                <span className="text-[9px] text-slate-500 font-bold block mt-0.5">Active Employees</span>
              </div>
            </div>
          </div>

          {/* Section 2: General Config */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-rose-500" /> General Information
            </h4>
            <div className="bg-slate-950/80 border border-slate-855/60 rounded-2xl p-4 space-y-3 font-bold text-slate-350">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Outlet ID</span>
                  <span className="text-xs font-mono text-white block mt-0.5">{restaurant.id}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Owner / Manager</span>
                  <span className="text-xs text-white block mt-0.5">{restaurant.owner}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-2.5">
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Cuisine Group</span>
                  <span className="text-xs text-white block mt-0.5">{restaurant.cuisine || 'Multi-Cuisine'}</span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Taxation Configuration</span>
                  <span className="text-xs text-white block mt-0.5">{restaurant.taxRate}% GST Enabled</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-2.5">
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">POS Status</span>
                  <span className={`text-xs font-black uppercase tracking-wider block mt-0.5 ${
                    restaurant.status === 'Active' ? 'text-emerald-400' : 'text-rose-500'
                  }`}>
                    {restaurant.status === 'Active' ? '● Active / Open' : '○ Suspended'}
                  </span>
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Currency Symbol</span>
                  <span className="text-xs text-white block mt-0.5">{restaurant.currency || '₹'} (INR)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Credentials & Reset */}
          <div className="space-y-3">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Security Access & Login IDs
            </h4>
            <div className="bg-slate-950/80 border border-slate-855/60 rounded-2xl p-4.5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Owner Username ID</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Username ID"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-rose-500 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-wider mb-1">Security Password</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-rose-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[9px] text-slate-500 font-bold leading-normal max-w-[240px]">
                  These credentials allow direct access to this branch's POS workspace, bypassing the administrative portal.
                </p>
                <button 
                  type="button"
                  onClick={handleSave}
                  className={`px-4 py-2.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1 shadow-md ${
                    isSaved 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-550' 
                      : 'bg-rose-600 hover:bg-rose-550 text-white'
                  }`}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Updated
                    </>
                  ) : (
                    'Reset Credentials'
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-855 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-slate-955 border border-slate-800 hover:bg-slate-850 text-slate-300 hover:text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

// --- Main Root App Component ---
function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('knife_pos_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [restaurants, setRestaurants] = useState(() => {
    const saved = localStorage.getItem('knife_pos_restaurants');
    return saved ? JSON.parse(saved) : [
      {
        id: 'urmi_kitchen',
        name: 'Urmi Kitchen',
        owner: 'Bunty',
        cuisine: 'North Indian & Biryani',
        status: 'Active',
        taxRate: 5,
        currency: '₹',
        username: 'urmi',
        password: 'urmi123'
      }
    ];
  });

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/restaurants`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setRestaurants(data);
          }
        }
      } catch (err) {
        console.error("Error fetching restaurants from backend API:", err);
      }
    };
    fetchRestaurants();
  }, []);

  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [onboardForm, setOnboardForm] = useState({ name: '', owner: '', phone: '', cuisine: 'Multi-Cuisine', currency: '₹', taxRate: '5' });
  const [selectedDetailsRestaurant, setSelectedDetailsRestaurant] = useState(null);

  // Admin Portal Navigation Tabs State
  const [adminTab, setAdminTab] = useState('outlets'); // 'outlets', 'leads', 'support'
  const [inquiries, setInquiries] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [adminSocket, setAdminSocket] = useState(null);
  const [selectedChatRestaurantId, setSelectedChatRestaurantId] = useState('');
  const [adminChatMessages, setAdminChatMessages] = useState([]);
  const [adminReplyMsg, setAdminReplyMsg] = useState('');
  const [unreadChannels, setUnreadChannels] = useState([]);
  
  const adminMessagesEndRef = React.useRef(null);
  useEffect(() => {
    if (adminMessagesEndRef.current) {
      adminMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminChatMessages]);

  // Sync state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('knife_pos_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('knife_pos_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('knife_pos_restaurants', JSON.stringify(restaurants));
  }, [restaurants]);

  // Auto-launch POS if logged in as a restaurant owner on page refresh
  useEffect(() => {
    if (user && user.role === 'restaurant' && !currentRestaurant) {
      const restObj = restaurants.find(r => r.id === user.restaurantId);
      if (restObj) {
        setCurrentRestaurant(restObj);
      }
    }
  }, [user, restaurants, currentRestaurant]);

  // Socket.io for admin support messages
  useEffect(() => {
    if (user && user.role === 'admin') {
      const s = io(API_BASE);
      setAdminSocket(s);
      
      s.emit('join_admin_support');
      
      s.on('admin_support_notification', (newMsg) => {
        if (selectedChatRestaurantId === newMsg.restaurantId) {
          setAdminChatMessages(prev => {
            if (prev.some(m => m._id === newMsg._id || (m.timestamp === newMsg.createdAt && m.message === newMsg.message))) return prev;
            return [...prev, { ...newMsg, timestamp: newMsg.createdAt }];
          });
        }
        
        if (newMsg.sender === 'restaurant') {
          if (selectedChatRestaurantId !== newMsg.restaurantId || adminTab !== 'support') {
            setUnreadChannels(prev => {
              if (prev.includes(newMsg.restaurantId)) return prev;
              return [...prev, newMsg.restaurantId];
            });
          }
        }
      });
      
      return () => {
        s.disconnect();
      };
    }
  }, [user, selectedChatRestaurantId, adminTab]);

  // Fetch inquiries from backend
  useEffect(() => {
    if (user && user.role === 'admin' && adminTab === 'leads') {
      const fetchInquiries = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/inquiries`);
          if (res.ok) {
            const data = await res.json();
            setInquiries(data);
          }
        } catch (err) {
          console.error("Error fetching inquiries:", err);
        }
      };
      fetchInquiries();
    }
  }, [user, adminTab]);

  // Fetch complaints from backend
  useEffect(() => {
    if (user && user.role === 'admin' && adminTab === 'complaints') {
      const fetchComplaints = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/complaints`);
          if (res.ok) {
            const data = await res.json();
            setComplaints(data);
          }
        } catch (err) {
          console.error("Error fetching complaints:", err);
        }
      };
      fetchComplaints();
    }
  }, [user, adminTab]);

  // Fetch chat history for selected restaurant
  useEffect(() => {
    if (selectedChatRestaurantId && user && user.role === 'admin') {
      const fetchHistory = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/chat/${selectedChatRestaurantId}`);
          if (res.ok) {
            const data = await res.json();
            setAdminChatMessages(data.map(m => ({ ...m, timestamp: m.createdAt })));
          }
        } catch (err) {
          console.error("Error fetching admin support chat history:", err);
        }
      };
      fetchHistory();
    }
  }, [selectedChatRestaurantId, user]);

  const handleSendAdminReply = (e) => {
    e.preventDefault();
    if (!adminReplyMsg.trim() || !selectedChatRestaurantId) return;
    
    if (adminSocket) {
      adminSocket.emit('send_admin_reply', {
        restaurantId: selectedChatRestaurantId,
        message: adminReplyMsg.trim()
      });
      
      // Optimistically add message to UI
      const optimisticMsg = {
        _id: 'opt_' + Date.now(),
        restaurantId: selectedChatRestaurantId,
        sender: 'admin',
        message: adminReplyMsg.trim(),
        timestamp: new Date().toISOString()
      };
      setAdminChatMessages(prev => [...prev, optimisticMsg]);
      
      setAdminReplyMsg('');
    }
  };

  const handleUpdateInquiryStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/inquiries/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setInquiries(prev => prev.map(inq => inq._id === id ? updated : inq));
      }
    } catch (err) {
      console.error("Error updating inquiry status:", err);
    }
  };

  const handleResolveComplaint = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Resolved' })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaints(prev => prev.map(c => c._id === id ? updated : c));
      }
    } catch (err) {
      console.error("Error resolving complaint:", err);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    if (userData.role === 'restaurant') {
      const restObj = restaurants.find(r => r.id === userData.restaurantId);
      if (restObj) {
        setCurrentRestaurant(restObj);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRestaurant(null);
  };

  const handleToggleStatus = async (id) => {
    const currentRest = restaurants.find(r => r.id === id);
    if (!currentRest) return;
    const nextStatus = currentRest.status === 'Active' ? 'Closed' : 'Active';

    // Optimistic UI update
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r));

    try {
      const res = await fetch(`${API_BASE}/api/restaurants/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch (err) {
      console.error(err);
      // Revert status
      setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: currentRest.status } : r));
      alert("Error: Could not update status on server!");
    }
  };

  const handleUpdateCredentials = async (restaurantId, newUsername, newPassword) => {
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('Username and password cannot be empty!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/restaurants/${restaurantId}/credentials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim(), password: newPassword.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setRestaurants(prev => prev.map(r => r.id === restaurantId ? updated : r));
        setSelectedDetailsRestaurant(updated);
        alert('Credentials updated successfully!');
      } else {
        throw new Error('Server error updating credentials');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update credentials on backend.');
    }
  };

  const [newOutletCredentials, setNewOutletCredentials] = useState(null);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardForm.name || !onboardForm.owner || !onboardForm.phone) {
      alert('Please fill out all required fields!');
      return;
    }

    const newId = onboardForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    
    if (restaurants.some(r => r.id === newId)) {
      alert('A restaurant with a similar name already exists!');
      return;
    }

    const generatedUsername = `owner_${newId}`;
    const generatedPassword = `knife_${Math.floor(1000 + Math.random() * 9000)}`;

    const newRestaurant = {
      id: newId,
      name: onboardForm.name,
      owner: onboardForm.owner,
      phone: onboardForm.phone,
      cuisine: onboardForm.cuisine,
      status: 'Active',
      currency: onboardForm.currency,
      taxRate: Number(onboardForm.taxRate) || 5,
      username: generatedUsername,
      password: generatedPassword
    };

    try {
      const res = await fetch(`${API_BASE}/api/restaurants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurant)
      });
      if (res.ok) {
        const savedRestaurant = await res.json();
        setRestaurants(prev => [...prev, savedRestaurant]);
        setNewOutletCredentials({ name: savedRestaurant.name, username: generatedUsername, password: generatedPassword });
        setOnboardForm({ name: '', owner: '', phone: '', cuisine: 'Multi-Cuisine', currency: '₹', taxRate: '5' });
        setShowOnboardModal(false);
      } else {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to onboard restaurant');
      }
    } catch (err) {
      console.error(err);
      alert(`Error onboarding restaurant: ${err.message}`);
    }
  };

  // 1. If not logged in, show Landing Page or Login gate
  if (!user) {
    if (view === 'landing') {
      return <LandingPage onEnterLogin={() => setView('login')} />;
    }
    return <LoginScreen onLogin={handleLogin} restaurants={restaurants} onBackToLanding={() => setView('landing')} />;
  }

  // 2. If logged in but no active restaurant selected, show Manager Portal
  if (!currentRestaurant) {
    return (
      <div className="admin-portal-root bg-[#070b13] min-h-screen font-sans text-slate-100 p-4 md:p-10 select-none pb-8 relative overflow-x-hidden">
        {/* Glowing backdrop circles */}
        <div className="absolute top-0 left-1/4 w-80 md:w-[450px] h-80 md:h-[450px] bg-rose-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-80 md:w-[450px] h-80 md:h-[450px] bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
          
          {/* Top Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/35 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-200">
                <img src="/logo.png" alt="KNIFE POS Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-1.5">
                  KNIFE <span className="bg-[#ef4444] text-white text-[10px] px-1.5 py-0.5 rounded font-black font-sans leading-none pb-0.5 pt-0.5 shadow-xs">PORTAL</span>
                </h1>
                <p className="text-[9px] text-rose-500 font-extrabold uppercase tracking-widest mt-0.5">ADMINISTRATIVE OUTLET MANAGER</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t border-slate-800/40 md:border-0 pt-4 md:pt-0">
              <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-850 px-3.5 py-1.5 rounded-2xl shadow-inner">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <div className="text-left">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase leading-none">Logged In</span>
                  <span className="block text-xs font-black text-slate-200 mt-1">{user.name}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="bg-slate-900 border border-slate-855 text-slate-300 hover:text-white hover:bg-slate-850 hover:border-slate-700 font-extrabold px-4.5 py-2.5 rounded-2xl text-[10px] uppercase tracking-wider transition-all duration-200 shadow-sm cursor-pointer active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Hero Banner with Stats Grid */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-920 to-slate-950 text-white rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl border border-slate-800/80">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
              <div className="space-y-3.5 max-w-xl">
                <span className="text-rose-500 font-black text-[9px] uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md shadow-xs">ADMIN SUITE V3.0</span>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">Control & Deploy POS Terminals</h2>
                <p className="text-slate-400 text-xs font-semibold leading-relaxed">Instantly manage outlet switches ("band karibara achi"), review configuration metrics, launch point of sale modules, or onboard new branches globally.</p>
              </div>

              {/* Metrics card block */}
              <div className="grid grid-cols-3 gap-6 bg-slate-950/80 backdrop-blur-md p-5 rounded-2xl border border-slate-850 shadow-inner w-full lg:w-auto shrink-0">
                <div className="text-center px-4">
                  <span className="text-2xl font-black text-white font-mono block tracking-tight">{restaurants.length}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mt-1">Total Branches</span>
                </div>
                <div className="text-center px-4 border-l border-slate-855">
                  <span className="text-2xl font-black text-emerald-400 font-mono block tracking-tight">{restaurants.filter(r => r.status === 'Active').length}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mt-1">Active</span>
                </div>
                <div className="text-center px-4 border-l border-slate-855">
                  <span className="text-2xl font-black text-rose-500 font-mono block tracking-tight">{restaurants.filter(r => r.status !== 'Active').length}</span>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block mt-1">Suspended</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Sub-Navigation Tabs */}
          <div className="flex border-b border-slate-805/60 gap-6 text-[11px] font-black uppercase tracking-wider text-slate-400 pb-1.5 select-none">
            <button 
              onClick={() => setAdminTab('outlets')}
              className={`pb-2 transition-all cursor-pointer border-b-2 ${adminTab === 'outlets' ? 'text-rose-500 border-rose-500 font-extrabold' : 'border-transparent hover:text-white'}`}
            >
              Outlets Registry
            </button>
            <button 
              onClick={() => setAdminTab('leads')}
              className={`pb-2 transition-all cursor-pointer border-b-2 ${adminTab === 'leads' ? 'text-rose-500 border-rose-500 font-extrabold' : 'border-transparent hover:text-white'}`}
            >
              Leads Tracker
            </button>
            <button 
              onClick={() => { setAdminTab('support'); if (selectedChatRestaurantId) { setUnreadChannels(prev => prev.filter(id => id !== selectedChatRestaurantId)); } }}
              className={`pb-2 transition-all cursor-pointer border-b-2 ${adminTab === 'support' ? 'text-rose-500 border-rose-500 font-extrabold' : 'border-transparent hover:text-white'} flex items-center gap-1.5`}
            >
              Support Hub
              {unreadChannels.length > 0 && (
                <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none min-w-[14px] text-center">
                  {unreadChannels.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setAdminTab('complaints')}
              className={`pb-2 transition-all cursor-pointer border-b-2 ${adminTab === 'complaints' ? 'text-rose-500 border-rose-500 font-extrabold' : 'border-transparent hover:text-white'}`}
            >
              Complaints Hub
            </button>
          </div>

          {/* Tab Content Rendering */}
          {adminTab === 'outlets' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-rose-600 rounded-full shadow-sm"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Outlets Registry</h3>
                </div>
                <button 
                  onClick={() => setShowOnboardModal(true)}
                  className="bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 text-white font-extrabold px-5 py-2.5 rounded-2xl text-[10px] uppercase tracking-wider transition-all duration-200 shadow-md shadow-rose-955/20 cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Onboard Outlet
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map(r => (
                  <div 
                    key={r.id}
                    onClick={() => setSelectedDetailsRestaurant(r)}
                    className={`restaurant-card bg-slate-900/35 backdrop-blur-xl rounded-3xl border transition-all duration-300 p-6 flex flex-col justify-between min-h-[15rem] relative overflow-hidden group hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-955/5 cursor-pointer ${
                      r.status === 'Active' 
                        ? 'border-slate-800/80 hover:border-rose-600/80' 
                        : 'border-rose-955/40 opacity-70 bg-slate-950/30'
                    }`}
                  >
                    {r.status !== 'Active' && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-rose-955/20 rounded-bl-full flex items-start justify-end p-2 select-none border-b border-l border-rose-900/20">
                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider rotate-45 translate-x-2.5 translate-y-1">SUSPENDED</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-955/80 rounded-xl border border-slate-855 text-rose-550">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-white tracking-tight leading-tight group-hover:text-rose-500 transition-colors">{r.name}</h4>
                          <span className="text-[9px] text-slate-400 font-semibold">{r.cuisine} Cuisine</span>
                        </div>
                      </div>
                      
                      <div className="text-[10px] bg-slate-955/45 border border-slate-855/60 rounded-xl p-3.5 space-y-1 text-slate-400 font-bold select-none shadow-inner">
                        <div className="flex justify-between">
                          <span>Owner:</span> 
                          <span className="text-slate-200">{r.owner}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Onboarded:</span> 
                          <span className="text-slate-200">{r.onboardedAt ? new Date(r.onboardedAt).toLocaleDateString('en-IN') : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trial Expires:</span> 
                          <span className="text-slate-200">{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString('en-IN') : '1 Year Free'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Days Remaining:</span> 
                          <span className={`font-black ${r.expiryDate && new Date(r.expiryDate) < new Date() ? 'text-rose-500' : 'text-emerald-400'}`}>
                            {r.expiryDate 
                              ? (() => {
                                  const diff = Math.ceil((new Date(r.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                                  return diff <= 0 ? 'Expired' : `${diff} Days`;
                                })()
                              : '365 Days'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/50 pt-4 mt-4 flex justify-between items-center select-none">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(r.id); }}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                            r.status === 'Active' ? 'bg-emerald-600 shadow-xs shadow-emerald-500/20' : 'bg-slate-805'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                            r.status === 'Active' ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${
                          r.status === 'Active' ? 'text-emerald-400 font-bold' : 'text-slate-500'
                        }`}>
                          {r.status === 'Active' ? 'Open' : 'Suspended'}
                        </span>
                      </div>

                      {r.status === 'Active' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentRestaurant(r); }}
                          className="bg-white hover:bg-slate-100 text-slate-900 font-black px-4.5 py-2 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95 shadow-md"
                        >
                          Launch POS
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="bg-slate-900/60 text-slate-500 border border-slate-800/80 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 cursor-not-allowed"
                        >
                          🔒 Suspended
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div 
                  onClick={() => setShowOnboardModal(true)}
                  className="border-2 border-dashed border-slate-800/80 hover:border-rose-600/80 rounded-3xl p-6 flex flex-col items-center justify-center h-60 cursor-pointer group transition-all duration-300 bg-slate-900/10 hover:bg-slate-900/20"
                >
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:border-rose-600/80 transition-all duration-300 shadow-md mb-3.5 group-hover:scale-105">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Onboard Outlet</span>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">Register a new POS branch</p>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'leads' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-rose-600 rounded-full shadow-sm"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Book a Call Leads</h3>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">Total Inquiries: {inquiries.length}</div>
              </div>

              <div className="bg-slate-900/35 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                {inquiries.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-bold">No call inquiries received yet.</div>
                ) : (
                  <div className="overflow-x-auto select-text">
                    <table className="w-full border-collapse text-left text-xs font-bold text-slate-300">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-850 text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Restaurant Name</th>
                          <th className="p-4">Owner Name</th>
                          <th className="p-4">Phone Number</th>
                          <th className="p-4">Restaurant Address</th>
                          <th className="p-4">Submitted Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {inquiries.map(inq => (
                          <tr key={inq._id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="p-4 text-white font-extrabold">{inq.restaurantName}</td>
                            <td className="p-4">{inq.ownerName}</td>
                            <td className="p-4 font-mono select-all text-rose-455">{inq.ownerPhone}</td>
                            <td className="p-4 truncate max-w-[200px]" title={inq.restaurantAddress}>{inq.restaurantAddress}</td>
                            <td className="p-4 text-slate-500 font-mono">{new Date(inq.createdAt).toLocaleDateString('en-IN')}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                inq.status === 'Pending' 
                                  ? 'bg-amber-500/10 text-amber-550 border border-amber-500/20' 
                                  : inq.status === 'Contacted'
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                              }`}>
                                {inq.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2 select-none">
                              {inq.status !== 'Contacted' && inq.status !== 'Closed' && (
                                <button 
                                  onClick={() => handleUpdateInquiryStatus(inq._id, 'Contacted')}
                                  className="bg-sky-655 hover:bg-sky-600 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer"
                                >
                                  Mark Contacted
                                </button>
                              )}
                              {inq.status !== 'Closed' && (
                                <button 
                                  onClick={() => handleUpdateInquiryStatus(inq._id, 'Closed')}
                                  className="bg-emerald-655 hover:bg-emerald-600 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer"
                                >
                                  Close
                                </button>
                              )}
                              {inq.status === 'Closed' && (
                                <span className="text-slate-500 text-[10px] font-bold">Resolved</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {adminTab === 'support' && (
            <div className="admin-support-hub grid grid-cols-1 lg:grid-cols-4 gap-6 lg:h-[550px] animate-in fade-in duration-200">
              <div className="lg:col-span-1 bg-slate-900/35 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden min-h-[200px] lg:min-h-0">
                <div className="p-4 bg-slate-955 border-b border-slate-850 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outlet Channels</h4>
                  <span className="text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-md font-bold uppercase">Socket Active</span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-850 p-2 max-h-[180px] lg:max-h-none">
                  {restaurants.map(rest => {
                    const isSelected = selectedChatRestaurantId === rest.id;
                    const isUnread = unreadChannels.includes(rest.id);
                    return (
                      <div 
                        key={rest.id}
                        onClick={() => { setSelectedChatRestaurantId(rest.id); setUnreadChannels(prev => prev.filter(id => id !== rest.id)); }}
                        className={`p-3.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-900/25' 
                            : 'hover:bg-slate-900/40 text-slate-350 hover:text-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border shrink-0 ${
                          isSelected ? 'bg-white/10 border-white/20 text-white' : 'bg-slate-955 border-slate-800 text-slate-400'
                        } relative`}>
                          <Store className="w-4 h-4" />
                          {isUnread && (
                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-slate-900"></span>
                            </span>
                          )}
                        </div>
                        <div className="truncate flex-1 flex justify-between items-center">
                          <div className="truncate">
                            <span className={`block text-xs font-black truncate leading-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>{rest.name}</span>
                            <span className={`block text-[9px] mt-0.5 font-bold uppercase tracking-wider leading-none ${isSelected ? 'text-rose-200' : 'text-slate-500 font-mono'}`}>Support ID: {rest.uniqueId || 'N/A'}</span>
                          </div>
                          {isUnread && (
                            <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse shrink-0">New</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={selectedChatRestaurantId ? "lg:col-span-2 bg-slate-900/35 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden min-h-[350px] lg:min-h-0" : "lg:col-span-3 bg-slate-900/35 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden min-h-[200px] lg:min-h-0"}>
                {selectedChatRestaurantId ? (
                  (() => {
                    const currentChatRest = restaurants.find(r => r.id === selectedChatRestaurantId);
                    return (
                      <div className="flex flex-col h-full overflow-hidden text-left">
                        <div className="p-4 bg-slate-955 border-b border-slate-850 flex justify-between items-center select-none">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-500">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-xs uppercase tracking-wide text-white">{currentChatRest ? currentChatRest.name : 'Unknown Restaurant'}</h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Active Session • verified_outlet</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold font-mono text-slate-550 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                            Support ID: {currentChatRest ? currentChatRest.uniqueId : 'N/A'}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-955/20 select-text">
                          {adminChatMessages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-500 font-bold text-xs">
                              No support messages in this channel yet.
                            </div>
                          ) : (
                            adminChatMessages.map((msg, index) => {
                              const isAdmin = msg.sender === 'admin';
                              const isRobert = msg.sender === 'robert' || msg.sender === 'support';
                              return (
                                <div key={index} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[75%] rounded-2xl p-3 text-xs font-semibold leading-relaxed shadow-sm ${
                                    isAdmin 
                                      ? 'bg-rose-600 text-white rounded-tr-none' 
                                      : isRobert
                                        ? 'bg-slate-800 text-slate-100 border border-slate-750 rounded-tl-none font-sans'
                                        : 'bg-slate-955 text-slate-200 border border-slate-800 rounded-tl-none'
                                  }`}>
                                    {msg.message}
                                    <span className={`block text-[8px] mt-1 text-right font-bold font-mono ${isAdmin ? 'text-rose-200' : 'text-slate-500'}`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={adminMessagesEndRef} />
                        </div>

                        <form onSubmit={handleSendAdminReply} className="p-3 bg-slate-950 border-t border-slate-855 flex gap-2">
                          <input 
                            type="text"
                            placeholder={`Reply to ${currentChatRest ? currentChatRest.name : 'restaurant'}...`}
                            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-rose-500 transition-all outline-none"
                            value={adminReplyMsg}
                            onChange={e => setAdminReplyMsg(e.target.value)}
                          />
                          <button 
                            type="submit"
                            className="bg-rose-600 hover:bg-rose-550 text-white font-extrabold px-5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 font-bold p-6 space-y-2">
                    <Headphones className="w-8 h-8 text-slate-650" />
                    <span className="text-xs uppercase tracking-wider">Please select a restaurant channel to begin support chat</span>
                  </div>
                )}
              </div>

              {selectedChatRestaurantId && (() => {
                const currentChatRest = restaurants.find(r => r.id === selectedChatRestaurantId);
                if (!currentChatRest) return null;
                return (
                  <div className="lg:col-span-1 bg-slate-900/35 border border-slate-800/80 rounded-3xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-slate-955 border-b border-slate-850">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Outlet Profile</h4>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs font-bold text-slate-350 select-text">
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Restaurant Name</span>
                        <span className="text-white text-xs font-black">{currentChatRest.name}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Unique Support ID</span>
                        <span className="text-rose-455 font-mono text-sm font-black">{currentChatRest.uniqueId || 'N/A'}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Owner Name</span>
                        <span className="text-slate-200">{currentChatRest.owner}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Phone Number</span>
                        <span className="text-slate-200 font-mono">{currentChatRest.phone || '9861234567'}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Cuisine Category</span>
                        <span className="text-slate-200">{currentChatRest.cuisine}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Status</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${currentChatRest.status === 'Active' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>{currentChatRest.status}</span>
                      </div>
                      <div className="border-t border-slate-800/80 pt-3 space-y-2">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Login Credentials</span>
                        <div className="bg-slate-955/50 p-2.5 rounded-xl border border-slate-855 space-y-1 font-mono text-[10px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Username:</span>
                            <span className="text-slate-305 font-bold">{currentChatRest.username}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Password:</span>
                            <span className="text-slate-305 font-bold">{currentChatRest.password}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {adminTab === 'complaints' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-6 bg-rose-600 rounded-full shadow-sm"></div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Complaints & Tickets</h3>
                </div>
                <div className="text-[10px] text-slate-500 font-bold">Total Complaints: {complaints.length}</div>
              </div>

              <div className="bg-slate-900/35 border border-slate-800/80 rounded-3xl overflow-hidden shadow-xl">
                {complaints.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-bold">No complaints received yet.</div>
                ) : (
                  <div className="overflow-x-auto select-text">
                    <table className="w-full border-collapse text-left text-xs font-bold text-slate-300">
                      <thead>
                        <tr className="bg-slate-950 border-b border-slate-850 text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Restaurant</th>
                          <th className="p-4">Subject</th>
                          <th className="p-4">Description</th>
                          <th className="p-4">Submitted Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {complaints.map(comp => (
                          <tr key={comp._id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="p-4">
                              <span className="text-white font-extrabold block">{comp.restaurantName}</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono">ID: {comp.restaurantId}</span>
                            </td>
                            <td className="p-4 text-rose-455 font-extrabold">{comp.subject}</td>
                            <td className="p-4 max-w-[350px] whitespace-pre-wrap leading-relaxed text-slate-350">{comp.description}</td>
                            <td className="p-4 text-slate-500 font-mono">
                              {new Date(comp.createdAt).toLocaleDateString('en-IN')} {new Date(comp.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                comp.status === 'Pending' 
                                  ? 'bg-amber-500/10 text-amber-550 border border-amber-500/20' 
                                  : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                              }`}>
                                {comp.status}
                              </span>
                            </td>
                            <td className="p-4 text-right select-none">
                              {comp.status === 'Pending' ? (
                                <button 
                                  onClick={() => handleResolveComplaint(comp._id)}
                                  className="bg-emerald-655 hover:bg-emerald-600 text-white font-extrabold text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-955/10"
                                >
                                  Resolve Ticket
                                </button>
                              ) : (
                                <div className="text-right">
                                  <span className="text-emerald-400 text-[10px] font-extrabold block">Resolved</span>
                                  {comp.resolvedAt && (
                                    <span className="text-slate-500 text-[8px] font-mono block mt-0.5">
                                      {new Date(comp.resolvedAt).toLocaleDateString('en-IN')}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Onboard Outlet Form Modal */}
        {showOnboardModal && (
          <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-in fade-in duration-200">
            <div className="bg-[#0f1422] rounded-3xl shadow-2xl w-full max-w-md border border-slate-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              <div className="p-5 bg-slate-900 border-b border-slate-855 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-855">
                    <img src="/logo.png" alt="KNIFE POS Logo" className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-extrabold uppercase tracking-wide text-xs">Onboard New Outlet</h3>
                </div>
                <button onClick={() => setShowOnboardModal(false)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4.5 text-xs font-bold text-slate-350">
                
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Outlet / Restaurant Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Bunty Biryani & Kababs" 
                    className="w-full bg-slate-955 border border-slate-855 text-white rounded-xl px-4 py-3 font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                    value={onboardForm.name}
                    onChange={e => setOnboardForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Owner / Manager Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Bunty Patra" 
                    className="w-full bg-slate-955 border border-slate-855 text-white rounded-xl px-4 py-3 font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                    value={onboardForm.owner}
                    onChange={e => setOnboardForm(prev => ({ ...prev, owner: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Owner Phone Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. 9861234567" 
                    className="w-full bg-slate-955 border border-slate-855 text-white rounded-xl px-4 py-3 font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                    value={onboardForm.phone || ''}
                    onChange={e => setOnboardForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Cuisine Category / Description</label>
                  <input 
                    type="text" 
                    placeholder="e.g. North Indian, Chinese, Tandoor" 
                    className="w-full bg-slate-955 border border-slate-855 text-white rounded-xl px-4 py-3 font-semibold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                    value={onboardForm.cuisine}
                    onChange={e => setOnboardForm(prev => ({ ...prev, cuisine: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 tracking-wider mb-1.5">Currency Code</label>
                    <input 
                      type="text" 
                      placeholder="e.g. ₹" 
                      className="w-full bg-slate-955 border border-slate-855 text-white rounded-xl px-4 py-3 font-black outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                      value={onboardForm.currency}
                      onChange={e => setOnboardForm(prev => ({ ...prev, currency: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 tracking-wider mb-1.5">Tax Rate (GST %)</label>
                    <input 
                      type="number" 
                      placeholder="5" 
                      className="w-full bg-slate-955 border border-slate-855 text-white rounded-xl px-4 py-3 font-bold outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                      value={onboardForm.taxRate}
                      onChange={e => setOnboardForm(prev => ({ ...prev, taxRate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3.5">
                  <button 
                    type="button" 
                    onClick={() => setShowOnboardModal(false)}
                    className="flex-1 bg-slate-900 border border-slate-855 hover:bg-slate-800 text-slate-305 font-extrabold py-3.5 rounded-xl uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-550 hover:to-red-650 text-white font-extrabold py-3.5 rounded-xl shadow-md uppercase tracking-wider text-[10px] cursor-pointer active:scale-98"
                  >
                    Create Outlet
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* New Outlet Success Credentials Modal */}
        {newOutletCredentials && (
          <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none animate-in fade-in duration-200">
            <div className="bg-[#0f1422] rounded-3xl shadow-2xl w-full max-w-md border border-emerald-500/30 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              <div className="p-5 bg-slate-900 border-b border-slate-855 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold uppercase tracking-wide text-xs">Outlet Created Successfully!</h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setNewOutletCredentials(null)} 
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs text-slate-300">
                <p className="font-semibold text-slate-400 leading-normal">
                  The outlet <span className="text-white font-extrabold">"{newOutletCredentials.name}"</span> has been registered. Give the following credentials to the restaurant owner so they can log in directly.
                </p>

                <div className="bg-slate-950/80 border border-slate-855/80 rounded-2xl p-4.5 space-y-3 font-mono shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Username / Login ID</span>
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-200 select-all font-bold">
                      <span>{newOutletCredentials.username}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newOutletCredentials.username);
                          alert('Username copied to clipboard!');
                        }}
                        className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Default Password</span>
                    <div className="flex justify-between items-center bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl text-slate-200 select-all font-bold">
                      <span>{newOutletCredentials.password}</span>
                      <button 
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newOutletCredentials.password);
                          alert('Password copied to clipboard!');
                        }}
                        className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="button"
                    onClick={() => setNewOutletCredentials(null)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-550 hover:to-teal-650 text-white font-extrabold py-3.5 rounded-xl shadow-md uppercase tracking-wider text-[10px] cursor-pointer transition-all active:scale-98"
                  >
                    Done & Return
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Restaurant Details Modal */}
        {selectedDetailsRestaurant && (() => {
          const stats = getRestaurantStats(selectedDetailsRestaurant);
          return (
            <DetailsModal 
              restaurant={selectedDetailsRestaurant} 
              stats={stats} 
              onClose={() => setSelectedDetailsRestaurant(null)} 
              onUpdateCredentials={handleUpdateCredentials}
            />
          );
        })()}

      </div>
    );
  }

  // 3. Render POS System for selected restaurant
  return (
    <POSWorkspace 
      key={currentRestaurant.id} 
      restaurant={currentRestaurant} 
      onExit={() => {
        if (user && user.role === 'restaurant') {
          handleLogout();
        } else {
          setCurrentRestaurant(null);
        }
      }} 
      user={user} 
    />
  );
}

export default App;
