
import { useState } from 'react';

export interface CategoryResult {
  category: string;
  confidence: number;
}

export const useCategoryDetection = () => {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectCategory = async (merchant: string, items: any[]): Promise<CategoryResult> => {
    setIsDetecting(true);
    
    try {
      // Simple category detection logic
      const merchantLower = merchant?.toLowerCase() || '';
      const itemTexts = items?.map(item => 
        `${item.description || ''} ${item.name || ''}`.toLowerCase()
      ).join(' ') || '';
      
      const allText = `${merchantLower} ${itemTexts}`;
      
      // Category detection rules
      const categories = [
        {
          name: 'groceries',
          keywords: ['grocery', 'supermarket', 'walmart', 'target', 'kroger', 'safeway', 'whole foods', 'food', 'produce', 'dairy', 'meat', 'vegetables'],
          confidence: 0.9
        },
        {
          name: 'restaurants',
          keywords: ['restaurant', 'cafe', 'diner', 'pizza', 'burger', 'coffee', 'starbucks', 'mcdonald', 'subway', 'taco', 'chinese', 'sushi'],
          confidence: 0.85
        },
        {
          name: 'gas',
          keywords: ['gas', 'fuel', 'shell', 'exxon', 'chevron', 'bp', 'mobil', 'texaco', 'station'],
          confidence: 0.95
        },
        {
          name: 'shopping',
          keywords: ['store', 'shop', 'mall', 'amazon', 'ebay', 'clothing', 'shoes', 'electronics', 'home depot', 'lowes'],
          confidence: 0.8
        },
        {
          name: 'travel',
          keywords: ['hotel', 'airline', 'flight', 'airport', 'uber', 'lyft', 'taxi', 'rental', 'vacation', 'booking'],
          confidence: 0.85
        },
        {
          name: 'healthcare',
          keywords: ['pharmacy', 'doctor', 'hospital', 'medical', 'health', 'cvs', 'walgreens', 'clinic'],
          confidence: 0.9
        },
        {
          name: 'entertainment',
          keywords: ['movie', 'theater', 'cinema', 'netflix', 'spotify', 'game', 'entertainment', 'concert', 'ticket'],
          confidence: 0.8
        }
      ];

      // Find the best matching category
      let bestMatch = { name: 'other', confidence: 0.5 };
      
      for (const category of categories) {
        const matchCount = category.keywords.filter(keyword => 
          allText.includes(keyword)
        ).length;
        
        if (matchCount > 0) {
          const confidence = Math.min(category.confidence, matchCount * 0.3 + 0.4);
          if (confidence > bestMatch.confidence) {
            bestMatch = { name: category.name, confidence };
          }
        }
      }

      return {
        category: bestMatch.name,
        confidence: bestMatch.confidence
      };
    } catch (error) {
      console.error('Category detection error:', error);
      return { category: 'other', confidence: 0.3 };
    } finally {
      setIsDetecting(false);
    }
  };

  return {
    detectCategory,
    isDetecting
  };
};
