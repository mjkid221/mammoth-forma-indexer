const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // 1 second

/**
 * Retries a function a specified number of times with a delay between retries.
 * @param fn - The function to retry.
 * @param retries - The number of times to retry the function.
 * @param delay - The delay between retries in milliseconds.
 * @returns The result of the function.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY_MS,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay);
  }
}
