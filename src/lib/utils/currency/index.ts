export const formatCurrency = (value: number, currency = "USD") => {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: currency,
  });
};

export const formatNumber = (value: number) => {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
};
