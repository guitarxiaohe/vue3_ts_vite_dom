<script setup lang="ts">
import { computed, ref, watch, nextTick, watchEffect, useSlots } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { useI18n } from 'vue-i18n';
import { getSysUserById } from '@/api/modules/user';
import { UserSex, type SysUserDetailApiResponse } from '@/types/user';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import { Mars, Venus } from 'lucide-vue-next';
import FileCell from '../table-entity/cells/file-cell.vue';
import { useImageUrl } from '@/composables/use-image-url';
const { ensureImageBaseUrl, resolveImageUrl } = useImageUrl();
void ensureImageBaseUrl();
/******************************** 类型 ********************************/

export type UserAvatarGenderInput =
  | 'male'
  | 'female'
  | 'unknown'
  | ''
  | 1
  | 2
  | 'M'
  | 'F'
  | 'm'
  | 'f'
  | '男'
  | '女';

/******************************** props ********************************/

const props = withDefaults(
  defineProps<{
    /** 用户 ID，传入后请求 `/system/user/{id}`，返回 data 为 SysUser */
    userId?: string | number;
    /** 展示名称（仅 userId 时可省略，由接口 nickName / userName 兜底） */
    name?: string;
    /** 副标题，如部门、职位 */
    subtitle?: string;
    /** 头像图片地址 */
    src?: string;
    /** 男性：右侧文案蓝色；女性：粉色；未传或无法识别：次要文字色 */
    gender?: UserAvatarGenderInput;
    /** 头像尺寸，对应 el-avatar size */
    size?: number;
    /** 透传 el-avatar（会与 src、size、shape 合并，后者优先） */
    avatarProps?: Record<string, unknown>;
    /** 抽屉内头像尺寸（基础信息 el-descriptions 首行） */
    drawerAvatarSize?: number;
    /** 年龄 */
    age?: string | number;
    /** 工龄 */
    workYears?: string | number;
    /** 邮箱 */
    email?: string;
    /** 手机号 */
    phone?: string;
    /** 部门信息（未传时用 subtitle / 接口 dept 兜底） */
    department?: string;
    /** 职级 */
    jobLevel?: string;
    /** 是否允许点击打开抽屉 */
    enableDrawer?: boolean;
    /** 抽屉标题，不传则用 i18n */
    drawerTitle?: string;
    /** 抽屉宽度 */
    drawerSize?: string | number;
    /** 透传 el-drawer */
    drawerProps?: Record<string, unknown>;
  }>(),
  {
    userId: undefined,
    name: undefined,
    subtitle: '',
    size: 30,
    gender: undefined,
    avatarProps: undefined,
    age: undefined,
    workYears: undefined,
    email: undefined,
    phone: undefined,
    department: undefined,
    jobLevel: undefined,
    enableDrawer: true,
    drawerTitle: undefined,
    drawerSize: '40%',
    drawerProps: undefined,
    drawerAvatarSize: 64,
  }
);

const drawerVisible = defineModel<boolean>('drawerVisible', { default: false });

/** 懒加载：首次打开前不挂载 el-drawer；在 closed 后再卸载以保留关闭动画 */
const drawerRendered = ref(false);

watch(
  drawerVisible,
  (v) => {
    if (v) drawerRendered.value = true;
  },
  { immediate: true }
);

function onDrawerClosed() {
  drawerRendered.value = false;
}

const { t } = useI18n();
const slots = useSlots();

/******************************** 远程 SysUser ********************************/

const remoteEnabled = computed(
  () => props.userId != null && String(props.userId) !== ''
);

const { data: remoteDetail, isFetching } = useQuery({
  queryKey: computed(() => ['sysUser', props.userId] as const),
  queryFn: async (): Promise<SysUserDetailApiResponse> => {
    const res = await getSysUserById(props.userId!);
    if (!isApiSuccess(res.code)) {
      throw new Error(getApiErrorText(res));
    }
    return res;
  },
  enabled: remoteEnabled,
});

/** data 内用户主数据 */
const remoteUser = computed(() => remoteDetail.value?.data);

const showRemoteLoading = computed(
  () => remoteEnabled.value && isFetching.value && !remoteDetail.value
);

/** 显式 props 优先于接口 */
const displayName = computed(
  () =>
    props.name ?? remoteUser.value?.nickName ?? remoteUser.value?.userName ?? ''
);

const displaySubtitle = computed(
  () => props.subtitle || remoteUser.value?.dept?.deptName || ''
);

const displaySrc = computed(() => props.src ?? remoteUser.value?.avatar ?? '');

const displayEmail = computed(
  () => props.email ?? remoteUser.value?.email ?? ''
);

