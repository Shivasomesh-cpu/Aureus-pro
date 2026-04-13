
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { CATEGORIES } from '../constants';
import { Category, Transaction, Budget, FinancialInsight, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });

const LOCAL_CATEGORIES_MAP: Record<string, Category> = {
  // Food & Dining
  'food': 'Food', 'drink': 'Food', 'snack': 'Food', 'coffee': 'Food', 'cafe': 'Food', 'latte': 'Food',
  'tea': 'Food', 'starbucks': 'Food', 'dunkin': 'Food', 'pizza': 'Food', 'burger': 'Food',
  'mcdonalds': 'Food', 'kf': 'Food', 'taco': 'Food', 'sushi': 'Food',
  'restaurant': 'Food', 'dinner': 'Food', 'lunch': 'Food', 'breakfast': 'Food', 'brunch': 'Food',
  'bar': 'Food', 'pub': 'Food', 'beer': 'Food', 'wine': 'Food', 'cocktail': 'Food',
  'grocery': 'Food', 'groceries': 'Food', 'supermarket': 'Food', 'market': 'Food',
  'whole foods': 'Food', 'trader joes': 'Food', 'walmart': 'Food', 'costco': 'Food', 'target': 'Food',

  // Transportation
  'transport': 'Transportation', 'bus': 'Transportation', 'train': 'Transportation', 'subway': 'Transportation',
  'metro': 'Transportation', 'uber': 'Transportation', 'lyft': 'Transportation', 'taxi': 'Transportation',
  'cab': 'Transportation', 'gas': 'Transportation', 'fuel': 'Transportation', 'petrol': 'Transportation',
  'parking': 'Transportation', 'toll': 'Transportation', 'flight': 'Transportation', 'airline': 'Transportation',
  'car': 'Transportation', 'maintenance': 'Transportation', 'repair': 'Transportation',

  // Housing & Utilities
  'rent': 'Housing', 'mortgage': 'Housing', 'lease': 'Housing', 'housing': 'Housing',
  'utility': 'Utilities', 'utilities': 'Utilities', 'electric': 'Utilities', 'water': 'Utilities',
  'gas bill': 'Utilities', 'internet': 'Utilities', 'wifi': 'Utilities', 'broadband': 'Utilities',
  'phone': 'Utilities', 'mobile': 'Utilities', 'cell': 'Utilities', 'bill': 'Utilities',

  // Entertainment & Subscriptions
  'entertainment': 'Entertainment', 'movie': 'Entertainment', 'cinema': 'Entertainment', 'theatre': 'Entertainment',
  'concert': 'Entertainment', 'ticket': 'Entertainment', 'event': 'Entertainment', 'game': 'Entertainment',
  'netflix': 'Entertainment', 'hulu': 'Entertainment', 'disney': 'Entertainment', 'hbo': 'Entertainment',
  'spotify': 'Entertainment', 'apple music': 'Entertainment', 'youtube': 'Entertainment', 'prime': 'Entertainment',
  'steam': 'Entertainment', 'playstation': 'Entertainment', 'xbox': 'Entertainment', 'nintendo': 'Entertainment',

  // Health & Personal Care
  'health': 'Healthcare', 'doctor': 'Healthcare', 'dentist': 'Healthcare', 'vision': 'Healthcare',
  'pharmacy': 'Healthcare', 'drug': 'Healthcare', 'medicine': 'Healthcare', 'prescription': 'Healthcare',
  'hospital': 'Healthcare', 'clinic': 'Healthcare', 'therapy': 'Healthcare', 'gym': 'Healthcare',
  'fitness': 'Healthcare', 'yoga': 'Healthcare', 'haircut': 'Healthcare', 'salon': 'Healthcare', 'barber': 'Healthcare',

  // Shopping
  'shop': 'Shopping', 'shopping': 'Shopping', 'amazon': 'Shopping', 'ebay': 'Shopping',
  'clothes': 'Shopping', 'clothing': 'Shopping', 'shoe': 'Shopping', 'apparel': 'Shopping',
  'electronics': 'Shopping', 'gadget': 'Shopping', 'gift': 'Shopping', 'book': 'Shopping',

  // Income
  'salary': 'Salary', 'pay': 'Salary', 'paycheck': 'Salary', 'wage': 'Salary', 'bonus': 'Salary',
  'income': 'Salary', 'dividend': 'Investment', 'interest': 'Investment',

  // Other
  'investment': 'Investment', 'stock': 'Investment', 'crypto': 'Investment', 'bitcoin': 'Investment',
  'save': 'Investment', 'saving': 'Investment', 'transfer': 'Other', 'withdrawal': 'Other', 'cash': 'Other'
};

