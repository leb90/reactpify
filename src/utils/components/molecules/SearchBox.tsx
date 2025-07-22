import React, { useState } from 'react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

interface SearchBoxProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  loading?: boolean;
  className?: string;
  showButton?: boolean;
  buttonText?: string;
}

/**
 * SearchBox Molecule - Combines Input and Button atoms
 * Example molecule component - feel free to modify or delete
 */
export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = 'Search...',
  onSearch,
  loading = false,
  className = '',
  showButton = true,
  buttonText = 'Search'
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <div className="flex-1">
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={setQuery}
          disabled={loading}
          onKeyPress={handleKeyPress}
        />
      </div>
      
      {showButton && (
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          loading={loading}
          variant="primary"
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
}; 