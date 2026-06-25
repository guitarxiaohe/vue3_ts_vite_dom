<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { watch } from 'vue';

/******************************** 类型定义 ********************************/

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    editable?: boolean;
    maxHeight?: string;
  }>(),
  {
    modelValue: '',
    placeholder: '请输入内容...',
    editable: true,
    maxHeight: '400px',
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

/******************************** 编辑器实例 ********************************/

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
    }),
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor-content',
    },
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML());
  },
});

/******************************** 同步外部值 ********************************/

watch(
  () => props.modelValue,
  (value) => {
    const isSame = editor.value?.getHTML() === value;
    if (!isSame && value !== undefined) {
      editor.value?.commands.setContent(value, { emitUpdate: false });
    }
  }
);

watch(
  () => props.editable,
  (value) => {
    editor.value?.setEditable(value);
  }
);

/******************************** 工具栏方法 ********************************/

function toggleBold() {
  editor.value?.chain().focus().toggleBold().run();
}
function toggleItalic() {
  editor.value?.chain().focus().toggleItalic().run();
}
function toggleStrike() {
  editor.value?.chain().focus().toggleStrike().run();
}
function toggleHeading(level: 1 | 2 | 3) {
  editor.value?.chain().focus().toggleHeading({ level }).run();
}
function toggleBulletList() {
  editor.value?.chain().focus().toggleBulletList().run();
}
function toggleOrderedList() {
  editor.value?.chain().focus().toggleOrderedList().run();
}
function toggleBlockquote() {
  editor.value?.chain().focus().toggleBlockquote().run();
}
function toggleCodeBlock() {
  editor.value?.chain().focus().toggleCodeBlock().run();
}
function setHorizontalRule() {
  editor.value?.chain().focus().setHorizontalRule().run();
}
function addLink() {
  const url = window.prompt('输入链接地址');
  if (url) {
    editor.value
      ?.chain()
      .focus()
      .setLink({ href: url })
      .run();
  }
}
function addImage() {
  const url = window.prompt('输入图片地址');
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run();
  }
}
function undo() {
  editor.value?.chain().focus().undo().run();
}
function redo() {
  editor.value?.chain().focus().redo().run();
}
function clearFormat() {
  editor.value?.chain().focus().clearNodes().unsetAllMarks().run();
}

const isActive = (name: string, attrs?: Record<string, unknown>) =>
  editor.value?.isActive(name, attrs) ?? false;

defineExpose({ editor, clearFormat });
</script>

<template>
  <div v-if="editor" class="tiptap-wrapper">
    <!-------------------------- 工具栏 -------------------------->
    <div
      class="tiptap-toolbar"
      @mousedown.prevent
    >
      <button
        type="button"
        :class="{ 'is-active': isActive('bold') }"
        title="加粗"
        @click="toggleBold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('italic') }"
        title="斜体"
        @click="toggleItalic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('strike') }"
        title="删除线"
        @click="toggleStrike"
      >
        <s>S</s>
      </button>

      <span class="tiptap-separator" />

      <button
        type="button"
        :class="{ 'is-active': isActive('heading', { level: 1 }) }"
        title="一级标题"
        @click="toggleHeading(1)"
      >
        H1
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('heading', { level: 2 }) }"
        title="二级标题"
        @click="toggleHeading(2)"
      >
        H2
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('heading', { level: 3 }) }"
        title="三级标题"
        @click="toggleHeading(3)"
      >
        H3
      </button>

      <span class="tiptap-separator" />

      <button
        type="button"
        :class="{ 'is-active': isActive('bulletList') }"
        title="无序列表"
        @click="toggleBulletList"
      >
        • 列表
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('orderedList') }"
        title="有序列表"
        @click="toggleOrderedList"
      >
        1. 列表
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('blockquote') }"
        title="引用"
        @click="toggleBlockquote"
      >
        ❝ 引用
      </button>
      <button
        type="button"
        :class="{ 'is-active': isActive('codeBlock') }"
        title="代码块"
        @click="toggleCodeBlock"
      >
        &lt;/&gt;
      </button>

      <span class="tiptap-separator" />

      <button type="button" title="分割线" @click="setHorizontalRule">—</button>
      <button type="button" title="插入链接" @click="addLink">🔗</button>
      <button type="button" title="插入图片" @click="addImage">🖼</button>

      <span class="tiptap-separator" />

      <button type="button" title="撤销" @click="undo">↩</button>
      <button type="button" title="重做" @click="redo">↪</button>
      <button type="button" title="清除格式" @click="clearFormat">清除格式</button>
    </div>

    <!-------------------------- 编辑区 -------------------------->
    <EditorContent :editor="editor" />
  </div>
</template>

<style scoped lang="scss">
.tiptap-wrapper {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  background: var(--el-bg-color);
}

.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    height: 28px;
    padding: 0 6px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--el-text-color-regular);
    font-size: 13px;
    cursor: pointer;
    transition:
      background 0.15s,
      color 0.15s;

    &:hover {
      background: var(--el-fill-color);
    }

    &.is-active {
      background: var(--el-color-primary-light-3);
      color: var(--el-color-primary);
    }
  }
}

.tiptap-separator {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: var(--el-border-color-light);
}

// 编辑器内容区样式（非 scoped，作用于 EditorContent 内部）
:deep(.tiptap-editor-content) {
  padding: 12px 16px;
  min-height: 120px;
  max-height: v-bind(maxHeight);
  overflow-y: auto;
  outline: none;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);

  // Placeholder
  p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: var(--el-text-color-placeholder);
    pointer-events: none;
  }

  // 标题
  h1 { font-size: 1.6em; font-weight: 700; margin: 0.8em 0 0.4em; }
  h2 { font-size: 1.3em; font-weight: 600; margin: 0.6em 0 0.3em; }
  h3 { font-size: 1.1em; font-weight: 600; margin: 0.5em 0 0.2em; }

  // 引用
  blockquote {
    border-left: 3px solid var(--el-color-primary-light-3);
    padding: 4px 12px;
    margin: 8px 0;
    color: var(--el-text-color-secondary);
  }

  // 代码块
  pre {
    background: var(--el-fill-color);
    border-radius: var(--el-border-radius-base);
    padding: 12px 16px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 13px;
    code { background: none; padding: 0; }
  }

  // 行内代码
  code {
    background: var(--el-fill-color);
    border-radius: 3px;
    padding: 1px 4px;
    font-size: 0.9em;
  }

  // 图片
  img {
    max-width: 100%;
    height: auto;
    border-radius: var(--el-border-radius-base);
    margin: 8px 0;
  }

  // 链接
  a {
    color: var(--el-color-primary);
    text-decoration: underline;
  }

  // 分割线
  hr {
    border: none;
    border-top: 1px solid var(--el-border-color-lighter);
    margin: 16px 0;
  }

  // 列表
  ul, ol {
    padding-left: 1.5em;
    margin: 4px 0;
  }
}
</style>
