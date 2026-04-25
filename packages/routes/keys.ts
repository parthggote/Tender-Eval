export function keys() {
  return {
    NEXT_PUBLIC_PORTAL_URL:
      process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000',
    NEXT_PUBLIC_INTERNAL_API_URL:
      process.env.NEXT_PUBLIC_INTERNAL_API_URL ?? 'http://localhost:8000'
  };
}

