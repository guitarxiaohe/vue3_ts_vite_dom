<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getListByEntityKeyApi } from '@/api/modules/user';
import type { TableListQuery } from '@/components/table-entity/index.type';
import type {
  AsyncCascaderEntityConfig,
  AsyncCascaderFetchParams,
  AsyncCascaderNode,
  CascaderVal,
} from './async-cascader.type';

/******************************** 组件入参 ********************************/

const props = withDefaults(
  defineProps<{
    modelValue?: CascaderVal;
    fetcher?: (
      params: AsyncCascaderFetchParams
    ) => Promise<AsyncCascaderNode[] | Record<string, any>[]>;
    entityConfig?: AsyncCascaderEntityConfig;
    propsMap?: {
      value?: string;
      label?: string;
      children?: string;
      leaf?: string;
    };
    placeholder?: string;
    disabled?: boolean;
    clearable?: boolean;
    checkStrictly?: boolean;
    emitPath?: boolean;
    showAllLevels?: boolean;
  }>(),
  {
    modelValue: () => [],
    propsMap: () => ({}),
    placeholder: '',
    disabled: false,
    clearable: true,
    checkStrictly: false,
    emitPath: true,
    showAllLevels: true,
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: CascaderVal];
  change: [value: CascaderVal];
}>();

const { t } = useI18n();

/******************************** 常量与状态 ********************************/

const DEFAULT_LABEL_KEYS = ['label', 'name', 'title', 'deptName'];
const DEFAULT_VALUE_KEYS = ['value', 'id', 'deptId', 'menuId'];
const DEFAULT_CHILDREN_KEYS = ['children', 'childList'];
const DEFAULT_LEAF_KEYS = ['leaf', 'isLeaf', 'hasChildren'];

const loading = ref<boolean>(false);
const loadedMap = ref<Map<string, AsyncCascaderNode[]>>(new Map());

