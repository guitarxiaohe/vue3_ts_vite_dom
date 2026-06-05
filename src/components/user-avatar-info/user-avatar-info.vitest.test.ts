import { createPinia } from 'pinia';
import { renderToString } from 'vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query';
import { describe, expect, test } from 'vitest';

import UserAvatarInfo from './index.vue';
import { i18n } from '@/i18n';

/******************************** 用户头像显示测试 ********************************/

async function renderUserAvatarInfo(props: Record<string, unknown>) {
  const app = createSSRApp({
    render: () => h(UserAvatarInfo, props),
  });

  app.use(createPinia());
  app.use(i18n);
  app.use(VueQueryPlugin, {
    queryClient: new QueryClient(),
  });

  return renderToString(app);
}

describe('user-avatar-info display name', () => {
  test('should prefer nickName over account name', async () => {
    const html = await renderUserAvatarInfo({
      name: 'admin',
      nickName: '管理员',
      deptName: '技术部门',
      enableDrawer: false,
    });

    expect(html).toContain('管理员');
    expect(html).not.toContain('>admin<');
  });
});
