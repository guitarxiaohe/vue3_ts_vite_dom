<script setup lang="ts">
import { computed } from 'vue';

/******************************** AI 客服配置使用手册弹窗 ********************************/

/** 手册类型 */
export type ManualType =
  | 'chatRule'
  | 'chatPrompt'
  | 'chatKnowledge'
  | 'chatCategory';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** 手册类型，决定弹窗标题和主体内容 */
    type?: ManualType;
  }>(),
  { type: 'chatRule' }
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

function close() {
  visible.value = false;
}

/******************************** 按类型切换标题 ********************************/

const titleMap: Record<ManualType, string> = {
  chatRule: '如何新增规则 — AI 客服配置使用手册',
  chatPrompt: '如何新增提示词 — AI 客服配置使用手册',
  chatKnowledge: '如何新增知识库 — AI 客服配置使用手册',
  chatCategory: '如何维护分类 — AI 客服配置使用手册',
};

const dialogTitle = computed(() => titleMap[props.type]);
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="780px"
    top="3vh"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="manual-scroll">
      <!-- ==================== chat_category：分类维护 ==================== -->
      <template v-if="type === 'chatCategory'">
        <section class="manual-section highlight-section">
          <h3><span class="section-badge">分类</span> 分类字段说明</h3>
          <el-table :data="categoryFields" size="small" border>
            <el-table-column prop="field" label="字段" width="130" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
          <h4 style="margin-top: 16px">推荐基础分类</h4>
          <el-table :data="categories" size="small" border>
            <el-table-column prop="code" label="编码" width="100" />
            <el-table-column prop="name" label="名称" width="80" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
          <p class="tip">
            分类用于把规则、提示词、知识库串起来。<b
              >建议先维护分类，再配置规则/提示词/知识库。</b
            >
          </p>
        </section>
      </template>

      <!-- ==================== chat_rule：规则维护 ==================== -->
      <template v-else-if="type === 'chatRule'">
        <section class="manual-section highlight-section">
          <h3><span class="section-badge">规则</span> 规则字段说明</h3>
          <el-table :data="ruleFields" size="small" border>
            <el-table-column prop="field" label="字段" width="130" />
            <el-table-column prop="desc" label="说明" />
          </el-table>

          <h4 style="margin-top: 16px">match_type 匹配方式</h4>
          <el-table :data="matchTypes" size="small" border>
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="desc" label="说明" />
          </el-table>

          <h4 style="margin-top: 16px">action_type 动作类型</h4>
          <el-table :data="actionTypes" size="small" border>
            <el-table-column prop="type" label="类型" width="140" />
            <el-table-column prop="desc" label="说明" />
          </el-table>

          <h4 style="margin-top: 16px">优先级建议</h4>
          <el-table :data="priorityRanges" size="small" border>
            <el-table-column prop="range" label="范围" width="120" />
            <el-table-column prop="desc" label="适用场景" />
          </el-table>
        </section>
      </template>

      <!-- ==================== chat_prompt：提示词维护 ==================== -->
      <template v-else-if="type === 'chatPrompt'">
        <section class="manual-section highlight-section">
          <h3><span class="section-badge">提示词</span> 提示词字段说明</h3>
          <el-table :data="promptFields" size="small" border>
            <el-table-column prop="field" label="字段" width="120" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
          <p class="tip" style="margin-top: 12px">
            提示词用于约束 AI
            <b>怎么回答</b>（语气、格式、规范），不是事实内容。
          </p>
          <h4 style="margin-top: 16px">推荐提示词示例</h4>
          <el-table :data="promptExamples" size="small" border>
            <el-table-column prop="name" label="名称" width="140" />
            <el-table-column prop="category" label="分类" width="80" />
            <el-table-column prop="content" label="内容" />
          </el-table>
        </section>
      </template>

      <!-- ==================== chat_knowledge：知识库维护 ==================== -->
      <template v-else-if="type === 'chatKnowledge'">
        <section class="manual-section highlight-section">
          <h3><span class="section-badge">知识库</span> 知识库字段说明</h3>
          <el-table :data="knowledgeFields" size="small" border>
            <el-table-column prop="field" label="字段" width="120" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="desc" label="说明" />
          </el-table>
          <p class="tip" style="margin-top: 12px">
            知识库用于给 AI
            提供<b>事实依据</b>。<b>一条只解决一个问题</b>，不要堆砌。
          </p>
          <h4 style="margin-top: 16px">推荐知识库示例</h4>
          <el-table :data="knowledgeExamples" size="small" border>
            <el-table-column prop="title" label="标题" width="130" />
            <el-table-column prop="question" label="典型问题" width="160" />
            <el-table-column prop="answer" label="标准答案" />
          </el-table>
        </section>
      </template>

      <!-- ==================== 通用章节 ==================== -->

      <!-- 客服链路 -->
      <section class="manual-section">
        <h3>当前客服链路</h3>
        <pre class="flow-block">
