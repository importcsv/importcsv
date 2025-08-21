import { useRef, useState } from "react";
import { createPortal } from 'react-dom';
import useClickOutside from "../../hooks/useClickOutside";
import useRect from "../../hooks/useRect";
import useWindowSize from "../../hooks/useWindowSize";
import classes from "../../utils/classes";
import { InputProps } from "./types";
import { ChevronDown, Info } from "lucide-react";

export default function Input({ as = "input", label, icon, iconAfter, error, options, className, variants = [], children, ...props }: InputProps) {
  const Element = as;

  const containerClassName = classes(["flex flex-col", className]);

  const icon1 = icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>;

  const icon2 = iconAfter ? (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{iconAfter}</span>
  ) : (
    error && (
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
        <Info />
      </span>
    )
  );

  const iconSelect = options && (
    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
      <ChevronDown />
    </span>
  );

  const selectElement = options && options && <Select options={options} {...props} />;

  const inputWrapper = (
    <div className={classes(["relative flex items-center", error && "border-red-500"])}>
      {icon1}
      {selectElement || <Element className={classes(["w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", icon && "pl-10", (iconAfter || error) && "pr-10"])} {...props} {...(options ? { type: "text" } : {})} />}
      {iconSelect}
      {icon2}
    </div>
  );

  return (
    <div className={containerClassName}>
      <label className="flex flex-col">
        {label ? <span className="mb-1 text-sm font-medium text-gray-700">{label}</span> : null}
        {inputWrapper}
      </label>
      {error && <div className="mt-1 text-sm text-red-500">{error}</div>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

function Select({ options = {}, placeholder, ...props }: InputProps) {
  const [open, setOpen] = useState(false);

  const onChangeOption = (e: any) => {
    const { value } = e.target;
    props?.onChange && props?.onChange(value);
    e.stopPropagation();
    e.preventDefault();
    onBlur();
  };

  const selectedKey = Object.keys(options).find((k) => options[k].value === props.value) || "";

  const [setRef, size, updateRect] = useRect();
  const [setRefPortal, sizePortal, updatePortalRect] = useRect();
  const windowSize = useWindowSize();
  const top = size.y + sizePortal.height > windowSize[1] - 4 ? windowSize[1] - sizePortal.height - 4 : size.y + 4;

  const optionsPosition = {
    top: `${top}px`,
    left: `${size?.x}px`,
    width: `${size?.right - size?.left}px`,
  };

  const onFocus = () => {
    updateRect();
    updatePortalRect();
    setOpen(true);
  };

  const onBlur = () => {
    setOpen(false);
  };

  const ref = useRef(null);
  useClickOutside(ref, onBlur);

  return (
    <>
      <input
        {...props}
        value={selectedKey}
        className={classes(["w-full px-3 py-2 border rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500", open && "ring-2 ring-blue-500"])}
        readOnly
        onFocus={onFocus}
        placeholder={placeholder}
      />

      <div className="relative" ref={setRef} />

      {open && (
        <div className="fixed z-50 bg-white border rounded-md shadow-lg" style={optionsPosition} ref={setRefPortal}>
          <div className="py-1 max-h-60 overflow-auto" ref={ref}>
            {placeholder && (
              <button key={-1} className="w-full px-3 py-2 text-left text-gray-500 hover:bg-gray-100" onClick={onChangeOption}>
                {placeholder}
              </button>
            )}
            {Object.keys(options).map((k, i) => (
              <button
                key={k}
                className={classes(["w-full px-3 py-2 text-left hover:bg-gray-100", options[k].value === props.value && "bg-blue-50 text-blue-600"])}
                type="button"
                {...options[k]}
                onClick={onChangeOption}
                autoFocus={i === 0}>
                {k} {options[k].required && <span className="text-red-500 ml-1">*</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
