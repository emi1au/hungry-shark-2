
import { Category, MenuItem, ModifierGroup } from './types';

export const CURRENCY = '£';
export const DELIVERY_CHARGE = 2.00;

// 7, esplanade building, Friars Rd, Barry CF62 5TJ
export const SHOP_LOCATION = {
  lat: 51.391629,
  lng: -3.273656,
  address: "7, Esplanade Building, Friars Rd, Barry CF62 5TJ"
};

export const MAX_DELIVERY_MILES = 8;

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.CHIPS]: 'yellow',
  [Category.FISH]: 'blue',
  [Category.PIES]: 'amber',
  [Category.SAUSAGES]: 'rose',
  [Category.CHICKEN]: 'teal',
  [Category.BITES]: 'indigo',
  [Category.KEBABS]: 'red',
  [Category.BURGERS]: 'orange',
  [Category.WRAPS]: 'emerald',
  [Category.SIDES]: 'purple',
  [Category.POTS]: 'lime',
  [Category.KIDS_MEALS]: 'pink',
  [Category.DRINKS]: 'cyan',
};

export const getCategoryColor = (category: Category): string => {
  return CATEGORY_COLORS[category] || 'slate';
};

export const getCategoryEmoji = (category: Category): string => {
  switch (category) {
    case Category.CHIPS: return '🍟';
    case Category.FISH: return '🐟';
    case Category.PIES: return '🥧';
    case Category.SAUSAGES: return '🌭';
    case Category.CHICKEN: return '🍗';
    case Category.BITES: return '🍿';
    case Category.KEBABS: return '🥙';
    case Category.BURGERS: return '🍔';
    case Category.WRAPS: return '🌯';
    case Category.SIDES: return '🧅';
    case Category.POTS: return '🥣';
    case Category.KIDS_MEALS: return '🧸';
    case Category.DRINKS: return '🥤';
    default: return '🍽️';
  }
};

export const getModifierGroupEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  
  if (lower.includes('size')) return '📏';
  if (lower.includes('salad')) return '🥗';
  if (lower.includes('sauce') || lower.includes('dip')) return '🥣';
  if (lower.includes('drink')) return '🥤';
  if (lower.includes('chips')) return '🍟';
  if (lower.includes('served with') || lower.includes('addons') || lower.includes('condiments')) return '➕';
  if (lower.includes('type') || lower.includes('style') || lower.includes('base') || lower.includes('meat')) return '🥩';
  if (lower.includes('upgrade')) return '⭐';
  
  return '✨';
};

export const getModifierEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  
  // Sizes
  if (['small', 'medium', 'large'].includes(lower));
  
  // Salad items
  if (lower.includes('lettuce')) return '🥬';
  if (lower.includes('tomato')) return '🍅';
  if (lower.includes('onion')) return '🧅';
  if (lower.includes('cucumber')) return '🥒';
  if (lower.includes('jalapeno')) return '🌶️';
  if (lower.includes('salad')) return '🥗';
  
  // Cheese
  if (lower.includes('cheese')) return '🧀';
  
  // Sauces & Condiments
  if (lower.includes('chilli')) return '🌶️';
  if (lower.includes('garlic')) return '🧄';
  if (lower.includes('mayo')) return '🥚';
  if (lower.includes('ketchup') || lower.includes('red sauce')) return '🍅';
  if (lower.includes('brown sauce')) return '🟤';
  if (lower.includes('vinegar')) return '🍾';
  if (lower.includes('salt')) return '🧂';
  if (lower.includes('sauce') || lower.includes('dip')) return '🥣';
  if (lower.includes('gravy')) return '🫗';
  if (lower.includes('curry')) return '🍛';
  
  // Add-ons
  if (lower.includes('chips')) return '🍟';
  if (lower.includes('pitta')) return '🫓';
  if (lower.includes('rice')) return '🍚';
  if (lower.includes('beans')) return '🥫';
  if (lower.includes('peas')) return '🟢';
  if (lower.includes('fish')) return '🐟';
  if (lower.includes('sausage')) return '🌭';
  if (lower.includes('burger')) return '🍔';
  if (lower.includes('chicken')) return '🍗';
  if (lower.includes('meat')) return '🥩';
  if (lower.includes('donner')) return '🥙';
  
  // Drinks
  if (lower.includes('coke') || lower.includes('pepsi') || lower.includes('fanta') || lower.includes('sprite') || lower.includes('7up') || lower.includes('tango')) return '🥤';
  if (lower.includes('water')) return '💧';
  if (lower.includes('juice') || lower.includes('fruit shoot')) return '🧃';
  
  // Default fallback
  return '';
};

