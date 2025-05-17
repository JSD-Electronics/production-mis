type CheckboxOneProps = {
  id: string;                   // Assuming id is a string
  value: string | number;       // Depending on your use case
  checked: boolean;
  setValue: (value: boolean) => void; // Assuming it toggles the checkbox state
};
const CheckboxOne = ({ id, value, checked, setValue }:CheckboxOneProps) => {
  return (
    <div>
      <label
        htmlFor="checkboxLabelOne"
        className="flex cursor-pointer select-none items-center"
      >
        <div className="relative">
          <input
            type="checkbox"
            id="checkboxLabelOne"
            className="sr-only"
            checked={checked}
            onChange={(e) => setValue(e.target.checked)}
          />
          <div
            className={`mr-4 flex h-5 w-5 items-center justify-center rounded border ${
              isChecked && "border-primary bg-gray dark:bg-transparent"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-sm ${isChecked && "bg-primary"}`}
            ></span>
          </div>
        </div>
        Checkbox Text
      </label>
    </div>
  );
};

export default CheckboxOne;
