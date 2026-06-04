<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useReaderStore } from '../stores/reader';
import { useSearchStore } from '../stores/search';
import { 
  X, List, Bookmark as BookmarkIcon, Search, 
  Trash2, Loader2, ArrowRight
} from 'lucide-vue-next';

interface FlattenedOutline {
  title: string;
  level: number;
  pageNum?: number;
}

const props = withDefaults(defineProps<{
  isOpen: boolean;
  pdf: any;
  bookId: string;
  currentPage: number;
  isCached?: boolean;
  cacheProgress?: number;
}>(), {
  isCached: true,
  cacheProgress: 100
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'jumpToPage', pageNum: number): void;
}>();

const store = useReaderStore();
const activeTab = ref<'toc' | 'bookmarks' | 'search'>('toc');

// TOC State
const outline = ref<FlattenedOutline[]>([]);
const isOutlineLoading = ref(false);

// Search State
const searchQuery = ref('');
const searchResults = ref<Array<{ pageNum: number; snippet: string }>>([]);
const searchProgress = ref(0);
const isSearching = ref(false);

// Bookmarks State
const bookmarks = computed(() => store.getBookmarks(props.bookId));

const searchStore = useSearchStore();

// Load outline from pre-generated JSON
async function loadOutline() {
  if (outline.value.length > 0) return;
  isOutlineLoading.value = true;
  
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    const res = await fetch(`${cleanBaseUrl}pages/${props.bookId}-toc.json`);
    if (res.ok) {
      outline.value = await res.json();
    } else {
      console.warn('Failed to load local TOC JSON, outline is empty');
      outline.value = [];
    }
  } catch (e) {
    console.error('Error loading PDF outline:', e);
    outline.value = [];
  } finally {
    isOutlineLoading.value = false;
  }
}

// Perform instant local search via pre-generated text index
async function handleSearch() {
  const query = searchQuery.value.trim();
  if (!query) return;
  
  isSearching.value = true;
  searchResults.value = [];
  searchProgress.value = 10;
  
  try {
    // 1. Ensure search index is loaded
    await searchStore.loadIndex(props.bookId);
    searchProgress.value = 50;
    
    // 2. Perform local search
    const results = searchStore.search(props.bookId, query);
    
    // 3. Map to searchResults format
    searchResults.value = results.map(r => ({
      pageNum: r.page,
      snippet: r.preview
    }));
    searchProgress.value = 100;
  } catch (err) {
    console.error('Search failed:', err);
  } finally {
    isSearching.value = false;
  }
}

// Load outline only when drawer opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadOutline();
  }
});

function handleOutlineClick(item: FlattenedOutline) {
  if (item.pageNum) {
    emit('jumpToPage', item.pageNum);
    emit('close');
  }
}

function handleBookmarkClick(page: number) {
  emit('jumpToPage', page);
  emit('close');
}

function handleSearchResultClick(page: number) {
  emit('jumpToPage', page);
  emit('close');
}

function highlightText(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(escaped, 'gi'),
    (match) => `<mark>${match}</mark>`
  );
}
</script>

