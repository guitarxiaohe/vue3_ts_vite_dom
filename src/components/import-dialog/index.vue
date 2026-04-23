<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import type { UploadFile, UploadInstance } from 'element-plus';
import {
  ArrowRight,
  Check,
  Close,
  Download,
  InfoFilled,
  Plus,
  SuccessFilled,
  WarningFilled,
} from '@element-plus/icons-vue';
import type {
  ImportDialogEmits,
  ImportDialogMappingItem,
  ImportDialogMode,
  ImportDialogModeOption,
  ImportDialogParseResult,
  ImportDialogProps,
  ImportDialogStep,
  ImportDialogSubmitResult,
} from './index.type';

const props = withDefaults(defineProps<ImportDialogProps>(), {
  title: '',
  defaultMode: 'create',
  modes: undefined,
  accept: () => ['.xls', '.xlsx'],
  maxSize: 5,
  maxPreviewCount: 100,
  tips: undefined,
  resetOnClose: true,
});

const emit = defineEmits<ImportDialogEmits>();
const { t } = useI18n();

/******************************** 基础状态 ********************************/

const uploadRef = ref<UploadInstance>();
const currentStep = ref<ImportDialogStep>('upload');
const selectedMode = ref<ImportDialogMode>(props.defaultMode);
const selectedFile = ref<File | null>(null);
const displayFileName = ref<string>('');
const sheetOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedSheet = ref<string>('');
const previewColumns = ref<ImportDialogParseResult['previewColumns']>([]);
const previewRows = ref<Record<string, unknown>[]>([]);
const previewTotal = ref<number>(0);
const mappings = ref<ImportDialogMappingItem[]>([]);
const parsing = ref<boolean>(false);
const importing = ref<boolean>(false);
const progress = ref<number>(0);
const progressMessage = ref<string>('');
const result = ref<ImportDialogSubmitResult | null>(null);
const parseToken = ref<number>(0);

/******************************** 计算属性 ********************************/

// 弹窗标题
const dialogTitle = computed(() => {
  return props.title || t('components.importDialog.title');
});

// 弹窗显隐
const dialogVisible = computed<boolean>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

// 导入方式选项
const modeOptions = computed<ImportDialogModeOption[]>(() => {
  if (props.modes?.length) {
    return props.modes;
  }

  return [
    {
      label: t('components.importDialog.modeCreate'),
      value: 'create',
    },
    {
      label: t('components.importDialog.modeUpdate'),
      value: 'update',
    },
  ];
});

// 默认说明文案
const tipList = computed<string[]>(() => {
  if (props.tips?.length) {
    return props.tips;
  }

  return [
    t('components.importDialog.tipSize', { size: props.maxSize }),
    t('components.importDialog.tipHeader'),
    t('components.importDialog.tipFormula'),
    t('components.importDialog.tipArea'),
    t('components.importDialog.tipRelation'),
  ];
});

// 接受的文件后缀
const acceptText = computed<string>(() => props.accept.join(','));

// 上传区展示的文件类型
const acceptLabel = computed<string>(() => {
  return props.accept
    .map((item) => item.replace(/^\./, '').toUpperCase())
    .join('、');
});

// 当前是否在结果页
const isResultState = computed<boolean>(() => result.value !== null);

// 当前是否显示步骤条
const showSteps = computed<boolean>(() => !isResultState.value);

// 预览汇总文案
const previewSummary = computed<string>(() => {
  return t('components.importDialog.previewSummary', {
    total: previewTotal.value,
    count: Math.min(previewRows.value.length, props.maxPreviewCount),
  });
});

// 上传区文件名
const uploadFileName = computed<string>(() => {
  return displayFileName.value || selectedFile.value?.name || '';
});

// 字段映射的源列选项
const sourceColumnOptions = computed(() => {
  return previewColumns.value.map((column) => ({
    label: column.label,
    value: column.prop,
  }));
});