export const getModifierGroupIdsForItem = (item: MenuItem): string[] => {
  return item.modifierGroupIds || [];
};

// Initial Data for dynamic state
export const DEFAULT_MODIFIER_GROUPS: ModifierGroup[] = [
  // --- SIZES ---
  {
    id: 'size_fish',
    name: "Fish Size",
    allowMultiple: false,
    options: [
      { name: "Medium", price: 0, triggersGroupId: 'fish_chip_opt_med' },
      { name: "Large", price: 1.50, triggersGroupId: 'fish_chip_opt_lrg' }
    ]
  },
  {
    id: 'cod_bites_size',
    name: "How Many?",
    allowMultiple: false,
    options: [
      { name: "1 Pc", price: 0 },
      { name: "4 Pcs", price: 4.70 }, // 1.80 + 4.70 = 6.50
    ]
  },
  {
    id: 'size_kebab',
    name: "Kebab Size",
    allowMultiple: false,
    options: [
      { name: "Medium", price: 0 },
      { name: "Large", price: 2.00 }
    ]
  },
  {
    id: 'size_chips',
    name: "Portion Size",
    allowMultiple: false,
    options: [
      { name: "Small", price: 0, triggersGroupId: 'chips_sauce' },
      { name: "Medium", price: 0.80, triggersGroupId: 'chips_sauce' },
      { name: "Large", price: 1.50, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'chip_combo_selection',
    name: "Select Type",
    allowMultiple: false,
    options: [
      { name: "Cheese & Chips", price: 4.70, triggersGroupId: 'size_combo_ml' },
      { name: "Chips & Curry", price: 4.50, triggersGroupIds: ['size_combo_ml', 'specialty_curry_type'] },
      { name: "Chips & Gravy", price: 4.50, triggersGroupId: 'size_combo_ml' },
      { name: "Cheese, Chips & Curry", price: 5.70, triggersGroupIds: ['size_combo_ml', 'specialty_curry_type'] },
      { name: "Cheese, Chips & Gravy", price: 5.70, triggersGroupId: 'size_combo_ml' },
      { name: "Cheese & Beans (Lrg)", price: 6.70 }, // Fixed Large
      { name: "Chip Butty (Lrg)", price: 4.20 }  // Fixed Large
    ]
  },
  {
    id: 'specialty_curry_type',
    name: "Curry Option",
    allowMultiple: false,
    options: [
      { name: "Mild Curry", price: 0 },
      { name: "Irish Curry", price: 0 },
      { name: "Fruit Curry", price: 0 }
    ]
  },
  {
    id: 'size_combo_ml',
    name: "Size",
    allowMultiple: false,
    options: [
      { name: "Medium", price: 0 },
      { name: "Large", price: 1.00 }
    ]
  },
  {
    id: 'size_burger',
    name: "Burger Size",
    allowMultiple: false,
    options: [
      { name: "1/4 lb", price: 0 },
      { name: "1/2 lb", price: 1.50 }
    ]
  },
  {
    id: 'size_side',
    name: "Pot Size",
    allowMultiple: false,
    options: [
      { name: "Small", price: 0 },
      { name: "Large", price: 1.00 }
    ]
  },
  // -- SAUSAGE SIZES --
  {
    id: 'size_sausage_plain',
    name: "Sausage Size",
    allowMultiple: false,
    options: [
      { name: "Small", price: 0, triggersGroupId: 'opt_chips_sausage_small' }, // Base 1.50
      { name: "Large", price: 0.70, triggersGroupId: 'opt_chips_sausage_large' } // Base 1.50 + 0.70 = 2.20
    ]
  },
  {
    id: 'size_sausage_battered',
    name: "Sausage Size",
    allowMultiple: false,
    options: [
      { name: "Small", price: 0, triggersGroupId: 'opt_chips_battered_small' }, // Base 1.70
      { name: "Large", price: 0.80, triggersGroupId: 'opt_chips_battered_large' } // Base 1.70 + 0.80 = 2.50
    ]
  },

  // --- OPTIONS ---
  {
    id: 'fish_chip_opt_med',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.00, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'fish_chip_opt_lrg',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.50, triggersGroupId: 'chips_sauce' }
    ]
  },
  {
    id: 'chips_cod_bites',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.00, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  {
    id: 'chips_fish_cake',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.20, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  {
    id: 'pie_chips_opt',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "Pie Only", price: 0 },
      { name: "With Chips", price: 3.00, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  // -- SAUSAGE CHIP OPTIONS (Calculated to match totals) --
  {
    id: 'opt_chips_sausage_small',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.40, triggersGroupId: 'chips_sauce' } // 1.50 + 3.40 = 4.90
    ]
  },
  {
    id: 'opt_chips_sausage_large',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.40, triggersGroupId: 'chips_sauce' } // 2.20 + 3.40 = 5.60
    ]
  },
  {
    id: 'opt_chips_battered_small',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.30, triggersGroupId: 'chips_sauce' } // 1.70 + 3.30 = 5.00
    ]
  },
  {
    id: 'opt_chips_battered_large',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Add Chips", price: 3.40, triggersGroupId: 'chips_sauce' } // 2.50 + 3.40 = 5.90
    ]
  },

  {
    id: 'kebab_base',
    name: "Served With",
    allowMultiple: true,
    maxSelection: 2,
    options: [
      { name: "Pitta Bread", price: 0 },
      { name: "On Chips", price: 0, triggersGroupIds: ['condiments', 'chips_sauce'] }, // Triggers multiple
      { name: "Extra Pitta", price: 1.20 },
      { name: "Rice", price: 1.50 }
    ]
  },
  {
    id: 'salad',
    name: "Salad",
    allowMultiple: true,
    options: [
      { name: "All Salad", price: 0 },
      { name: "Lettuce", price: 0 },
      { name: "Onion", price: 0 },
      { name: "Tomato", price: 0 },
      { name: "Cucumber", price: 0 },
      { name: "Jalapeno", price: 0 },
      { name: "Slice Cheese", price: 0 },
      { name: "Mozz Cheese", price: 1.50 },
      { name: "Salad Separate", price: 0 },
      { name: "No Salad", price: 0 }
    ]
  },
  {
    id: 'sauce',
    name: "Sauce",
    allowMultiple: true,
    options: [
      { name: "Chilli Sauce", price: 0 },
      { name: "Garlic Mayo", price: 0 },
      { name: "Mayo", price: 0 },
      { name: "Ketchup", price: 0 },
      { name: "Mint Sauce", price: 0 },
      { name: "BBQ Sauce", price: 0 },
      { name: "Burger Sauce", price: 0 },
      { name: "Relish", price: 0 },
      { name: "No Sauce", price: 0 },
      { name: "Sauce Separate", price: 0.50 }
    ]
  },
  {
    id: 'condiments',
    name: "Condiments",
    allowMultiple: true,
    options: [
      { name: "Salt & Vinegar", price: 0 },
      { name: "Salt", price: 0 },
      { name: "Vinegar", price: 0 },
      { name: "Plain", price: 0 }
    ]
  },
  {
    id: 'meal_upgrade',
    name: "Make it a Meal?",
    allowMultiple: false,
    options: [
      { name: "Burger Only", price: 0 },
      { name: "Meal", price: 3.00, triggersGroupIds: ['meal_drinks', 'condiments', 'chips_sauce'] }
    ]
  },
  {
    id: 'wrap_meal_upgrade',
    name: "Make it a Meal?",
    allowMultiple: false,
    options: [
      { name: "Wrap Only", price: 0 },
      { name: "Meal", price: 3.50, triggersGroupIds: ['meal_drinks', 'condiments', 'chips_sauce'] }
    ]
  },
  {
    id: 'meal_drinks',
    name: "Meal Drink Selection",
    allowMultiple: false,
    options: [
      { name: "Coke", price: 0 },
      { name: "Zero Coke", price: 0 },
      { name: "Cherry", price: 0 },
      { name: "Pepsi Max", price: 0 },
      { name: "Dr Pepper", price: 0 },
      { name: "7up", price: 0 },
      { name: "Fanta Lemon", price: 0 },
      { name: "Apple Tango", price: 0 },
      { name: "Orange Tango", price: 0 },
      { name: "Mango", price: 0 },
      { name: "Rio", price: 0 },
      { name: "Water", price: 0 },
      { name: "Ribena", price: 0 },
      { name: "Fruit Shoot Blackcurrant", price: 0 },
      { name: "Fruit Shoot Orange", price: 0 }
    ]
  },
  {
    id: 'chips_sauce',
    name: "Sauce & Toppings",
    allowMultiple: true,
    options: [
      { name: "Mild Curry", price: 1.40 },
      { name: "Irish Curry", price: 1.40 },
      { name: "Fruit Curry", price: 1.40 },
      { name: "Gravy", price: 1.40 },
      { name: "Mushy Peas", price: 2.20 },
      { name: "Beans", price: 2.20 },
      { name: "Cheese", price: 1.50 }
    ]
  },
  {
    id: 'chips_addons',
    name: "Add Extras",
    allowMultiple: true,
    options: [
      { name: "Sausage (Small)", price: 1.50 },
      { name: "Sausage (Large)", price: 2.20 },
      { name: "Battered Sausage (Small)", price: 1.70 },
      { name: "Battered Sausage (Large)", price: 2.50 },
      { name: "Fish Cake", price: 2.00 }
    ]
  },
  {
    id: 'kebab_burger_meat',
    name: "Meat Choice",
    allowMultiple: false,
    options: [
      { name: "Doner Meat", price: 0 },
      { name: "Chicken Meat", price: 0 },
      { name: "Mix Meat", price: 0 }
    ]
  },
  
  // --- NEW SIDES MODIFIERS ---
  {
    id: 'sauce_pot_type',
    name: "Select Side",
    allowMultiple: false,
    options: [
      { name: "Mild Curry", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Irish Curry", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Fruit Curry", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Gravy", price: 1.40, triggersGroupId: 'sauce_pot_size_upgrade' },
      { name: "Mushy Peas", price: 2.20 }, // Fixed Large
      { name: "Beans", price: 2.20 } // Fixed Large
    ]
  },
  {
    id: 'sauce_pot_size_upgrade',
    name: "Pot Size",
    allowMultiple: false,
    options: [
      { name: "Small", price: 0 },
      { name: "Large", price: 0.80 } // 1.40 + 0.80 = 2.20
    ]
  },
  {
    id: 'side_add_chips',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "No Chip", price: 0 },
      { name: "Small Chips", price: 2.70, triggersGroupIds: ['chips_sauce', 'condiments'] },
      { name: "Medium Chips", price: 3.50, triggersGroupIds: ['chips_sauce', 'condiments'] },
      { name: "Large Chips", price: 4.20, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  {
    id: 'chicken_breast_chips',
    name: "Add Chips?",
    allowMultiple: false,
    options: [
      { name: "Just Chicken", price: 0 },
      { name: "With Chips", price: 2.90, triggersGroupIds: ['chips_sauce', 'condiments'] }
    ]
  },
  {
    id: 'chicken_curry_style',
    name: "Serve With",
    allowMultiple: false,
    options: [
      { name: "Rice", price: 0 },
      { name: "Chips", price: 0, triggersGroupId: 'condiments' },
      { name: "Chips & Rice", price: 2.00, triggersGroupId: 'condiments' }
    ]
  },
  // --- KIDS MEAL MODIFIERS ---
  {
    id: 'kids_drink_select',
    name: "Select Drink",
    allowMultiple: false,
    options: [
      { name: "Coke", price: 0 },
      { name: "Zero Coke", price: 0 },
      { name: "Fanta", price: 0 },
      { name: "7up", price: 0 },
      { name: "Dr Pepper", price: 0 },
      { name: "Fruit Shoot Orange", price: 0 },
      { name: "Fruit Shoot Blackcurrant", price: 0 },
      { name: "Water", price: 0 }
    ]
  },
  {
    id: 'kids_sausage_type',
    name: "Sausage Type",
    allowMultiple: false,
    options: [
      { name: "Sausage", price: 0 },
      { name: "Battered Sausage", price: 0 }
    ]
  },
  {
    id: 'kids_sauce_choice',
    name: "Select Sauce",
    allowMultiple: false,
    options: [
      { name: "Mild Curry", price: 0 },
      { name: "Irish Curry", price: 0 },
      { name: "Fruit Curry", price: 0 },
      { name: "Gravy", price: 0 },
      { name: "Beans", price: 0 },
      { name: "Mushy Peas", price: 0 }
    ]
  },
  
  // --- DRINK OPTIONS ---
  {
    id: 'all_drinks_opt',
    name: "Select Drink",
    allowMultiple: false,
    options: [
      { name: "Coke", price: 1.50 },
      { name: "Zero Coke", price: 1.50 },
      { name: "Cherry", price: 1.50 },
      { name: "Pepsi Max", price: 1.50 },
      { name: "Dr Pepper", price: 1.50 },
      { name: "7up", price: 1.50 },
      { name: "Fanta Lemon", price: 1.50 },
      { name: "Apple Tango", price: 1.50 },
      { name: "Orange Tango", price: 0 },
      { name: "Mango", price: 1.50 },
      { name: "Rio", price: 1.50 },
      { name: "Water", price: 1.50 },
      { name: "Ribena", price: 1.50 },
      { name: "Fruit Shoot Blackcurrant", price: 1.50 },
      { name: "Fruit Shoot Orange", price: 1.50 }
    ]
  },
  // --- DIP OPTIONS (For new Dips item) ---
  {
    id: 'dip_flavours',
    name: "Select Dip",
    allowMultiple: false,
    options: [
      { name: "Chilli Sauce", price: 0 },
      { name: "Garlic Mayo", price: 0 },
      { name: "Mayo", price: 0 },
      { name: "Ketchup", price: 0 },
      { name: "BBQ Sauce", price: 0 },
      { name: "Burger Sauce", price: 0 },
      { name: "Relish", price: 0 },
      { name: "Mint Sauce", price: 0 }
    ]
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // CHIPS
  {
    id: '12',
    name: 'Chips',
    price: 2.70, // Base Price (Small)
    category: Category.CHIPS,
    modifierGroupIds: ['size_chips', 'condiments', 'chips_addons']
  },
  {
    id: 'chips_cheese',
    name: 'Cheese & Chips',
    price: 4.70,
    category: Category.CHIPS,
    modifierGroupIds: ['size_combo_ml', 'condiments', 'chips_addons']
  },
  {
    id: 'chips_curry',
    name: 'Chips & Curry',
    price: 4.50,
    category: Category.CHIPS,
    modifierGroupIds: ['size_combo_ml', 'specialty_curry_type', 'condiments', 'chips_addons']
  },
  {
    id: 'chips_gravy',
    name: 'Chips & Gravy',
    price: 4.50,
    category: Category.CHIPS,
    modifierGroupIds: ['size_combo_ml', 'condiments', 'chips_addons']
  },
  {
    id: 'chips_cheese_curry',
    name: 'Cheese, Chips & Curry',
    price: 5.70,
    category: Category.CHIPS,
    modifierGroupIds: ['size_combo_ml', 'specialty_curry_type', 'condiments', 'chips_addons']
  },
  {
    id: 'chips_cheese_gravy',
    name: 'Cheese, Chips & Gravy',
    price: 5.70,
    category: Category.CHIPS,
    modifierGroupIds: ['size_combo_ml', 'condiments', 'chips_addons']
  },
  {
    id: 'chips_cheese_beans',
    name: 'Cheese & Beans (Lrg)',
    price: 6.70,
    category: Category.CHIPS,
    modifierGroupIds: ['condiments', 'chips_addons']
  },
  {
    id: 'chip_butty',
    name: 'Chip Butty (Lrg)',
    price: 4.20,
    category: Category.CHIPS,
    modifierGroupIds: ['condiments', 'chips_addons', 'chips_sauce']
  },

  // FISH
  {
    id: 'cod_fillet',
    name: 'Cod',
    price: 7.50,
    category: Category.FISH,
    modifierGroupIds: ['size_fish', 'condiments']
  },
  {
    id: 'cod_bites_main',
    name: 'Cod Bites',
    price: 1.80,
    category: Category.FISH,
    modifierGroupIds: ['cod_bites_size', 'chips_cod_bites']
  },
  {
    id: 'fish_cake',
    name: 'Fish Cake',
    price: 2.00,
    category: Category.FISH,
    modifierGroupIds: ['chips_fish_cake']
  },

  // PIES
  {
    id: 'pie_1',
    name: 'Steak & Kidney Pie',
    price: 4.00,
    category: Category.PIES,
    modifierGroupIds: ['pie_chips_opt']
  },
  {
    id: 'pie_2',
    name: 'Chicken & Mushroom Pie',
    price: 4.00,
    category: Category.PIES,
    modifierGroupIds: ['pie_chips_opt']
  },
  {
    id: 'pie_3',
    name: 'Minced Beef & Onion Pie',
    price: 4.00,
    category: Category.PIES,
    modifierGroupIds: ['pie_chips_opt']
  },

  // SAUSAGES
  {
    id: 'saus_plain',
    name: 'Sausage',
    price: 1.50, // Small Base
    category: Category.SAUSAGES,
    modifierGroupIds: ['size_sausage_plain', 'condiments']
  },
  {
    id: 'saus_battered',
    name: 'Battered Sausage',
    price: 1.70, // Small Base
    category: Category.SAUSAGES,
    modifierGroupIds: ['size_sausage_battered', 'condiments']
  },
  
  // Kebabs - Removed Condiments/ChipsSauce from default, added triggers to 'On Chips'
  {
    id: '4',
    name: 'Doner Meat',
    price: 9.00,
    category: Category.KEBABS,
    modifierGroupIds: ['size_kebab', 'kebab_base', 'salad', 'sauce']
  },
  {
    id: '5',
    name: 'Chicken Kebab',
    price: 9.00,
    category: Category.KEBABS,
    modifierGroupIds: ['size_kebab', 'kebab_base', 'salad', 'sauce']
  },
  {
    id: '6',
    name: 'Mix Kebab',
    price: 9.00,
    category: Category.KEBABS,
    modifierGroupIds: ['size_kebab', 'kebab_base', 'salad', 'sauce']
  },

  // Wraps - Removed Condiments/ChipsSauce from default, added triggers to 'Meal Upgrade'
  {
    id: 'wrap_chic_strips',
    name: 'Chicken Strips Wrap',
    price: 7.00,
    category: Category.WRAPS,
    modifierGroupIds: ['wrap_meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'wrap_doner',
    name: 'Doner Meat Wrap',
    price: 7.00,
    category: Category.WRAPS,
    modifierGroupIds: ['wrap_meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'wrap_chic_kebab',
    name: 'Chicken Kebab Wrap',
    price: 7.00,
    category: Category.WRAPS,
    modifierGroupIds: ['wrap_meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'wrap_mix',
    name: 'Mix Kebab Wrap',
    price: 7.00,
    category: Category.WRAPS,
    modifierGroupIds: ['wrap_meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'wrap_veggie',
    name: 'Veggie Wrap',
    price: 7.00,
    category: Category.WRAPS,
    modifierGroupIds: ['wrap_meal_upgrade', 'salad', 'sauce']
  },

  // Burgers - Removed Condiments/ChipsSauce from default, added triggers to 'Meal Upgrade'
  {
    id: 'burg_beef',
    name: 'Beef Burger',
    price: 5.50,
    category: Category.BURGERS,
    modifierGroupIds: ['size_burger', 'meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'burg_cheese',
    name: 'Cheese Burger',
    price: 5.50,
    category: Category.BURGERS,
    modifierGroupIds: ['size_burger', 'meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'burg_chicken',
    name: 'Chicken Burger',
    price: 5.50,
    category: Category.BURGERS,
    modifierGroupIds: ['size_burger', 'meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'burg_veggie',
    name: 'Veggie Burger',
    price: 5.50,
    category: Category.BURGERS,
    modifierGroupIds: ['size_burger', 'meal_upgrade', 'salad', 'sauce']
  },
  {
    id: 'burg_kebab',
    name: 'Kebab Burger',
    price: 5.50,
    category: Category.BURGERS,
    modifierGroupIds: ['kebab_burger_meat', 'size_burger', 'meal_upgrade', 'salad', 'sauce']
  },

  // KIDS MEALS - Updated to use full 'meal_drinks' list
  {
    id: 'kids_1',
    name: "Kid's 1 - Fish Cake",
    description: "Fish cake, chips & drink 330ml",
    price: 5.50,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['meal_drinks', 'condiments']
  },
  {
    id: 'kids_2',
    name: "Kid's 2 - Cod Bites",
    description: "Cod bites (2), chips & drink 330ml",
    price: 6.00,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['meal_drinks', 'condiments']
  },
  {
    id: 'kids_3',
    name: "Kid's 3 - Sausage",
    description: "Sausage or batter, chips & drink 330ml",
    price: 5.50,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['kids_sausage_type', 'meal_drinks', 'condiments']
  },
  {
    id: 'kids_4',
    name: "Kid's 4 - Nuggets",
    description: "Chicken nuggets (4), chips & drink 330ml",
    price: 5.50,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['meal_drinks', 'condiments']
  },
  {
    id: 'kids_5',
    name: "Kid's 5 - Strips",
    description: "Chicken strips (2), chips & drink 330ml",
    price: 6.00,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['meal_drinks', 'condiments']
  },
  {
    id: 'kids_6',
    name: "Kid's 6 - Chips & Sauce",
    description: "Chips, sauce & drink 330ml",
    price: 5.50,
    category: Category.KIDS_MEALS,
    modifierGroupIds: ['kids_sauce_choice', 'meal_drinks', 'condiments']
  },

  // CHICKEN
  {
    id: 'chic_breast',
    name: 'Chicken Breast',
    price: 5.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['chicken_breast_chips']
  },
  {
    id: 'chic_curry_meal',
    name: 'Chicken Curry',
    price: 10.00,
    category: Category.CHICKEN,
    modifierGroupIds: ['chicken_curry_style']
  },

  // BITES
  {
    id: 'chic_strips',
    name: 'Chicken Strips (5 pcs)',
    price: 6.00,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'chic_nuggets',
    name: 'Chicken Nuggets (6 pcs)',
    price: 3.00,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'spicy_wings',
    name: 'Spicy Wings (6 pcs)',
    price: 5.00,
    category: Category.BITES,
    modifierGroupIds: ['side_add_chips']
  },

  // SIDES & POTS
  {
    id: 'sauce_pot_main',
    name: 'Sauce Pot',
    price: 0,
    category: Category.POTS,
    modifierGroupIds: ['sauce_pot_type']
  },
  {
    id: 'dips_main',
    name: 'Dips',
    price: 0.50,
    category: Category.POTS,
    modifierGroupIds: ['dip_flavours']
  },
  {
    id: 'cheese_sticks',
    name: 'Breaded Cheese Sticks (6)',
    price: 5.00,
    category: Category.SIDES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'jalapeno_cream',
    name: 'Jalapeno Cream Cheese (6)',
    price: 5.00,
    category: Category.SIDES,
    modifierGroupIds: ['side_add_chips']
  },
  {
    id: 'green_salad',
    name: 'Green Salad',
    price: 3.00,
    category: Category.SIDES,
    modifierGroupIds: ['salad', 'sauce']
  },
  {
    id: '14_bread_roll',
    name: 'Bread Roll',
    price: 1.00,
    category: Category.SIDES,
    modifierGroupIds: []
  },

  // Drinks - Updated
  {
    id: 'drinks_all',
    name: 'Drinks',
    price: 0,
    category: Category.DRINKS,
    modifierGroupIds: ['all_drinks_opt']
  }
];
