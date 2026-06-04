import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/reader/:bookId',
    name: 'reader',
    component: () => import('../views/ReaderView.vue'),
    props: true,
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});


