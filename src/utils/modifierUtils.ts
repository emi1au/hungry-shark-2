
import { ModifierOption } from '../types';

export const adjustModifierPrices = (itemCategory: string, modifiers: ModifierOption[]): ModifierOption[] => {
  const adjusted = modifiers.map(m => ({ ...m }));

  if (['Kebabs', 'Burgers', 'Wraps'].includes(itemCategory)) {
    const sauceModifiers = adjusted.filter(m => m.groupId === 'sauce');

    const sauceSeparate = sauceModifiers.find(m => m.name === 'Sauce Separate');
    const sauceSeparateSelected = !!sauceSeparate;

    // Countable sauces
    const countableSauces = sauceModifiers.filter(
      m => m.name !== 'Sauce Separate' && m.name !== 'No Sauce'
    );

    countableSauces.forEach((m, index) => {
      if (sauceSeparateSelected && index >= 2) {
        m.price = 0.50;
      } else {
        m.price = 0;
      }
    });

    // Sauce Separate itself is always free
    if (sauceSeparate) {
      sauceSeparate.price = 0;
    }
  }

  return adjusted;
};

export const calculateChipsPrice = (itemName: string, modifiers: ModifierOption[]): number | null => {
  if (itemName !== 'Chips') return null;

  const sizeMod = modifiers.find(m => ['Small', 'Medium', 'Large'].includes(m.name));
  const size = sizeMod ? sizeMod.name : 'Small';

  const curries = modifiers.filter(m => ['Mild Curry', 'Irish Curry', 'Fruit Curry', 'Gravy'].includes(m.name));
  const beansPeas = modifiers.filter(m => ['Beans', 'Mushy Peas'].includes(m.name));
  const cheeses = modifiers.filter(m => m.name === 'Cheese');

  const extraModifiers = modifiers.filter(m => 
    !['Small', 'Medium', 'Large', 'Mild Curry', 'Irish Curry', 'Fruit Curry', 'Gravy', 'Beans', 'Mushy Peas', 'Cheese'].includes(m.name)
  );

  const hasCurryOrGravy = curries.length > 0;
  const hasBeansOrPeas = beansPeas.length > 0;
  const hasCheese = cheeses.length > 0;

  let baseComboPrice = 0;

  if (size === 'Small') {
    if ((hasCurryOrGravy || hasBeansOrPeas) && hasCheese) {
      baseComboPrice = 5.50;
    } else if (hasCurryOrGravy) {
      baseComboPrice = 4.10;
    } else if (hasBeansOrPeas) {
      baseComboPrice = 4.90; // 2.70 + 2.20
    } else if (hasCheese) {
      baseComboPrice = 4.20; // 2.70 + 1.50
    } else {
      baseComboPrice = 2.70;
    }
  } else if (size === 'Medium') {
    if ((hasCurryOrGravy || hasBeansOrPeas) && hasCheese) {
      baseComboPrice = 5.70;
    } else if (hasCurryOrGravy) {
      baseComboPrice = 4.50;
    } else if (hasBeansOrPeas) {
      baseComboPrice = 5.70; // 3.50 + 2.20
    } else if (hasCheese) {
      baseComboPrice = 4.70;
    } else {
      baseComboPrice = 3.50;
    }
  } else if (size === 'Large') {
    if ((hasCurryOrGravy || hasBeansOrPeas) && hasCheese) {
      baseComboPrice = 6.70;
    } else if (hasCurryOrGravy) {
      baseComboPrice = 5.50;
    } else if (hasBeansOrPeas) {
      baseComboPrice = 6.40;
    } else if (hasCheese) {
      baseComboPrice = 5.70;
    } else {
      baseComboPrice = 4.20;
    }
  }

  let extraCost = extraModifiers.reduce((sum, m) => sum + m.price, 0);

  if (hasBeansOrPeas && hasCurryOrGravy) {
    extraCost += curries.length * 1.40;
    extraCost += (beansPeas.length - 1) * 2.20;
  } else if (hasBeansOrPeas) {
    extraCost += (beansPeas.length - 1) * 2.20;
  } else if (hasCurryOrGravy) {
    extraCost += (curries.length - 1) * 1.40;
  }

  if (hasCheese) {
    extraCost += (cheeses.length - 1) * 1.50;
  }

  return baseComboPrice + extraCost;
};

export const isInlineModifier = (groupId?: string) => {
  if (!groupId) return true;
  const id = groupId.toLowerCase();
  
  const NEW_LINE_GROUPS = [
    'salad', 
    'sauce', 
    'condiments', 
    'pie_addons', 
    'chips_sauce', 
    'side_add_chips', 
    'chips_addons',
    'meal_upgrade',
    'wrap_meal_upgrade',
    'meal_drinks',
    'kebab_base',
    'kebab_burger_meat'
  ];
  
  return !NEW_LINE_GROUPS.includes(id);
};

export const getModifierSuperGroup = (groupId?: string) => {
  if (!groupId) return 'misc';
  const id = groupId.toLowerCase();
  
  // 1. Size
  if (
    id.includes('size') || 
    id === 'cod_bites_size'
  ) return 'size';

  // 2. Type / Base
  if (
    id === 'kids_sausage_type' ||
    id === 'specialty_curry_type' ||
    id === 'chicken_curry_style' ||
    id === 'kebab_base' ||
    id === 'kebab_burger_meat' ||
    id === 'chip_combo_selection'
  ) return 'type';

  // 3. Upgrade
  if (
    id === 'meal_upgrade' ||
    id === 'wrap_meal_upgrade'
  ) return 'upgrade';

  // 4. Add Chips
  if (
    id.includes('chip_opt') ||
    id.includes('chips_opt') ||
    id.includes('opt_chips') ||
    id === 'chips_cod_bites' ||
    id === 'chips_fish_cake' ||
    id === 'chicken_breast_chips' ||
    id === 'side_add_chips'
  ) return 'add_chips';

  // 5. Drink
  if (
    id === 'meal_drinks' ||
    id === 'kids_drink_select' ||
    id === 'all_drinks_opt' ||
    id.includes('drink')
  ) return 'drink';

  // 6. Salad
  if (id === 'salad') return 'salad';

  // 7. Sauce (Basic)
  if (
    id === 'sauce' || 
    id === 'kids_sauce_choice' || 
    id === 'sauce_pot_type' || 
    id === 'dip_flavours'
  ) return 'sauce_basic';

  // 8. Condiments
  if (id === 'condiments') return 'condiments';

  // 9. Sauce & Toppings
  if (id === 'chips_sauce') return 'sauce_toppings';

  // 10. Addons
  if (id === 'chips_addons' || id === 'pie_addons') return 'addons';
  
  return id;
};

export const getModifierPriority = (groupId?: string) => {
  if (!groupId) return 999;
  const superGroup = getModifierSuperGroup(groupId);
  
  switch (superGroup) {
    case 'size': return 10;
    case 'type': return 20;
    case 'upgrade': return 30;
    case 'add_chips': return 40;
    case 'drink': return 50;
    case 'salad': return 60;
    case 'sauce_basic': return 70;
    case 'condiments': return 80;
    case 'sauce_toppings': return 90;
    case 'addons': return 100;
    default: return 999;
  }
};
