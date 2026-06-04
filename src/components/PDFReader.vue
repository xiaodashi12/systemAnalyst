<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useReaderStore } from '../stores/reader';
import type { ReaderTheme } from '../stores/reader';
import { booksList } from '../config/books';
import { 
  ArrowLeft, Menu, Bookmark as BookmarkIcon, 
  Settings, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2,
  AlertTriangle
} from 'lucide-vue-next';
import OutlineDrawer from './OutlineDrawer.vue';

const props = defineProps<{
  bookId: string;
  pdfUrl: string;
  bookTitle: string;
}>();

const router = useRouter();
const store = useReaderStore();

// UI States
const isMenuOpen = ref(true);
const isDrawerOpen = ref(false);
const isSettingsOpen = ref(false);
const isImageLoading = ref(true);
const isImageError = ref(false);

// Find book configuration
const bookConfig = booksList.find((b) => b.id === props.bookId);
const totalPages = ref(bookConfig?.pages || 777);
const currentPage = ref(1);

// DOM Elements
const containerRef = ref<HTMLDivElement | null>(null);

// Touch Gestures
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

// Theme configuration
const activeTheme = computed(() => store.theme);
function selectTheme(themeName: ReaderTheme) {
  store.setTheme(themeName);
  document.documentElement.setAttribute('data-theme', themeName);
}

// Get Image URL for a specific page
function getPageUrl(page: number) {
  const filename = `page_${String(page).padStart(4, '0')}.jpg`;
  if (bookConfig?.pagesUrlBase) {
    const base = bookConfig.pagesUrlBase.endsWith('/')
      ? bookConfig.pagesUrlBase
      : `${bookConfig.pagesUrlBase}/`;
    return `${base}${filename}`;
  }
  return `/pages/${props.bookId}/${filename}`;
}

const currentPageUrl = computed(() => getPageUrl(currentPage.value));

// Preload neighboring page images in browser cache
function preloadAdjacentImages(page: number) {
  const pagesToPreload = [page - 1, page + 1, page + 2];
  for (const p of pagesToPreload) {
    if (p >= 1 && p <= totalPages.value) {
      const img = new Image();
      img.src = getPageUrl(p);
    }
  }
}

// Zoom computed style
const zoomStyle = computed(() => {
  if (store.zoomLevel === 'fit-width') {
    return {
      width: '100%',
      maxWidth: '100%',
    };
  } else {
    const scale = Number(store.zoomLevel) || 1.0;
    return {
      width: `${scale * 100}%`,
      maxWidth: 'none',
    };
  }
});

// Image load events
function onImageLoad() {
  isImageLoading.value = false;
  isImageError.value = false;
  
  // Save progress (scrollTop is set to 0 for page changes)
  store.updateProgress(props.bookId, currentPage.value, store.zoomLevel, 0);
  
  // Preload neighboring pages
  preloadAdjacentImages(currentPage.value);
}

function onImageError() {
  isImageLoading.value = false;
  isImageError.value = true;
}

// Initialize page on mount
onMounted(() => {
  document.documentElement.setAttribute('data-theme', store.theme);
  
  // Restore reading progress if available
  const savedProgress = store.getProgress(props.bookId);
  if (savedProgress) {
    currentPage.value = Math.min(savedProgress.lastPage, totalPages.value);
    if (savedProgress.zoom) {
      store.setZoomLevel(savedProgress.zoom);
    }
  }
  
  // Initial preload
  preloadAdjacentImages(currentPage.value);
});

// Watch current page changes
watch(currentPage, () => {
  isImageLoading.value = true;
  isImageError.value = false;
  if (containerRef.value) {
    containerRef.value.scrollTop = 0; // Scroll back to top on page change
  }
});

// Navigation Actions
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function jumpToPage(pageNum: number) {
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    currentPage.value = pageNum;
  }
}

// Swipe and click gestures
function onPageTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
}

function onPageTouchEnd(e: TouchEvent) {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  const diffX = touchEndX - touchStartX;
  const diffY = touchEndY - touchStartY;
  const duration = Date.now() - touchStartTime;
  
  // Swipe Left -> Next Page, Swipe Right -> Prev Page
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40 && duration < 300) {
    if (diffX < 0) {
      nextPage();
    } else {
      prevPage();
    }
    return;
  }
  
  // Center tap detection to toggle menu overlays
  if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10 && duration < 250) {
    const screenWidth = window.innerWidth;
    const clickX = touchEndX;
    
    if (clickX < screenWidth * 0.3) {
      prevPage();
    } else if (clickX > screenWidth * 0.7) {
      nextPage();
    } else {
      isMenuOpen.value = !isMenuOpen.value;
      if (!isMenuOpen.value) {
        isSettingsOpen.value = false;
      }
    }
  }
}

