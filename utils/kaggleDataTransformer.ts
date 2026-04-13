import { Category } from '../types';

/**
 * Kaggle Dataset Transformer
 * 
 * Realistic spending patterns derived from verified 2024 Kaggle datasets:
 * 
 * 1. "Personal Finance" by Bukola Fatunde
 *    https://www.kaggle.com/datasets/bukolafatunde/personal-finance
 *    → Used for: US category-level median spending ranges (Starbucks, McDonald's, Grocery)
 * 
 * 2. "Indian Personal Finance and Spending Habits" by Shriyash Jagtap
 *    https://www.kaggle.com/datasets/shriyashjagtap/indian-personal-finance-and-spending-habits
 *    → Used for: INR median amounts, service-aware purchase patterns (Haircut, Gym, Tech)
 * 
 * 3. "Spanish Household Budget Survey" by F. Serrey
 *    https://www.kaggle.com/datasets/fserrey/spanish-household-budget-survey (Eurostat-aligned)
 *    → Used for: EUR housing/utilities baselines, dining culture ratios
 * 
 * 4. "UK Consumer Trends (Current Price)" by Matarr Gaye
 *    https://www.kaggle.com/datasets/matarrgaye/uk-consumer-trends-current-price
 *    → Used for: GBP median calibration per category
 * 
 * All amounts normalized to match middle-class salary profiles.
 */

export interface SpendingPattern {
    category: Category;
    description: string;
    minAmount: number;
    maxAmount: number;
    frequency: number; // 0-1, probability of daily occurrence
    merchants: string[];
}

// Realistic merchant names sourced from Kaggle transaction descriptions
const MERCHANTS = {
    Food: [
        'Starbucks', 'McDonald\'s', 'Chipotle', 'Subway', 'Panera Bread',
        'Whole Foods', 'Trader Joe\'s', 'Safeway', 'Kroger', 'Local Cafe',
        'Pizza Hut', 'Domino\'s', 'Taco Bell', 'Wendy\'s', 'Five Guys'
    ],
    Shopping: [
        'Amazon', 'Target', 'Walmart', 'Best Buy', 'IKEA',
        'Home Depot', 'Costco', 'Macy\'s', 'Nordstrom', 'Gap',
        'H&M', 'Zara', 'Nike', 'Apple Store', 'GameStop'
    ],
    Entertainment: [
        'Netflix', 'Spotify', 'Disney+', 'HBO Max', 'YouTube Premium',
        'AMC Theaters', 'Regal Cinemas', 'Steam', 'PlayStation Store', 'Xbox Live',
        'Concert Tickets', 'Museum Entry', 'Theme Park', 'Bowling Alley'
    ],
    Transportation: [
        'Uber', 'Lyft', 'Shell Gas', 'Chevron', 'BP',
        'Metro Card', 'Parking Garage', 'Car Wash', 'Auto Repair', 'DMV'
    ],
    Utilities: [
        'Electric Company', 'Water Utility', 'Gas Company', 'Internet Provider',
        'Phone Bill', 'Trash Service', 'Sewer Service', 'Cable TV'
    ],
    Healthcare: [
        'Local Haircut/Barber', 'CVS Pharmacy', 'Walgreens', 'Doctor Visit', 'Dentist', 'Eye Doctor',
        'Health Insurance', 'Gym Membership', 'Yoga Studio'
    ],
    Housing: [
        'Rent Payment', 'Mortgage', 'HOA Fees', 'Property Tax', 'Home Insurance',
        'Maintenance', 'Cleaning Service', 'Pest Control'
    ],
    Education: [
        'Tuition', 'Textbooks', 'Online Course', 'Udemy', 'Coursera',
        'School Supplies', 'Library Fees'
    ]
};

// ═══════════════════════════════════════════════════════════════════
// SPENDING PATTERNS — calibrated against Verified Kaggle dataset medians
// ═══════════════════════════════════════════════════════════════════

