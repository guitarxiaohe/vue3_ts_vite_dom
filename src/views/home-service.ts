import { httpClient } from '@/api/client';

/** 首页展示用的项目数据结构 */
export interface ProjectTimelineItem {
  projectId?: number;
  projectName?: string;
  projectYear?: string;
  projectType?: string;
  projectAddress?: string;
  companyName?: string;
  images?: string;
  remark?: string;
  [key: string]: unknown;
}

/** 后端分页列表响应体 */
interface ListResponse {
  total?: number;
  rows?: ProjectTimelineItem[];
  data?: {
    total?: number;
    rows?: ProjectTimelineItem[];
  };
}

/**
 * 拉取项目配置列表（首页专用，不分页，按 projectYear 降序排列）
 * 复用动态实体通用接口，不新增后端 API。
 */
export async function fetchProjectTimeline(): Promise<ProjectTimelineItem[]> {
  const response = await httpClient.get<ListResponse>(
    '/system/fieldConfig/listByEntityKey/projectConfig',
    {
      pageNum: 1,
      pageSize: 9999,
    }
  );
  const rows = response.data?.rows ?? response.data?.data?.rows ?? [];
  console.log(
    'response ==>',
    rows.map((item: ProjectTimelineItem) => ({
      ...item,
      projectYear:
        item.projectYear != null ? String(item.projectYear) : undefined,
    }))
  );

  return rows.map((item: ProjectTimelineItem) => ({
    ...item,
    projectYear:
      item.projectYear != null ? String(item.projectYear) : undefined,
  }));
}
