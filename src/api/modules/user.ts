import { httpClient } from '../client';
import type {
  DataStructure,
  FieldConfig,
  LoginParams,
  LoginResponse,
  SysUser,
  SysUserDetailApiResponse,
} from '@/types/user';
import type { SysRouter } from '@/types/menu';
import { isMockEnabled } from '@/utils/is-mock';
import { listRouterTree } from './menu';
import {
  findMockAuthUserByCredentials,
  listMockAuthUsers,
} from './mock-auth';

const nowTs = () => new Date().toISOString();

const createMockField = (
  field: Partial<FieldConfig> & Record<string, unknown>
): FieldConfig & Record<string, unknown> => ({
  id: Number(field.id ?? Date.now()),
  entityKey: String(field.entityKey ?? ''),
  fieldKey: String(field.fieldKey ?? ''),
  fieldName: String(field.fieldName ?? field.fieldKey ?? ''),
  fieldType: (field.fieldType as string | null | undefined) ?? 'input',
  dictCode: (field.dictCode as string | null | undefined) ?? null,
  selectEntityKey:
    (field.selectEntityKey as string | null | undefined) ?? null,
  sort: Number(field.sort ?? 0),
  isFuzzySearch: Boolean(field.isFuzzySearch ?? false),
  isVisible: Boolean(field.isVisible ?? true),
  createdBy: null,
  createdTime: null,
  updatedBy: null,
  updatedTime: null,
  fixed: (field.fixed as 'left' | 'right' | null | undefined) ?? null,
  ...field,
});

const mockEntityFields: Record<string, Array<FieldConfig & Record<string, unknown>>> = {
  dept: [
    createMockField({
      id: 1,
      entityKey: 'dept',
      fieldKey: 'deptName',
      fieldName: '部门名称',
      fieldType: 'input',
      sort: 1,
      isVisible: true,
      isRequired: true,
    }),
    createMockField({
      id: 2,
      entityKey: 'dept',
      fieldKey: 'leader',
      fieldName: '负责人',
      fieldType: 'select',
      sort: 2,
      isVisible: true,
      selectEntityKey: 'user',
      labelKey: 'nickName',
      valueKey: 'userId',
      dragKey: 'userName',
    }),
    createMockField({
      id: 3,
      entityKey: 'dept',
      fieldKey: 'status',
      fieldName: '状态',
      fieldType: 'select',
      sort: 3,
      isVisible: true,
      options: [
        { label: '启用', value: '0' },
        { label: '停用', value: '1' },
      ],
    }),
    createMockField({
      id: 4,
      entityKey: 'dept',
      fieldKey: 'remark',
      fieldName: '备注',
      fieldType: 'textarea',
      sort: 4,
      isVisible: true,
    }),
  ],
  user: [
    createMockField({
      id: 11,
      entityKey: 'user',
      fieldKey: 'userName',
      fieldName: '账号',
      fieldType: 'input',
      sort: 1,
      isVisible: true,
      isRequired: true,
    }),
    createMockField({
      id: 12,
      entityKey: 'user',
      fieldKey: 'nickName',
      fieldName: '昵称',
      fieldType: 'input',
      sort: 2,
      isVisible: true,
      isRequired: true,
    }),
    createMockField({
      id: 13,
      entityKey: 'user',
      fieldKey: 'email',
      fieldName: '邮箱',
      fieldType: 'input',
      sort: 3,
      isVisible: true,
    }),
    createMockField({
      id: 14,
      entityKey: 'user',
      fieldKey: 'deptId',
      fieldName: '所属部门',
      fieldType: 'select',
      sort: 4,
      isVisible: true,
      selectEntityKey: 'dept',
      labelKey: 'deptName',
      valueKey: 'deptId',
      dragKey: 'leader',
    }),
  ],
  fileInfo: [
    createMockField({
      id: 21,
      entityKey: 'fileInfo',
      fieldKey: 'fileOriginName',
      fieldName: '文件名称',
      fieldType: 'input',
      sort: 1,
      isVisible: true,
      isRequired: true,
    }),
    createMockField({
      id: 22,
      entityKey: 'fileInfo',
      fieldKey: 'fileSuffix',
      fieldName: '文件类型',
      fieldType: 'select',
      sort: 2,
      isVisible: true,
      options: [
        { label: '图片', value: 'image' },
        { label: '文档', value: 'document' },
        { label: '其他', value: 'other' },
      ],
    }),
    createMockField({
      id: 23,
      entityKey: 'fileInfo',
      fieldKey: 'fileSizeInfo',
      fieldName: '文件大小',
      fieldType: 'number',
      sort: 3,
      isVisible: true,
      precision: 0,
      min: 0,
    }),
    createMockField({
      id: 24,
      entityKey: 'fileInfo',
      fieldKey: 'delFlag',
      fieldName: '删除标记',
      fieldType: 'select',
      sort: 4,
      isVisible: true,
      options: [
        { label: '正常', value: '0' },
        { label: '已删除', value: '1' },
      ],
    }),
    createMockField({
      id: 25,
      entityKey: 'fileInfo',
      fieldKey: 'remark',
      fieldName: '备注',
      fieldType: 'textarea',
      sort: 5,
      isVisible: true,
    }),
  ],
  dict: [
    createMockField({
      id: 31,
      entityKey: 'dict',
      fieldKey: 'dictName',
      fieldName: '字典名称',
      fieldType: 'input',
      sort: 1,
      isVisible: true,
      isRequired: true,
    }),
    createMockField({
      id: 32,
      entityKey: 'dict',
      fieldKey: 'dictType',
      fieldName: '字典类型',
      fieldType: 'input',
      sort: 2,
      isVisible: true,
      isRequired: true,
    }),
    createMockField({
      id: 33,
      entityKey: 'dict',
      fieldKey: 'status',
      fieldName: '状态',
      fieldType: 'select',
      sort: 3,
      isVisible: true,
      options: [
        { label: '启用', value: '0' },
        { label: '停用', value: '1' },
      ],
    }),
    createMockField({
      id: 34,
      entityKey: 'dict',
      fieldKey: 'remark',
      fieldName: '备注',
      fieldType: 'textarea',
      sort: 4,
      isVisible: true,
    }),
  ],
  dictData: [
    createMockField({
      id: 41,
      entityKey: 'dictData',
      fieldKey: 'dictLabel',
      fieldName: '字典标签',
      fieldType: 'input',
      sort: 1,
      isVisible: true,
    }),
    createMockField({
      id: 42,
      entityKey: 'dictData',
      fieldKey: 'dictValue',
      fieldName: '字典键值',
      fieldType: 'input',
      sort: 2,
      isVisible: true,
    }),
    createMockField({
      id: 43,
      entityKey: 'dictData',
      fieldKey: 'dictType',
      fieldName: '字典类型',
      fieldType: 'input',
      sort: 3,
      isVisible: true,
    }),
    createMockField({
      id: 44,
      entityKey: 'dictData',
      fieldKey: 'status',
      fieldName: '状态',
      fieldType: 'select',
      sort: 4,
      isVisible: true,
      options: [
        { label: '启用', value: '0' },
        { label: '停用', value: '1' },
      ],
    }),
    createMockField({
      id: 45,
      entityKey: 'dictData',
      fieldKey: 'dictSort',
      fieldName: '排序',
      fieldType: 'number',
      sort: 5,
      isVisible: true,
    }),
  ],
};