// 当前导入描述
const importingDescription = computed<string>(() => {
  return (
    progressMessage.value ||
    t('components.importDialog.importingProgress', {
      progress: progress.value,
    })
  );
});

// 结果页标题
const resultTitle = computed<string>(() => {
  if (!result.value) return '';
  if (result.value.title) return result.value.title;

  return result.value.success
    ? t('components.importDialog.successTitle')
    : t('components.importDialog.errorTitle');
});

// 结果页说明
const resultDescription = computed<string>(() => {
  if (!result.value) return '';
  if (result.value.description) return result.value.description;

  return result.value.success
    ? t('components.importDialog.successDescription')
    : t('components.importDialog.errorDescription');
});

// 步骤条配置
const stepItems = computed(() => {
  return [
    t('components.importDialog.stepUpload'),
    t('components.importDialog.stepPreview'),
    t('components.importDialog.stepMapping'),
    t('components.importDialog.stepImport'),
  ];
});

/******************************** 状态同步 ********************************/

// 弹窗关闭时重置内部状态
watch(
  () => props.modelValue,
  (visible, oldVisible) => {
    if (visible) {
      selectedMode.value = props.defaultMode;
      return;
    }

    if (oldVisible && props.resetOnClose) {
      resetDialogState();
    }
  }
);

/******************************** 交互方法 ********************************/

// 重置弹窗状态
function resetDialogState() {
  parseToken.value += 1;
  currentStep.value = 'upload';
  selectedFile.value = null;
  displayFileName.value = '';
  sheetOptions.value = [];
  selectedSheet.value = '';
  previewColumns.value = [];
  previewRows.value = [];
  previewTotal.value = 0;
  mappings.value = [];
  parsing.value = false;
  importing.value = false;
  progress.value = 0;
  progressMessage.value = '';
  result.value = null;
  uploadRef.value?.clearFiles();
}

// 重置解析结果
function resetParsedState() {
  sheetOptions.value = [];
  selectedSheet.value = '';
  previewColumns.value = [];
  previewRows.value = [];
  previewTotal.value = 0;
  mappings.value = [];
  result.value = null;
}

// 关闭弹窗
function closeDialog() {
  if (!isResultState.value) {
    emit('cancel');
  }
  dialogVisible.value = false;
}

// 处理模板下载
function handleDownloadTemplate() {
  emit('download-template');
}

// 校验文件
function validateFile(file: File): boolean {
  const sizeInMb = file.size / 1024 / 1024;
  if (sizeInMb > props.maxSize) {
    ElMessage.error(
      t('components.importDialog.fileSizeExceeded', {
        size: props.maxSize,
      })
    );
    return false;
  }

  if (!props.accept.length) return true;

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();
  const isAllowed = props.accept.some((acceptItem) => {
    const acceptValue = acceptItem.toLowerCase();
    if (acceptValue.startsWith('.')) {
      return fileName.endsWith(acceptValue);
    }
    return fileType === acceptValue;
  });

  if (!isAllowed) {
    ElMessage.error(
      t('components.importDialog.fileTypeInvalid', {
        types: acceptLabel.value,
      })
    );
    return false;
  }

  return true;
}

// 构建字段映射
function buildMappings(
  parsedMappings: ImportDialogParseResult['mappings']
): ImportDialogMappingItem[] {
  const parsedMap = new Map(
    (parsedMappings ?? []).map((item) => [item.targetField, item])
  );

  return props.targetFields.map((field) => {
    const currentMapping = parsedMap.get(field.field);

    return {
      targetField: field.field,
      targetLabel: currentMapping?.targetLabel || field.label,
      sourceColumn: currentMapping?.sourceColumn || '',
      required: field.required ?? false,
      duplicateCheck: currentMapping?.duplicateCheck ?? false,
      allowDuplicateCheck: field.allowDuplicateCheck ?? true,
    };
  });
}

