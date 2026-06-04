<script setup lang="ts">
import { computed } from 'vue';
import type { Book } from '../config/books';
import { useReaderStore } from '../stores/reader';

import { BookOpen } from 'lucide-vue-next';

const props = defineProps<{
  book: Book;
}>();

const store = useReaderStore();

const progress = computed(() => {
  return store.getProgress(props.book.id);
});

const progressText = computed(() => {
  if (!progress.value) return '未读';
  return `已读 ${progress.value.lastPage} 页`;
});

const progressPercentage = computed(() => {
  if (!progress.value || !props.book.pages) return 0;
  return Math.min(100, Math.round((progress.value.lastPage / props.book.pages) * 100));
});

const lastReadTime = computed(() => {
  if (!progress.value) return '';
  const date = new Date(progress.value.lastTime);
  return `${date.getMonth() + 1}月${date.getDate()}日阅读`;
});
</script>

<template>
  <div class="book-card clickable">
    <div class="cover-wrapper" :style="{ background: book.coverColor }">
      <div class="book-spine"></div>
      <div class="book-details">
        <BookOpen class="book-icon" :size="28" />
        <h3 class="cover-title">{{ book.title }}</h3>
        <p class="cover-author">{{ book.author }}</p>
      </div>
    </div>
    
    <div class="info-wrapper">
      <h2 class="book-title">{{ book.title }}</h2>
      <p class="book-desc">{{ book.description }}</p>
      
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-status">{{ progressText }}</span>
          <span class="progress-time" v-if="lastReadTime">{{ lastReadTime }}</span>
        </div>
        <div class="progress-bar-bg" v-if="progressPercentage > 0">
          <div class="progress-bar-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.book-card {
  display: flex;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
  padding: 14px;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-color);
}

.cover-wrapper {
  position: relative;
  width: 90px;
  height: 130px;
  flex-shrink: 0;
  border-radius: 8px;
  box-shadow: 2px 4px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 10px;
}

.book-spine {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 5px;
  background: linear-gradient(to right, rgba(0,0,0,0.25) 0%, rgba(255,255,255,0.1) 40%, rgba(0,0,0,0.1) 60%, rgba(255,255,255,0.1) 100%);
  z-index: 2;
}

.book-details {
  display: flex;
  flex-direction: column;
  color: #ffffff;
  z-index: 1;
}

.book-icon {
  margin-bottom: 8px;
  opacity: 0.9;
}

.cover-title {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cover-author {
  font-size: 7px;
  opacity: 0.7;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 1;
  min-width: 0; /* Ensures overflow text ellipsis works on flex items */
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}

.progress-status {
  color: var(--accent-color);
  font-weight: 500;
}

.progress-time {
  color: var(--text-muted);
}

.progress-bar-bg {
  height: 4px;
  background-color: var(--border-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--accent-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
