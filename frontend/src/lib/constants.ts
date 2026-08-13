export const CROP_TYPES = [
  { value: "rice", label: "Rice (Oryza sativa)" },
  { value: "corn", label: "Corn / Maize" },
  { value: "tea", label: "Tea" },
  { value: "coconut", label: "Coconut" },
  { value: "banana", label: "Banana" },
  { value: "cassava", label: "Cassava" },
  { value: "pepper", label: "Pepper" },
  { value: "chilli", label: "Chilli" },
  { value: "tomato", label: "Tomato" },
  { value: "potato", label: "Potato" },
] as const;

export const REGIONS = [
  { value: "Colombo", label: "Colombo" },
  { value: "Gampaha", label: "Gampaha" },
  { value: "Kalutara", label: "Kalutara" },
  { value: "Kandy", label: "Kandy" },
  { value: "Matale", label: "Matale" },
  { value: "Nuwara Eliya", label: "Nuwara Eliya" },
  { value: "Galle", label: "Galle" },
  { value: "Matara", label: "Matara" },
  { value: "Hambantota", label: "Hambantota" },
  { value: "Jaffna", label: "Jaffna" },
  { value: "Kilinochchi", label: "Kilinochchi" },
  { value: "Mannar", label: "Mannar" },
  { value: "Vavuniya", label: "Vavuniya" },
  { value: "Mullaitivu", label: "Mullaitivu" },
  { value: "Batticaloa", label: "Batticaloa" },
  { value: "Ampara", label: "Ampara" },
  { value: "Trincomalee", label: "Trincomalee" },
  { value: "Kurunegala", label: "Kurunegala" },
  { value: "Puttalam", label: "Puttalam" },
  { value: "Anuradhapura", label: "Anuradhapura" },
  { value: "Polonnaruwa", label: "Polonnaruwa" },
  { value: "Badulla", label: "Badulla" },
  { value: "Monaragala", label: "Monaragala" },
  { value: "Ratnapura", label: "Ratnapura" },
  { value: "Kegalle", label: "Kegalle" },
] as const;

export const PROVINCES = [
  { name: "WESTERN",       districts: ["Colombo", "Gampaha", "Kalutara"] },
  { name: "CENTRAL",       districts: ["Kandy", "Matale", "Nuwara Eliya"] },
  { name: "SOUTHERN",      districts: ["Galle", "Matara", "Hambantota"] },
  { name: "NORTHERN",      districts: ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"] },
  { name: "EASTERN",       districts: ["Batticaloa", "Ampara", "Trincomalee"] },
  { name: "NORTH WESTERN", districts: ["Kurunegala", "Puttalam"] },
  { name: "NORTH CENTRAL", districts: ["Anuradhapura", "Polonnaruwa"] },
  { name: "UVA",           districts: ["Badulla", "Monaragala"] },
  { name: "SABARAGAMUWA",  districts: ["Ratnapura", "Kegalle"] },
] as const;

export type CropType = (typeof CROP_TYPES)[number]["value"];
export type Region = (typeof REGIONS)[number]["value"];
