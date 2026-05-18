<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormInstance, FormRules } from 'element-plus';
import DetailDrawer from '@/features/form-shell/components/form-drawer.vue';
import type {
  EntityFormProps,
  EntityFormEmits,
} from '@/features/entities/_shared/types';
import {
  createRole,
  editRole,
  getDeptTreeSelect,
  getMenuTreeSelect,
  getRoleInfo,
  getRoleMenuTreeSelect,
  listRoles,
  updateRoleDataScope,
  type PermissionTreeNode,
  type RolePermissionPayload,
} from './service';

/******************************** 角色表单 ********************************/

const props = defineProps<EntityFormProps>();
const emit = defineEmits<EntityFormEmits>();

const { t } = useI18n();

/******************************** 表单状态 ********************************/

const formRef = ref<FormInstance>();
const submitLoading = ref<boolean>(false);
const optionsLoading = ref<boolean>(false);
const menuTreeRef = ref();
const deptTreeRef = ref();
const formData = ref<Record<string, any>>({});
const menuTree = ref<PermissionTreeNode[]>([]);
const deptTree = ref<PermissionTreeNode[]>([]);
const initialDeptIds = ref<Array<number | string>>([]);
const dataScopeTouched = ref<boolean>(false);

const treeProps = {
  label: 'label',
  children: 'children',
};

const dataScopeOptions = computed(() => [
  { label: t('permissionForm.dataScopeAll'), value: '1' },
  { label: t('permissionForm.dataScopeCustom'), value: '2' },
  { label: t('permissionForm.dataScopeDept'), value: '3' },
  { label: t('permissionForm.dataScopeDeptAndChild'), value: '4' },
  { label: t('permissionForm.dataScopeSelf'), value: '5' },
]);

const statusOptions = computed(() => [
  { label: t('deptForm.enabled'), value: '0' },
  { label: t('deptForm.disabled'), value: '1' },
]);

const drawerTitle = computed(() => {
  if (props.isCreate && props.record) {
    return `${t('common.copy')}${t('entity.role.title')}`;
  }
  return props.isCreate
    ? `${t('common.add')}${t('entity.role.title')}`
    : `${t('common.edit')}${t('entity.role.title')}`;
});

const rules = computed<FormRules>(() => ({
  roleName: [
    {
      required: true,
      message: t('validation.enterField', {
        field: t('permissionForm.roleName'),
      }),
      trigger: 'blur',
    },
  ],
  roleKey: [
    {
      required: true,
      message: t('validation.enterField', {
        field: t('permissionForm.roleKey'),
      }),
      trigger: 'blur',
    },
  ],
  roleSort: [
    {
      required: true,
      message: t('validation.enterField', {
        field: t('permissionForm.roleSort'),
      }),
      trigger: 'blur',
    },
  ],
  dataScope: [
    {
      required: true,
      message: t('validation.selectField', {
        field: t('permissionForm.dataScope'),
      }),
      trigger: 'change',
    },
  ],
}));

/******************************** 数据方法 ********************************/

// 标准化 ID 列表
function normalizeIds(value: unknown): Array<number | string> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => item !== '' && item != null) as Array<number | string>;
}

// 构建默认角色表单
function createDefaultForm() {
  return {
    roleId: '',
    roleName: '',
    roleKey: '',
    roleSort: 1,
    status: '0',
    dataScope: '1',
    menuCheckStrictly: true,
    deptCheckStrictly: true,
    menuIds: [],
    deptIds: [],
    remark: '',
  };
}

// 获取树组件已勾选节点
function getCheckedTreeKeys(treeRef: any): Array<number | string> {
  return normalizeIds(treeRef?.getCheckedKeys?.(false) ?? []);
}

// 设置树组件勾选节点
async function setCheckedTreeKeys(treeRef: any, keys: Array<number | string>) {
  await nextTick();
  treeRef?.setCheckedKeys?.(keys, false);
}

