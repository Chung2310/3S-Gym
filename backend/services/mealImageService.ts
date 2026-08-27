import { fetchWithTimeout } from './providerRequest.js';

export interface MealImageResult {
  buffer?: Buffer;
  contentType?: string;
  redirectUrl?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80';

export async function getMealImage(prompt: string, seed: string): Promise<MealImageResult> {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=600&height=600&nologo=true&seed=${encodeURIComponent(seed)}`;
  try {
    const response = await fetchWithTimeout(url, { headers: { 'User-Agent': '3SGym-Backend/1.0' } }, 10_000);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength >= 5_000) {
      return { buffer, contentType: response.headers.get('content-type') || 'image/jpeg' };
    }
  } catch {
    // A stable redirect keeps the legacy endpoint usable without fabricating domain data.
  }
  return { redirectUrl: FALLBACK_IMAGE };
}