const displayPhone = computed(
  () => props.phone ?? remoteUser.value?.phonenumber ?? ''
);

const displayAge = computed(() => props.age);
const displayWorkYears = computed(() => props.workYears);
const displayJobLevel = computed(() => props.jobLevel);

// 默认插槽存在时，抽屉内展示插槽内容，否则展示内置字段
const hasDrawerDefaultSlot = computed(() => !!slots.default);

const genderSource = computed<UserAvatarGenderInput | undefined>(() => {
  if (
    props.gender !== undefined &&
    props.gender !== null &&
    props.gender !== ''
  ) {
    return props.gender;
  }
  const sex = remoteUser.value?.sex;
  if (sex === UserSex.MALE || sex === '0') return 'male';
  if (sex === UserSex.FEMALE || sex === '1') return 'female';
  if (sex === UserSex.UNKNOWN || sex === '2') return 'unknown';
  return undefined;
});

// 归一化性别，便于样式类名
const resolvedGender = computed<'male' | 'female' | 'unknown'>(() => {
  const g = genderSource.value;
  if (g === undefined || g === null || g === '') return 'unknown';
  if (g === 'male' || g === 1 || g === 'M' || g === 'm' || g === '男') {
    return 'male';
  }
  if (g === 'female' || g === 2 || g === 'F' || g === 'f' || g === '女') {
    return 'female';
  }
  if (g === 'unknown') return 'unknown';
  return 'unknown';
});

const genderLabel = computed(() => {
  if (resolvedGender.value === 'male') {
    return t('components.userAvatarInfo.genderMale');
  }
  if (resolvedGender.value === 'female') {
    return t('components.userAvatarInfo.genderFemale');
  }
  return t('components.userAvatarInfo.genderUnknown');
});

const metaClass = computed(() => ({
  'user-avatar-info__meta--male': resolvedGender.value === 'male',
  'user-avatar-info__meta--female': resolvedGender.value === 'female',
}));

/** 头像右上角性别角标（仅男/女展示） */
const showGenderBadge = computed(
  () => resolvedGender.value === 'male' || resolvedGender.value === 'female'
);

const genderIconSize = computed(() =>
  Math.max(10, Math.min(16, Math.round(props.size * 0.36)))
);

const drawerGenderIconSize = computed(() =>
  Math.max(12, Math.min(22, Math.round(props.drawerAvatarSize * 0.32)))
);

const mergedAvatarProps = computed(() => ({
  ...props.avatarProps,
  size: props.size,
  src: resolveImageUrl(displaySrc.value),
  shape: 'circle',
}));

/** 抽屉内 descriptions 的头像（与列表区头像同源，尺寸可单独调大） */
const drawerAvatarBind = computed(() => ({
  ...props.avatarProps,
  size: props.drawerAvatarSize,
  url: displaySrc.value,
  name: '',
}));

const drawerTitleText = computed(
  () => props.drawerTitle ?? t('components.userAvatarInfo.drawerTitle')
);

const drawerDetailItems = computed(() => [
  {
    key: 'avatar',
    label: t('components.userAvatarInfo.fieldAvatar'),
    type: 'avatar' as const,
    value: '',
  },
  {
    key: 'name',
    label: t('components.userAvatarInfo.fieldName'),
    type: 'text' as const,
    value: displayName.value,
  },
  {
    key: 'gender',
    label: t('components.userAvatarInfo.fieldGender'),
    type: 'text' as const,
    value: genderLabel.value,
  },
  {
    key: 'age',
    label: t('components.userAvatarInfo.fieldAge'),
    type: 'text' as const,
    value: displayField(displayAge.value),
  },
  {
    key: 'workYears',
    label: t('components.userAvatarInfo.fieldWorkYears'),
    type: 'text' as const,
    value: displayField(displayWorkYears.value),
  },
  {
    key: 'email',
    label: t('components.userAvatarInfo.fieldEmail'),
    type: 'text' as const,
    value: displayField(displayEmail.value),
  },
  {
    key: 'phone',
    label: t('components.userAvatarInfo.fieldPhone'),
    type: 'text' as const,
    value: displayField(displayPhone.value),
  },
  {
    key: 'department',
    label: t('components.userAvatarInfo.fieldDepartment'),
    type: 'text' as const,
    value: departmentDisplay.value,
  },
  {
    key: 'jobLevel',
    label: t('components.userAvatarInfo.fieldJobLevel'),
    type: 'text' as const,
    value: displayField(displayJobLevel.value),
  },
]);

const mergedDrawerProps = computed(() => ({
  appendToBody: true,
  destroyOnClose: false,
  ...props.drawerProps,
}));