const mockUserRows: SysUser[] = [
  ...listMockAuthUsers().map((user) => ({
    userId: user.userId,
    deptId: user.deptId,
    userName: user.userName,
    nickName: user.nickName,
    email: user.email,
    status: user.status,
    sex: user.sex,
    avatar: user.avatar,
    dept: user.dept ? { ...user.dept } : undefined,
    roles: user.roles?.map((role) => ({ ...role })),
    roleIds: user.roleIds ? [...user.roleIds] : undefined,
    roleId: user.roleId,
    createBy: user.createBy,
    createTime: user.createTime,
    remark: user.remark,
    admin: user.admin,
  })),
  ...Array.from({ length: 23 }, (_, i) => ({
    userId: i + 11,
    userName: `user_${i + 1}`,
    nickName: `用户${i + 1}`,
    email: `user${i + 1}@mock.com`,
    status: i % 2 === 0 ? '0' : '1',
    sex: String(i % 3),
    dept: {
      deptId: 100 + (i % 4),
      deptName: ['研发部', '产品部', '运营部', '测试部'][i % 4],
    },
    roles: [
      {
        roleId: 9,
        roleName: '普通角色',
        roleKey: 'common',
      },
    ],
  })),
];

const mockDeptRows = Array.from({ length: 8 }, (_, i) => ({
  deptId: i + 1,
  deptName: `部门${i + 1}`,
  leader: `负责人${i + 1}`,
  status: i % 2 === 0 ? '0' : '1',
  remark: `这是部门${i + 1}的备注信息`,
}));

let mockDictRows = [
  {
    dictId: 1,
    dictName: '用户性别',
    dictType: 'sys_user_sex',
    dictClass: 'system',
    status: '0',
    remark: '用户性别字典',
    createdTime: '2026-04-01 10:00:00',
  },
  {
    dictId: 2,
    dictName: '任务状态',
    dictType: 'sys_job_status',
    dictClass: 'system',
    status: '0',
    remark: '任务状态字典',
    createdTime: '2026-04-02 10:00:00',
  },
  {
    dictId: 3,
    dictName: '通知类型',
    dictType: 'sys_notice_type',
    dictClass: 'business',
    status: '1',
    remark: '通知类型字典',
    createdTime: '2026-04-03 10:00:00',
  },
];

