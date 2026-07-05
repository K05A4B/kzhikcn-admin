# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

kzhikcn-admin 是一个 Vue 3 博客/CMS 管理面板前端，配合后端 API 服务 `kzhikcn-api` 使用。包含文章管理（CRUD、回收站）、分类管理、标签管理、用户设置、仪表盘等功能。

## 常用命令

```bash
npm run dev          # 启动开发服务器（Vite，默认端口 5173）
npm run build        # 类型检查 + 生产构建
npm run type-check   # 仅运行 vue-tsc 类型检查
npm run preview      # 预览生产构建
```

## 技术栈

- **Vue 3** (Composition API + `<script setup>`) + TypeScript 6.0
- **Vite 8** 构建工具，`@/` 别名指向 `src/`
- **Naive UI** 组件库，全局配置在 `App.vue`（中文本地化、主题覆盖来自 `src/assets/theme-overrides.json`、dark/light 切换）
- **Pinia** 状态管理，配合 `pinia-plugin-persistedstate` 持久化
- **Vue Router 5**，路由懒加载，meta 驱动侧边栏菜单生成
- **Axios** HTTP 客户端，通过拦截器注入 baseURL 和 JWT Bearer token
- **Icon Park** (`@icon-park/vue-next`) 提供图标

## 后端依赖

开发时 Vite 代理 `/api` → `http://localhost:5083`。后端是 Docker 化的 Go 服务，可用 `compose.backend.yml` 启动：

```bash
docker compose -f compose.backend.yml up -d
```

后端镜像：`ghcr.io/k05a4b/kzhikcn-api:latest`，暴露端口 5083，需要配置 `JWT_SECRET` 等环境变量。

## 项目架构

### 路由与布局（核心流程）

`App.vue` 根据 `authStore.isAuthorized` 条件渲染不同布局：
- **未登录** → `LoginLayout`（包裹 `LoginView`）
- **已登录** → `MainLayout`（header + 侧边栏 + 标签页 + 内容区）

`MainLayout` 结构：
```
NLayoutHeader → HeaderComponent（用户头像、刷新、清缓存、全屏、主题切换）
NLayout (has-sider)
  ├── SidebarComponent（NMenu，由路由 meta 自动生成）
  └── NLayoutContent
       ├── TabComponents（多标签页导航）
       └── <slot />（页面内容）
```

路由通过 `meta.icon` 和 `meta.title` 自动渲染侧边栏菜单，`meta.hidden` 的路由不在菜单中显示。`useTabStore` 管理多标签页，监听路由变化自动打开/切换标签。

### API 层 (`src/api/`)

- **`response.ts`**: 泛型 `HttpResponse<T>` 接口，包装所有后端响应（`code`、`success`、`message`、`data`、`meta`、`errorCode`、`traceId`）。`Resp<T>` 是 `Promise<AxiosResponse<HttpResponse<T>>>` 的别名。
- **`interceptors.ts`**: 创建 `httpClient`（Axios 实例）。请求拦截器从 `authStore` 读取 `baseUrl` 和 `token` 并注入；响应拦截器处理 `system.unauthorized` 错误码，自动清除 token（登录过期处理）。
- **`v1/`**: 按业务模块拆分（`auth`、`articles`、`categories`、`tags`、`user`），统一入口 `v1/index.ts` 重新导出所有模块。

### 状态管理 (`src/stores/`)

| Store | 用途 | 持久化 |
|---|---|---|
| `authStore` | JWT token、baseUrl、登录/登出逻辑 | ✅ |
| `panelStore` | themeMode（dark/light）、侧边栏展开状态、页面加载状态 | ✅ |
| `tabStore` | 多标签页状态、标签关闭拦截器 | ✅ |
| `userStore` | 当前用户信息 | ❌ |
| `categoriesStore` | 分类列表（分页累积加载） | ❌ |

`authStore.baseUrl` 变更时自动 ping API 检测连通性。

### Composables (`src/composable/`)

| Composable | 用途 |
|---|---|
| `useFetch(fn, options?)` | 通用异步请求封装，返回 `{ data, error, loading, fetch }`。自动处理错误并弹出 message |
| `usePagination(initPageSize)` | 通用分页状态管理，支持 `onNotify` 回调自动触发数据刷新 |
| `useArticles(fetchFn, adapter)` | 文章列表的通用 CRUD（增删改查+分页），接收 fetch 函数和适配器 |
| `useArticlesViewer()` / `useTrashBinViewer()` | 基于 `useArticles` 扩展——给每个文章附加 `$state`（checked、loadings），供表格 UI 使用 |
| `useDiscreteApi()` | Naive UI 的离散 API（message、notification、dialog、loadingBar），全局单例，带主题覆盖 |

### 视图组织

- **`views/articles/`**: `ArticlesManager`（文章列表+批量操作）、`ArticleEditor`（编辑器，支持任意路径参数 `:articleId(.*)`）、`TrashBin`（回收站）
- **`views/tags/`**: `TagsManager`（标签管理）
- **`views/categories/`**: `CategoriesManager`（分类管理）
- **`views/settings/`**: `GeneralView`（通用设置）、`ProfileView`（资料管理）
- **`views/dashboard/`**: `DashboardView`（仪表盘首页）

### 命名约定

- 文件命名：snake_case（`use_fetch.ts`、`HeaderComponent.vue`）
- 类型/接口导出：PascalCase（`Article`、`EditableArticle`）
- 函数/变量：camelCase
- Vue 组件通过 `<script setup>` 和 Vite 的 `unplugin-vue-components` 自动导入 Naive UI 组件（无需手动 import）

### 主题系统

`src/assets/theme-overrides.json` 定义 Naive UI 的主题覆盖变量，在 `App.vue` 的 `NConfigProvider` 中注入。`panelStore.themeMode` 切换 dark/light，主题覆盖对两种模式均生效。

### 开发规范

1. 所有API调用都必须使用 `useFetch`(需要获取数据), `useAction`(不需要获取数据) 函数，不能直接调用 `httpClient`。
2. 能复用的代码都必须提取到 `composables/` 目录下，避免重复编写。
3. 实现功能前先看看能不能使用composable的代码
4. 不要重复造轮子，除非功能非常简单引入第三方库可能带来额外的负面影响