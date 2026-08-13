import { useState } from "react";
import { CROP_TYPES, type CropType, type Region } from "@/lib/constants";
import type { AgentQuery } from "@/lib/types";
import Button from "@/components/common/Button";
import ImageUpload from "./ImageUpload";
import RegionSelect from "./RegionSelect";

interface QueryFormProps {
  onSubmit: (query: AgentQuery) => void;
  loading?: boolean;
}

interface FormState {
  crop_type: CropType | "";
  symptoms: string;
  region: Region | "";
  image_base64: string;
}

const EMPTY: FormState = {
  crop_type: "",
  symptoms: "",
  region: "",
  image_base64: "",
};

function fieldLabel(label: string, htmlFor: string, required = true) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-1.5">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export default function QueryForm({ onSubmit, loading = false }: QueryFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);

  const isValid =
    form.crop_type !== "" &&
    form.symptoms.trim().length >= 10 &&
    form.region !== "" &&
    form.image_base64 !== "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || loading) return;
    onSubmit({
      crop_type: form.crop_type as CropType,
      symptoms: form.symptoms.trim(),
      region: form.region as Region,
      image_base64: form.image_base64,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-green-100 shadow-sm p-6 sm:p-8 space-y-6">

      {/* Crop type */}
      <div>
        {fieldLabel("Crop type", "crop_type")}
        <select
          id="crop_type"
          value={form.crop_type}
          onChange={(e) => setForm((f) => ({ ...f, crop_type: e.target.value as CropType }))}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none
            bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M4.646%206.646a.5.5%200%200%201%20.708%200L8%209.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22%2F%3E%3C%2Fsvg%3E')]
            bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem] pr-8"
        >
          <option value="" disabled>Select crop…</option>
          {CROP_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Region */}
      <div>
        {fieldLabel("Your district", "region")}
        <RegionSelect
          value={form.region}
          onChange={(region) => setForm((f) => ({ ...f, region }))}
        />
      </div>

      {/* Symptoms */}
      <div>
        {fieldLabel("Describe what you see", "symptoms")}
        <textarea
          id="symptoms"
          value={form.symptoms}
          onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
          placeholder="e.g. Yellowing leaves with brown spots on the edges, spreading inward from older leaves…"
          rows={4}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800
            placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500
            focus:border-transparent resize-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          {form.symptoms.trim().length < 10
            ? `At least ${10 - form.symptoms.trim().length} more character${10 - form.symptoms.trim().length === 1 ? "" : "s"} needed`
            : `${form.symptoms.trim().length} characters`}
        </p>
      </div>

      {/* Image upload */}
      <div>
        {fieldLabel("Photo of affected crop", "image")}
        <ImageUpload
          onImageReady={(base64) => setForm((f) => ({ ...f, image_base64: base64 }))}
          onClear={() => setForm((f) => ({ ...f, image_base64: "" }))}
        />
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={!isValid}
          className="w-full"
        >
          {loading ? "Analysing…" : "Diagnose my crop"}
        </Button>
        {!isValid && !loading && (
          <p className="mt-2 text-xs text-center text-gray-400">
            Fill in all fields and upload a photo to continue
          </p>
        )}
      </div>
    </form>
  );
}