// Zoom toggles
function handleZoomChange(type: 'in' | 'out' | 'fit') {
  if (type === 'fit') {
    store.setZoomLevel('fit-width');
  } else {
    let currentZoom = store.zoomLevel === 'fit-width' ? 1.0 : Number(store.zoomLevel);
    if (type === 'in') {
      currentZoom = Math.min(3.0, currentZoom + 0.25);
    } else {
      currentZoom = Math.max(0.5, currentZoom - 0.25);
    }
    store.setZoomLevel(currentZoom);
  }
}

// Bookmarks
const isCurrentPageBookmarked = computed(() => {
  return store.hasBookmark(props.bookId, currentPage.value);
});

function toggleBookmark() {
  if (isCurrentPageBookmarked.value) {
    store.removeBookmark(props.bookId, currentPage.value);
  } else {
    store.addBookmark(props.bookId, currentPage.value, `第 ${currentPage.value} 页 (系分)`);
  }
}
</script>

<template>
  <div class="reader-wrapper">
    <!-- Top Menu Header (Animated) -->
    <transition name="slide-down">
      <header class="reader-header glassmorphism" v-show="isMenuOpen">
        <button class="icon-btn clickable" @click="router.push('/')">
          <ArrowLeft :size="22" />
        </button>
        
        <h1 class="book-title-header">{{ bookTitle }}</h1>
        
        <div class="header-actions">
          <button 
            class="icon-btn clickable" 
            :class="{ bookmarked: isCurrentPageBookmarked }"
            @click="toggleBookmark"
          >
            <BookmarkIcon :size="22" :fill="isCurrentPageBookmarked ? 'currentColor' : 'none'" />
          </button>
          <button class="icon-btn clickable" @click="isDrawerOpen = true">
            <Menu :size="22" />
          </button>
        </div>
      </header>
    </transition>

    <!-- Core Reader Content -->
    <div 
      ref="containerRef" 
      class="pdf-page-container"
      :class="[`theme-${activeTheme}`]"
      @touchstart="onPageTouchStart"
      @touchend="onPageTouchEnd"
    >
      <!-- Page Image Loading Skeleton -->
      <div v-if="isImageLoading" class="loading-overlay">
        <div class="loader-card glassmorphism">
          <Loader2 class="spinner" :size="32" />
          <span class="loading-text">正在加载第 {{ currentPage }} 页...</span>
        </div>
      </div>

      <!-- Sliced Image Viewer -->
      <div class="image-viewer-wrapper" v-show="!isImageError">
        <div class="image-shadow" :style="zoomStyle">
          <img 
            :src="currentPageUrl" 
            :alt="`第 ${currentPage} 页`"
            class="page-image"
            @load="onImageLoad"
            @error="onImageError"
            draggable="false"
          />
        </div>
      </div>

      <!-- Error State -->
      <div v-if="isImageError" class="loading-overlay">
        <div class="loader-card error-card glassmorphism">
          <AlertTriangle class="error-icon" :size="32" />
          <span class="loading-text">图片加载失败</span>
          <span class="error-details text-muted">第 {{ currentPage }} 页</span>
          <p class="error-advice text-muted">
            请确认本地切片文件已成功生成。检查路径是否存在：`/public/pages/${bookId}/page_*.jpg`。
          </p>
        </div>
      </div>
    </div>

    <!-- Bottom Navigation Bar (Animated) -->
    <transition name="slide-up">
      <footer class="reader-footer glassmorphism" v-show="isMenuOpen">
        <div class="footer-slider-row">
          <button class="arrow-btn" @click="prevPage" :disabled="currentPage <= 1">
            <ChevronLeft :size="20" />
          </button>
          
          <input 
            type="range" 
            min="1" 
            :max="totalPages" 
            v-model.number="currentPage"
            @change="jumpToPage(currentPage)"
            class="page-slider"
          />
          
          <button class="arrow-btn" @click="nextPage" :disabled="currentPage >= totalPages">
            <ChevronRight :size="20" />
          </button>
        </div>
        
        <div class="footer-control-row">
          <span class="page-indicator">第 {{ currentPage }} / {{ totalPages }} 页</span>
          
          <div class="footer-controls">
            <button class="icon-btn clickable" @click="isSettingsOpen = !isSettingsOpen">
              <Settings :size="20" />
            </button>
          </div>
        </div>
      </footer>
    </transition>

    <!-- Floating Settings Modal -->
    <transition name="fade">
      <div class="settings-modal glassmorphism" v-if="isSettingsOpen && isMenuOpen">
        <!-- Theme selectors -->
        <div class="settings-section">
          <span class="section-label">阅读底色</span>
          <div class="theme-picker">
            <button 
              class="theme-btn theme-light" 
              :class="{ selected: activeTheme === 'light' }"
              @click="selectTheme('light')"
            >明亮</button>
            <button 
              class="theme-btn theme-sepia" 
              :class="{ selected: activeTheme === 'sepia' }"
              @click="selectTheme('sepia')"
            >护眼</button>
            <button 
              class="theme-btn theme-green" 
              :class="{ selected: activeTheme === 'green' }"
              @click="selectTheme('green')"
            >绿意</button>
            <button 
              class="theme-btn theme-dark" 
              :class="{ selected: activeTheme === 'dark' }"
              @click="selectTheme('dark')"
            >深色</button>
          </div>
        </div>

        <!-- Zoom settings -->
        <div class="settings-section">
          <span class="section-label">显示缩放</span>
          <div class="zoom-picker">
            <button class="zoom-btn" @click="handleZoomChange('out')">
              <ZoomOut :size="16" />
              <span>缩小</span>
            </button>
            <span class="zoom-value">{{ store.zoomLevel === 'fit-width' ? '适应宽度' : `${Math.round(Number(store.zoomLevel) * 100)}%` }}</span>
            <button class="zoom-btn" @click="handleZoomChange('in')">
              <ZoomIn :size="16" />
              <span>放大</span>
            </button>
            <button class="zoom-btn btn-fit" @click="handleZoomChange('fit')">
              <span>宽度自适应</span>
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Directory & Search Drawer -->
    <OutlineDrawer 
      :is-open="isDrawerOpen"
      :pdf="null"
      :book-id="bookId"
      :current-page="currentPage"
      @close="isDrawerOpen = false"
      @jump-to-page="jumpToPage"
    />
  </div>
