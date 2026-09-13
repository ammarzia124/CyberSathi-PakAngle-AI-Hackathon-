const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  analyzeUrl: (url) => request("/analyze/url", { method: "POST", body: { url } }),
  analyzeMessage: (text) => request("/analyze/message", { method: "POST", body: { text } }),
  analyzeCombined: (text, urls) =>
    request("/analyze/combined", { method: "POST", body: { text, urls } }),
  analyzeScreenshot: async (file) => {
    const formData = new FormData();
    formData.append("screenshot", file);
    const response = await fetch(`${API_BASE}/analyze/screenshot`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  },
  getReport: (id) => request(`/report/${id}`),
  getScans: (page = 1) => request(`/scans?page=${page}`),
  getAnalytics: () => request("/analytics"),
};
