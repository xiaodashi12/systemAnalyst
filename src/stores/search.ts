import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface PageIndex {
  page: number;
  text: string;
}

export const useSearchStore = defineStore('search', () => {
  const indices = ref<Record<string, PageIndex[]>>({});
  const isLoading = ref(false);

  // Load search index for a book (loads only once and caches in memory)
  async function loadIndex(bookId: string) {
    if (indices.value[bookId]) return; // Already cached
    
    isLoading.value = true;
    try {
      const baseUrl = import.meta.env.BASE_URL || '/';
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const res = await fetch(`${cleanBaseUrl}pages/${bookId}-index.json`);
      if (!res.ok) {
        throw new Error(`Failed to load index: ${res.statusText}`);
      }
      indices.value[bookId] = await res.json();
    } catch (err) {
      console.error(`Error loading search index for ${bookId}:`, err);
    } finally {
      isLoading.value = false;
    }
  }

  // Perform full-text search locally
  function search(bookId: string, keyword: string): Array<{
    page: number;
    preview: string; // Surrounding snippet containing keyword
  }> {
    if (!keyword.trim() || !indices.value[bookId]) return [];
    
    const kw = keyword.toLowerCase();
    const results: Array<{ page: number; preview: string }> = [];
    
    for (const item of indices.value[bookId]) {
      const lowerText = item.text.toLowerCase();
      const pos = lowerText.indexOf(kw);
      if (pos !== -1) {
        // Extract 30 characters before and after the keyword for preview context
        const start = Math.max(0, pos - 30);
        const end = Math.min(item.text.length, pos + keyword.length + 30);
        const preview = (start > 0 ? '...' : '') + 
                        item.text.slice(start, end) + 
                        (end < item.text.length ? '...' : '');
        results.push({ page: item.page, preview });
      }
    }
    
    return results;
  }

  return { indices, isLoading, loadIndex, search };
});
