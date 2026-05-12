<template>
  <div class="build-page">
    <!-------------------------- 页面头部 -------------------------->
    <section class="build-page__header">
      <div>
        <h2 class="build-page__title">{{ t('tool.build.title') }}</h2>
        <p class="build-page__subtitle">{{ t('tool.build.desc') }}</p>
      </div>
    </section>

    <!-------------------------- 三栏布局 -------------------------->
    <section class="build-page__layout">
      <!-------------------------- 左栏：实体列表 -------------------------->
      <aside class="build-page__aside">
        <el-card shadow="never" class="build-page__card">
          <template #header>
            <h3 class="build-page__card-title">
              {{ t('tool.build.entityList') }}
            </h3>
          </template>
          <el-scrollbar max-height="540px">
            <div
              v-for="entity in entityList"
              :key="entity.entityKey"
              class="build-page__entity-item"
              :class="{ 'is-active': selectedEntity === entity.entityKey }"
              @click="selectEntity(entity.entityKey)"
            >
              <span class="build-page__entity-name">{{
                entity.title || entity.entityKey
              }}</span>
              <span class="build-page__entity-key">{{ entity.entityKey }}</span>
            </div>
          </el-scrollbar>
          <el-empty
            v-if="!entityList.length"
            :description="t('common.noData')"
          />
        </el-card>
      </aside>

      <!-------------------------- 中栏：表单预览 -------------------------->
      <main class="build-page__main">
        <el-card shadow="never" class="build-page__card">
          <template #header>
            <div class="build-page__card-header">
              <h3 class="build-page__card-title">
                {{ t('tool.build.formPreview') }}
              </h3>
              <span v-if="selectedEntity" class="build-page__entity-badge">{{
                selectedEntity
              }}</span>
            </div>
          </template>
          <div v-if="!selectedEntity" class="build-page__empty-canvas">
            <el-empty :description="t('tool.build.selectEntityHint')" />
          </div>
          <div v-else-if="fieldLoading" class="build-page__loading">
            <el-skeleton :rows="8" animated />
          </div>
          <el-scrollbar v-else max-height="540px">
            <el-form label-position="top" class="build-page__preview-form">
              <el-form-item
                v-for="field in displayFields"
                :key="field.key"
                :label="field.label"
              >
                <component
                  :is="resolvePreviewComponent(field)"
                  v-bind="resolvePreviewProps(field)"
                />
              </el-form-item>
            </el-form>
          </el-scrollbar>
        </el-card>
      </main>

      <!-------------------------- 右栏：字段属性 -------------------------->
      <aside class="build-page__aside">
        <el-card shadow="never" class="build-page__card">
          <template #header>
            <h3 class="build-page__card-title">
              {{ t('tool.build.fieldProps') }}
            </h3>
          </template>
          <div v-if="!selectedField" class="build-page__empty-panel">
            <el-empty
              :description="t('tool.build.selectFieldHint')"
              :image-size="60"
            />
          </div>
          <el-form
            v-else
            :model="selectedField"
            label-position="top"
            class="build-page__props-form"
          >
            <el-form-item :label="t('tool.build.propFieldKey')">
              <el-input :model-value="selectedField.field_key" disabled />
            </el-form-item>
            <el-form-item :label="t('tool.build.propFieldName')">
              <el-input v-model="selectedField.field_name" />
            </el-form-item>
            <el-form-item :label="t('tool.build.propFieldType')">
              <el-select v-model="selectedField.field_type">
                <el-option label="输入框" value="input" />
                <el-option label="数字" value="number" />
                <el-option label="文本域" value="textarea" />
                <el-option label="下拉框" value="select" />
                <el-option label="字典" value="dict" />
                <el-option label="日期" value="date" />
                <el-option label="日期时间" value="datetime" />
                <el-option label="开关" value="switch" />
                <el-option label="文件" value="file" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('tool.build.propSort')">
              <el-input-number
                v-model="selectedField.sort"
                :min="0"
                :max="999"
              />
            </el-form-item>
            <el-form-item :label="t('tool.build.propVisible')">
              <el-switch
                v-model="selectedField.is_visible"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
            <el-form-item :label="t('tool.build.propFuzzySearch')">
              <el-switch
                v-model="selectedField.is_fuzzy_search"
                :active-value="1"
                :inactive-value="0"
              />
            </el-form-item>
          </el-form>
        </el-card>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getAllEntityModules } from '@/features/entities/registry';
import { getByEntityKeyAndFieldKeyApi } from '@/api/modules/user';

