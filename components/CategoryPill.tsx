
import React from 'react';
import { Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface CategoryPillProps {
  category: Category;
}

const CategoryPill: React.FC<CategoryPillProps> = ({ category }) => {
  const colorClass = CATEGORY_COLORS[category] || 'bg-gray-500';

  return (
    <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${colorClass}`}>
      {category}
    </span>
  );
};

export default CategoryPill;
