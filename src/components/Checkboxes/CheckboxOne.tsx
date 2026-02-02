type CheckboxOneProps = {
  id: string;
  value: string | number;
  checked: boolean;
  setValue: (value: boolean) => void;
};

const CheckboxOne = ({ id, value, checked, setValue }: CheckboxOneProps) => {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            type="checkbox"
            id={id}
            className="sr-only"
            checked={checked}
            onChange={(e) => setValue(e.target.checked)}
          />
          <div
            className={`mr-4 flex h-5 w-5 items-center justify-center rounded border ${
              checked
                ? "border-primary bg-gray dark:bg-transparent"
                : "border-gray-400 bg-white"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-sm ${
                checked ? "bg-primary" : ""
              }`}
            ></span>
          </div>
        </div>
        {value}
      </label>
    </div>
  );
};

export default CheckboxOne;
