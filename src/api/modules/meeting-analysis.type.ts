/******************************** 会议分析查询 ********************************/

export interface MeetingAnalysisQuery {
  beginTime: string;
  endTime: string;
  status: string;
  hostUserId: number | null;
}

/******************************** 会议分析响应 ********************************/

export interface MeetingAnalysisSummary {
  meetingCount: number;
  activeCount: number;
  closingCount: number;
  closedSuccessCount: number;
  closeFailedCount: number;
  participantCount: number;
  avgParticipantCount: number;
  avgDurationMinutes: number;
  longMeetingCount: number;
  transcriptCount: number;
  mergedTranscriptCount: number;
  mergedTranscriptRate: number;
  stageSummaryMeetingCount: number;
  stageSummaryCoverageRate: number;
  finalSummaryCompletenessRate: number;
  summaryGenerateRate: number;
  emptyOrMissingSummaryCount: number;
}

export interface MeetingTrendItem {
  statDate: string;
  meetingCount: number;
  participantCount: number;
}

export interface MeetingNameValueItem {
  name: string;
  value: number;
  percent: number;
}

export interface MeetingHeatmapItem {
  weekDay: string;
  hourLabel: string;
  value: number;
}

export interface MeetingSpeakerItem {
  displayName: string;
  transcriptCount: number;
  wordCount: number;
  percent: number;
}

export interface MeetingRiskItem {
  meetingId: number;
  title: string;
  hostNickName: string;
  status: string;
  participantCount: number;
  transcriptCount: number;
  riskLevel: string;
  riskText: string;
  lastTime: string;
}

export interface MeetingSummaryQualityItem {
  title: string;
  valueText: string;
  description: string;
  level: string;
}

export interface MeetingAnalysisOverview {
  query: MeetingAnalysisQuery;
  summary: MeetingAnalysisSummary;
  meetingTrend: MeetingTrendItem[];
  statusDistribution: MeetingNameValueItem[];
  timeHeatmap: MeetingHeatmapItem[];
  rtcQuality: MeetingNameValueItem[];
  speakerTop: MeetingSpeakerItem[];
  riskMeetings: MeetingRiskItem[];
  summaryQuality: MeetingSummaryQualityItem[];
}