</template>

<style scoped>
.reader-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--reader-bg);
}

/* Header Overlay */
.reader-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 50;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.book-title-header {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55%;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.icon-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.icon-btn:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

.icon-btn.bookmarked {
  color: var(--accent-color);
}

/* Core PDF Page Viewer Area */
.pdf-page-container {
  flex-grow: 1;
  width: 100%;
  overflow-y: auto;
  overflow-x: auto;
  display: flex;
  align-items: center; /* Center horizontally/vertically */
  justify-content: center;
  padding: 64px 8px 64px 8px; /* Top & bottom margins to make room for bars */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  transition: background-color var(--transition-normal);
}

/* Theme adjustments */
.pdf-page-container.theme-light { background-color: #f3f4f6; }
.pdf-page-container.theme-dark { background-color: #0b0f19; }
.pdf-page-container.theme-sepia { background-color: #ebdccb; }
.pdf-page-container.theme-green { background-color: #d0ebd0; }

.image-viewer-wrapper {
  display: flex;
  justify-content: center;
  margin: auto;
  width: 100%;
}

.image-shadow {
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  overflow: hidden;
  background-color: #ffffff;
  transition: width 0.2s ease-in-out;
}

.page-image {
  width: 100%;
  height: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}

/* Loading Screen Overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  padding: 24px;
}

.loader-card {
  padding: 24px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 280px;
  box-shadow: var(--shadow-lg);
}

.error-card {
  border: 1px solid rgba(239, 68, 68, 0.2);
  max-width: 320px;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 8px;
}

.error-details {
  font-size: 11px;
  font-family: monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 8px;
  word-break: break-all;
  max-width: 100%;
}

.error-advice {
  font-size: 11px;
  margin-top: 12px;
  line-height: 1.5;
  text-align: left;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-top: 12px;
}

.spinner {
  animation: spin 1s linear infinite;
  color: var(--accent-color);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Bottom Menu Footer */
.reader-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 16px;
  z-index: 50;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  gap: 4px;
}

.footer-slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.arrow-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  transition: color var(--transition-fast), opacity var(--transition-fast);
}

.arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-slider {
  flex-grow: 1;
  height: 4px;
  border-radius: 2px;
  background-color: var(--border-color);
  outline: none;
  accent-color: var(--accent-color);
  -webkit-appearance: none;
}

.page-slider::-webkit-slider-runnable-track {
  height: 4px;
}

.page-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  margin-top: -6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.footer-control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.page-indicator {
  font-weight: 500;
}

.footer-controls {
  display: flex;
  gap: 12px;
}

/* Floating Settings Dialog */
.settings-modal {
  position: absolute;
  bottom: 74px;
  left: 16px;
  right: 16px;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 45;
  box-shadow: var(--shadow-lg);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.theme-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.theme-btn {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px 0;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.theme-btn.selected {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-light);
}

.theme-light { background-color: #f9fafb; color: #111827; }
.theme-sepia { background-color: #fdf6e3; color: #5c4738; }
.theme-green { background-color: #f4faf4; color: #2d4a2d; }
.theme-dark { background-color: #1e293b; color: #f8fafc; }

.zoom-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.zoom-btn {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.zoom-btn:hover {
  background-color: var(--border-color);
}

.btn-fit {
  margin-left: auto;
}

.zoom-value {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  min-width: 50px;
  text-align: center;
}

/* Animations for Bars */
.slide-down-enter-active, .slide-down-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from, .slide-down-leave-to {
  transform: translateY(-100%);
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
