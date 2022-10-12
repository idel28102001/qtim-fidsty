import { format, previousMonday } from 'date-fns';

export const getDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};

export const getTime = (date: Date) => {
  return format(date, 'HH:mm');
};

export const getMonday = (d) => {
  const monday = previousMonday(d);
  return format(new Date(monday), 'yyyy-MM-dd');
};