<template>
  <div class="drawer-container" :class="{ 'is-open': isOpen }">
    <!-- Backdrop -->
    <div class="drawer-backdrop" @click="emit('close')"></div>
    
    <!-- Drawer Content -->
    <div class="drawer-content">
      <div class="drawer-header">
        <div class="tabs-container">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'toc' }"
            @click="activeTab = 'toc'"
          >
            <List :size="18" />
            <span>目录</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'bookmarks' }"
            @click="activeTab = 'bookmarks'"
          >
            <BookmarkIcon :size="18" />
            <span>书签</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'search' }"
            @click="activeTab = 'search'"
          >
            <Search :size="18" />
            <span>搜索</span>
          </button>
        </div>
        <button class="close-btn" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="tab-content">
        <!-- 1. Table of Contents -->
        <div v-if="activeTab === 'toc'" class="tab-pane toc-pane">
          <div v-if="isOutlineLoading" class="loading-state">
            <Loader2 class="spinner" :size="24" />
            <span>正在解析文档大纲...</span>
          </div>
          <div v-else-if="outline.length === 0" class="empty-state">
            <span>该PDF未包含内置书签目录</span>
          </div>
          <div v-else class="outline-list">
            <div 
              v-for="(item, index) in outline" 
              :key="index"
              class="outline-item clickable"
              :class="{ 'is-current': item.pageNum === currentPage }"
              :style="{ paddingLeft: `${item.level * 16 + 16}px` }"
              @click="handleOutlineClick(item)"
            >
              <div class="outline-bullet" :style="{ opacity: 1 - item.level * 0.2 }"></div>
              <span class="outline-title">{{ item.title }}</span>
              <span class="outline-page" v-if="item.pageNum">{{ item.pageNum }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Bookmarks -->
        <div v-if="activeTab === 'bookmarks'" class="tab-pane bookmarks-pane">
          <div v-if="bookmarks.length === 0" class="empty-state">
            <BookmarkIcon :size="32" class="empty-icon" />
            <span>暂无书签</span>
            <p class="empty-sub">在阅读页面点击顶部书签按钮，可添加当前页</p>
          </div>
          <div v-else class="bookmark-list">
            <div 
              v-for="bookmark in bookmarks" 
              :key="bookmark.page"
              class="bookmark-item clickable"
              @click="handleBookmarkClick(bookmark.page)"
            >
              <div class="bookmark-info">
                <span class="bookmark-name">{{ bookmark.label }}</span>
                <span class="bookmark-date">{{ new Date(bookmark.time).toLocaleDateString() }}</span>
              </div>
              <button 
                class="delete-bookmark-btn" 
                @click.stop="store.removeBookmark(bookId, bookmark.page)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Search -->
        <div v-if="activeTab === 'search'" class="tab-pane search-pane">
          <form class="search-form" @submit.prevent="handleSearch">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="请输入关键字搜索书本内容" 
              class="search-input"
            />
            <button type="submit" class="search-btn" :disabled="isSearching || !searchQuery.trim()">
              <Search :size="18" />
            </button>
          </form>

          <!-- Search Progress Bar -->
          <div v-if="isSearching" class="search-progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${searchProgress}%` }"></div>
            </div>
            <div class="search-status">
              <span>正在搜索内容 ({{ searchProgress }}%)</span>
              <Loader2 class="spinner" :size="14" />
            </div>
          </div>

          <!-- Search Results List -->
          <div v-if="searchResults.length > 0" class="search-results-list">
            <div class="results-count">找到 {{ searchResults.length }} 个相关项</div>
            <div 
              v-for="(result, idx) in searchResults" 
              :key="idx" 
              class="search-result-item clickable"
              @click="handleSearchResultClick(result.pageNum)"
            >
              <div class="result-header">
                <span class="result-page-badge">第 {{ result.pageNum }} 页</span>
                <ArrowRight :size="14" class="jump-arrow" />
              </div>
              <p class="result-snippet" v-html="highlightText(result.snippet, searchQuery)"></p>
            </div>
          </div>

          <div v-else-if="!isSearching && searchQuery && searchResults.length === 0" class="empty-state">
            <span>未找到相关搜索内容</span>
          </div>

          <div v-else-if="!searchQuery" class="empty-state">
            <Search :size="32" class="empty-icon" />
            <span>输入内容搜索书本</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawer-container {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  visibility: hidden;
  pointer-events: none;
  transition: visibility var(--transition-normal);
}

.drawer-container.is-open {
  visibility: visible;
  pointer-events: auto;
}

.drawer-backdrop {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-overlay);
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.drawer-container.is-open .drawer-backdrop {
  opacity: 1;
}

.drawer-content {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 85%;
  max-width: 380px;
  background-color: var(--bg-card);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform var(--transition-normal);
}

.drawer-container.is-open .drawer-content {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  padding: 10px 16px;
  background-color: var(--bg-card);
}

.tabs-container {
  display: flex;
  gap: 8px;
  flex-grow: 1;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 8px 6px;
  cursor: pointer;
  outline: none;
  font-weight: 500;
  transition: color var(--transition-fast), border-color var(--transition-fast);
}

.tab-btn.active {
  color: var(--accent-color);
  border-bottom-color: var(--accent-color);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.close-btn:hover {
  background-color: var(--border-color);
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

.tab-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  text-align: center;
  font-size: 14px;
}

.empty-icon {
  margin-bottom: 12px;
  color: var(--text-muted);
}

.empty-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.spinner {
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
  color: var(--accent-color);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* TOC Pane Styling */
.outline-list {
  display: flex;
  flex-direction: column;
}

.outline-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-card);
  transition: background-color var(--transition-fast);
  text-decoration: none;
  font-size: 13px;
  line-height: 1.4;
}

.outline-item:hover {
  background-color: var(--bg-primary);
}

.outline-item.is-current {
  color: var(--accent-color);
  font-weight: 600;
  background-color: var(--accent-light);
}

.outline-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--accent-color);
  margin-right: 10px;
  flex-shrink: 0;
}

.outline-title {
  flex-grow: 1;
  margin-right: 12px;
  word-break: break-all;
}

.outline-page {
  font-size: 11px;
  color: var(--text-muted);
  background-color: var(--bg-primary);
  padding: 2px 6px;
  border-radius: 8px;
}

/* Bookmark Pane Styling */
.bookmark-list {
  display: flex;
  flex-direction: column;
}

.bookmark-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
}

.bookmark-item:hover {
  background-color: var(--bg-primary);
}

.bookmark-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bookmark-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.bookmark-date {
  font-size: 11px;
  color: var(--text-muted);
}

.delete-bookmark-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.delete-bookmark-btn:hover {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

/* Search Pane Styling */
.search-form {
  display: flex;
  padding: 12px 16px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
}

.search-input {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 16px;
  transition: border-color var(--transition-fast);
}

.search-input:focus {
  border-color: var(--accent-color);
}

.search-btn {
  background-color: var(--accent-color);
  border: none;
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color var(--transition-fast);
}

.search-btn:disabled {
  background-color: var(--text-muted);
  cursor: not-allowed;
}

.search-progress-container {
  padding: 12px 16px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar {
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--accent-color);
  transition: width 0.1s ease;
}

.search-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--text-secondary);
}

.search-results-list {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.results-count {
  padding: 8px 16px;
  font-size: 12px;
  color: var(--text-muted);
  background-color: var(--bg-primary);
}

.search-result-item {
  padding: 12px 16px;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  transition: background-color var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.search-result-item:hover {
  background-color: var(--bg-primary);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-page-badge {
  font-size: 11px;
  color: var(--accent-color);
  background-color: var(--accent-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.jump-arrow {
  color: var(--text-muted);
}

.result-snippet {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-all;
}

.result-snippet :deep(mark) {
  background-color: rgba(253, 224, 71, 0.4);
  color: inherit;
  border-bottom: 1px solid #eab308;
  font-weight: 500;
  padding: 0 1px;
  border-radius: 2px;
}

/* Offline Index Prep Styling */
.search-indexing-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-secondary);
}

.spinner-large {
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
  color: var(--accent-color);
}

.indexing-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.progress-bar-small {
  width: 100%;
  max-width: 220px;
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill-small {
  height: 100%;
  background-color: var(--accent-color);
  transition: width 0.3s ease;
}

.indexing-tip {
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.75;
  max-width: 280px;
}
</style>
