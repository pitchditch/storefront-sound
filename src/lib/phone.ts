export const isValidE164 = (value: string) => {
  if (!value) return false;
  return /^\+[1-9]\d{1,14}$/.test(value);
};

export const normalizeToE164Draft = (value: string) => {
  if (!value) return "";
  const cleaned = value.replace(/[^\d+]/g, "");
  // Ensure a single leading + and digits
  const noPlus = cleaned.replace(/\+/g, "");
  return "+" + noPlus;
};