// 应用解析结果
function applyParseResult(parseResult: ImportDialogParseResult) {
  displayFileName.value =
    parseResult.fileName || selectedFile.value?.name || '';
  sheetOptions.value = parseResult.sheets;
  selectedSheet.value =
    parseResult.currentSheet || parseResult.sheets[0]?.value || '';
  previewColumns.value = parseResult.previewColumns;
  previewRows.value = parseResult.previewRows;
  previewTotal.value = parseResult.total;
  mappings.value = buildMappings(parseResult.mappings);
}

// 执行文件解析
async function runParse(sheet?: string) {
  if (!selectedFile.value) {
    ElMessage.warning(t('components.importDialog.fileRequired'));
    return;
  }

  const currentToken = ++parseToken.value;
  parsing.value = true;

  try {
    const parseResult = await props.parseFile({
      file: selectedFile.value,
      mode: selectedMode.value,
      sheet,
    });

    if (currentToken !== parseToken.value) return;

    applyParseResult(parseResult);
    currentStep.value = 'preview';
  } catch (error) {
    if (currentToken !== parseToken.value) return;

    const message =
      error instanceof Error
        ? error.message
        : t('components.importDialog.parseError');
    ElMessage.error(message);
  } finally {
    if (currentToken === parseToken.value) {
      parsing.value = false;
    }
  }
}

// 处理文件变更
function handleUploadChange(uploadFile: UploadFile) {
  const rawFile = uploadFile.raw;
  uploadRef.value?.clearFiles();

  if (!rawFile) return;
  if (!validateFile(rawFile)) return;

  selectedFile.value = rawFile;
  displayFileName.value = rawFile.name;
  currentStep.value = 'upload';
  resetParsedState();
  emit('file-change', rawFile);
}

// 处理导入方式变更
function handleModeChange(value: ImportDialogMode) {
  selectedMode.value = value;
  resetParsedState();
  currentStep.value = 'upload';
}

// 处理 sheet 切换
async function handleSheetChange(value: string) {
  if (!value || !selectedFile.value) return;
  await runParse(value);
}

// 校验映射数据
function validateMappings(): boolean {
  if (!mappings.value.length) {
    ElMessage.warning(t('components.importDialog.mappingEmpty'));
    return false;
  }

  const requiredField = mappings.value.find(
    (item) => item.required && !item.sourceColumn
  );
  if (requiredField) {
    ElMessage.warning(
      t('components.importDialog.mappingRequired', {
        field: requiredField.targetLabel,
      })
    );
    return false;
  }

  const selectedColumns = mappings.value
    .map((item) => item.sourceColumn)
    .filter(Boolean);
  if (new Set(selectedColumns).size !== selectedColumns.length) {
    ElMessage.warning(t('components.importDialog.mappingDuplicate'));
    return false;
  }

  return true;
}

// 进入下一步
async function handleNext() {
  if (currentStep.value === 'upload') {
    await runParse();
    return;
  }

  if (currentStep.value === 'preview') {
    currentStep.value = 'mapping';
    return;
  }

  if (currentStep.value === 'mapping') {
    await handleImport();
  }
}

// 返回上一步
function handlePrevious() {
  if (currentStep.value === 'mapping') {
    currentStep.value = 'preview';
    return;
  }

  if (currentStep.value === 'preview') {
    currentStep.value = 'upload';
  }
}

// 更新导入进度
function handleProgress(nextProgress: number, message?: string) {
  progress.value = Math.max(0, Math.min(100, Math.round(nextProgress)));
  if (message) {
    progressMessage.value = message;
  }
}

