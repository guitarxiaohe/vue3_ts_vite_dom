/**
 * 环境相关Logo配置
 *
 * 根据不同环境显示不同Logo
 */

import devLogo from '@/assets/images/dev-logo.svg';
import prodLogo from '@/assets/images/prod-logo.svg';
import testLogo from '@/assets/images/test-logo.svg';
import prevLogo from '@/assets/images/prev-logo.svg';

interface LogoConfig {
  logoPath: string;
}

// 定义不同环境的Logo配置
const envLogoConfigs: Record<string, LogoConfig> = {
  development: {
    logoPath: devLogo, // 开发环境Logo
  },
  production: {
    logoPath: prodLogo, // 生产环境Logo
  },
  test: {
    logoPath: testLogo, // 测试环境Logo
  },
  preview: {
    logoPath: prevLogo, // 预发布环境Logo
  },
};

// 获取当前环境的Logo配置
export const getEnvLogoConfig = (): LogoConfig => {
  // 从Vite环境变量获取当前环境
  const env = import.meta.env.MODE || 'production';

  // 返回对应环境的配置，如果不存在则返回开发环境配置作为默认
  return envLogoConfigs[env] || envLogoConfigs.production;
};

// 获取当前环境Logo路径
export const getEnvLogoPath = (): string => {
  return getEnvLogoConfig().logoPath;
};
