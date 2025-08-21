import { useEffect, useState } from "react";
import classes from "../../utils/classes";
import { Option, ToggleFilterProps } from "./types";

function ToggleFilter({ options, onChange, className }: ToggleFilterProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const toggleFilterClassName = classes(["inline-flex rounded-md shadow-sm", className]);

  useEffect(() => {
    const defaultSelected = options.find((option) => option.selected);
    setSelectedOption(defaultSelected ? defaultSelected.label : options[0]?.label);
  }, [options]);

  const handleClick = (option: Option) => {
    setSelectedOption(option.label);
    if (onChange) {
      onChange(option.filterValue);
    }
  };

  const getButtonClasses = (option: Option, index: number, total: number) => {
    const isSelected = selectedOption === option.label;
    const isFirst = index === 0;
    const isLast = index === total - 1;
    
    return classes([
      "px-4 py-2 text-sm font-medium border",
      isSelected ? "bg-blue-600 text-white border-blue-600 z-10" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
      isFirst && "rounded-l-md",
      isLast && "rounded-r-md",
      !isFirst && "-ml-px"
    ]);
  };

  return (
    <div className={toggleFilterClassName}>
      {options.map((option, index) => (
        <button
          key={option.label}
          className={getButtonClasses(option, index, options.length)}
          onClick={() => handleClick(option)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default ToggleFilter;