// 执行导入
async function handleImport() {
  if (!selectedFile.value) {
    ElMessage.warning(t('components.importDialog.fileRequired'));
    return;
  }

  if (!selectedSheet.value) {
    ElMessage.warning(t('components.importDialog.sheetRequired'));
    return;
  }

  if (!validateMappings()) {
    return;
  }

  currentStep.value = 'importing';
  importing.value = true;
  progress.value = 8;
  progressMessage.value = t('components.importDialog.importingStart');

  try {
    const submitResult = await props.submitImport({
      file: selectedFile.value,
      mode: selectedMode.value,
      sheet: selectedSheet.value,
      mappings: mappings.value,
      onProgress: handleProgress,
    });

    progress.value = 100;
    result.value = submitResult;

    if (submitResult.success) {
      emit('success', submitResult);
    } else {
      emit('error', submitResult);
    }
  } catch (error) {
    const errorResult: ImportDialogSubmitResult = {
      success: false,
      detail:
        error instanceof Error
          ? error.message
          : t('components.importDialog.importError'),
    };

    progress.value = 100;
    result.value = errorResult;
    emit('error', error instanceof Error ? error : errorResult);
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    class="import-dialog__dialog"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="!importing"
    width="600px"
  >
    <template #header>
      <!-------------------------- 弹窗头部 -------------------------->
      <div class="import-dialog__header">
        <div class="import-dialog__title">{{ dialogTitle }}</div>
        <el-button
          text
          circle
          class="import-dialog__close"
          @click="closeDialog"
        >
          <el-icon :size="16">
            <Close />
          </el-icon>
        </el-button>
      </div>
    </template>

    <div class="import-dialog">
      <!-------------------------- 步骤条 -------------------------->
      <div v-if="showSteps" class="import-dialog__steps">
        <div
          v-for="(stepLabel, index) in stepItems"
          :key="stepLabel"
          class="import-dialog__step"
        >
          <div
            class="import-dialog__step-node"
            :class="{
              'is-active':
                (currentStep === 'upload' && index === 0) ||
                (currentStep === 'preview' && index === 1) ||
                (currentStep === 'mapping' && index === 2) ||
                (currentStep === 'importing' && index === 3),
              'is-done':
                (currentStep === 'preview' && index === 0) ||
                (currentStep === 'mapping' && index <= 1) ||
                (currentStep === 'importing' && index <= 2),
            }"
          >
            <el-icon
              v-if="
                (currentStep === 'preview' && index === 0) ||
                (currentStep === 'mapping' && index <= 1) ||
                (currentStep === 'importing' && index <= 2)
              "
            >
              <Check />
            </el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="import-dialog__step-label">{{ stepLabel }}</div>
          <div
            v-if="index !== stepItems.length - 1"
            class="import-dialog__step-line"
            :class="{
              'is-active':
                (currentStep === 'preview' && index === 0) ||
                (currentStep === 'mapping' && index <= 1) ||
                (currentStep === 'importing' && index <= 2),
            }"
          />
        </div>
      </div>

      <!-------------------------- 上传文件 -------------------------->
      <template v-if="currentStep === 'upload'">
        <div class="import-dialog__form-label">
          <span>{{ t('components.importDialog.modeLabel') }}</span>
          <el-tooltip :content="t('components.importDialog.modeHelp')">
            <el-icon class="import-dialog__info">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </div>

        <el-radio-group
          :model-value="selectedMode"
          class="import-dialog__mode-group"
          @update:model-value="handleModeChange"
        >
          <el-radio
            v-for="option in modeOptions"
            :key="option.value"
            :label="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>

        <el-upload
          ref="uploadRef"
          class="import-dialog__upload"
          drag
          :auto-upload="false"
          :show-file-list="false"
          :accept="acceptText"
          :on-change="handleUploadChange"
        >
          <div class="import-dialog__upload-inner">
            <div class="import-dialog__upload-icon">
              <el-icon :size="20">
                <Plus />
              </el-icon>
            </div>
            <div class="import-dialog__upload-title">
              {{ t('components.importDialog.uploadPlaceholder') }}
              <span class="import-dialog__upload-link">
                {{ t('components.importDialog.selectUpload') }}
              </span>
            </div>
            <div class="import-dialog__upload-subtitle">
              {{
                t('components.importDialog.supportedTypes', {
                  types: acceptLabel,
                })
              }}
            </div>
            <div v-if="uploadFileName" class="import-dialog__upload-name">
              {{ uploadFileName }}
            </div>
          </div>
        </el-upload>

        <div class="import-dialog__download">
          <el-icon :size="14">
            <Download />
          </el-icon>
          <span>{{ t('components.importDialog.templateText') }}</span>
          <button
            type="button"
            class="import-dialog__download-button"
            @click="handleDownloadTemplate"
          >
            {{ t('components.importDialog.downloadTemplate') }}
          </button>
        </div>

        <div class="import-dialog__tips">
          <div
            v-for="tip in tipList"
            :key="tip"
            class="import-dialog__tip-item"
          >
            {{ tip }}
          </div>
        </div>
      </template>

      <!-------------------------- 确认数据 -------------------------->
      <template v-else-if="currentStep === 'preview'">
        <div class="import-dialog__preview-header">
          <div class="import-dialog__preview-field">
            <div class="import-dialog__form-label">
              {{ t('components.importDialog.fileLabel') }}
            </div>
            <el-input :model-value="uploadFileName" readonly />
          </div>

          <div class="import-dialog__preview-field">
            <div class="import-dialog__form-label">
              {{ t('components.importDialog.sheetLabel') }}
            </div>
            <el-select
              v-model="selectedSheet"
              class="import-dialog__sheet-select"
              :disabled="parsing"
              @change="handleSheetChange"
            >
              <el-option
                v-for="sheet in sheetOptions"
                :key="sheet.value"
                :label="sheet.label"
                :value="sheet.value"
              />
            </el-select>
          </div>
        </div>

        <el-table
          v-loading="parsing"
          :data="previewRows"
          border
          height="352"
          class="import-dialog__table"
        >
          <el-table-column
            v-for="column in previewColumns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            :min-width="column.minWidth || 120"
            show-overflow-tooltip
          />
        </el-table>

        <div class="import-dialog__preview-summary">{{ previewSummary }}</div>
      </template>

      <!-------------------------- 字段映射 -------------------------->
      <template v-else-if="currentStep === 'mapping'">
        <div class="import-dialog__mapping-header">
          <div>{{ t('components.importDialog.mappingExcelColumn') }}</div>
          <div></div>
          <div>{{ t('components.importDialog.mappingTargetField') }}</div>
          <div>{{ t('components.importDialog.mappingDuplicateLabel') }}</div>
        </div>

        <div class="import-dialog__mapping-body">
          <div
            v-for="mapping in mappings"
            :key="mapping.targetField"
            class="import-dialog__mapping-row"
          >
            <el-select
              v-model="mapping.sourceColumn"
              clearable
              :placeholder="t('common.pleaseSelect')"
            >
              <el-option
                v-for="option in sourceColumnOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>

            <div class="import-dialog__mapping-arrow">
              <el-icon :size="18">
                <ArrowRight />
              </el-icon>
            </div>

            <div
              class="import-dialog__mapping-target"
              :class="{ 'is-required': mapping.required }"
            >
              {{ mapping.targetLabel }}
            </div>

            <div class="import-dialog__mapping-checkbox">
              <el-checkbox
                v-model="mapping.duplicateCheck"
                :disabled="!mapping.allowDuplicateCheck"
              />
            </div>
          </div>
        </div>
      </template>

      <!-------------------------- 结果态 -------------------------->
      <template v-else-if="isResultState">
        <div
          class="import-dialog__result-illustration"
          :class="{
            'is-success': result?.success,
            'is-error': !result?.success,
          }"
        >
          <div class="import-dialog__result-card">
            <div class="import-dialog__result-layer"></div>
            <div class="import-dialog__result-layer is-front"></div>
          </div>
          <div class="import-dialog__result-badge">
            <el-icon v-if="result?.success">
              <SuccessFilled />
            </el-icon>
            <el-icon v-else>
              <WarningFilled />
            </el-icon>
          </div>
        </div>

        <div class="import-dialog__result-title">{{ resultTitle }}</div>
        <div class="import-dialog__result-description">
          {{ resultDescription }}
        </div>
        <div v-if="result?.detail" class="import-dialog__result-detail">
          {{ result.detail }}
        </div>
      </template>

      <!-------------------------- 导入中 -------------------------->
      <template v-else-if="currentStep === 'importing'">
        <div class="import-dialog__progress">
          <el-progress
            :percentage="progress"
            :stroke-width="10"
            :show-text="false"
            color="var(--color-success)"
          />
          <div class="import-dialog__progress-icon">
            <el-icon color="var(--color-success)">
              <SuccessFilled />
            </el-icon>
          </div>
        </div>

        <div class="import-dialog__progress-title">
          {{ t('components.importDialog.importingTitle') }}
        </div>
        <div class="import-dialog__progress-description">
          {{ importingDescription }}
        </div>
        <div class="import-dialog__progress-hint">
          {{ t('components.importDialog.importingHint') }}
        </div>
      </template>
    </div>

    <template #footer>
      <!-------------------------- 弹窗底部 -------------------------->
      <div class="import-dialog__footer">
        <template v-if="currentStep === 'preview' || currentStep === 'mapping'">
          <el-button @click="handlePrevious">
            {{ t('components.importDialog.previous') }}
          </el-button>
          <el-button
            type="primary"
            :loading="parsing || importing"
            @click="handleNext"
          >
            {{
              currentStep === 'mapping'
                ? t('components.importDialog.startImport')
                : t('components.importDialog.next')
            }}
          </el-button>
        </template>

        <template v-else-if="currentStep === 'upload'">
          <el-button type="primary" :loading="parsing" @click="handleNext">
            {{ t('components.importDialog.next') }}
          </el-button>
        </template>

        <template v-else>
          <el-button @click="closeDialog">
            {{ t('common.close') }}
          </el-button>
        </template>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.import-dialog {
  color: var(--color-text-primary);
}

