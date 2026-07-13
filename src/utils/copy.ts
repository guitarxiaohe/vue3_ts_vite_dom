export function copyText(text: string) {
  // 1. 优先使用现代 API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard
      .writeText(text)
      .then(() => {
        // 这里可以触发 UI 提示（如 Toast）
        console.log('复制成功');
      })
      .catch((err) => {
        // 如果发生权限错误或未在 HTTPS 下，降级处理
        console.warn('新版 API 失败，尝试降级', err);
        fallbackCopy(text);
      });
  } else {
    // 2. 直接降级
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();

  try {
    const result = document.execCommand('copy');
    if (result) console.log('降级复制成功');
    else console.warn('降级复制失败');
  } catch (e) {
    console.error('降级复制异常', e);
  }

  document.body.removeChild(textarea);
}