// 加载角色权限选项
async function loadRolePermissionOptions() {
  if (!props.visible) return;

  optionsLoading.value = true;
  dataScopeTouched.value = false;
  try {
    const roleId = props.isCreate ? undefined : props.record?.roleId;
    const baseForm = {
      ...createDefaultForm(),
      ...(props.record ?? {}),
    };
    formData.value = baseForm;

    const [menuResponse, deptResponse, roleResponse] = await Promise.all([
      roleId
        ? getRoleMenuTreeSelect(roleId as number | string)
        : getMenuTreeSelect(),
      getDeptTreeSelect(),
      roleId ? getRoleInfo(roleId as number | string) : Promise.resolve(null),
    ]);

    menuTree.value = menuResponse.menus ?? menuResponse.data ?? [];
    deptTree.value = deptResponse.data ?? [];

    const roleData = roleResponse?.data ?? {};
    const checkedMenuIds = normalizeIds(
      menuResponse.checkedKeys ?? roleData.menuIds ?? baseForm.menuIds
    );
    const checkedDeptIds = normalizeIds(roleData.deptIds ?? baseForm.deptIds);
    initialDeptIds.value = checkedDeptIds;

    formData.value = {
      ...baseForm,
      ...roleData,
      menuIds: checkedMenuIds,
      deptIds: checkedDeptIds,
      status: String(roleData.status ?? baseForm.status ?? '0'),
      dataScope: String(roleData.dataScope ?? baseForm.dataScope ?? '1'),
      menuCheckStrictly: Boolean(
        roleData.menuCheckStrictly ?? baseForm.menuCheckStrictly ?? true
      ),
      deptCheckStrictly: Boolean(
        roleData.deptCheckStrictly ?? baseForm.deptCheckStrictly ?? true
      ),
    };

    await setCheckedTreeKeys(menuTreeRef.value, checkedMenuIds);
    await setCheckedTreeKeys(deptTreeRef.value, checkedDeptIds);
  } finally {
    optionsLoading.value = false;
  }
}

// 组装后端角色权限参数
function buildPayload(data: Record<string, any>): RolePermissionPayload {
  const menuIds = getCheckedTreeKeys(menuTreeRef.value);
  const deptIds =
    String(data.dataScope ?? '1') === '2'
      ? getCheckedTreeKeys(deptTreeRef.value)
      : [];

  return {
    roleId: data.roleId,
    roleName: String(data.roleName ?? '').trim(),
    roleKey: String(data.roleKey ?? '').trim(),
    roleSort: data.roleSort ?? 1,
    status: String(data.status ?? '0'),
    dataScope: String(data.dataScope ?? '1'),
    menuCheckStrictly: Boolean(data.menuCheckStrictly),
    deptCheckStrictly: Boolean(data.deptCheckStrictly),
    menuIds,
    deptIds,
    remark: String(data.remark ?? '').trim() || undefined,
  };
}

/******************************** 事件方法 ********************************/

// 自定义校验
async function validateRoleForm() {
  await formRef.value?.validate();
}

// 清除校验
function clearRoleValidate() {
  formRef.value?.clearValidate();
}

// 保存角色权限表单
async function save(data: Record<string, any>) {
  submitLoading.value = true;
  try {
    const payload = buildPayload(data);
    if (props.isCreate) {
      await createRole(payload);
      if (payload.dataScope === '2' && payload.deptIds.length > 0) {
        const roleListResponse = await listRoles({ roleKey: payload.roleKey });
        const createdRole = (roleListResponse.rows ?? []).find(
          (role) => role.roleKey === payload.roleKey
        );
        if (createdRole?.roleId != null) {
          await updateRoleDataScope({
            ...payload,
            roleId: createdRole.roleId,
          });
        }
      }
    } else {
      await editRole(payload);
      if (
        payload.dataScope === '2' &&
        (dataScopeTouched.value || initialDeptIds.value.length > 0)
      ) {
        await updateRoleDataScope(payload);
      }
    }
    emit('save');
    emit('update:visible', false);
  } finally {
    submitLoading.value = false;
  }
}

// 关闭抽屉
function onCancel() {
  emit('update:visible', false);
  emit('cancel');
}

/******************************** 监听 ********************************/

watch(
  () => [props.visible, props.record?.roleId, props.isCreate] as const,
  () => {
    if (props.visible) {
      void loadRolePermissionOptions();
    }
  },
  { immediate: true }
);
</script>