.import-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 4px;
}

.import-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.import-dialog__close {
  color: var(--color-text-secondary);
}

.import-dialog__steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 4px 12px 24px;
}

.import-dialog__step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.import-dialog__step-node {
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid #cfd5df;
  border-radius: 50%;
  background: var(--color-bg-card);
  color: #98a2b3;
  font-size: 12px;
  transition: all var(--transition-fast);
}

.import-dialog__step-node.is-active,
.import-dialog__step-node.is-done {
  border-color: #2f66f5;
  color: #2f66f5;
}

.import-dialog__step-node.is-active {
  background: #2f66f5;
  color: #ffffff;
}

.import-dialog__step-label {
  font-size: 12px;
  line-height: 18px;
  color: var(--color-text-secondary);
  text-align: center;
}

.import-dialog__step-line {
  position: absolute;
  top: 11px;
  left: calc(50% + 18px);
  width: calc(100% - 36px);
  height: 1px;
  background: #e5e7eb;
}

.import-dialog__step-line.is-active {
  background: #2f66f5;
}

.import-dialog__form-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.import-dialog__info {
  color: var(--color-text-secondary);
}

.import-dialog__mode-group {
  margin-bottom: 18px;
}

.import-dialog__upload {
  margin-bottom: 16px;
}

.import-dialog__upload :deep(.el-upload-dragger) {
  padding: 20px 24px;
  border: 1px dashed #d4d7de;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffffff 0%, #fafcff 100%);
}