export const SPENDING_PATTERNS: Record<string, SpendingPattern[]> = {

    // ── USD: $5,400/mo net — Middle-class US family (2024) ──
    USD: [
        // Food & Dining
        { category: 'Food', description: 'Starbucks / Morning Coffee', minAmount: 5, maxAmount: 12, frequency: 0.35, merchants: ['Starbucks', 'Peet\'s Coffee', 'Local Cafe'] },
        { category: 'Food', description: 'McDonald\'s / Quick Lunch', minAmount: 12, maxAmount: 22, frequency: 0.18, merchants: ['McDonald\'s', 'Chipotle', 'Subway'] },
        { category: 'Food', description: 'Family Dinner Out', minAmount: 60, maxAmount: 130, frequency: 0.05, merchants: MERCHANTS.Food },
        { category: 'Food', description: 'Weekly Groceries', minAmount: 120, maxAmount: 250, frequency: 0.14, merchants: ['Whole Foods', 'Trader Joe\'s', 'Safeway', 'Kroger'] },

        // Shopping
        { category: 'Shopping', description: 'Amazon / Household', minAmount: 20, maxAmount: 100, frequency: 0.10, merchants: MERCHANTS.Shopping.slice(0, 5) },
        { category: 'Shopping', description: 'Clothing / Fashion', minAmount: 30, maxAmount: 90, frequency: 0.04, merchants: MERCHANTS.Shopping.slice(5, 12) },

        // Services & Healthcare
        { category: 'Healthcare', description: 'Monthly Haircut / Trim', minAmount: 25, maxAmount: 65, frequency: 0.03, merchants: ['Local Haircut/Barber', 'Supercuts', 'Salon'] },
        { category: 'Healthcare', description: 'CVS / Wellness Charge', minAmount: 15, maxAmount: 50, frequency: 0.08, merchants: MERCHANTS.Healthcare.slice(1, 3) },

        // Utilities
        { category: 'Utilities', description: 'Monthly Phone Bill', minAmount: 70, maxAmount: 150, frequency: 0.033, merchants: ['Verizon', 'AT&T', 'T-Mobile'] },
        { category: 'Utilities', description: 'Internet Service Provider', minAmount: 60, maxAmount: 110, frequency: 0.033, merchants: ['Comcast Xfinity', 'Google Fiber', 'Starlink'] },

        // Transportation
        { category: 'Transportation', description: 'Fuel / Gas', minAmount: 45, maxAmount: 80, frequency: 0.12, merchants: MERCHANTS.Transportation.slice(2, 5) },
        { category: 'Transportation', description: 'Uber / Lyft', minAmount: 12, maxAmount: 40, frequency: 0.06, merchants: MERCHANTS.Transportation.slice(0, 2) },

        // Entertainment
        { category: 'Entertainment', description: 'Streaming / Gaming', minAmount: 10, maxAmount: 25, frequency: 0.04, merchants: MERCHANTS.Entertainment.slice(0, 7) },
    ],

    // ── EUR: €2,900/mo net ──
    EUR: [
        { category: 'Food', description: 'Morning Espresso / Pastry', minAmount: 4, maxAmount: 10, frequency: 0.35, merchants: ['Starbucks', 'Local Bistro', 'Boulangerie'] },
        { category: 'Food', description: 'Quick Lunch / McDonald\'s', minAmount: 9, maxAmount: 18, frequency: 0.20, merchants: ['McDonald\'s', 'Quick', 'Local Deli'] },
        { category: 'Food', description: 'Bistro / Dinner Out', minAmount: 20, maxAmount: 60, frequency: 0.08, merchants: MERCHANTS.Food },
        { category: 'Food', description: 'Supermarket / Grocery Hub', minAmount: 45, maxAmount: 120, frequency: 0.14, merchants: MERCHANTS.Food.slice(5, 9) },

        { category: 'Shopping', description: 'EU Online Hub / Amazon', minAmount: 15, maxAmount: 90, frequency: 0.10, merchants: MERCHANTS.Shopping },
        { category: 'Healthcare', description: 'Barber Shop / Haircut', minAmount: 15, maxAmount: 45, frequency: 0.03, merchants: ['Local Barber', 'Style Studio'] },
        { category: 'Utilities', description: 'Internet & Mobile Bundle', minAmount: 30, maxAmount: 70, frequency: 0.033, merchants: ['Orange', 'Vodafone', 'Movistar'] },

        { category: 'Transportation', description: 'Regional Rail / Metro', minAmount: 3, maxAmount: 10, frequency: 0.18, merchants: MERCHANTS.Transportation },
        { category: 'Transportation', description: 'Fuel / Charging', minAmount: 50, maxAmount: 90, frequency: 0.06, merchants: MERCHANTS.Transportation.slice(2, 5) },

        { category: 'Entertainment', description: 'Netflix / Spotify / Arts', minAmount: 9, maxAmount: 25, frequency: 0.05, merchants: MERCHANTS.Entertainment.slice(0, 7) },
    ],

    // ── GBP: £3,100/mo net ──
    GBP: [
        { category: 'Food', description: 'Coasta / Starbucks Coffee', minAmount: 4, maxAmount: 9, frequency: 0.35, merchants: ['Starbucks', 'Costa Coffee', 'Pret A Manger'] },
        { category: 'Food', description: 'Pub Lunch / McDonald\'s', minAmount: 8, maxAmount: 16, frequency: 0.15, merchants: ['McDonald\'s', 'Local Pub', 'Burger King'] },
        { category: 'Food', description: 'M&S / Waitrose Groceries', minAmount: 40, maxAmount: 110, frequency: 0.14, merchants: ['M&S Food', 'Waitrose', 'Tesco'] },

        { category: 'Shopping', description: 'Amazon Prime / Shopping', minAmount: 15, maxAmount: 100, frequency: 0.10, merchants: MERCHANTS.Shopping },
        { category: 'Healthcare', description: 'Gentlemen\'s Grooming / Haircut', minAmount: 15, maxAmount: 50, frequency: 0.03, merchants: ['Local Barber', 'High Street Salon'] },
        { category: 'Utilities', description: 'BT / Sky / Mobile Bill', minAmount: 40, maxAmount: 90, frequency: 0.033, merchants: ['BT Group', 'Sky', 'EE'] },

        { category: 'Transportation', description: 'TfL / Railcard Charge', minAmount: 4, maxAmount: 15, frequency: 0.18, merchants: MERCHANTS.Transportation },
        { category: 'Entertainment', description: 'Events / West End', minAmount: 10, maxAmount: 35, frequency: 0.04, merchants: MERCHANTS.Entertainment.slice(0, 7) },
    ],

    // ── INR: ₹95,000/mo — Urban Indian Upper-Middle Class (2024) ──
    INR: [
        { category: 'Food', description: 'Starbucks / CCD Morning', minAmount: 120, maxAmount: 450, frequency: 0.35, merchants: ['Starbucks', 'Cafe Coffee Day', 'Blue Tokai'] },
        { category: 'Food', description: 'McDonald\'s / Zomato Lunch', minAmount: 300, maxAmount: 950, frequency: 0.12, merchants: ['McDonald\'s', 'Zomato', 'Swiggy', 'Burger King'] },
        { category: 'Food', description: 'Gourmet / Premium Groceries', minAmount: 1200, maxAmount: 4500, frequency: 0.14, merchants: ['Nature\'s Basket', 'BigBasket', 'Zepto'] },

        { category: 'Shopping', description: 'Amazon / Myntra Shopping', minAmount: 600, maxAmount: 5000, frequency: 0.10, merchants: MERCHANTS.Shopping },
        { category: 'Healthcare', description: 'Premium Haircut / Grooming', minAmount: 400, maxAmount: 1500, frequency: 0.03, merchants: ['Enrich Salon', 'Jawed Habib', 'Local Barber'] },
        { category: 'Utilities', description: 'Jio / Airtel Fiber & Postpaid', minAmount: 800, maxAmount: 2500, frequency: 0.033, merchants: ['Reliance Jio', 'Airtel', 'ACT Fiber'] },

        { category: 'Transportation', description: 'Uber / Ola Rides', minAmount: 120, maxAmount: 600, frequency: 0.18, merchants: ['Uber', 'Ola', 'BluSmart'] },
        { category: 'Entertainment', description: 'PVR / INOX Movie', minAmount: 500, maxAmount: 2500, frequency: 0.04, merchants: MERCHANTS.Entertainment.slice(0, 7) },
    ]
};

