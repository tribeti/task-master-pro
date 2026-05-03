export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      const timeoutError = new Error(`Kết nối bị gián đoạn (timeout sau ${timeoutMs / 1000}s)`);
      (timeoutError as any).status = 504;
      throw timeoutError;
    }
    throw error;
  }
};
