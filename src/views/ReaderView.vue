<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { booksList } from '../config/books';
import PDFReader from '../components/PDFReader.vue';
import { ArrowLeft, AlertCircle } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();

const bookId = computed(() => (route.params.bookId as string) || '');

// Find book in our static config list
const book = computed(() => {
  return booksList.find((b) => b.id === bookId.value) || null;
});
</script>

<template>
  <div class="reader-view-container">
    <!-- Active PDF Reader -->
    <PDFReader 
      v-if="book" 
      :book-id="book.id" 
      :pdf-url="book.path" 
      :book-title="book.title" 
    />
    
    <!-- 404 Error State -->
    <div v-else class="error-state">
      <AlertCircle :size="48" class="error-icon" />
      <h2>未找到相关书籍</h2>
      <p>抱歉，您请求的图书不存在或已被移除。</p>
      <button class="back-home-btn clickable" @click="router.push('/')">
        <ArrowLeft :size="16" />
        <span>返回我的书架</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.reader-view-container {
  width: 100%;
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
}

.error-state {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.error-icon {
  color: #ef4444;
  margin-bottom: 16px;
}

.error-state h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.error-state p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.back-home-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--accent-color);
  color: #ffffff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
  transition: background-color var(--transition-fast);
}

.back-home-btn:hover {
  background-color: var(--accent-color-hover);
}
</style>