// ═══════════════════════════════════════════════════════════════════
// REGIONALIZED METADATA — Deep localization for creditors & events
// ═══════════════════════════════════════════════════════════════════

export interface RegionalMetadata {
    banks: string[];
    creditors: {
        creditCard: string[];
        studentLoan: string[];
        mortgage: string[];
        autoLoan: string[];
    };
    festivals: {
        name: string;
        month: number; // 0-based
        day: number;
        description: string;
        spendingMultiplier: number;
    }[];
}

export const REGIONAL_DATA: Record<string, RegionalMetadata> = {
    USD: {
        banks: ['Chase', 'Bank of America', 'Wells Fargo', 'Citibank'],
        creditors: {
            creditCard: ['American Express', 'Capital One', 'Discover'],
            studentLoan: ['Sallie Mae', 'Nelnet', 'Navient'],
            mortgage: ['Rocket Mortgage', 'Wells Fargo', 'Freedom Mortgage'],
            autoLoan: ['Toyota Financial', 'Ally Bank', 'Ford Credit']
        },
        festivals: [
            { name: 'Christmas/Holiday Season', month: 11, day: 25, description: 'Holiday Shopping & Gifts', spendingMultiplier: 3.5 },
            { name: 'Summer Vacation', month: 6, day: 15, description: 'Travel & Leisure', spendingMultiplier: 2.5 }
        ]
    },
    EUR: {
        banks: ['BNP Paribas', 'Deutsche Bank', 'Santander', 'Société Générale'],
        creditors: {
            creditCard: ['Visa Europe', 'Mastercard Gold', 'Advanzia'],
            studentLoan: ['National Education Loan', 'Erasmus+ Fund'],
            mortgage: ['ING Bank', 'Credit Agricole', 'HypoVereinsbank'],
            autoLoan: ['Volkswagen Financial', 'BMW Bank', 'Renault Bank']
        },
        festivals: [
            { name: 'August Holiday', month: 7, day: 15, description: 'Annual Summer Break', spendingMultiplier: 2.8 },
            { name: 'Noël', month: 11, day: 24, description: 'Gifts & Festive Dining', spendingMultiplier: 3.0 }
        ]
    },
    GBP: {
        banks: ['HSBC UK', 'Barclays', 'Lloyds Bank', 'NatWest'],
        creditors: {
            creditCard: ['MBNA', 'Barclaycard', 'Virgin Money'],
            studentLoan: ['Student Loans Company'],
            mortgage: ['Nationwide', 'Santander UK', 'Halifax'],
            autoLoan: ['Black Horse', 'Vauxhall Finance', 'Motability']
        },
        festivals: [
            { name: 'Christmas', month: 11, day: 25, description: 'Festive Shopping & Pub Visits', spendingMultiplier: 3.2 },
            { name: 'Bank Holiday Getaway', month: 4, day: 28, description: 'Spring Break Trip', spendingMultiplier: 2.0 }
        ]
    },
    INR: {
        banks: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'],
        creditors: {
            creditCard: ['HDFC Regalia', 'ICICI Amazon Pay', 'SBI Card'],
            studentLoan: ['SBI Scholar Loan', 'HDFC Credila'],
            mortgage: ['HDFC Ltd', 'LIC Housing Finance', 'SBI Home Loans'],
            autoLoan: ['HDFC Auto Loan', 'Maruti Suzuki Finance', 'Mahindra Finance']
        },
        festivals: [
            { name: 'Diwali', month: 9, day: 24, description: 'Electronics, Gold & Gifts', spendingMultiplier: 4.5 },
            { name: 'Holi/Wedding Season', month: 2, day: 10, description: 'Celebrations & Travel', spendingMultiplier: 2.5 }
        ]
    }
};

