export const allowedOrigins = () =>
  (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
