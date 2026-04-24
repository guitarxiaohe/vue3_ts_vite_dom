<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
  addMenu,
  assertAjaxOk,
  fetchMenuTreeSelect,
  MENU_TREESELECT_QUERY_KEY,
  updateMenu,
} from '@/api/modules/menu';
import type { SysMenu, SysMenuFormData } from '@/types/menu';
import type {
  EntityFormEmits,
  EntityFormProps,
} from '@/features/entities/_shared/types';
import { MENU_ICON_OPTIONS, resolveMenuIcon } from './menu-icons';

/******************************** 组件入参 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();
const { t } = useI18n();
const queryClient = useQueryClient();

/******************************** 基础状态 ********************************/

const formRef = ref<FormInstance>();
const saving = ref<boolean>(false);
const formData = ref<SysMenuFormData>(createDefaultFormData());

const { data: parentOptionsData } = useQuery({
  queryKey: MENU_TREESELECT_QUERY_KEY,
  queryFn: fetchMenuTreeSelect,
  enabled: computed(() => props.visible),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  retry: 0,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
});

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return t('menuPage.createChildTitle');
  }

  return props.isCreate
    ? t('menuPage.createTitle')
    : t('menuPage.editTitle');
});

const localeOptions = computed(() => [
  { label: t('locale.zhCN'), value: 'zh-CN' },
  { label: t('locale.enUS'), value: 'en-US' },
  { label: t('menuPage.localeJaJP'), value: 'ja-JP' },
]);

const menuTypeOptions = computed(() => [
  { label: t('menuPage.typeDirectory'), value: 'M' },
  { label: t('menuPage.typeMenu'), value: 'C' },
  { label: t('menuPage.typeButton'), value: 'F' },
]);

const previewIcon = computed(() => resolveMenuIcon(formData.value.icon));
const parentOptions = computed<SysMenu[]>(() => parentOptionsData.value ?? []);

const filteredParentOptions = computed(() => {
  if (!formData.value.menuId) {
    return parentOptions.value;
  }

  const currentId = Number(formData.value.menuId);
  const blockedIds = new Set<number>([currentId]);

  const collectChildren = (menus: SysMenu[]) => {
    menus.forEach((menu) => {
      if (blockedIds.has(Number(menu.parentId))) {
        blockedIds.add(Number(menu.menuId));
      }

      if (menu.children?.length) {
        collectChildren(menu.children);
      }
    });
  };

  collectChildren(parentOptions.value);

  const filterTree = (menus: SysMenu[]): SysMenu[] => {
    return menus
      .map((menu) => {
        if (blockedIds.has(Number(menu.menuId))) {
          return null;
        }

        return {
          ...menu,
          children: menu.children?.length ? filterTree(menu.children) : [],
        };
      })
      .filter((item): item is SysMenu => item != null);
  };

  return filterTree(parentOptions.value);
});

const formRules = computed<FormRules<SysMenuFormData>>(() => ({
  orderNum: [
    {
      required: true,
      message: t('validation.enterField', { field: t('menuPage.orderNum') }),
      trigger: 'blur',
    },
  ],
  menuType: [
    {
      required: true,
      message: t('validation.selectField', { field: t('menuPage.menuType') }),
      trigger: 'change',
    },
  ],
}));

/******************************** 数据方法 ********************************/

// 创建默认表单
function createDefaultFormData(): SysMenuFormData {
  return {
    menuId: undefined,
    menuName: '',
    parentId: 0,
    orderNum: 1,
    path: '',
    component: '',
    query: '',
    routeName: '',
    isFrame: 1,
    isCache: 0,
    menuType: 'C',
    visible: '0',
    status: '0',
    perms: '',
    icon: 'House',
    remark: '',
    localeNames: [{ locale: 'zh-CN', label: '' }],
  };
}

// 克隆表单数据
function cloneFormData(record?: Record<string, unknown>) {
  const source = (record ?? {}) as Partial<SysMenuFormData>;
  return {
    ...createDefaultFormData(),
    ...source,
    parentId: Number(source.parentId ?? 0),
    orderNum: Number(source.orderNum ?? 1),
    localeNames:
      source.localeNames?.length
        ? source.localeNames.map((item) => ({ ...item }))
        : [{ locale: 'zh-CN', label: String(source.menuName ?? '') }],
  } as SysMenuFormData;
}

// 同步中文主名称
function syncMenuName() {
  const zhRow = formData.value.localeNames.find((item) => item.locale === 'zh-CN');
  const fallback = formData.value.localeNames.find((item) => item.label.trim());
  formData.value.menuName =
    zhRow?.label.trim() || fallback?.label.trim() || '';
}

// 新增语言行
function addLocaleRow() {
  const usedLocales = new Set(formData.value.localeNames.map((item) => item.locale));
  const nextLocale = localeOptions.value.find((item) => !usedLocales.has(item.value));

  if (!nextLocale) {
    ElMessage.warning(t('menuPage.localeFull'));
    return;
  }

  formData.value.localeNames.push({
    locale: nextLocale.value as 'zh-CN' | 'en-US' | 'ja-JP',
    label: '',
  });
}

// 删除语言行
function removeLocaleRow(index: number) {
  if (formData.value.localeNames.length <= 1) {
    return;
  }

  formData.value.localeNames.splice(index, 1);
  syncMenuName();
}

