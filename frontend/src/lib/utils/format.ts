export const formatCurrency = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0 ₽';
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
};
