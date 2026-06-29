<script setup lang="ts">
import { ref } from 'vue'
import ArticleCard from '@/components/articles/ArticleCard.vue';
import { NCard, NEmpty, NGrid, NFlex, NGi, NSpin, NPagination, NButton, NAlert, NTag, NDrawer, NDrawerContent } from 'naive-ui';
import { Add, Edit } from '@icon-park/vue-next';
import { useArticlesViewer } from '@/composable/use_articles_view';
import ArticleToolbar from '@/components/articles/ArticleToolbar.vue';
import ArticleCreateForm from '@/components/articles/ArticleCreateForm.vue';
import type { CreateArticleBody } from '@/api/v1';
import { useTabStore } from '@/stores/tab';

const view = useArticlesViewer();
const tab = useTabStore()
const showCreateDrawer = ref(false)

const onEdit = (id: string) => {
  tab.openTab(`/article-editor/${id}`)
}

const onCreateBtnClick = () => {
  showCreateDrawer.value = !showCreateDrawer.value
}

const onCreateArticle = async (data: CreateArticleBody) => {
  const created = await view.create(data)
  if (created) {
    showCreateDrawer.value = false
    tab.openTab(`/article-editor/${created.id}`)
  }
}
</script>

<template>
  <NCard>
    <NDrawer v-model:show="showCreateDrawer" width="80%">
      <NDrawerContent closable>
        <template #header>
          创建文章
        </template>
        
        <ArticleCreateForm @submit="onCreateArticle" />
      </NDrawerContent>
    </NDrawer>

    <NSpin :show="view.loading.value">
      <NFlex>
        <NAlert 
          closable
          v-if="view.expr.value && view.expr.value.length != 0" 
          style="width:100%" 
          size="small" 
          :type="view.error.value ? 'error' : 'info'"
        >
          <div v-if="!view.error.value">
            查找到 <NTag size="small" type="success">{{ view.total.value }}</NTag> 条符合条件的数据
          </div>
          <div v-else>
            表达式错误: <NTag size="small" type="error">{{ view.error.value.message }}</NTag>
          </div>
        </NAlert>
        <ArticleToolbar 
          :checked-all="view.isCheckAll.value"
          :orderBy="view.orderBy.value"
          @check-all="view.setCheckAll"
          @update-order-by="view.setOrderBy"
          @update-expression="view.setExpr"
          @delete-checked="view.deleteChecked"
          style="width: 100%;" >
          <template #buttons>
            <NButton title="创建文章" type="primary" secondary @click="onCreateBtnClick">
              <Add/>
            </NButton>
          </template>
        </ArticleToolbar>

        <NGrid x-gap="8" y-gap="8" cols="1 l:2 xl:3" responsive="screen" v-if="view.articles.value.length > 0">
          <NGi v-for="article in view.articles.value" :key="article.id">
            <ArticleCard 
              @check="view.setCheck"
              @update="view.update"
              @delete="view.delete"
              :info="article" >
              <template #action-buttons>
                <NButton secondary size="small" @click="onEdit(article.id)"
                  title="编辑文章" type="primary">
                  <Edit />
                </NButton>
              </template>
            </ArticleCard>
          </NGi>
        </NGrid>
        <NEmpty style="width: 100%" v-else />

        <NPagination
          :page-size="view.pageSize.value"
          :item-count="view.total.value"
          @update:page="view.setPage"
          :page-sizes="[10, 20, 40, 50]"
          @update-page-size="view.setPageSize"
          show-size-picker
        />
      </NFlex>
    </NSpin>
  </NCard>
</template>