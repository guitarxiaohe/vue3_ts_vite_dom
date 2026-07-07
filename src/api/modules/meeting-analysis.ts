import { httpClient } from '../client';
import type {
  MeetingAnalysisOverview,
  MeetingAnalysisQuery,
} from './meeting-analysis.type';

/******************************** 接口方法 ********************************/

// 查询会议分析总览
export function getMeetingAnalysisOverviewApi(params: MeetingAnalysisQuery) {
  return httpClient.get<MeetingAnalysisOverview>(
    '/cms/meeting/analysis/overview',
    params
  );
}
