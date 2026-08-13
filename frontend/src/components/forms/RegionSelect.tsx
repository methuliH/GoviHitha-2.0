import { REGIONS, type Region } from "@/lib/constants";

interface RegionSelectProps {
  value: Region | "";
  onChange: (value: Region) => void;
  id?: string;
}

export default function RegionSelect({ value, onChange, id = "region" }: RegionSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as Region)}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800
        focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed appearance-none
        bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M4.646%206.646a.5.5%200%200%201%20.708%200L8%209.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22%2F%3E%3C%2Fsvg%3E')]
        bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]
        pr-8"
    >
      <option value="" disabled>Select your district…</option>
      {REGIONS.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
