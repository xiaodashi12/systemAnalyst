import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export interface ProgressState {
  lastPage: number;
  lastTime: number;
  zoom: number | string;
  scrollTop?: number;
}

export interface Bookmark {
  page: number;
  label?: string;
  time: number;
}

export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'green';

export const useReaderStore = defineStore('reader', () => {
  // Reading Progress (Memory)
  const progressMap = ref<Record<string, ProgressState>>(
    JSON.parse(localStorage.getItem('pdf_reader_progress') || '{}')
  );

  // Bookmarks
  const bookmarksMap = ref<Record<string, Bookmark[]>>(
    JSON.parse(localStorage.getItem('pdf_reader_bookmarks') || '{}')
  );

  // Settings
  const theme = ref<ReaderTheme>((localStorage.getItem('pdf_reader_theme') as ReaderTheme) || 'light');
  const zoomLevel = ref<number | string>(
    localStorage.getItem('pdf_reader_zoom') 
      ? (isNaN(Number(localStorage.getItem('pdf_reader_zoom'))) 
          ? localStorage.getItem('pdf_reader_zoom')! 
          : Number(localStorage.getItem('pdf_reader_zoom')))
      : 'fit-width'
  );

  // Watchers to persist state
  watch(
    progressMap,
    (val) => {
      localStorage.setItem('pdf_reader_progress', JSON.stringify(val));
    },
    { deep: true }
  );

  watch(
    bookmarksMap,
    (val) => {
      localStorage.setItem('pdf_reader_bookmarks', JSON.stringify(val));
    },
    { deep: true }
  );

  watch(theme, (val) => {
    localStorage.setItem('pdf_reader_theme', val);
  });

  watch(zoomLevel, (val) => {
    localStorage.setItem('pdf_reader_zoom', String(val));
  });

  // Actions
  function updateProgress(bookId: string, page: number, zoom: number | string, scrollTop?: number) {
    progressMap.value[bookId] = {
      lastPage: page,
      lastTime: Date.now(),
      zoom,
      scrollTop,
    };
  }

  function getProgress(bookId: string): ProgressState | null {
    return progressMap.value[bookId] || null;
  }

  function addBookmark(bookId: string, page: number, label?: string) {
    if (!bookmarksMap.value[bookId]) {
      bookmarksMap.value[bookId] = [];
    }
    
    // Check if bookmark already exists
    const exists = bookmarksMap.value[bookId].some((b) => b.page === page);
    if (!exists) {
      bookmarksMap.value[bookId].push({
        page,
        label: label || `Page ${page}`,
        time: Date.now(),
      });
      // Sort bookmarks by page number
      bookmarksMap.value[bookId].sort((a, b) => a.page - b.page);
    }
  }

  function removeBookmark(bookId: string, page: number) {
    if (bookmarksMap.value[bookId]) {
      bookmarksMap.value[bookId] = bookmarksMap.value[bookId].filter((b) => b.page !== page);
    }
  }

  function hasBookmark(bookId: string, page: number): boolean {
    return bookmarksMap.value[bookId]?.some((b) => b.page === page) || false;
  }

  function getBookmarks(bookId: string): Bookmark[] {
    return bookmarksMap.value[bookId] || [];
  }

  // Theme configuration setter
  function setTheme(newTheme: ReaderTheme) {
    theme.value = newTheme;
  }

  // Zoom configuration setter
  function setZoomLevel(zoom: number | string) {
    zoomLevel.value = zoom;
  }

  return {
    progressMap,
    bookmarksMap,
    theme,
    zoomLevel,
    updateProgress,
    getProgress,
    addBookmark,
    removeBookmark,
    hasBookmark,
    getBookmarks,
    setTheme,
    setZoomLevel,
  };
});
