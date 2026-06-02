import { createRouter, createWebHistory } from 'vue-router';
import WorkflowView from '@/views/WorkflowView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/workflow/test'
    },
    {
      path: '/workflow/:id',
      name: 'workflow',
      component: WorkflowView,
      props: true
    }
  ]
});

export default router;