用户提问
  ↓ WebSocket /ws/chat/assistant
后端 ChatAssistantServiceImpl.ask()
  ↓ 优先匹配 chat_rule 规则
规则命中 → 执行固定回答 / 商品查询 / 价格查询 / 跳转 / 转人工
规则未命中 → AI 分析意图 → 后端按意图查询 → AI 生成回答</pre
        >
        <p class="tip">
          核心原则：<b
            >确定问题走规则，事实内容进知识库，回答风格靠提示词，数据查询由后端执行，AI
            只负责分析意图和组织回答。</b
          >
        </p>
      </section>

      <!-- 三类配置区别 -->
      <section class="manual-section">
        <h3>三类配置怎么区分</h3>
        <el-table :data="configTypes" size="small" border>
          <el-table-column prop="type" label="配置" width="130" />
          <el-table-column prop="desc" label="用途" />
          <el-table-column prop="when" label="判断标准" />
        </el-table>
      </section>

      <!-- 推荐配置顺序 -->
      <section class="manual-section">
        <h3>推荐配置顺序</h3>
        <ol class="ordered-list">
          <li :class="{ current: type === 'chatCategory' }">
            维护分类 <code>chat_category</code>
          </li>
          <li :class="{ current: type === 'chatPrompt' }">
            维护通用提示词 <code>chat_prompt</code>
          </li>
          <li :class="{ current: type === 'chatRule' }">
            维护高频规则 <code>chat_rule</code>
          </li>
          <li :class="{ current: type === 'chatKnowledge' }">
            维护知识库 <code>chat_knowledge</code>
          </li>
          <li>测试用户提问</li>
          <li>根据未命中问题补规则或知识库</li>
        </ol>
      </section>

      <!-- AI 兜底 -->
      <section class="manual-section">
        <h3>AI 数据驱动兜底</h3>
        <p>规则未命中时，AI 输出结构化计划，后端只接受白名单工具：</p>
        <p class="tool-tags">
          <el-tag size="small" type="info">NONE</el-tag>
          <el-tag size="small" type="primary">KNOWLEDGE</el-tag>
          <el-tag size="small" type="success">PRODUCT_SEARCH</el-tag>
          <el-tag size="small" type="warning">PRICE_QUERY</el-tag>
        </p>
        <p class="tip">
          AI
          不能直接查数据库或调用任意接口，只能告诉后端它想查什么，后端校验后再执行。
        </p>
      </section>

      <!-- 维护建议 -->
      <section class="manual-section">
        <h3>维护建议</h3>
        <ul class="bullet-list">
          <li>规则少而准，高频问题优先做规则</li>
          <li>提示词按分类维护，知识库一条只解决一个问题</li>
          <li>不确定问题放知识库给 AI 兜底</li>
        </ul>
        <p style="margin-top: 8px"><b>排查顺序：</b></p>
        <ol class="ordered-list">
          <li>问题是否命中规则</li>
          <li>规则 priority 是否太靠后</li>
          <li>规则 status 是否为 1（启用）</li>
          <li>分类是否存在且启用</li>
          <li>提示词 status 是否为 1</li>
          <li>知识库 keywords 是否能召回</li>
        </ol>
      </section>
    </div>

    <template #footer>
      <el-button type="primary" @click="close">知道了</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.manual-scroll {
  max-height: 82vh;
  overflow-y: auto;
  padding-right: 4px;
}

