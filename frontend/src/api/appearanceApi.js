import axiosClient from './axiosClient';

const BASE = '/appearance';

export const getThemeBySlug = (slug) =>
    axiosClient.get(BASE, { params: { slug } }).then((r) => r.data.theme);

export const getThemeAdmin = () =>
    axiosClient.get(BASE).then((r) => r.data.theme);

export const saveTheme = (themePayload) =>
    axiosClient.put(BASE, themePayload).then((r) => r.data.theme);

export const resetTheme = () =>
    axiosClient.post(`${BASE}/reset`).then((r) => r.data.theme);

export const generateThemeWithAI = (prompt) =>
    axiosClient.post(`${BASE}/ai-generate`, { prompt }).then((r) => r.data.theme);

