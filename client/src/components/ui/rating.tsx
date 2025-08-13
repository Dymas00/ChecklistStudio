import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  className?: string;
}

export default function Rating({ 
  value = 0, 
  onChange, 
  max = 5, 
  size = 'md',
  readOnly = false,
  className 
}: RatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(value);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (rating: number) => {
    if (readOnly) return;
    
    setCurrentRating(rating);
    onChange?.(rating);
  };

  const handleStarHover = (rating: number) => {
    if (readOnly) return;
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  const getStarState = (starIndex: number) => {
    const rating = hoverRating || currentRating;
    return starIndex <= rating;
  };

  return (
    <div 
      className={cn("flex items-center space-x-1", className)}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = getStarState(starNumber);
        
        return (
          <Star
            key={starNumber}
            className={cn(
              sizeClasses[size],
              "transition-colors duration-150",
              readOnly ? "cursor-default" : "cursor-pointer",
              isFilled 
                ? "text-yellow-400 fill-yellow-400" 
                : "text-gray-300 hover:text-yellow-400"
            )}
            onClick={() => handleStarClick(starNumber)}
            onMouseEnter={() => handleStarHover(starNumber)}
          />
        );
      })}
      
      {!readOnly && (
        <span className="ml-2 text-sm text-gray-600">
          {currentRating}/{max}
        </span>
      )}
    </div>
  );
}

export { Rating };