.manual-section {
  margin-bottom: 20px;
}

.manual-section h3 {
  font-size: 15px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 6px;
  margin-bottom: 10px;
}

.manual-section h4 {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

/* 当前类型高亮章节 */
.highlight-section {
  background: #fafbfc;
  border: 1px solid #d9ecff;
  border-left: 4px solid #409eff;
  border-radius: 6px;
  padding: 14px 16px;
}

.highlight-section h3 {
  border-bottom-color: #d9ecff;
}

.section-badge {
  display: inline-block;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 3px;
  margin-right: 6px;
  vertical-align: middle;
}

.flow-block {
  background: #f5f7fa;
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 13px;
  line-height: 1.8;
  color: #303133;
  white-space: pre;
  margin: 0;
}

.tip {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  margin: 8px 0 0;
}

.ordered-list {
  padding-left: 20px;
  line-height: 2;
  font-size: 13px;
  color: #606266;
  margin: 4px 0;
}

.ordered-list code {
  background: #f0f2f5;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.ordered-list li.current {
  color: #409eff;
  font-weight: 600;
}

.ordered-list li.current code {
  background: #ecf5ff;
  color: #409eff;
}

.bullet-list {
  padding-left: 20px;
  line-height: 2;
  font-size: 13px;
  color: #606266;
  margin: 4px 0;
}

.tool-tags {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}
</style>

<script lang="ts">
/******************************** 静态数据 ********************************/

const configTypes = [
  {
    type: '规则 chat_rule',
    desc: '适合 100% 确定怎么处理的问题：固定回答、商品查询、价格查询、SKU 查询、跳转页面、转人工、敏感问题固定话术',
    when: '只要命中关键词或正则，就能确定动作 → 加规则',
  },
  {
    type: '提示词 chat_prompt',
    desc: '用于约束 AI 怎么回答：客服语气、回答格式、禁止编造、商品/价格/售后回答规范',
    when: '不是事实，而是回答要求 → 加提示词',
  },
  {
    type: '知识库 chat_knowledge',
    desc: '用于给 AI 提供事实依据：售后政策、物流说明、支付方式、退换货、联系方式、公司介绍、商品 FAQ',
    when: '这是客服需要知道的事实内容 → 加知识库',
  },
];

const categories = [
  { code: 'GENERAL', name: '通用', desc: '通用问题' },
  { code: 'PRODUCT', name: '商品', desc: '商品信息、型号、SKU、产品查询' },
  { code: 'PRICE', name: '价格', desc: '商品价格、报价、多少钱' },
  { code: 'PROMPT', name: '提示词', desc: '提示词 / 配置' },
  { code: 'AFTERSALE', name: '售后', desc: '售后问题' },
  { code: 'SHIPPING', name: '物流', desc: '物流、配送' },
];

/********** chat_category **********/

const categoryFields = [
  {
    field: 'categoryCode',
    type: 'String',
    desc: '分类编码，唯一标识，如 PRODUCT、PRICE',
  },
  { field: 'categoryName', type: 'String', desc: '分类名称，如 商品、价格' },
  { field: 'description', type: 'String', desc: '分类描述' },
  {
    field: 'keywords',
    type: 'String',
    desc: '关键词，逗号分隔，如 商品,产品,型号',
  },
  { field: 'sort', type: 'Number', desc: '排序，越小越靠前' },
  { field: 'status', type: 'String', desc: '0 禁用，1 启用' },
];

/********** chat_rule **********/

const ruleFields = [
  { field: 'ruleCode', desc: '规则编码，唯一标识' },
  { field: 'ruleName', desc: '规则名称' },
  { field: 'category', desc: '命中后的分类，关联 chat_category.category_code' },
  { field: 'matchType', desc: '匹配方式：KEYWORD / REGEX / INTENT' },
  { field: 'matchPattern', desc: '匹配内容，关键词逗号分隔，或正则表达式' },
  { field: 'priority', desc: '优先级，越小越先执行' },
  {
    field: 'actionType',
    desc: '动作类型：ANSWER / PRODUCT_SEARCH / PRICE_QUERY / ASK_REDIRECT / REDIRECT / HANDOFF',
  },
  { field: 'actionConfig', desc: '动作配置 JSON，如跳转链接等' },
  { field: 'answerTemplate', desc: '固定回答模板，actionType=ANSWER 时使用' },
  { field: 'status', desc: '0 禁用，1 启用，2 AI生成' },
];

const matchTypes = [
  { type: 'KEYWORD', desc: '用户问题包含任意关键词即命中' },
  { type: 'REGEX', desc: '用正则匹配，适合 SKU、邮箱、手机号等固定格式' },
  { type: 'INTENT', desc: '根据请求分类匹配，目前主要作为扩展' },
];

const actionTypes = [
  { type: 'ANSWER', desc: '直接返回 answer_template 固定回答' },
  { type: 'PRODUCT_SEARCH', desc: '调商品搜索接口，返回商品卡片' },
  { type: 'PRICE_QUERY', desc: '调商品接口，返回价格回答' },
  { type: 'ASK_REDIRECT', desc: '询问用户是否跳转' },
  { type: 'REDIRECT', desc: '直接返回 redirectUrl 跳转' },
  { type: 'HANDOFF', desc: '转人工话术' },
];

const priorityRanges = [
  { range: '1 ~ 50', desc: '精准规则：SKU、特殊固定问答' },
  { range: '51 ~ 199', desc: '商品、价格、跳转' },
  { range: '200 ~ 499', desc: '分类通用规则' },
  { range: '900+', desc: '兜底规则' },
];

/********** chat_prompt **********/

const promptFields = [
  { field: 'name', type: 'String', desc: '提示词名称，如 通用客服规范' },
  { field: 'description', type: 'String', desc: '提示词描述' },
  { field: 'content', type: 'Text', desc: '提示词内容，AI 回答时遵循的规范' },
  {
    field: 'category',
    type: 'String',
    desc: '分类，关联 chat_category.category_code',
  },
  { field: 'tags', type: 'String', desc: '标签，逗号分隔' },
  { field: 'status', type: 'String', desc: '0 禁用，1 启用' },
];

const promptExamples = [
  {
    name: '通用客服规范',
    category: 'GENERAL',
    content:
      '你是 Elebee 的 AI 客服。回答要简洁、礼貌、直接。不确定时说明需要人工确认。不要编造商品、价格、库存、链接或政策。',
  },
  {
    name: '商品咨询回答规范',
    category: 'PRODUCT',
    content:
      '当用户咨询商品时，只能基于后端返回的商品数据回答。商品图片、价格、链接由前端商品卡片展示，文字只做简短总结。',
  },
  {
    name: '价格咨询回答规范',
    category: 'PRICE',
    content:
      '当用户咨询价格时，只能使用后端商品接口返回的价格字段。没有价格时说明暂未查询到价格，不要估价。',
  },
];

/********** chat_knowledge **********/

const knowledgeFields = [
  { field: 'title', type: 'String', desc: '知识标题' },
  { field: 'question', type: 'String', desc: '典型问题，用于匹配用户提问' },
  { field: 'answer', type: 'Text', desc: '标准答案' },
  {
    field: 'category',
    type: 'String',
    desc: '分类，关联 chat_category.category_code',
  },
  { field: 'scene', type: 'String', desc: '场景，可为空' },
  {
    field: 'keywords',
    type: 'String',
    desc: '关键词，多个用逗号分隔，用于召回',
  },
  { field: 'sort', type: 'Number', desc: '排序，越小越靠前' },
  { field: 'status', type: 'String', desc: '0 禁用，1 启用' },
];

const knowledgeExamples = [
  {
    title: '人工客服联系方式',
    question: '如何联系人工客服？',
    answer: '可以联系人工客服微信号：XiaoheGuitar。',
  },
  {
    title: '售后处理说明',
    question: '商品有问题怎么办？',
    answer:
      '如果商品出现质量问题，请提供订单号、商品图片和问题描述，客服会协助确认售后方案。',
  },
];
</script>