let mockDictDataRows = [
  {
    dictCode: 101,
    dictSort: 1,
    dictLabel: '男',
    dictValue: '0',
    dictType: 'sys_user_sex',
    color: '#b7ebc2',
    status: '0',
    remark: '男性',
  },
  {
    dictCode: 102,
    dictSort: 2,
    dictLabel: '女',
    dictValue: '1',
    dictType: 'sys_user_sex',
    color: '#ffd6e7',
    status: '0',
    remark: '女性',
  },
  {
    dictCode: 103,
    dictSort: 3,
    dictLabel: '未知',
    dictValue: '2',
    dictType: 'sys_user_sex',
    color: '#ffe58f',
    status: '1',
    remark: '未知性别',
  },
  {
    dictCode: 201,
    dictSort: 1,
    dictLabel: '正常',
    dictValue: '0',
    dictType: 'sys_job_status',
    color: '#b7ebc2',
    status: '0',
    remark: '启用状态',
  },
  {
    dictCode: 202,
    dictSort: 2,
    dictLabel: '暂停',
    dictValue: '1',
    dictType: 'sys_job_status',
    color: '#ffccc7',
    status: '1',
    remark: '停用状态',
  },
  {
    dictCode: 301,
    dictSort: 1,
    dictLabel: '通知',
    dictValue: '1',
    dictType: 'sys_notice_type',
    color: '#91d5ff',
    status: '0',
    remark: '通知消息',
  },
];

/******************************** Mock 列表工具 ********************************/

const filterMockRows = (
  rows: Array<Record<string, unknown>>,
  params?: Record<string, unknown>
) => {
  const filterEntries = Object.entries(params ?? {}).filter(
    ([key, value]) =>
      !['pageNum', 'pageSize', 'orderByColumn', 'isAsc'].includes(key) &&
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ''
  );

  if (!filterEntries.length) {
    return rows;
  }

  return rows.filter((row) =>
    filterEntries.every(([key, value]) => {
      const current = row[key];
      if (current == null) {
        return false;
      }
      return String(current)
        .toLowerCase()
        .includes(String(value).toLowerCase());
    })
  );
};

export const login = (data: LoginParams) => {
  if (isMockEnabled()) {
    const matched = findMockAuthUserByCredentials(
      String(data.username ?? '').trim(),
      String(data.password ?? '')
    );

    if (!matched) {
      return Promise.resolve({
        code: 500,
        msg: '账号或密码错误',
        token: '',
      } as LoginResponse);
    }

    return Promise.resolve({
      code: 200,
      msg: '登录成功',
      token: matched.token,
    } as LoginResponse);
  }

  return httpClient.post<LoginResponse>('/login', data);
};

export const getRoutersApi = () => {
  if (isMockEnabled()) {
    return listRouterTree() as Promise<any>;
  }

  return httpClient.get<SysRouter[]>('/getRouters');
};

// 根据实体标识查询字段配置列表
export const getByEntityKeyAndFieldKeyApi = (entityKey: string) => {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      data: mockEntityFields[entityKey] ?? [],
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.get<Array<FieldConfig & Record<string, unknown>>>(
    '/system/fieldConfig/listByEntityKey/' + entityKey
  );
};

/**
 * 根据实体标识和 id 删除
 * 支持批量删除，多个 id 用逗号分隔
 * @param entityKey
 * @param ids
 * @returns
 */
export const deleteByEntityKeyAndIdApi = (entityKey: string, ids: string) => {
  if (isMockEnabled()) {
    return Promise.resolve({
      code: 200,
      message: `mock deleted ${entityKey}: ${ids}`,
      msg: '操作成功',
      timestamp: nowTs(),
    } as any);
  }
  const path = entityKey + '/' + ids;
  return httpClient.delete('/system/fieldConfig/delete/' + path);
};

/**
 * 根据实体标识分页拉取列表（query：pageNum、pageSize 及 dataParams）
 * 与 getByEntityKeyAndFieldKeyApi 同一路径时，由后端按是否带分页参数等区分返回（字段配置 vs 行数据）
 */
export const getListByEntityKeyApi = (
  entityKey: string,
  params?: Record<string, unknown>
) => {
  if (isMockEnabled()) {
    const pageNum = Number(params?.pageNum ?? 1);
    const pageSize = Number(params?.pageSize ?? 10);
    const start = (pageNum - 1) * pageSize;
    const rowsSource =
      entityKey === 'user'
        ? mockUserRows
        : entityKey === 'dept'
          ? mockDeptRows
          : entityKey === 'dict'
            ? mockDictRows
            : entityKey === 'dictData'
              ? mockDictDataRows
              : [];
    const filteredRows = filterMockRows(
      rowsSource as Array<Record<string, unknown>>,
      params
    );
    const rows = filteredRows.slice(start, start + pageSize);
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      total: filteredRows.length,
      rows,
      timestamp: nowTs(),
    } as any);
  }
  return httpClient.get(
    '/system/fieldConfig/listByEntityKey/' + encodeURIComponent(entityKey),
    params
  );
};

