import { Transaction, TransactionType, Category } from '../types';

export interface ParsedStatementResult {
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  detectedBank: string;
  dateRange: { start: string; end: string };
  potentialSubscriptions: { description: string; amount: number; category: Category }[];
  summaryByCategory: Record<string, number>;
}

const MERCHANT_CLEANUP_REGEXES = [
  /^(pos|ach|chk|dbt|debit|credit|direct\s*dep|recurring|atm|wd|wire|transfer|payment\s*to)\s*[-:]?\s*/i,
  /#\s*\d+/g,
  /\b\d{4,}\b/g, // long transaction IDs
  /\b(ca|ny|wa|tx|fl|uk|in|de|fr|us)\b$/i, // trailing state/country codes
];

function cleanMerchantName(raw: string): string {
  let cleaned = raw.trim();
  for (const reg of MERCHANT_CLEANUP_REGEXES) {
    cleaned = cleaned.replace(reg, ' ');
  }
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned.length > 2 ? cleaned : raw.trim();
}

function isValidISODate(value: string): boolean {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const LOCAL_KEYWORD_RULES: [RegExp, Category][] = [
  [/starbucks|coffee|dunkin|cafe|costa|blue tokai|barista|peet/i, 'Food'],
  [/mcdonald|burger|pizza|subway|chipotle|domino|kfc|taco|zomato|swiggy|uber\s*eats|doordash|grubhub/i, 'Food'],
  [/walmart|target|whole\s*foods|kroger|safeway|trader\s*joe|aldi|costco|bigbasket|grocer/i, 'Food'],
  [/uber|lyft|ola|grab|taxi|metro|transit|subway|train|amtrak|shell|chevron|exxon|bp|petrol|fuel|gas\s*station/i, 'Transportation'],
  [/flight|airline|delta|united|american\s*air|emirates|ryanair|british\s*airways|hotel|airbnb|booking/i, 'Travel'],
  [/netflix|spotify|hulu|disney|apple\.com\/bill|prime\s*video|steam|playstation|youtube|hbo|paramount/i, 'Entertainment'],
  [/cinema|amc|regal|pvr|inox|theatre|concert|ticketmaster/i, 'Entertainment'],
  [/amazon|ebay|etsy|zara|h&m|nike|adidas|target|myntra|asos|shein/i, 'Shopping'],
  [/pharmacy|walgreens|cvs|boots|apollo|clinic|hospital|doctor|dentist|optom|health/i, 'Healthcare'],
  [/electric|water|gas\s*utility|power|coned|pge|verizon|at&t|t-mobile|comcast|xfinity|broadband|wifi|internet/i, 'Utilities'],
  [/rent|mortgage|apartment|lease|landlord|housing/i, 'Housing'],
  [/tuition|university|college|udemy|coursera|edx|school|books/i, 'Education'],
  [/salary|payroll|direct\s*deposit|wages|employer|paycheck|bonus/i, 'Salary'],
  [/fidelity|vanguard|schwab|robinhood|coinbase|zerodha|etrade|investment|dividend/i, 'Investment'],
];

export function inferCategory(description: string, type: TransactionType): Category {
  if (type === TransactionType.INCOME) {
    if (/investment|dividend|interest|yield|crypto|stock/i.test(description)) return 'Investment';
    return 'Salary';
  }

  for (const [pattern, category] of LOCAL_KEYWORD_RULES) {
    if (pattern.test(description)) {
      return category;
    }
  }

  return 'Other';
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

function parseFlexibleDate(dateStr: string): string {
  if (!dateStr) return '';
  const cleaned = dateStr.trim().replace(/^"/, '').replace(/"$/, '');

  // ISO Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
    const isoDate = cleaned.slice(0, 10);
    return isValidISODate(isoDate) ? isoDate : '';
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const slashParts = cleaned.split(/[\/\-\.]/);
  if (slashParts.length === 3) {
    let [p1, p2, p3] = slashParts.map(p => parseInt(p, 10));
    if ([p1, p2, p3].some(Number.isNaN)) return '';
    if (p3 < 100) p3 += 2000; // 2-digit year
    if (p1 > 1000) {
      // YYYY-MM-DD
      const y = p1;
      const m = String(p2).padStart(2, '0');
      const d = String(p3).padStart(2, '0');
      const isoDate = `${y}-${m}-${d}`;
      return isValidISODate(isoDate) ? isoDate : '';
    }
    // Assume MM/DD/YYYY unless p1 > 12
    let month = p1;
    let day = p2;
    if (p1 > 12 && p2 <= 12) {
      // DD/MM/YYYY
      month = p2;
      day = p1;
    }
    const y = p3;
    if (month < 1 || month > 12 || day < 1 || day > 31) return '';
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const isoDate = `${y}-${m}-${d}`;
    return isValidISODate(isoDate) ? isoDate : '';
  }

  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
}

/**
 * Parses raw statement content (CSV or pasted text) into validated Aureus transactions
 */
export function parseBankStatement(rawContent: string): ParsedStatementResult {
  const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    throw new Error('Statement content is empty.');
  }

  // Detect bank from header or top lines
  let detectedBank = 'Standard Bank';
  const fullText = lines.slice(0, 10).join(' ').toLowerCase();
  if (fullText.includes('chase')) detectedBank = 'JPMorgan Chase';
  else if (fullText.includes('bank of america') || fullText.includes('bofa')) detectedBank = 'Bank of America';
  else if (fullText.includes('wells fargo')) detectedBank = 'Wells Fargo';
  else if (fullText.includes('citibank') || fullText.includes('citi')) detectedBank = 'Citibank';
  else if (fullText.includes('barclays')) detectedBank = 'Barclays';
  else if (fullText.includes('hsbc')) detectedBank = 'HSBC';
  else if (fullText.includes('hdfc')) detectedBank = 'HDFC Bank';
  else if (fullText.includes('icici')) detectedBank = 'ICICI Bank';
  else if (fullText.includes('revolut')) detectedBank = 'Revolut';
  else if (fullText.includes('monzo')) detectedBank = 'Monzo';

  // Find header line
  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let amountCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let typeCol = -1;

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const cols = parseCSVLine(lines[i]).map(c => c.toLowerCase());
    const dIdx = cols.findIndex(c => c.includes('date') || c.includes('posting') || c.includes('trans date'));
    const descIdx = cols.findIndex(c => c.includes('desc') || c.includes('memo') || c.includes('payee') || c.includes('details') || c.includes('narrative'));
    const amtIdx = cols.findIndex(c => c === 'amount' || c.includes('trans amount'));
    const debIdx = cols.findIndex(c => /\b(debit|withdrawal|dr)\b/.test(c));
    const credIdx = cols.findIndex(c => /\b(credit|deposit|cr)\b/.test(c));
    const tIdx = cols.findIndex(c => c === 'type' || c.includes('trans type'));

    if (dIdx !== -1 && (descIdx !== -1 || amtIdx !== -1 || debIdx !== -1)) {
      headerIndex = i;
      dateCol = dIdx;
      descCol = descIdx !== -1 ? descIdx : (dIdx === 0 ? 1 : 0);
      amountCol = amtIdx;
      debitCol = debIdx;
      creditCol = credIdx;
      typeCol = tIdx;
      break;
    }
  }

  const transactions: Transaction[] = [];
  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;

  for (let i = startRow; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseCSVLine(line);
    if (cols.length < 2) continue;

    let rawDate = '';
    let rawDesc = '';
    let amount = 0;
    let type: TransactionType = TransactionType.EXPENSE;

    if (dateCol !== -1 && dateCol < cols.length) {
      rawDate = cols[dateCol];
    } else {
      rawDate = cols[0];
    }

    if (descCol !== -1 && descCol < cols.length) {
      rawDesc = cols[descCol];
    } else {
      rawDesc = cols[1] || 'Bank Transaction';
    }

    if (debitCol !== -1 && creditCol !== -1) {
      const debitVal = parseFloat(cols[debitCol]?.replace(/[^0-9.-]/g, '') || '0');
      const creditVal = parseFloat(cols[creditCol]?.replace(/[^0-9.-]/g, '') || '0');
      if (creditVal > 0) {
        amount = creditVal;
        type = TransactionType.INCOME;
      } else {
        amount = Math.abs(debitVal);
        type = TransactionType.EXPENSE;
      }
    } else if (amountCol !== -1 && amountCol < cols.length) {
      const rawAmt = cols[amountCol]?.replace(/[^0-9.-]/g, '') || '0';
      const parsedAmt = parseFloat(rawAmt);
      if (!isNaN(parsedAmt)) {
        if (typeCol !== -1 && cols[typeCol]?.toLowerCase().includes('credit')) {
          type = TransactionType.INCOME;
          amount = Math.abs(parsedAmt);
        } else if (parsedAmt < 0) {
          type = TransactionType.EXPENSE;
          amount = Math.abs(parsedAmt);
        } else {
          // If description implies income
          if (/payroll|salary|direct\s*dep|bonus|deposit/i.test(rawDesc)) {
            type = TransactionType.INCOME;
          } else {
            type = TransactionType.EXPENSE;
          }
          amount = Math.abs(parsedAmt);
        }
      }
    } else {
      // Guess from remaining cols
      for (let c = 2; c < cols.length; c++) {
        const parsed = parseFloat(cols[c]?.replace(/[^0-9.-]/g, '') || '');
        if (!isNaN(parsed) && parsed !== 0) {
          amount = Math.abs(parsed);
          type = parsed > 0 && /deposit|credit|salary/i.test(rawDesc) ? TransactionType.INCOME : TransactionType.EXPENSE;
          break;
        }
      }
    }

    const formattedDate = parseFlexibleDate(rawDate);
    if (amount <= 0 || isNaN(amount) || !formattedDate) continue;
    const cleanedDescription = cleanMerchantName(rawDesc);
    const category = inferCategory(cleanedDescription, type);

    transactions.push({
      id: crypto.randomUUID(),
      date: formattedDate,
      description: cleanedDescription,
      amount: Math.round(amount * 100) / 100,
      category,
      type,
      aiGenerated: true,
      notes: `Imported via ${detectedBank} statement`,
    });
  }

  if (transactions.length === 0) {
    throw new Error('Unable to parse valid financial transactions. Ensure statement includes dates and amounts.');
  }

  // Sort chronological descending
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let totalIncome = 0;
  let totalExpenses = 0;
  const summaryByCategory: Record<string, number> = {};

  transactions.forEach(t => {
    if (t.type === TransactionType.INCOME) totalIncome += t.amount;
    else {
      totalExpenses += t.amount;
      summaryByCategory[t.category] = (summaryByCategory[t.category] || 0) + t.amount;
    }
  });

  // Detect recurring subscriptions
  const potentialSubscriptions: { description: string; amount: number; category: Category }[] = [];
  const descFrequency = new Map<string, { count: number; amount: number; category: Category }>();

  transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
    const key = t.description.toLowerCase();
    const existing = descFrequency.get(key);
    if (existing) {
      existing.count++;
    } else {
      descFrequency.set(key, { count: 1, amount: t.amount, category: t.category });
    }
  });

  descFrequency.forEach((data, name) => {
    if (data.count >= 2) {
      potentialSubscriptions.push({
        description: name.charAt(0).toUpperCase() + name.slice(1),
        amount: data.amount,
        category: data.category,
      });
    }
  });

  return {
    transactions,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netCashFlow: Math.round((totalIncome - totalExpenses) * 100) / 100,
    detectedBank,
    dateRange: {
      start: transactions[transactions.length - 1].date,
      end: transactions[0].date,
    },
    potentialSubscriptions,
    summaryByCategory,
  };
}
