export type UserRole = "customer" | "restaurantOwner" | "deliveryPartner" | "admin";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  isApproved?: boolean;
  status?: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
}

export interface BusinessHours {
  open: string;
  close: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  ratingCount: number;
  image: string;
  timings: string;
  businessHours?: BusinessHours;
  ownerId: string;
  isApproved: boolean;
  address: string;
  coords: Coordinates;
  featured?: boolean;
  offers?: string;
  bankDetails?: BankDetails;
  taxNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FoodAddon {
  id: string;
  name: string;
  price: number;
}

export interface FoodVariant {
  id: string;
  name: string;
  price: number;
}

export interface FoodItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVeg: boolean;
  isAvailable: boolean;
  addons?: FoodAddon[];
  variants?: FoodVariant[];
  rating?: number;
  offers?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | "placed" 
  | "accepted" 
  | "cooking" 
  | "readyForPickup" 
  | "pickedUp" 
  | "delivered" 
  | "cancelled";

export interface CartItem {
  foodId: string;
  name: string;
  price: number;
  qty: number;
  isVeg: boolean;
  image: string;
  restaurantId: string;
  restaurantName: string;
  selectedAddons?: FoodAddon[];
  selectedVariant?: FoodVariant;
}

export interface OrderItem {
  foodId: string;
  name: string;
  price: number;
  qty: number;
  isVeg: boolean;
  addons?: string[];
  variant?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCoords: Coordinates;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantCoords: Coordinates;
  restaurantOwnerId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: "UPI" | "Card" | "Wallet" | "Cash on Delivery";
  paymentStatus: "pending" | "paid" | "refunded";
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerCoords?: Coordinates;
  deliveryInstructions?: string;
  otp?: string;
  ratingRestaurant?: number;
  ratingDriver?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  code: string;
  discount: number;
  type: "flat" | "percent";
  minOrder: number;
  description: string;
  isAvailable: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  restaurantId: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isSeen: boolean;
}

export interface WalletEarnings {
  userId: string;
  balance: number;
  totalEarned: number;
  transactions: {
    id: string;
    orderId?: string;
    amount: number;
    type: "credit" | "debit";
    description: string;
    date: string;
  }[];
}

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}
