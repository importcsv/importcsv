import { useEffect, useState } from "preact/hooks";
import { Select } from "../../../components/ui/select";
import { InputOption } from "../../../components/Input/types";

type DropdownFieldsProps = {
  options: { [key: string]: InputOption };
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  selectedValues: { id?: string; key?: string; selected: boolean | undefined }[];
  updateSelectedValues: (updatedValues: { id?: string; key?: string; selected: boolean | undefined }[]) => void;
};

export default function DropdownFields({ 
  options, 
  value, 
  placeholder, 
  onChange, 
  selectedValues, 
  updateSelectedValues 
}: DropdownFieldsProps) {
  const [selectedOption, setSelectedOption] = useState(value);
  const [filteredOptions, setFilteredOptions] = useState<{ [key: string]: InputOption }>({});

  useEffect(() => {
    setSelectedOption(value);
  }, [selectedValues]);

  useEffect(() => {
    filterOptions();
  }, [options, selectedValues]);

  const handleValueChange = (newValue: string) => {
    // Handle special values
    if (newValue === "__placeholder__" || newValue === "__empty__") {
      // If placeholder or empty selection, treat it as an empty string 
      const updatedSelectedValues = selectedValues.map((item) => {
        if (item.key === selectedOption) {
          return { ...item, selected: false };
        }
        return item;
      });
      
      setSelectedOption("");
      updateSelectedValues([...updatedSelectedValues]);
      onChange("");
      return;
    }
    
    const updatedSelectedValues = selectedValues.map((item) => {
      if (item.key === selectedOption) {
        return { ...item, selected: false };
      } else if (item.key === newValue) {
        return { ...item, selected: true };
      }
      return item;
    });
    
    setSelectedOption(newValue);
    updateSelectedValues([...updatedSelectedValues]);
    onChange(newValue);
  };

  const filterOptions = () => {
    const newFilteredOptions: { [key: string]: InputOption } = {};
    for (const key in options) {
      const option = options[key];
      const isSelected = selectedValues.some((item) => ((item as any).id || item.key) === option?.value && item.selected && option.value !== value);
      if (!isSelected) {
        newFilteredOptions[key] = option;
      }
    }
    setFilteredOptions(newFilteredOptions);
  };

  const isEmpty = Object.keys(filteredOptions).length === 0;

  // Convert options to array format for SimpleSelect
  const selectOptions = [
    ...(placeholder ? [{ value: "__placeholder__", label: placeholder }] : []),
    ...Object.entries(filteredOptions).map(([key, option]) => ({
      value: String(option.value || "__empty__"),
      label: `${key}${option.required ? " *" : ""}`
    }))
  ];

  return (
    <Select
      value={selectedOption}
      onChange={(e) => handleValueChange(e.target.value)}
      disabled={isEmpty}
      options={selectOptions}
    />
  );
}
