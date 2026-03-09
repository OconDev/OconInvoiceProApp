
export const isValidDate = (date: any): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

export const safeDate = (date: any): Date => {
  const d = new Date(date);
  return isValidDate(d) ? d : new Date();
};

export const formatSafeDate = (date: any): string => {
  return safeDate(date).toLocaleDateString();
};

export const formatSafeTime = (date: any): string => {
  return safeDate(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const safeISODate = (date: any): string => {
  return safeDate(date).toISOString();
};