const cascaderValue = computed<CascaderVal>({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (value) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const resolvedPlaceholder = computed(
  () => props.placeholder || t('common.pleaseSelect')
);

const resolvedConfig = computed(() => ({
  value: props.propsMap.value ?? props.entityConfig?.valueKey ?? 'value',
  label: props.propsMap.label ?? props.entityConfig?.labelKey ?? 'label',
  children:
    props.propsMap.children ?? props.entityConfig?.childrenKey ?? 'children',
  leaf: props.propsMap.leaf ?? props.entityConfig?.leafKey ?? 'leaf',
}));

const cascaderProps = computed(() => ({
  lazy: true,
  emitPath: props.emitPath,
  checkStrictly: props.checkStrictly,
  lazyLoad: onLazyLoad,
}));

/******************************** 数据处理 ********************************/

// 生成缓存键
function getCacheKey(parentValue: string | number | null) {
  return String(parentValue ?? '__root__');
}

// 解析节点文案
function resolveNodeLabel(item: Record<string, any>) {
  const keys = [resolvedConfig.value.label, ...DEFAULT_LABEL_KEYS];

  for (const key of keys) {
    const value = item[String(key)];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }

  return '';
}

// 解析节点值
function resolveNodeValue(item: Record<string, any>) {
  const keys = [resolvedConfig.value.value, ...DEFAULT_VALUE_KEYS];

  for (const key of keys) {
    const value = item[String(key)];
    if (value !== undefined && value !== null && value !== '') {
      return value as string | number;
    }
  }

  return '';
}

// 解析是否叶子节点
function resolveNodeLeaf(item: Record<string, any>) {
  const leafKey = resolvedConfig.value.leaf;
  const leafValue = item[String(leafKey)];
  if (leafValue !== undefined && leafValue !== null) {
    if (leafKey === 'hasChildren') {
      return !Boolean(leafValue);
    }
    return Boolean(leafValue);
  }

  for (const key of DEFAULT_LEAF_KEYS) {
    const value = item[key];
    if (value === undefined || value === null) continue;
    if (key === 'hasChildren') return !Boolean(value);
    return Boolean(value);
  }

  return false;
}

// 规范化节点数据
function normalizeNode(item: Record<string, any>): AsyncCascaderNode {
  const children = DEFAULT_CHILDREN_KEYS.map((key) => item[key]).find((v) =>
    Array.isArray(v)
  ) as Record<string, any>[] | undefined;
  const normalizedChildren = children?.map((child) => normalizeNode(child));

  return {
    label: resolveNodeLabel(item),
    value: resolveNodeValue(item),
    leaf: normalizedChildren?.length ? false : resolveNodeLeaf(item),
    children: normalizedChildren,
    raw: item,
  };
}

// 拉取实体节点
async function fetchEntityNodes(
  params: AsyncCascaderFetchParams
): Promise<AsyncCascaderNode[]> {
  const config = props.entityConfig;
  if (!config?.entityKey) {
    throw new Error('AsyncCascader entityConfig.entityKey is required');
  }

  const query: TableListQuery = {
    pageNum: 1,
    pageSize: 999,
    ...(config.dataParams ?? {}),
  };
  const parentKey = config.parentKey ?? 'parentId';
  const rootParentValue =
    config.rootParentValue === undefined ? 0 : config.rootParentValue;
  query[parentKey] = params.parentValue ?? rootParentValue;

  const rows = config.fetcher
    ? (await config.fetcher(query)).rows ?? []
    : ((await getListByEntityKeyApi(config.entityKey, query)) as unknown as {
        rows?: Record<string, any>[];
      }).rows ?? [];

  return rows.map((row) => normalizeNode(row));
}

// 拉取联级节点
async function fetchNodes(
  params: AsyncCascaderFetchParams
): Promise<AsyncCascaderNode[]> {
  if (props.fetcher) {
    const rows = await props.fetcher(params);
    return (rows ?? []).map((row) => normalizeNode(row as Record<string, any>));
  }
  if (props.entityConfig?.entityKey) {
    return fetchEntityNodes(params);
  }
  throw new Error('AsyncCascader requires fetcher or entityConfig');
}

// 根据路径预加载节点，确保值回显
async function ensurePathLoaded(pathValues: CascaderVal) {
  if (!pathValues.length) return;
  let parentValue: string | number | null = null;
  let level = 0;

  for (const currentValue of pathValues) {
    const cacheKey = getCacheKey(parentValue);
    let currentLevelNodes = loadedMap.value.get(cacheKey);

    if (!currentLevelNodes) {
      currentLevelNodes = await fetchNodes({
        level,
        parentValue,
        pathValues: pathValues.slice(0, level),
      });
      loadedMap.value.set(cacheKey, currentLevelNodes);
    }

    const currentNode = currentLevelNodes.find(
      (node) => node.value === currentValue
    );
    if (!currentNode) break;

    parentValue = currentNode.value;
    level += 1;
  }
}

/******************************** 事件方法 ********************************/

// 懒加载节点
async function onLazyLoad(node: any, resolve: (data: AsyncCascaderNode[]) => void) {
  const level = Number(node?.level ?? 0);
  const parentValue =
    level === 0 ? null : (node.value as string | number | null);
  const pathValues = Array.isArray(node?.pathValues) ? node.pathValues : [];
  const cacheKey = getCacheKey(parentValue);
  const cached = loadedMap.value.get(cacheKey);

  if (cached) {
    resolve(cached);
    return;
  }

  loading.value = true;
  try {
    const nodes = await fetchNodes({ level, parentValue, pathValues });
    loadedMap.value.set(cacheKey, nodes);
    resolve(nodes);
  } catch {
    resolve([]);
  } finally {
    loading.value = false;
  }
}

watch(
  () => cascaderValue.value,
  (pathValues) => {
    void ensurePathLoaded(pathValues);
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <el-cascader
    v-model="cascaderValue"
    :props="cascaderProps"
    :placeholder="resolvedPlaceholder"
    :disabled="disabled"
    :clearable="clearable"
    :show-all-levels="showAllLevels"
    :loading="loading"
    style="width: 100%"
    v-bind="$attrs"
  />
</template>
