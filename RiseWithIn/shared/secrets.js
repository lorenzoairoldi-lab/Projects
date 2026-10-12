export const requiredSecret = (name, developmentFallback) => {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production`);
  }
  return developmentFallback;
};
