<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { booksList } from '../config/books';
import { useReaderStore } from '../stores/reader';
import BookCard from '../components/BookCard.vue';
import { Search, BookOpen, Clock, Calendar } from 'lucide-vue-next';

const router = useRouter();
const store = useReaderStore();

const searchQuery = ref('');

// Filter books list based on search query
const filteredBooks = computed(() => {
  if (!searchQuery.value.trim()) return booksList;
  const query = searchQuery.value.toLowerCase();
  return booksList.filter(
    (b) =>
      b.title.toLowerCase().includes(query) ||
      b.author.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query)
  );
});

// Calculate overall bookshelf stats
const recentBook = computed(() => {
  let latestTime = 0;
  let latestBookId = '';
  
  for (const [bookId, progress] of Object.entries(store.progressMap)) {
    if (progress.lastTime > latestTime) {
      latestTime = progress.lastTime;
      latestBookId = bookId;
    }
  }
  
  if (!latestBookId) return null;
  return booksList.find((b) => b.id === latestBookId) || null;
});

const recentBookProgress = computed(() => {
  if (!recentBook.value) return null;
  return store.getProgress(recentBook.value.id);
});

function openBook(bookId: string) {
  router.push(`/reader/${bookId}`);
}
</script>

<template>
  <div class="home-container">
    <!-- Header Banner -->
    <header class="home-header">
      <div class="header-content">
        <h1 class="app-title">我的移动书房</h1>
        <p class="app-subtitle">精选专业教程 & 随时随地阅读</p>
      </div>
      <div class="stats-card glassmorphism">
        <div class="stat-item">
          <BookOpen class="stat-icon" :size="20" />
          <div class="stat-details">
            <span class="stat-value">{{ booksList.length }}本</span>
            <span class="stat-label">总藏书</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <Clock class="stat-icon" :size="20" />
          <div class="stat-details">
            <span class="stat-value">{{ Object.keys(store.progressMap).length }}本</span>
            <span class="stat-label">在读图书</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Section -->
    <main class="home-main">
      <!-- Recent Read Section -->
      <section class="recent-section" v-if="recentBook && recentBookProgress">
        <h2 class="section-title">最近阅读</h2>
        <div class="recent-card clickable" @click="openBook(recentBook.id)">
          <div class="recent-cover" :style="{ background: recentBook.coverColor }">
            <div class="book-spine"></div>
            <BookOpen class="cover-icon" :size="20" />
          </div>
          <div class="recent-info">
            <h3 class="recent-title">{{ recentBook.title }}</h3>
            <p class="recent-progress">
              已读至第 <strong>{{ recentBookProgress.lastPage }}</strong> 页
            </p>
            <div class="recent-time">
              <Calendar :size="12" />
              <span>上次阅读：{{ new Date(recentBookProgress.lastTime).toLocaleDateString() }}</span>
            </div>
          </div>
          <div class="recent-action">
            <button class="continue-btn">继续阅读</button>
          </div>
        </div>
      </section>

      <!-- Book Search -->
      <div class="search-bar-container">
        <div class="search-wrapper">
          <Search class="search-icon" :size="18" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索书架上的图书、作者..." 
            class="bookshelf-search-input"
          />
        </div>
      </div>

      <!-- Books Grid Shelf -->
      <section class="shelf-section">
        <h2 class="section-title">书架列表</h2>
        
        <div v-if="filteredBooks.length === 0" class="empty-shelf">
          <p>书架上没有找到相关书籍</p>
        </div>
        
        <div v-else class="books-grid">
          <BookCard 
            v-for="book in filteredBooks" 
            :key="book.id" 
            :book="book"
            @click="openBook(book.id)"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100svh;
  background-color: var(--bg-primary);
  overflow-y: auto;
}

/* Header styling */
.home-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  padding: 24px 16px 50px 16px;
  color: #ffffff;
  position: relative;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
}

.header-content {
  margin-bottom: 20px;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.app-subtitle {
  font-size: 13px;
  opacity: 0.8;
  margin-top: 4px;
}

/* Header Stats Card */
.stats-card {
  position: absolute;
  bottom: -24px;
  left: 16px;
  right: 16px;
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  color: var(--accent-color);
}

.stat-details {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 10px;
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 24px;
  background-color: var(--border-color);
}

/* Main Section */
.home-main {
  padding: 44px 16px 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex-grow: 1;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  position: relative;
  padding-left: 10px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  border-radius: 2px;
  background-color: var(--accent-color);
}

/* Recent Card */
.recent-card {
  display: flex;
  align-items: center;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 12px 14px;
  gap: 14px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.recent-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.recent-cover {
  width: 44px;
  height: 60px;
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.book-spine {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to right, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.1) 100%);
}

.cover-icon {
  opacity: 0.8;
}

.recent-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

.recent-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-progress {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.recent-progress strong {
  color: var(--accent-color);
}

.recent-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 4px;
}

.recent-action {
  flex-shrink: 0;
}

.continue-btn {
  background-color: var(--accent-color);
  color: #ffffff;
  border: none;
  font-size: 11px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.25);
  transition: background-color var(--transition-fast);
}

.continue-btn:hover {
  background-color: var(--accent-color-hover);
}

/* Search bar styling */
.search-bar-container {
  width: 100%;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 14px;
  color: var(--text-muted);
}

.bookshelf-search-input {
  width: 100%;
  padding: 10px 14px 10px 42px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  color: var(--text-primary);
  outline: none;
  font-size: 16px;
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.bookshelf-search-input:focus {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px var(--accent-light);
}

/* Books Shelf Grid */
.books-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-shelf {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
