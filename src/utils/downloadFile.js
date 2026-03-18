// src/utils/downloadFile.js
// FIX: was using localStorage.getItem('token') directly — broken for
// "Don't Remember Me" sessions where the token lives in sessionStorage.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Read from whichever storage holds the active session token
const getToken = () =>
  localStorage.getItem('token') || sessionStorage.getItem('token');

/**
 * Download a document from the backend by its ID.
 * @param {string} docId    - MongoDB _id of the document
 * @param {string} filename - Suggested filename for the download
 */
export const downloadFile = async (docId, filename) => {
  const token = getToken();

  const response = await fetch(`${BASE_URL}/documents/${docId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};