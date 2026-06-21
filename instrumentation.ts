export async function register() {
  const { validateEnv } = await import('@/lib/utils/env');

  try {
    validateEnv();
  } catch (error) {
    console.error(error);
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}