const triggerAriaLabel = computed(() =>
  props.enableDrawer
    ? `${t('components.userAvatarInfo.ariaLabel')}, ${t('components.userAvatarInfo.clickToViewDetail')}`
    : t('components.userAvatarInfo.ariaLabel')
);

function displayField(v: unknown) {
  if (v === undefined || v === null || v === '') {
    return t('components.userAvatarInfo.empty');
  }
  return String(v);
}

const departmentDisplay = computed(() =>
  displayField(
    props.department ?? props.subtitle ?? remoteUser.value?.dept?.deptName ?? ''
  )
);

function onTriggerClick() {
  if (!props.enableDrawer) return;
  drawerVisible.value = true;
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (!props.enableDrawer) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    drawerVisible.value = true;
  }
}

/******************************** 副标题省略与 hover 全文 ********************************/

const subtitleRef = ref<HTMLElement | null>(null);
const subtitleOverflow = ref(false);

function measureSubtitleOverflow() {
  const el = subtitleRef.value;
  if (!el) {
    subtitleOverflow.value = false;
    return;
  }
  subtitleOverflow.value = el.scrollWidth > el.clientWidth + 1;
}

watchEffect((onCleanup) => {
  const el = subtitleRef.value;
  if (!el || typeof ResizeObserver === 'undefined') {
    subtitleOverflow.value = false;
    return;
  }
  measureSubtitleOverflow();
  const ro = new ResizeObserver(() => measureSubtitleOverflow());
  ro.observe(el);
  onCleanup(() => ro.disconnect());
});

watch(
  () => displaySubtitle.value,
  () => nextTick(measureSubtitleOverflow)
);

function openDrawer() {
  drawerVisible.value = true;
}

function closeDrawer() {
  drawerVisible.value = false;
}

defineExpose({
  openDrawer,
  closeDrawer,
  /** data 内 SysUser */
  remoteUser,
  /** 完整接口响应（含根级 roles、posts、roleIds） */
  remoteDetail,
});
</script>

<template>
  <div class="user-avatar-info-root">
    <div v-if="showRemoteLoading" class="user-avatar-info__loading">
      <el-skeleton animated>
        <template #template>
          <div class="user-avatar-info__skeleton-row">
            <el-skeleton-item
              variant="circle"
              :style="{ width: size + 'px', height: size + 'px' }"
            />
            <div class="user-avatar-info__skeleton-text">
              <el-skeleton-item variant="p" style="width: 55%" />
              <el-skeleton-item variant="p" style="width: 40%" />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>

    <div
      v-else
      class="user-avatar-info"
      :class="{ 'user-avatar-info--clickable': enableDrawer }"
      :role="enableDrawer ? 'button' : undefined"
      :tabindex="enableDrawer ? 0 : undefined"
      :aria-label="triggerAriaLabel"
      :aria-disabled="!enableDrawer"
      @click="onTriggerClick"
      @keydown="onTriggerKeydown"
    >
      <div class="user-avatar-info__avatar-wrap">
        <el-avatar class="user-avatar-info__avatar" v-bind="mergedAvatarProps">
          <slot name="avatar">{{ displayName?.slice(0, 1) }}</slot>
        </el-avatar>
        <span
          v-if="showGenderBadge"
          class="user-avatar-info__gender-badge"
          :class="`user-avatar-info__gender-badge--${resolvedGender}`"
          aria-hidden="true"
        >
          <Mars
            v-if="resolvedGender === 'male'"
            :size="genderIconSize"
            :stroke-width="2.5"
          />
          <Venus v-else :size="genderIconSize" :stroke-width="2.5" />
        </span>
      </div>

      <div class="user-avatar-info__meta" :class="metaClass">
        <div class="user-avatar-info__name">
          <slot name="name">{{ displayName }}</slot>
        </div>
        <div
          v-if="displaySubtitle || $slots.subtitle"
          class="user-avatar-info__subtitle-wrap"
        >
          <el-tooltip
            placement="top"
            :disabled="!subtitleOverflow"
            :show-after="200"
            popper-class="user-avatar-info-tooltip"
          >
            <template #content>
              <div class="user-avatar-info__tooltip-text displaySubtitle">
                <slot name="subtitle">{{ displaySubtitle }}</slot>
              </div>
            </template>
            <div
              ref="subtitleRef"
              class="user-avatar-info__subtitle"
              :class="{
                'user-avatar-info__subtitle--overflow': subtitleOverflow,
              }"
            >
              <slot name="subtitle">{{ displaySubtitle }}</slot>
            </div>
          </el-tooltip>
        </div>
      </div>
    </div>

    <el-drawer
      v-if="drawerRendered"
      v-model="drawerVisible"
      :size="drawerSize"
      class="user-avatar-info-drawer row-detail-drawer"
      v-bind="mergedDrawerProps"
      @closed="onDrawerClosed"
    >
      <template #header>
        <div class="row-detail-drawer__header">
          <span class="row-detail-drawer__title">{{ drawerTitleText }}</span>
        </div>
      </template>

      <div v-if="hasDrawerDefaultSlot" class="user-avatar-info__drawer-slot">
        <slot />
      </div>
      <el-row v-else :gutter="12" class="row-detail-drawer__grid">
        <el-col v-for="item in drawerDetailItems" :key="item.key" :span="8">
          <div class="row-detail-drawer__item">
            <div class="row-detail-drawer__label">{{ item.label }}:</div>
            <div
              v-if="item.type === 'avatar'"
              class="row-detail-drawer__value user-avatar-info__drawer-avatar-value"
            >
              <slot name="drawer-avatar">
                <div class="user-avatar-info__avatar-wrap">
                  <FileCell :attachments="[drawerAvatarBind]" />
                </div>
              </slot>
            </div>
            <div v-else class="row-detail-drawer__value">
              <slot v-if="item.key === 'name'" name="drawer-name">
                {{ item.value }}
              </slot>
              <template v-else>
                {{ item.value }}
              </template>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.user-avatar-info-root {
  display: inline-block;
  max-width: 100%;
}

