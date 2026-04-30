import type {
  DictClassValue,
  DictFormData,
  DictItemDrawerFormData,
  DictItemFormData,
  DictStatusValue,
} from '@/types/dict';

export interface DictPayload {
  dictId?: number | string;
  dictType: string;
  dictName: string;
  dictClass: DictClassValue;
  status: DictStatusValue;
  remark: string;
}

export interface DictBundlePayload {
  dict: DictPayload;
  items: Array<{
    dictCode?: number | string;
    dictSort: number;
    dictValue: string;
    dictLabel: string;
    dictType: string;
    color: string;
    status: DictStatusValue;
    remark: string;
  }>;
}

export function createLocalId() {
  return `dict-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeStatus(value: unknown): DictStatusValue {
  return String(value ?? '0') === '1' ? '1' : '0';
}

export function getStatusLabel(
  status: DictStatusValue,
  t: (key: string) => string
) {
  return status === '0'
    ? t('dictPage.statusEnabled')
    : t('dictPage.statusDisabled');
}

export function getStatusTagType(status: DictStatusValue) {
  return status === '0' ? 'success' : 'danger';
}

export function createDefaultParentForm(): DictFormData {
  return {
    dictId: undefined,
    dictType: '',
    dictName: '',
    dictClass: 'system',
    status: '0',
    remark: '',
  };
}

export function cloneParentForm(record?: Record<string, unknown>): DictFormData {
  const source = record ?? {};

  return {
    ...createDefaultParentForm(),
    dictId: source.dictId as number | string | undefined,
    dictType: String(source.dictType ?? '').trim(),
    dictName: String(source.dictName ?? '').trim(),
    dictClass: (String(source.dictClass ?? 'system') as DictClassValue) || 'system',
    status: normalizeStatus(source.status),
    remark: String(source.remark ?? ''),
  };
}

export function createDefaultItem(): DictItemFormData {
  return {
    localId: createLocalId(),
    dictCode: undefined,
    dictSort: 1,
    dictValue: '',
    dictLabel: '',
    color: '#b7ebc2',
    remark: '',
    status: '0',
  };
}

export function createDefaultDrawerForm(): DictItemDrawerFormData {
  return {
    localId: createLocalId(),
    dictCode: undefined,
    dictSort: 1,
    dictValue: '',
    dictLabel: '',
    color: '#b7ebc2',
    remark: '',
    enabled: true,
  };
}

export function normalizeChildItem(
  record?: Record<string, unknown>,
  index = 0
): DictItemFormData {
  const source = record ?? {};

  return {
    ...createDefaultItem(),
    localId:
      String(source.localId ?? source.dictCode ?? '').trim() || createLocalId(),
    dictCode: source.dictCode as number | string | undefined,
    dictSort: Number(source.dictSort ?? index + 1),
    dictValue: String(source.dictValue ?? '').trim(),
    dictLabel: String(source.dictLabel ?? '').trim(),
    color: String(source.color ?? '#b7ebc2'),
    remark: String(source.remark ?? ''),
    status: normalizeStatus(source.status),
  };
}

export function normalizeDrawerForm(
  record?: Record<string, unknown>,
  index = 0
): DictItemDrawerFormData {
  const source = normalizeChildItem(record, index);

  return {
    localId: source.localId,
    dictCode: source.dictCode,
    dictSort: source.dictSort,
    dictValue: source.dictValue,
    dictLabel: source.dictLabel,
    color: source.color,
    remark: source.remark,
    enabled: source.status === '0',
  };
}

export function toItem(
  record: Record<string, unknown>,
  index = 0
): DictItemFormData {
  const source = record as DictItemDrawerFormData;

  return {
    localId: String(source.localId ?? createLocalId()),
    dictCode: source.dictCode,
    dictSort: Number(source.dictSort ?? index + 1),
    dictValue: String(source.dictValue ?? '').trim(),
    dictLabel: String(source.dictLabel ?? '').trim(),
    color: String(source.color ?? '#b7ebc2'),
    remark: String(source.remark ?? ''),
    status: source.enabled ? '0' : '1',
  };
}

export function normalizeOrder(items: DictItemFormData[]) {
  return items.map((item, index) => ({
    ...item,
    dictSort: index + 1,
  }));
}

export function buildDictPayload(form: DictFormData): DictPayload {
  return {
    dictId: form.dictId,
    dictType: form.dictType.trim(),
    dictName: form.dictName.trim(),
    dictClass: form.dictClass,
    status: normalizeStatus(form.status),
    remark: String(form.remark ?? '').trim(),
  };
}

export function buildDictBundlePayload(
  form: DictFormData,
  items: DictItemFormData[]
): DictBundlePayload {
  const dict = buildDictPayload(form);

  return {
    dict,
    items: items.map((item, index) => ({
      dictCode: item.dictCode,
      dictSort: index + 1,
      dictValue: item.dictValue.trim(),
      dictLabel: item.dictLabel.trim(),
      dictType: dict.dictType,
      color: item.color,
      status: normalizeStatus(item.status),
      remark: String(item.remark ?? '').trim(),
    })),
  };
}