const localNLPFallback = (text: string): Partial<Transaction> | null => {
  const lowercaseText = text.toLowerCase();

  // Extract amount
  const amountMatch = text.match(/\$?\s?(\d+(\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

  if (amount === 0) return null;

  // Detect type
  const isIncome = lowercaseText.includes('salary') || lowercaseText.includes('got paid') || lowercaseText.includes('income') || lowercaseText.includes('bonus');
  const type = isIncome ? TransactionType.INCOME : TransactionType.EXPENSE;

  // Detect Category
  let category: Category = isIncome ? 'Salary' : 'Other';
  for (const [key, val] of Object.entries(LOCAL_CATEGORIES_MAP)) {
    if (lowercaseText.includes(key)) {
      category = val;
      break;
    }
  }

  // Detect Date
  let date = new Date().toISOString().split('T')[0];
  if (lowercaseText.includes('yesterday')) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().split('T')[0];
  }

  return {
    amount,
    description: text.replace(/\$?\s?\d+(\.\d{1,2})?/, '').trim() || 'Transaction',
    category,
    date,
    type
  };
};

export const suggestCategory = async (description: string): Promise<Category | null> => {
  if (!description.trim()) {
    return null;
  }

  const prompt = `Based on the following expense description, what is the most appropriate category?
  Description: "${description}"
  
  Choose one of the following categories: ${CATEGORIES.join(', ')}.
  
  Respond with only the category name.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const suggestedCategory = response.text.trim();

    if (CATEGORIES.includes(suggestedCategory as Category)) {
      return suggestedCategory as Category;
    }
    return null;
  } catch (error) {
    console.error('Error suggesting category with Gemini API:', error);
    return null;
  }
};


const transactionSchema = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "The numeric amount of the transaction." },
    description: { type: Type.STRING, description: "A brief description of the transaction." },
    category: { type: Type.STRING, enum: CATEGORIES, description: "The category of the transaction." },
    date: { type: Type.STRING, description: "The date of the transaction in YYYY-MM-DD format." },
    type: { type: Type.STRING, enum: ['income', 'expense'], description: "The type of transaction." }
  },
  required: ["amount", "description", "category", "date", "type"]
};

export const parseTransactionFromText = async (text: string): Promise<Partial<Transaction> | null> => {
  if (!text.trim()) {
    return null;
  }

  const today = new Date().toISOString().split('T')[0];
  const prompt = `Parse the following text into a structured transaction object.
    Assume "today" is ${today}. Infer the date if relative terms like "yesterday" or "last Tuesday" are used.
    If the text implies income (e.g., "got paid", "salary"), set the type to "income" and category to "Salary". Otherwise, default to "expense".
    
    Text: "${text}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: transactionSchema,
      }
    });

    const jsonString = response.text;
    const parsed = JSON.parse(jsonString) as Partial<Transaction>;

    // Basic validation
    if (parsed.amount && parsed.description && parsed.category && parsed.date && parsed.type) {
      return { ...parsed, aiGenerated: true };
    }

    return localNLPFallback(text);
  } catch (error) {
    console.error('Error parsing transaction with Gemini API (swapping to fallback):', error);
    return localNLPFallback(text);
  }
};


const insightsSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING, enum: ['alert', 'prediction', 'tip'], description: "The type of insight." },
      message: { type: Type.STRING, description: "The insight message." },
      relatedCategory: { type: Type.STRING, enum: CATEGORIES, description: "The category related to the insight, if applicable." },
      confidenceScore: { type: Type.NUMBER, description: "Confidence score between 0 and 1." }
    },
    required: ["type", "message"]
  }
};

export const getFinancialInsights = async (transactions: Transaction[], budgets: Budget[]): Promise<FinancialInsight[]> => {
  if (transactions.length === 0) return [];

  const currentMonth = new Date().toISOString().slice(0, 7);
  const recentTransactions = transactions.slice(0, 50).map(t => ({
    amount: t.amount,
    category: t.category,
    type: t.type,
    date: t.date,
    description: t.description
  }));

  const budgetSummary = budgets.map(b => ({ category: b.category, limit: b.amount, month: b.month }));

  const prompt = `Analyze the following financial data and provide 3 personalized insights.
    Data:
    - Recent Transactions: ${JSON.stringify(recentTransactions)}
    - Budgets: ${JSON.stringify(budgetSummary)}
    - Current Month: ${currentMonth}

    Generate:
    1. One spending alert (e.g., if a category is near its budget limit or spending is unusually high).
    2. One prediction (e.g., expected end-of-month spending based on rate).
    3. One actionable savings tip specific to their spending habits.
    
    Return as a JSON array adhering to the schema.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: insightsSchema,
      }
    });

    const insights = JSON.parse(response.text) as FinancialInsight[];
    return insights;
  } catch (error: any) {
    console.error('Error generating insights:', error);
    if (error.message?.includes('503') || error.status === 503 || JSON.stringify(error).includes('503')) {
      return [
        { type: 'alert', message: "The AI service is currently overloaded. Please try again in a few moments." }
      ];
    }
    return [
      { type: 'tip', message: "Track your expenses regularly to get better AI insights." }
    ];
  }
};

