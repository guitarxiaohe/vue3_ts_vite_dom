import type { Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { deleteByEntityKeyAndIdApi } from '@/api/modules/user';
import { getApiErrorText, isApiSuccess } from '@/utils/api-success';
import type { TableEntlty } from '../index.type';

/******************************** 类型 ********************************/

type EmitDelete = {
  (e: 'delete-success'): void;
  (e: 'delete-error', payload: { message: string }): void;
};

/******************************** 按实体键删除（批量 / 单行） ********************************/

export function useEntityDelete(
  props: TableEntlty,
  selectedKeySet: Ref<Set<any>>,
  tableLoading: Ref<boolean>,
  clearSelection: () => void,
  initData: () => Promise<void>,
  emit: EmitDelete
) {
  // 调用通用删除接口，ids 逗号拼接
  async function deleteRowsByIds(ids: string[]): Promise<boolean> {
    const entityKey = props.entityKey?.trim();
    if (!entityKey) {
      ElMessage.warning('请配置 entityKey 后再使用内置删除');
      return false;
    }
    if (ids.length === 0) return false;
    const idsStr = ids.join(',');
    try {
      tableLoading.value = true;
      const res = (await deleteByEntityKeyAndIdApi(entityKey, idsStr)) as {
        code?: number;
        msg?: string;
        message?: string;
      };
      if (!isApiSuccess(res.code ?? 0)) {
        throw new Error(getApiErrorText(res));
      }
      ElMessage.success('删除成功');
      clearSelection();
      await initData();
      emit('delete-success');
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      ElMessage.error(msg);
      emit('delete-error', { message: msg });
      return false;
    } finally {
      tableLoading.value = false;
    }
  }

  async function deleteSelectedByEntityKey(): Promise<boolean> {
    const ids = [...selectedKeySet.value].map(String);
    if (ids.length === 0) {
      ElMessage.warning('请先选择要删除的数据');
      return false;
    }
    return deleteRowsByIds(ids);
  }

  // 行内删除：单主键
  async function deleteRowByEntityKey(
    row: Record<string, any>
  ): Promise<boolean> {
    const rk = props.rowKey ?? 'id';
    const id = row[rk];
    if (id == null || id === '') {
      ElMessage.warning('行数据缺少主键');
      return false;
    }
    return deleteRowsByIds([String(id)]);
  }

  return { deleteSelectedByEntityKey, deleteRowByEntityKey };
}