/******************************** 基础状态 ********************************/

const { t } = useI18n();

const entityList = computed(() => {
  const modules = getAllEntityModules();
  const list: Array<{ entityKey: string; title: string }> = [];
  modules.forEach((module, key) => {
    list.push({
      entityKey: key,
      title: module.config?.title || key,
    });
  });
  return list;
});

const selectedEntity = ref('');
const fieldLoading = ref(false);
const rawFields = ref<Record<string, any>[]>([]);

const selectedFieldKey = ref<string | null>(null);
const selectedField = computed({
  get: () =>
    rawFields.value.find(
      (f) =>
        f.field_key === selectedFieldKey.value ||
        f.fieldKey === selectedFieldKey.value
    ) ?? null,
  set: () => {},
});

const displayFields = computed(() =>
  rawFields.value
    .filter((f) => String(f.is_visible ?? f.isVisible ?? 1) !== '0')
    .sort((a, b) => Number(a.sort ?? 999) - Number(b.sort ?? 999))
    .map((f) => ({
      key: f.field_key || f.fieldKey,
      label: f.field_name || f.fieldName || f.field_key || f.fieldKey,
      type: f.field_type || f.fieldType || 'input',
      dictCode: f.dict_code || f.dictCode,
      options: f.options,
    }))
);

/******************************** 实体选择 ********************************/

async function selectEntity(entityKey: string) {
  selectedEntity.value = entityKey;
  selectedFieldKey.value = null;
  fieldLoading.value = true;
  try {
    const res = (await getByEntityKeyAndFieldKeyApi(entityKey)) as any;
    rawFields.value = (res?.data ?? res?.rows ?? []) as Record<string, any>[];
  } catch (e) {
    rawFields.value = [];
  } finally {
    fieldLoading.value = false;
  }
}

/******************************** 预览组件解析 ********************************/

function resolvePreviewComponent(field: { type: string; label: string }) {
  switch (field.type) {
    case 'switch':
      return 'el-switch';
    case 'number':
      return 'el-input-number';
    case 'textarea':
      return 'el-input';
    case 'date':
    case 'datetime':
      return 'el-date-picker';
    default:
      return 'el-input';
  }
}

function resolvePreviewProps(field: {
  type: string;
  label: string;
}): Record<string, any> {
  if (field.type === 'textarea')
    return {
      type: 'textarea',
      disabled: true,
      placeholder: field.label,
      rows: 3,
    };
  if (field.type === 'switch') return { disabled: true };
  return { disabled: true, placeholder: field.label };
}
</script>

<style scoped lang="scss">
.build-page {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  background: var(--color-bg-page);
}

.build-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.build-page__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.build-page__subtitle {
  margin: 6px 0 0;
  color: var(--color-text-secondary);
  font-size: 13px;
}

/******************************** 三栏布局 ********************************/

.build-page__layout {
  display: grid;
  flex: 1;
  min-height: 0;
  grid-template-columns: 260px 1fr 260px;
  gap: 18px;
}

.build-page__aside {
  min-width: 0;
}

.build-page__main {
  min-width: 0;
}

.build-page__card {
  height: 100%;
  border-radius: 18px;
  border: 1px solid var(--el-border-color-light);
  box-shadow: 0 10px 30px rgb(15 23 42 / 6%);

  :deep(.el-card__header) {
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-card__body) {
    padding: 16px 20px;
  }
}

.build-page__card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.build-page__card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.build-page__entity-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 600;
}

/******************************** 实体列表 ********************************/

.build-page__entity-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: var(--color-bg-hover);
  }

  &.is-active {
    background: var(--color-primary-bg);
  }
}

.build-page__entity-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.build-page__entity-key {
  font-size: 11px;
  color: var(--color-text-secondary);
  font-family: 'SF Mono', monospace;
}

/******************************** 表单预览 ********************************/

.build-page__empty-canvas,
.build-page__loading {
  padding: 60px 0;
}

.build-page__preview-form {
  padding: 8px 0;

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  :deep(.el-input.is-disabled .el-input__wrapper) {
    background: var(--el-fill-color-lighter);
    box-shadow: none;
  }
}

/******************************** 属性面板 ********************************/

.build-page__empty-panel {
  padding: 40px 0;
}

.build-page__props-form {
  :deep(.el-form-item) {
    margin-bottom: 14px;
  }
}

@media (max-width: 1100px) {
  .build-page__layout {
    grid-template-columns: 1fr;
  }

  .build-page__aside {
    display: none;
  }
}
</style>
