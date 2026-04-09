import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import { apiRequest } from '@/lib/apiClient';

const LocationSearch = ({ onLocationSelect, initialValue }) => {
  const [query, setQuery] = useState(initialValue || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (initialValue) {
        setQuery(initialValue);
    }
  }, [initialValue]);


  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedQuery.length > 2) {
        try {
          const response = await apiRequest(`/locations/search?q=${encodeURIComponent(debouncedQuery)}`);
          setSuggestions(response.suggestions || []);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Error fetching location suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    onLocationSelect(value); 
  };

  const handleSuggestionClick = (suggestion) => {
    const displayName = suggestion.display_name;
    setQuery(displayName);
    onLocationSelect(displayName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => debouncedQuery.length > 2 && setShowSuggestions(true)}
        placeholder="Buscar dirección..."
        autoComplete="off"
        required
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              className="px-4 py-3 cursor-pointer hover:bg-secondary text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                <span>{suggestion.display_name}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationSearch;
