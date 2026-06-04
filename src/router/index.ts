import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ReaderView from '../views/ReaderView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/reader/:bookId',
    name: 'reader',
    component: ReaderView,
    props: true,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
