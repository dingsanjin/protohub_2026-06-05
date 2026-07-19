import { get, post } from './axios';
import type { PreviewInfo } from '@/types';

export async function getPreviewInfo(shortId: string): Promise<PreviewInfo> {
  const response = await get<{ data: PreviewInfo }>(`/preview/${shortId}`);
  return response.data;
}

export async function verifyPassword(shortId: string, password: string): Promise<{ success: boolean; data: PreviewInfo }> {
  return post(`/preview/${shortId}/verify`, { password });
}
