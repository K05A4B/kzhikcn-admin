import { createRouter, createWebHashHistory } from 'vue-router'
import NotFound from '@/views/NotFound.vue'
import { Dashboard, User, Book, Info, Setting, CategoryManagement, Agreement, TagOne } from "@icon-park/vue-next"
import { useLoadingBar } from "@/composable/use_naiveui_discrete_api"
import { usePanelStore } from '@/stores/panel'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/dashboard",
    },
    {
      path: "/dashboard",
      component: () => import("@/views/dashboard/DashboardView.vue"),
      meta: { title: "仪表盘", icon: Dashboard, tabIcon: Dashboard },
    },

    {
      path: "/article-editor/:articleId",
      meta: { hidden: true, title: "文章编辑", tabIcon: Agreement },
      component: () => import("@/views/articles/ArticleEditor.vue"),
    },

    {
      path: "/content",
      redirect: "/content/articles",
      meta: { title: "内容管理", icon: Book },
      children: [
        {
          path: "/content/articles",
          component: () => import("@/views/articles/ArticlesManager.vue"),
          meta: { title: "文章管理", tabIcon: Agreement },
        },
        {
          path: "/content/articles/trash-bin",
          component: () => import("@/views/articles/TrashBin.vue"),
          meta: { title: "文章回收站", tabIcon: Agreement },
        },
        {
          path: "/content/articles/tags",
          component: () => import("@/views/tags/TagsManager.vue"),
          meta: { title: "文章标签管理", tabIcon: TagOne }
        },
        {
          path: "/content/articles/tags/:tagId(\\d+)",
          component: () => import("@/views/tags/TagWithArticles.vue"),
          meta: { hidden: true, title: "标签文章列表", tabIcon: TagOne },
        },
        {
          path: "/content/articles/categories",
          component: () => import("@/views/categories/CategoriesManager.vue"),
          meta: { title: "文章分类管理", tabIcon: CategoryManagement }
        },
        {
          path: "/content/articles/categories/:categoryId(\\d+)",
          component: () => import("@/views/categories/CategoryWithArticles.vue"),
          meta: { hidden: true, title: "分类文章列表", tabIcon: CategoryManagement },
        },
        // {
        //   path: "/content/articles/editor",
        //   component: () => import("@/views/content/editor/index.vue"),
        //   meta: { title: "文章编辑器", hidden: true, tabIcon: Editor }
        // },
        // {
        //   path: "/content/friendLinks",
        //   component: () => import("@/views/content/friendLink/index.vue"),
        //   meta: { title: "友情链接管理", tabIcon: FriendsCircle },
        // },
        // {
        //   path: "/content/friendLinks/audits",
        //   component: () => import("@/views/content/friendLink/audits/index.vue"),
        //   meta: { title: "友情链接审核", tabIcon: FriendsCircle },
        // }
      ],
    },

    {
      path: "/settings",
      redirect: "/settings/general",
      meta: { title: "设置", icon: Setting },
      children: [
        {
          path: "/settings/general",
          component: () => import("@/views/settings/GeneralView.vue"),
          meta: { title: "通用设置", tabIcon: Info }
        },
        {
          path: "/settings/profile",
          component: () => import("@/views/settings/ProfileView.vue"),
          meta: { title: "资料管理", tabIcon: User }
        },
      ]
    },

    { path: "/:pathMatch(.*)", component: NotFound }

  ],
})

router.beforeEach((to, from, next) => {
  useLoadingBar().start()
  usePanelStore().viewLoading = true
  next();
});

router.afterEach(() => {
  useLoadingBar().finish()
  usePanelStore().viewLoading = false
});


export default router
