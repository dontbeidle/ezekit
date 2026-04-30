/**
 * API client — thin fetch wrapper for the ezekit backend.
 */

const BASE = "/api/ocr";

async function request(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  // Handle empty responses (204, etc.)
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Projects ──

export function fetchProjects() {
  return request("/projects");
}

export function fetchProject(id) {
  return request(`/projects/${id}`);
}

const MAX_PDF_SIZE = 500 * 1024 * 1024; // 500 MB

export async function createProject({ name, pdfFile }) {
  if (pdfFile.size > MAX_PDF_SIZE) {
    throw new Error("File too large (max 500 MB)");
  }
  const formData = new FormData();
  formData.append("name", name);
  formData.append("pdf_file", pdfFile);

  const url = `${BASE}/projects`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets it with boundary for multipart
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function deleteProject(id) {
  return request(`/projects/${id}`, { method: "DELETE" });
}

// ── Pages ──

export function fetchPages(projectId) {
  return request(`/projects/${projectId}/pages`);
}

export function getPageImageUrl(pageId) {
  return `${BASE}/pages/${pageId}/image`;
}



// ── Crops ──

export function fetchCrops(pageId) {
  return request(`/pages/${pageId}/crops`);
}

export function createCrop(pageId, data) {
  return request(`/pages/${pageId}/crops`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCrop(cropId, data) {
  return request(`/crops/${cropId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteCrop(cropId) {
  return request(`/crops/${cropId}`, { method: "DELETE" });
}

// ── Charsets ──

export function fetchCharsets(projectId) {
  return request(`/projects/${projectId}/charsets`);
}

export function createCharset(projectId, data) {
  return request(`/projects/${projectId}/charsets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCharset(charsetId, data) {
  return request(`/charsets/${charsetId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCharset(charsetId) {
  return request(`/charsets/${charsetId}`, { method: "DELETE" });
}

// ── Auto-detect ──

export function autoDetectLines(pageId, replace = false) {
  return request(`/pages/${pageId}/auto-detect${replace ? "?replace=true" : ""}`, {
    method: "POST",
  });
}

// ── Export ──

export function getExportCount(projectId) {
  return request(`/projects/${projectId}/export/count`);
}

export function exportProject(projectId, format = "parquet") {
  return request(`/projects/${projectId}/export?format=${format}`, {
    method: "POST",
  });
}

export function getExportDownloadUrl(projectId, format = "parquet") {
  return `${BASE}/projects/${projectId}/export/download?format=${format}`;
}