.import-dialog__upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 112px;
  justify-content: center;
}

.import-dialog__upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #2f66f5;
  color: #ffffff;
  box-shadow: 0 10px 22px rgba(47, 102, 245, 0.18);
}

.import-dialog__upload-title {
  font-size: 14px;
  color: var(--color-text-primary);
}

.import-dialog__upload-link {
  margin-left: 4px;
  color: #2f66f5;
}

.import-dialog__upload-subtitle,
.import-dialog__upload-name {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.import-dialog__download {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.import-dialog__download-button {
  padding: 0;
  border: none;
  background: transparent;
  color: #2f66f5;
  cursor: pointer;
}

.import-dialog__tips {
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--color-bg-hover);
}

.import-dialog__tip-item {
  position: relative;
  padding-left: 12px;
  font-size: 12px;
  line-height: 24px;
  color: var(--color-text-secondary);
}

.import-dialog__tip-item::before {
  content: '·';
  position: absolute;
  left: 0;
}

.import-dialog__preview-header {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 16px;
  margin-bottom: 16px;
}

.import-dialog__sheet-select {
  width: 100%;
}

.import-dialog__table {
  margin-bottom: 12px;
}

.import-dialog__preview-summary {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.import-dialog__mapping-header,
.import-dialog__mapping-row {
  display: grid;
  grid-template-columns: 1fr 36px 1fr 96px;
  gap: 14px;
  align-items: center;
}

.import-dialog__mapping-header {
  padding: 0 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.import-dialog__mapping-body {
  max-height: 328px;
  overflow-y: auto;
  padding-right: 6px;
}

.import-dialog__mapping-row {
  padding: 0 8px;
  margin-bottom: 12px;
}

.import-dialog__mapping-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2f66f5;
}

.import-dialog__mapping-target {
  display: flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  font-size: 13px;
}

.import-dialog__mapping-target.is-required::before {
  content: '*';
  margin-right: 4px;
  color: var(--color-danger);
}

.import-dialog__mapping-checkbox {
  display: flex;
  justify-content: center;
}

.import-dialog__progress {
  position: relative;
  margin: 32px 32px 18px;
}

.import-dialog__progress-icon {
  position: absolute;
  top: -2px;
  right: -20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.import-dialog__progress-title,
.import-dialog__result-title {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
}

.import-dialog__progress-description,
.import-dialog__progress-hint,
.import-dialog__result-description,
.import-dialog__result-detail {
  text-align: center;
  font-size: 13px;
  line-height: 22px;
  color: var(--color-text-secondary);
}

.import-dialog__progress-hint {
  margin-top: 8px;
}

.import-dialog__result-illustration {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 132px;
  margin: 0 auto 18px;
}

.import-dialog__result-card {
  position: relative;
  width: 88px;
  height: 72px;
}

.import-dialog__result-layer {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: linear-gradient(180deg, #eff4ff 0%, #88a9ff 40%, #2f66f5 100%);
  opacity: 0.65;
  transform: translateY(-10px) scale(0.92);
}

.import-dialog__result-layer.is-front {
  opacity: 1;
  transform: translateY(0) scale(1);
  box-shadow: 0 18px 30px rgba(47, 102, 245, 0.2);
}

.import-dialog__result-badge {
  position: absolute;
  right: 44px;
  bottom: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  font-size: 20px;
}

.import-dialog__result-illustration.is-success .import-dialog__result-badge {
  color: var(--color-success);
}

.import-dialog__result-illustration.is-error .import-dialog__result-badge {
  color: var(--color-danger);
}

.import-dialog__result-detail {
  margin-top: 6px;
}

.import-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.import-dialog__dialog :deep(.el-dialog) {
  border-radius: 12px;
  background: var(--color-bg-card);
}

.import-dialog__dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding: 22px 24px 12px;
}

.import-dialog__dialog :deep(.el-dialog__body) {
  padding: 4px 24px 20px;
}

.import-dialog__dialog :deep(.el-dialog__footer) {
  padding: 0 24px 24px;
}

[data-theme='dark'] .import-dialog__upload :deep(.el-upload-dragger),
html.dark .import-dialog__upload :deep(.el-upload-dragger) {
  background: linear-gradient(180deg, rgba(31, 41, 55, 0.88) 0%, #1f2937 100%);
}
</style>
