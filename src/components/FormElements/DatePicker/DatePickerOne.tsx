import flatpickr from "flatpickr";
import { useEffect, useRef } from "react";
import { Calendar } from "lucide-react";

interface DatePickerOneProps {
  formLabel?: string;
  name: string;
  id: string;
  value: string;
  setValue: (value: string) => void;
  labelClass?: string;
  inputClass?: string;
  icon?: React.ReactNode;
}

const DatePickerOne = ({
  formLabel,
  name,
  id,
  value,
  setValue,
  labelClass,
  inputClass,
  icon
}: DatePickerOneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const fp = flatpickr(inputRef.current, {
      mode: "single",
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d", // Standard format
      defaultDate: value || null,
      onChange: function (selectedDates, dateStr) {
        setValue && setValue(dateStr);
      },
      prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M5.4 10.8l1.4-1.4-4-4 4-4L5.4 0 0 5.4z" /></svg>',
      nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1.4 10.8L0 9.4l4-4-4-4L1.4 0l5.4 5.4z" /></svg>',
    });

    return () => {
      fp.destroy();
    };
  }, []); // Intentionally empty to run once on mount, value controlled by input

  // Separate effect to handle value updates from parent
  useEffect(() => {
    if (inputRef.current && (inputRef.current as any)._flatpickr) {
      (inputRef.current as any)._flatpickr.setDate(value);
    }
  }, [value]);


  return (
    <div className="w-full">
      {formLabel && (
        <label className={labelClass || "mb-3 block text-sm font-medium text-black dark:text-white"}>
          {formLabel}
        </label>
      )}
      <div className="relative w-full grid">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-gray-300">
          {icon || <Calendar size={18} />}
        </div>
        <input
          ref={inputRef}
          type="text"
          name={name}
          id={id}
          className={`${inputClass || "form-datepicker w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary pl-10"} !w-full`}
          placeholder="Select date..."
          data-class="flatpickr-right"
        />
      </div>
    </div>
  );
};

export default DatePickerOne;