<template>
  <DetailDrawer
    v-model:form-data="formData"
    :record="props.record"
    :record-list="props.recordList"
    :initial-index="props.initialIndex"
    :visible="props.visible"
    :is-create="props.isCreate"
    :saving="submitLoading || optionsLoading"
    :title="drawerTitle"
    size="720px"
    :custom-validate="validateRoleForm"
    :custom-clear-validate="clearRoleValidate"
    @save="save"
    @cancel="onCancel"
    @update:visible="emit('update:visible', $event)"
  >
    <template #content="{ formData: scopedFormData }">
      <el-form
        ref="formRef"
        v-loading="optionsLoading"
        :model="scopedFormData"
        :rules="rules"
        label-position="top"
        class="role-permission-form"
      >
        <!-------------------------- 基础信息 -------------------------->
        <section class="permission-section">
          <h3 class="permission-section__title">
            {{ t('permissionForm.basicInfo') }}
          </h3>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item
                :label="t('permissionForm.roleName')"
                prop="roleName"
              >
                <el-input
                  v-model="scopedFormData.roleName"
                  :placeholder="
                    t('validation.enterField', {
                      field: t('permissionForm.roleName'),
                    })
                  "
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('permissionForm.roleKey')" prop="roleKey">
                <el-input
                  v-model="scopedFormData.roleKey"
                  :placeholder="
                    t('validation.enterField', {
                      field: t('permissionForm.roleKey'),
                    })
                  "
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="t('permissionForm.roleSort')"
                prop="roleSort"
              >
                <el-input-number
                  v-model="scopedFormData.roleSort"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="t('permissionForm.status')" prop="status">
                <el-radio-group v-model="scopedFormData.status">
                  <el-radio
                    v-for="option in statusOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item :label="t('field.remark')" prop="remark">
                <el-input
                  v-model="scopedFormData.remark"
                  type="textarea"
                  :rows="3"
                  :placeholder="
                    t('validation.enterField', { field: t('field.remark') })
                  "
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <!-------------------------- 菜单权限 -------------------------->
        <section class="permission-section">
          <div class="permission-section__header">
            <h3 class="permission-section__title">
              {{ t('permissionForm.menuPermission') }}
            </h3>
            <el-checkbox v-model="scopedFormData.menuCheckStrictly">
              {{ t('permissionForm.checkStrictly') }}
            </el-checkbox>
          </div>
          <el-tree
            ref="menuTreeRef"
            class="permission-tree"
            :data="menuTree"
            :props="treeProps"
            node-key="id"
            show-checkbox
            default-expand-all
            :check-strictly="scopedFormData.menuCheckStrictly"
          />
        </section>

        <!-------------------------- 数据权限 -------------------------->
        <section class="permission-section">
          <h3 class="permission-section__title">
            {{ t('permissionForm.dataPermission') }}
          </h3>
          <el-form-item :label="t('permissionForm.dataScope')" prop="dataScope">
            <el-select
              v-model="scopedFormData.dataScope"
              style="width: 100%"
              @change="dataScopeTouched = true"
            >
              <el-option
                v-for="option in dataScopeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>

          <template v-if="String(scopedFormData.dataScope) === '2'">
            <div class="permission-section__header">
              <h4 class="permission-section__subtitle">
                {{ t('permissionForm.deptPermission') }}
              </h4>
              <el-checkbox v-model="scopedFormData.deptCheckStrictly">
                {{ t('permissionForm.checkStrictly') }}
              </el-checkbox>
            </div>
            <el-tree
              ref="deptTreeRef"
              class="permission-tree"
              :data="deptTree"
              :props="treeProps"
              node-key="id"
              show-checkbox
              default-expand-all
              :check-strictly="scopedFormData.deptCheckStrictly"
            />
          </template>
        </section>
      </el-form>
    </template>
  </DetailDrawer>
</template>

<style scoped lang="scss">
.role-permission-form {
  padding-right: 8px;
}

.permission-section {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--color-border);
}

.permission-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.permission-section__title,
.permission-section__subtitle {
  margin: 0 0 12px;
  color: var(--color-text-primary);
  font-weight: 700;
}

.permission-section__title {
  font-size: 15px;
}

.permission-section__subtitle {
  font-size: 13px;
}

.permission-tree {
  max-height: 260px;
  overflow: auto;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
}
</style>