/**
 * 根据用户 ID 查询详情（code=200，msg；data 为用户；根级可有 roleIds、roles、posts）
 */
export const getSysUserById = (
  userId: string | number
): Promise<SysUserDetailApiResponse> => {
  if (isMockEnabled()) {
    const uid = Number(userId);
    const user =
      mockUserRows.find((u) => Number(u.userId) === uid) ?? mockUserRows[0];
    return Promise.resolve({
      code: 200,
      message: 'mock',
      msg: 'mock',
      data: user,
      roleIds: (user.roles ?? []).map((r) => String(r.roleId ?? '')),
      roles: user.roles,
      posts: [],
      timestamp: nowTs(),
    } as SysUserDetailApiResponse);
  }
  return httpClient.get(
    `/system/user/${userId}`
  ) as Promise<SysUserDetailApiResponse>;
};

// ('/system/fieldConfig/orst');

export const fieldConfigSort = (data: DataStructure) => {
  return httpClient.put(
    '/system/fieldConfig/sort',
    data
  ) as Promise<SysUserDetailApiResponse>;
};

/******************************** Dict Mock 提交 ********************************/

export type MockDictDataItem = {
  dictCode?: number | string;
  dictSort?: number;
  dictLabel?: string;
  dictValue?: string;
  dictType?: string;
  color?: string;
  status?: string;
  remark?: string;
};

export type MockDictPayload = {
  dictId?: number | string;
  dictName: string;
  dictType: string;
  dictClass?: string;
  status?: string;
  remark?: string;
};

// 保存字典及字典值示例数据
export async function saveMockDictBundle(payload: {
  previousDictType?: string;
  dict: MockDictPayload;
  items: MockDictDataItem[];
}) {
  const nextDictType = String(payload.dict.dictType ?? '').trim();
  const previousDictType = String(payload.previousDictType ?? '').trim();
  const isCreate = payload.dict.dictId == null || payload.dict.dictId === '';

  if (!nextDictType) {
    throw new Error('dictType is required');
  }

  if (isCreate) {
    const nextId =
      Math.max(0, ...mockDictRows.map((item) => Number(item.dictId ?? 0))) + 1;
    mockDictRows.unshift({
      ...payload.dict,
      dictId: nextId,
      status: String(payload.dict.status ?? '0'),
      dictClass: String(payload.dict.dictClass ?? 'system'),
      createdTime: nowTs().slice(0, 19).replace('T', ' '),
    });
  } else {
    const targetIndex = mockDictRows.findIndex(
      (item) => String(item.dictId) === String(payload.dict.dictId)
    );

    if (targetIndex >= 0) {
      mockDictRows[targetIndex] = {
        ...mockDictRows[targetIndex],
        ...payload.dict,
        status: String(payload.dict.status ?? '0'),
        dictClass: String(payload.dict.dictClass ?? 'system'),
      };
    }
  }

  if (previousDictType && previousDictType !== nextDictType) {
    mockDictDataRows = mockDictDataRows.filter(
      (item) => String(item.dictType) !== previousDictType
    );
  }

  mockDictDataRows = mockDictDataRows.filter(
    (item) => String(item.dictType) !== nextDictType
  );

  const maxDictCode = Math.max(
    0,
    ...mockDictDataRows.map((item) => Number(item.dictCode ?? 0))
  );

  let dictCodeSeed = maxDictCode;
  const nextItems = payload.items.map((item, index) => {
    const rawCode = item.dictCode;
    const normalizedCode =
      rawCode == null || rawCode === ''
        ? (() => {
            dictCodeSeed += 1;
            return dictCodeSeed;
          })()
        : rawCode;

    return {
      ...item,
      dictCode: normalizedCode,
      dictSort: Number(item.dictSort ?? index + 1),
      dictType: nextDictType,
      color: String(item.color ?? '#b7ebc2'),
      status: String(item.status ?? '0'),
      remark: String(item.remark ?? ''),
    };
  });

  mockDictDataRows.push(...nextItems);

  return Promise.resolve({
    code: 200,
    msg: '操作成功',
    timestamp: nowTs(),
  } as any);
}

/**
 *
 *
 * {
  "entityKey": "user",
  "items": [
    { "id": 101, "sort": 1 },
    { "id": 102, "sort": 2 },
    { "id": 103, "sort": 3 }
  ]
}
 */
