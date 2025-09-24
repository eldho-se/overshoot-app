import React, { useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';

export interface Country {
  countryCode: string;
  countryName: string;
  shortName: string;
  abbr: string;
  people: string;
}

interface CountrySelectorProps {
  options?: Country[];
  onChange: (country: Country | null) => void;
  value?: string;
  defaultCode?: string;
  label?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({ options, onChange, value, defaultCode, label }) => {
  const [countries, setCountries] = useState<Country[]>(options ?? []);
  const isControlled = typeof value === 'string';
  const initialCode = value ?? defaultCode ?? '5001';
  const [selectedCode, setSelectedCode] = useState<string>(initialCode);
  const [error, setError] = useState<boolean>(false);
  const didInit = useRef(false);

  useEffect(() => {
    if (Array.isArray(options) && options.length > 0) {
      setCountries(options);
      setError(false);
    } else {
      setError(true);
    }
  }, [options]);

  const prioritized = useMemo(() => {
    if (!countries.length) return [];
    const priorityNames = ["world", "germany", "poland", "france"];
    const priority = countries.filter(c => priorityNames.includes(c.countryName.toLowerCase()));
    const rest = countries.filter(c => !priorityNames.includes(c.countryName.toLowerCase()));
    return [...priority, ...rest];
  }, [countries]);


  const selectOptions = useMemo(() =>
    prioritized.map(c => ({ value: c.countryCode, label: c.shortName })),
  [prioritized]);

  useEffect(() => {
    if (didInit.current || !prioritized.length) return;
    didInit.current = true;
    const code = isControlled ? value : selectedCode;
    const country = prioritized.find(c => c.countryCode === code) || prioritized[0] || null;
    onChange(country);
  }, [prioritized, isControlled, selectedCode, value, onChange]);

  return (
    <div className="w-full max-w-[220px]">
      <label className="block text-gray-300 mb-2">{label || 'Select Country'}</label>
      <Select
        options={selectOptions}
        onChange={option => {
          if (!option) {
            
            const worldCountry = prioritized.find(c => c.countryName.toLowerCase() === 'world');
            if (!isControlled && worldCountry) setSelectedCode(worldCountry.countryCode);
            onChange(worldCountry || null);
            return;
          }
          
          const country = prioritized.find(c => c.countryCode === option.value) || null;
          if (!isControlled && option.value) setSelectedCode(option.value);
          onChange(country);
        }}
        value={(() => {
          const code = isControlled ? value : selectedCode;
          const country = prioritized.find(c => c.countryCode === code);
          return country ? { value: country.countryCode, label: country.shortName } : null;
        })()}
        placeholder="Search or select..."
        isClearable
        classNamePrefix="react-select"
        styles={{
          control: (base) => ({
            ...base,
            backgroundColor: '#1e293b',
            borderColor: '#475569',
            color: '#f1f5f9',
          }),
          menu: (base) => ({ ...base, backgroundColor: '#1e293b', color: '#f1f5f9' }),
          menuList: (base) => ({ ...base, backgroundColor: '#1e293b', color: '#f1f5f9' }),
          singleValue: (base) => ({ ...base, color: '#f1f5f9' }),
          placeholder: (base) => ({ ...base, color: '#94a3b8' }),
          input: (base) => ({ ...base, color: '#f1f5f9', caretColor: '#f1f5f9' }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isFocused ? '#334155' : '#1e293b',
            color: '#f1f5f9',
          }),
          dropdownIndicator: (base) => ({ ...base, color: '#94a3b8' }),
          clearIndicator: (base) => ({ ...base, color: '#94a3b8' }),
          indicatorSeparator: (base) => ({ ...base, backgroundColor: '#475569' }),
          valueContainer: (base) => ({ ...base, color: '#f1f5f9' }),
        }}
      />
    </div>
  );
};

export default CountrySelector;