// 提交表单
async function handleSave() {
  syncMenuName();

  if (!formData.value.menuName.trim()) {
    ElMessage.warning(
      t('validation.enterField', { field: t('menuPage.menuName') })
    );
    return;
  }

  await formRef.value?.validate();

  saving.value = true;

  try {
    const payload = {
      ...formData.value,
      localeNames: formData.value.localeNames
        .map((item) => ({
          ...item,
          label: item.label.trim(),
        }))
        .filter((item) => item.label),
    };

    if (props.isCreate) {
      const response = await addMenu(payload);
      assertAjaxOk(response as { code?: number; msg?: string });
    } else {
      const response = await updateMenu(payload);
      assertAjaxOk(response as { code?: number; msg?: string });
    }

    await queryClient.invalidateQueries({ queryKey: MENU_TREESELECT_QUERY_KEY });
    emit('save', payload);
    emit('update:visible', false);
  } finally {
    saving.value = false;
  }
}

// 关闭抽屉
function handleCancel() {
  emit('update:visible', false);
  emit('cancel');
}

/******************************** 监听 ********************************/

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) {
      return;
    }

    formData.value = cloneFormData(props.record);
  },
  { immediate: true }
);
</script>

<template>
  <el-drawer
    :model-value="props.visible"
    :title="drawerTitle"
    size="520px"
    direction="rtl"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="menu-form">
      <!-------------------------- 表单主体 -------------------------->
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
      >
        <!-------------------------- 基础字段 -------------------------->
        <el-form-item :label="t('menuPage.parentMenu')">
          <el-tree-select
            v-model="formData.parentId"
            :data="filteredParentOptions"
            node-key="menuId"
            :props="{
              label: 'menuName',
              value: 'menuId',
              children: 'children',
            }"
            check-strictly
            clearable
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="t('menuPage.menuType')" prop="menuType">
          <el-select v-model="formData.menuType" style="width: 100%">
            <el-option
              v-for="item in menuTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <!-------------------------- 语言名称 -------------------------->
        <div class="menu-form__block">
          <div class="menu-form__header">
            <span>{{ t('menuPage.menuName') }}</span>
            <el-button text @click="addLocaleRow">
              {{ t('menuPage.addLocale') }}
            </el-button>
          </div>

          <div
            v-for="(item, index) in formData.localeNames"
            :key="`${item.locale}-${index}`"
            class="menu-form__locale-row"
          >
            <el-select v-model="item.locale" style="width: 120px">
              <el-option
                v-for="locale in localeOptions"
                :key="locale.value"
                :label="locale.label"
                :value="locale.value"
              />
            </el-select>
            <el-input
              v-model="item.label"
              :placeholder="t('validation.enterField', { field: t('menuPage.menuName') })"
              @blur="syncMenuName"
            />
            <el-button
              :disabled="formData.localeNames.length <= 1"
              text
              @click="removeLocaleRow(index)"
            >
              {{ t('common.delete') }}
            </el-button>
          </div>
        </div>

        <el-form-item :label="t('menuPage.orderNum')" prop="orderNum">
          <el-input-number
            v-model="formData.orderNum"
            :min="0"
            :max="9999"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item :label="t('menuPage.icon')">
          <el-select v-model="formData.icon" style="width: 100%">
            <el-option
              v-for="item in MENU_ICON_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <div class="menu-form__icon-option">
                <component :is="item.component" :size="16" />
                <span>{{ item.label }}</span>
              </div>
            </el-option>
          </el-select>

          <div class="menu-form__icon-preview">
            <component :is="previewIcon" :size="42" />
          </div>
        </el-form-item>

        <el-form-item :label="t('menuPage.path')">
          <el-input v-model="formData.path" clearable />
        </el-form-item>

        <el-form-item :label="t('menuPage.component')">
          <el-input v-model="formData.component" clearable />
        </el-form-item>

        <el-form-item :label="t('menuPage.routeName')">
          <el-input v-model="formData.routeName" clearable />
        </el-form-item>

        <el-form-item :label="t('menuPage.query')">
          <el-input v-model="formData.query" clearable />
        </el-form-item>

        <el-form-item :label="t('menuPage.permission')">
          <el-input v-model="formData.perms" clearable />
        </el-form-item>

        <!-------------------------- 状态开关 -------------------------->
        <div class="menu-form__switches">
          <div class="menu-form__switch-item">
            <span>{{ t('menuPage.visible') }}</span>
            <el-switch
              v-model="formData.visible"
              active-value="0"
              inactive-value="1"
            />
          </div>

          <div class="menu-form__switch-item">
            <span>{{ t('menuPage.status') }}</span>
            <el-switch
              v-model="formData.status"
              active-value="0"
              inactive-value="1"
            />
          </div>

          <div class="menu-form__switch-item">
            <span>{{ t('menuPage.cache') }}</span>
            <el-switch
              v-model="formData.isCache"
              :active-value="0"
              :inactive-value="1"
            />
          </div>

          <div class="menu-form__switch-item">
            <span>{{ t('menuPage.frame') }}</span>
            <el-switch
              v-model="formData.isFrame"
              :active-value="1"
              :inactive-value="0"
            />
          </div>
        </div>

        <el-form-item :label="t('menuPage.remark')">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="4"
          />
        </el-form-item>
      </el-form>

      <!-------------------------- 底部操作 -------------------------->
      <div class="menu-form__footer">
        <el-button @click="handleCancel">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ t('common.save') }}
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<style scoped lang="scss">
.menu-form__block {
  margin-bottom: 18px;
}

.menu-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: 600;
}

.menu-form__locale-row {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr) 54px;
  gap: 10px;
  margin-bottom: 10px;
}

.menu-form__icon-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.menu-form__icon-preview {
  width: 84px;
  height: 84px;
  margin-top: 14px;
  border: 1px dashed var(--el-border-color);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-primary);
  background: var(--color-bg-page);
}

.menu-form__switches {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.menu-form__switch-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-text-primary);
}

.menu-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

@media (max-width: 640px) {
  .menu-form__locale-row {
    grid-template-columns: 1fr;
  }

  .menu-form__switches {
    grid-template-columns: 1fr;
  }
}
</style>