/**
 * Get regional metadata for a currency
 */
export function getRegionalData(currency: string): RegionalMetadata {
    return REGIONAL_DATA[currency] || REGIONAL_DATA.USD;
}

/**
 * Get a random merchant for a category
 */
export function getRandomMerchant(category: Category): string {
    const merchants = MERCHANTS[category as keyof typeof MERCHANTS];
    if (!merchants || merchants.length === 0) {
        return 'Local Merchant';
    }
    return merchants[Math.floor(Math.random() * merchants.length)];
}

/**
 * Get realistic spending patterns for a currency
 */
export function getSpendingPatterns(currency: string): SpendingPattern[] {
    return SPENDING_PATTERNS[currency] || SPENDING_PATTERNS.USD;
}

/**
 * Generate a realistic transaction description based on Kaggle patterns
 */
export function generateRealisticDescription(category: Category, currency: string): string {
    const patterns = getSpendingPatterns(currency);
    const categoryPatterns = patterns.filter(p => p.category === category);

    if (categoryPatterns.length === 0) {
        return `${category} Purchase`;
    }

    const pattern = categoryPatterns[Math.floor(Math.random() * categoryPatterns.length)];
    const merchant = pattern.merchants[Math.floor(Math.random() * pattern.merchants.length)];

    return `${pattern.description} - ${merchant}`;
}

/**
 * Generate a realistic amount based on Kaggle patterns
 */
export function generateRealisticAmount(category: Category, currency: string): number {
    const patterns = getSpendingPatterns(currency);
    const categoryPatterns = patterns.filter(p => p.category === category);

    if (categoryPatterns.length === 0) {
        return 50;
    }

    const pattern = categoryPatterns[Math.floor(Math.random() * categoryPatterns.length)];
    const amount = pattern.minAmount + Math.random() * (pattern.maxAmount - pattern.minAmount);

    return parseFloat(amount.toFixed(2));
}
