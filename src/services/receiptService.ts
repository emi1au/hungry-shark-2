
import { Order, CartItem, Category, ModifierOption } from '../types';
import { isInlineModifier, getModifierPriority, getModifierSuperGroup } from '../utils/modifierUtils';
import { DELIVERY_CHARGE } from '../constants';

export const generateReceiptContent = (order: Order, tillName: string): string => {
  const ESC = '\x1b';
  const GS = '\x1d';

  const ALIGN_CENTER = ESC + 'a' + '\x01';
  const ALIGN_LEFT = ESC + 'a' + '\x00';
  const ALIGN_RIGHT = ESC + 'a' + '\x02';

  const TXT_NORMAL = GS + '!' + '\x00';
  const TXT_QUAD = GS + '!' + '\x11';
  const TXT_LARGE = GS + '!' + '\x10';

  const FONT_A = ESC + 'M' + '\x00';
  const FONT_B = ESC + 'M' + '\x01';

  const TXT_BOLD_ON = ESC + 'E' + '\x01';
  const TXT_BOLD_OFF = ESC + 'E' + '\x00';

  const INVERSE_ON = GS + 'B' + '\x01';
  const INVERSE_OFF = GS + 'B' + '\x00';

  const MAX_WIDTH = 48;

  const line = (left: string, right: string = '') => {
    const space = MAX_WIDTH - left.length - right.length;
    if (space < 0) return left + ' ' + right + '\n';
    return left + ' '.repeat(space) + right + '\n';
  };

  const boldLeftNormalRight = (left: string, right: string = '') => {
    const space = MAX_WIDTH - left.length - right.length;
    if (space < 0) return TXT_BOLD_ON + left + TXT_BOLD_OFF + ' ' + right + '\n';
    return TXT_BOLD_ON + left + TXT_BOLD_OFF + ' '.repeat(space) + right + '\n';
  };

  const divider = '------------------------------------------------\n';

  let content = '';

  // Initialise
  content += ESC + '@';
  
  // Set default line height
  content += ESC + '2';

  // Drawer kick
  if (order.paymentMethod === 'Cash') {
    content += '\x1b\x70\x00\x19\xfa';
  }

  // Header
  content += ALIGN_LEFT;
  content += line(
    'Hungry Shark',
    `Time: ${order.date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`
  );

  // Divider above
  content += divider;

  // Order Number (clean & centred)
  content += '\n';
  content += ALIGN_CENTER;
  content += TXT_NORMAL;
  content += 'ORDER NUMBER:\n';

  content += TXT_QUAD;
  content += TXT_BOLD_ON;
  content += `A${order.id}\n`;
  content += TXT_BOLD_OFF;
  content += TXT_NORMAL;

  content += ALIGN_LEFT;
  content += '\n';

  // DELIVERY banner
  if (order.orderType === 'Delivery') {
    content += '\n';
    content += ALIGN_CENTER + TXT_LARGE + TXT_BOLD_ON + 'DELIVERY';
    content += TXT_BOLD_OFF + TXT_NORMAL + ALIGN_LEFT + '\n';
  }

  content += divider;

  // ===============================
  // CUSTOMER INFO
  // ===============================
  if (order.orderType === 'Delivery' && order.customer) {
    content += 'CUSTOMER INFO:\n';
    content += TXT_BOLD_ON + order.customer.phone + '\n';
    content += order.customer.address + '\n';
    content += order.customer.postcode + '\n';
    content += TXT_BOLD_OFF;
    content += divider;
  }

  // ===============================
  // SORT & GROUP ITEMS
  // ===============================
  const CATEGORY_PRIORITY = [
    Category.CHIPS,
    Category.FISH,
    Category.PIES,
    Category.SAUSAGES,
    Category.CHICKEN,
    Category.BITES,
    Category.KEBABS,
    Category.BURGERS,
    Category.WRAPS,
    Category.KIDS_MEALS,
    Category.POTS,
    Category.SIDES,
    Category.DRINKS
  ];

  const sortedItems = [...order.items].sort((a, b) => {
    const aIdx = CATEGORY_PRIORITY.indexOf(a.category);
    const bIdx = CATEGORY_PRIORITY.indexOf(b.category);
    return aIdx !== bIdx ? aIdx - bIdx : a.name.localeCompare(b.name);
  });

  const itemsByCategory: Record<string, CartItem[]> = {};
  sortedItems.forEach(item => {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  });

  // ===============================
  // ITEMS
  // ===============================
  CATEGORY_PRIORITY.forEach(cat => {
    const items = itemsByCategory[cat];
    if (!items || items.length === 0) return;

    content += TXT_NORMAL + cat.toUpperCase() + '\n';

    // -------- DRINKS LOGIC (UNCHANGED) --------
    if (cat === Category.DRINKS) {
      const grouped: Record<string, CartItem[]> = {};
      items.forEach(i => {
        if (!grouped[i.id]) grouped[i.id] = [];
        grouped[i.id].push(i);
      });

      Object.values(grouped).forEach(group => {
        const first = group[0];
        const hasMods = group.some(i => i.modifiers.length > 0);

        if (hasMods) {
          content += TXT_NORMAL + first.name + '\n';
          group.forEach((item, index) => {
            let unitPrice = item.manualPrice ?? item.price;
            if (item.manualPrice === undefined) {
              unitPrice += item.modifiers.reduce((a, m) => a + m.price, 0);
            }
            const total = unitPrice * item.quantity;
            const size = item.modifiers.filter(m => isInlineModifier(m.groupId));
            const sizeTxt = size.map(m => `(${m.name})`).join(' ');
            content += boldLeftNormalRight(`${item.quantity} x ${sizeTxt}`, total.toFixed(2));
            if (item.instructions) {
              content += `  Note: ${item.instructions}\n`;
            }
            if (index < group.length - 1) content += '\n';
          });
        } else {
          group.forEach((item, index) => {
            const price = item.manualPrice ?? item.price;
            content += boldLeftNormalRight(`${item.quantity} x ${item.name}`, (price * item.quantity).toFixed(2));
            if (item.instructions) {
              content += `  Note: ${item.instructions}\n`;
            }
            if (index < group.length - 1) content += '\n';
          });
        }
      });
    }

    // -------- POTS LOGIC (UNCHANGED) --------
    else if (cat === Category.POTS) {
      const grouped: Record<string, CartItem[]> = {};
      items.forEach(item => {
        let label = item.name;
        if (item.name.toLowerCase().includes('sauce pot')) {
          const isLarge = item.modifiers.some(m => m.name === 'Large');
          const isBeans = item.modifiers.some(m => ['Beans', 'Mushy Peas'].includes(m.name));
          label = (isLarge || isBeans) ? 'Sauce Pot (Large)' : 'Sauce Pot (Small)';
        }
        if (!grouped[label]) grouped[label] = [];
        grouped[label].push(item);
      });

      const groupedEntries = Object.entries(grouped);
      groupedEntries.forEach(([label, group], groupIndex) => {
        content += TXT_NORMAL + label + '\n';
        group.forEach((item, index) => {
          let unitPrice = item.manualPrice ?? item.price;
          if (item.manualPrice === undefined) {
            unitPrice += item.modifiers.reduce((a, m) => a + m.price, 0);
          }
          const flavors = item.modifiers.filter(m => !['Small', 'Large'].includes(m.name));
          const flavorTxt = flavors.map(m => `(${m.name})`).join(' ');
          content += boldLeftNormalRight(`${item.quantity} x ${flavorTxt}`, (unitPrice * item.quantity).toFixed(2));
          if (item.instructions) {
            content += `  Note: ${item.instructions}\n`;
          }
          if (index < group.length - 1) content += '\n';
        });
        if (groupIndex < groupedEntries.length - 1) content += '\n';
      });
    }

    // -------- STANDARD LOGIC (UNCHANGED) --------
    else {
      items.forEach((item, index) => {
        let unitPrice = item.manualPrice ?? item.price;
        if (item.manualPrice === undefined) {
          unitPrice += item.modifiers.reduce((a, m) => a + m.price, 0);
        }

        const size = item.modifiers.filter(m => isInlineModifier(m.groupId));
        const others = item.modifiers.filter(m => !isInlineModifier(m.groupId));

        const sizeTxt = size.map(m => `(${m.name})`).join(' ');
        const name = sizeTxt ? `${item.name} ${sizeTxt}` : item.name;

        content += boldLeftNormalRight(`${item.quantity} x ${name}`, (unitPrice * item.quantity).toFixed(2));

        // Sort modifiers
        others.sort((a, b) => getModifierPriority(a.groupId) - getModifierPriority(b.groupId));

        // Group modifiers
        const groupedModifiers = new Map<string, ModifierOption[]>();
        others.forEach(m => {
            const key = getModifierSuperGroup(m.groupId);
            if(!groupedModifiers.has(key)) groupedModifiers.set(key, []);
            groupedModifiers.get(key)?.push(m);
        });
        
        const modifierGroups = Array.from(groupedModifiers.values());

        modifierGroups.forEach(mods => {
            const isCondiment = mods.some(m => getModifierSuperGroup(m.groupId) === 'condiments');
            const modsText = `+ (${mods.map(m => m.name).join(', ')})`;
            
            if (isCondiment) {
                content += FONT_B + `  ${modsText}\n` + FONT_A;
            } else {
                content += `  ${modsText}\n`;
            }
        });

        if (item.instructions) {
            content += `  Note: ${item.instructions}\n`;
        }
        if (index < items.length - 1) content += '\n';
      });
    }

    // ✅ Divider AFTER each category
    content += divider;
  });

  // ===============================
  // TOTAL
  // ===============================
  content += line('TOTAL', order.total.toFixed(2));

  // Feed & cut (SUNMI / RawBT)
  content += '\n\n\n\n';
  content += '\x1d\x56\x42\x00';

  return content;
};
