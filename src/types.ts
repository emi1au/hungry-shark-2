
export enum Category {
  CHIPS = 'Chips',
  FISH = 'Fish',
  PIES = 'Pies',
  SAUSAGES = 'Sausages',
  CHICKEN = 'Chicken',
  BITES = 'Bites',
  KEBABS = 'Kebabs',
  BURGERS = 'Burgers',
  WRAPS = 'Wraps',
  SIDES = 'Sides',
  POTS = 'Pots',
  KIDS_MEALS = 'Kids Meals',
  DRINKS = 'Drinks',
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  description?: string;
  image?: string;
  modifierGroupIds: string[]; // IDs of groups that apply to this item
}

export interface ModifierOption {
  name: string;
  price: number;
  triggersGroupId?: string; // Legacy single trigger
  triggersGroupIds?: string[]; // New: Trigger multiple groups (e.g. Meal -> Drinks + Condiments)
  groupId?: string; // ID of the group this option belongs to
  groupName?: string; // Name of the group (e.g., "Salad", "Sauce")
}

export interface ModifierGroup {
  id: string;
  name: string;
  options: ModifierOption[];
  allowMultiple: boolean;
  maxSelection?: number;
}

export interface CartItem extends MenuItem {
  cartId: string; // Unique ID for the instance in cart
  quantity: number;
  modifiers: ModifierOption[]; // Changed from string[] to store price info too
  manualPrice?: number; // Override the calculated price (unit price)
  instructions?: string; // Special instructions or comments
}

export type OrderType = 'Takeaway' | 'Delivery';

export interface CustomerDetails {
  phone: string;
  postcode: string;
  address: string;
  distance?: number;
}

export interface Order {
  id: number;
  items: CartItem[];
  total: number;
  date: Date;
  paymentMethod: 'Cash' | 'Card';
  amountTendered?: number;
  changeDue?: number;
  orderType: OrderType;
  customer?: CustomerDetails;
}

export interface OrderAnalysis {
  items: {
    name: string;
    quantity: number;
    modifiers?: string[];
  }[];
  confirmationMessage: string;
}

export interface PrinterDevice {
  id: string;
  name: string;
  type: 'bluetooth' | 'network';
  status: 'connected' | 'disconnected';
  ipAddress?: string;
  port?: string;
}