.user-avatar-info__loading {
  min-width: 120px;
}

.user-avatar-info__skeleton-row {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
}

.user-avatar-info__skeleton-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-avatar-info {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
  max-width: 100%;
}

.user-avatar-info--clickable {
  cursor: pointer;
  border-radius: var(--radius-md);
  outline: none;
}

.user-avatar-info--clickable:focus-visible {
  box-shadow: 0 0 0 2px var(--color-primary-bg);
}

.user-avatar-info__avatar-wrap {
  position: relative;
  flex-shrink: 0;
  width: fit-content;
}

.user-avatar-info__gender-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
  box-sizing: border-box;
  background: var(--color-bg-card);
  pointer-events: none;
}

.user-avatar-info__gender-badge--male {
  color: var(--color-gender-male-text);
}

.user-avatar-info__gender-badge--female {
  color: var(--color-gender-female-text);
}

.user-avatar-info__gender-badge--drawer {
  width: 22px;
  height: 22px;
  right: -3px;
  top: -3px;
}

/* 勿用 line-height:0 / display:block，否则会破坏 el-avatar 内默认文字的 flex 居中 */
.user-avatar-info__avatar {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.user-avatar-info__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  font-size: var(--font-size-sm);
  line-height: 1.35;
}

.user-avatar-info__name {
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-avatar-info__subtitle-wrap {
  min-width: 0;
  width: 100%;
}

.user-avatar-info__subtitle {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  font-size: 10px;
}

.user-avatar-info__subtitle--overflow {
  cursor: help;
}

.user-avatar-info__tooltip-text {
  max-width: min(90vw, 360px);
  word-break: break-word;
  white-space: normal;
  line-height: 1.45;
}

.user-avatar-info__drawer-avatar {
  flex-shrink: 0;
}

.user-avatar-info__drawer-slot {
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.user-avatar-info__drawer-avatar-value {
  white-space: normal;
  overflow: visible;
}

.row-detail-drawer__header {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 24px;
  gap: 12px;
}

.row-detail-drawer__title {
  flex: 1;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.row-detail-drawer__grid {
  margin-top: 0;
}

.row-detail-drawer__item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  min-width: 0;
}

.row-detail-drawer__label {
  flex-shrink: 0;
  margin-right: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 20px;
}

.row-detail-drawer__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  line-height: 22px;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 12px;
}

/* 男性：名称与副标题均为蓝色 */
.user-avatar-info__meta--male .user-avatar-info__name,
.user-avatar-info__meta--male .user-avatar-info__subtitle {
  color: var(--color-gender-male-text);
}

/* 女性：名称与副标题均为粉色 */
.user-avatar-info__meta--female .user-avatar-info__name,
.user-avatar-info__meta--female .user-avatar-info__subtitle {
  color: var(--color-gender-female-text);
}
</style>

<style lang="scss">
/* el-tooltip 的 popper 挂载到 body */
.user-avatar-info-tooltip.el-popper {
  max-width: min(90vw, 380px);
}

.user-avatar-info-drawer .el-drawer__header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}

.user-avatar-info-drawer .el-drawer__body {
  padding-top: 8px;
}
</style>
