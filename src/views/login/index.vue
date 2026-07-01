<template>
  <div class="login-container">
    <!-- 右侧登录区 -->
    <div class="login-right">
      <div class="login-form-wrapper">
        <!-- 移动端 Logo -->
        <div class="mobile-logo">
          <div class="logo-icon">
            <Sparkles :size="16" />
          </div>
          <span>YourBrand</span>
        </div>

        <!-- 标题 -->
        <div class="form-header">
          <h1>
            {{
              isRegisterMode ? t('login.createAccount') : t('login.welcomeBack')
            }}
          </h1>
          <p>
            {{
              isRegisterMode
                ? t('login.enterRegisterDetails')
                : t('login.enterDetails')
            }}
          </p>
        </div>

        <!-------------------------- 登录注册切换 -------------------------->
        <div class="mode-switch">
          <button
            type="button"
            class="mode-btn"
            :class="{ active: !isRegisterMode }"
            @click="switchMode('login')"
          >
            {{ t('login.logIn') }}
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ active: isRegisterMode }"
            @click="switchMode('register')"
          >
            {{ t('login.register') }}
          </button>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-field">
            <label>{{ t('login.account') }}</label>
            <input
              v-model="formData.username"
              type="text"
              :placeholder="t('login.username')"
              autocomplete="off"
            />
          </div>

          <div class="form-field">
            <label>{{ t('user.password') }}</label>
            <div class="password-input">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="t('login.passwordPlaceholder')"
                required
              />
              <button type="button" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" :size="20" />
                <Eye v-else :size="20" />
              </button>
            </div>
          </div>

          <!-------------------------- 注册验证码 -------------------------->
          <div
            v-if="isRegisterMode && captchaState.captchaOnOff"
            class="form-field captcha-field"
          >
            <label>{{ t('login.captcha') }}</label>
            <div class="captcha-row">
              <input
                v-model="formData.code"
                type="text"
                :placeholder="t('login.captchaPlaceholder')"
                autocomplete="off"
              />
              <button
                type="button"
                class="captcha-image-btn"
                @click="loadCaptcha"
              >
                <img
                  v-if="captchaImageSrc"
                  :src="captchaImageSrc"
                  :alt="t('login.refreshCaptcha')"
                />
                <span v-else>{{ t('login.refreshCaptcha') }}</span>
              </button>
            </div>
          </div>

          <div v-if="!isRegisterMode" class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              <span>{{ t('login.rememberFor30Days') }}</span>
            </label>
            <button type="button" class="forgot-link">
              {{ t('user.forgotPassword') }}
            </button>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{
              isLoading
                ? isRegisterMode
                  ? t('login.signUpLoading')
                  : t('login.signIn')
                : isRegisterMode
                  ? t('login.register')
                  : t('login.logIn')
            }}
          </button>
        </form>

        <!-- 社交登录 -->
        <div v-if="!isRegisterMode" class="social-login">
          <button type="button" class="google-btn">
            <Mail :size="20" />
            {{ t('login.loginWithGoogle') }}
          </button>
        </div>

        <!-- 注册链接 -->
        <div class="signup-link">
          <button
            type="button"
            class="switch-link"
            @click="switchMode(nextMode)"
          >
            {{
              isRegisterMode
                ? t('login.switchToLogin')
                : t('login.switchToRegister')
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Sparkles, Eye, EyeOff, Mail } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useUserStore } from '@/stores';
import { getCaptchaImage } from '@/api/modules/user';
import router from '@/router';
import type { CaptchaImageResponse } from '@/types/user';

const { t } = useI18n();
const userStore = useUserStore();
const route = useRoute();

type AuthMode = 'login' | 'register';

// 响应式数据
const authMode = ref<AuthMode>('login');
const showPassword = ref(false);
const formData = ref({
  username: '',
  password: '',
  code: '',
  uuid: '',
});
const error = ref('');
const isLoading = ref(false);
const rememberMe = ref(false);
const captchaState = ref<CaptchaImageResponse>({
  code: 200,
  captchaOnOff: true,
  uuid: '',
  img: '',
});
const isRegisterMode = computed(() => authMode.value === 'register');
const nextMode = computed<AuthMode>(() =>
  isRegisterMode.value ? 'login' : 'register'
);
const captchaImageSrc = computed(() =>
  captchaState.value.img
    ? `data:image/jpeg;base64,${captchaState.value.img}`
    : ''
);
const loginRedirectTarget = computed(() => {
  const redirect = route.query.redirect;
  if (Array.isArray(redirect)) {
    return redirect[0] || '/index';
  }
  return redirect || '/index';
});

/******************************** 表单逻辑 ********************************/

const navigateAfterAuthSuccess = () => {
  void router.push(loginRedirectTarget.value);
};

// 切换模式
const switchMode = async (mode: AuthMode) => {
  if (authMode.value === mode) {
    return;
  }
  authMode.value = mode;
  error.value = '';
  showPassword.value = false;
  formData.value.password = '';
  formData.value.code = '';
  formData.value.uuid = '';
  if (mode === 'register') {
    await loadCaptcha();
  }
};

// 加载验证码
const loadCaptcha = async () => {
  try {
    const response = await getCaptchaImage();
    captchaState.value = {
      code: response.code,
      captchaOnOff: Boolean(response.captchaOnOff),
      uuid: response.uuid || '',
      img: response.img || '',
      msg: response.msg,
    };
    formData.value.code = '';
    formData.value.uuid = response.uuid || '';
  } catch (err) {
    captchaState.value = {
      code: 500,
      captchaOnOff: false,
      uuid: '',
      img: '',
    };
  }
};

// 提交注册
const handleRegister = async () => {
  if (
    captchaState.value.captchaOnOff &&
    (!formData.value.code.trim() || !formData.value.uuid)
  ) {
    error.value = t('login.captchaPlaceholder');
    return false;
  }
  const username = formData.value.username.trim();
  const password = formData.value.password;
  const result = await userStore.registerAction({
    username,
    password,
    code: formData.value.code.trim(),
    uuid: formData.value.uuid,
  });
  if (!result.ok) {
    error.value = result.msg;
    await loadCaptcha();
    return false;
  }
  const success = await userStore.loginAction({
    username,
    password,
  });
  if (!success) {
    error.value = t('login.loginFailed');
    await loadCaptcha();
    return false;
  }
  return true;
};

// 表单提交
const handleSubmit = async () => {
  error.value = '';
  isLoading.value = true;
  try {
    if (isRegisterMode.value) {
      const success = await handleRegister();
      if (success) {
        navigateAfterAuthSuccess();
      }
      return;
    }
    userStore.logout();
    const success = await userStore.loginAction({
      username: formData.value.username.trim(),
      password: formData.value.password,
    });
    if (success) {
      navigateAfterAuthSuccess();
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// 右侧样式
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--color-bg-page);

  .login-form-wrapper {
    width: 100%;
    max-width: 420px;

    .mobile-logo {
      display: none;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 3rem;
      color: var(--color-text-primary);

      @media (max-width: 1024px) {
        display: flex;
      }

      .logo-icon {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        background: var(--color-primary-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      span {
        font-weight: 600;
      }
    }

    .form-header {
      text-align: center;
      margin-bottom: 2.5rem;

      h1 {
        font-size: 1.875rem;
        font-weight: 700;
        letter-spacing: -0.025em;
        margin-bottom: 0.5rem;
        color: var(--color-text-primary);
      }

      p {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        input {
          height: 3rem;
          padding: 0 1rem;
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          background: var(--color-bg-card);
          color: var(--color-text-primary);
          font-size: 0.875rem;
          transition: all 0.2s;

          &::placeholder {
            color: var(--color-text-placeholder);
          }

          &:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 2px var(--color-primary-bg);
          }
        }

        .password-input {
          position: relative;

          input {
            width: 100%;
            padding-right: 2.5rem;
          }

          button {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--color-text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
              color: var(--color-text-primary);
            }
          }
        }

        .captcha-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 8.5rem;
          gap: 0.75rem;
          align-items: center;
        }

        .captcha-image-btn {
          height: 3rem;
          border: 1px solid var(--color-border);
          border-radius: 0.5rem;
          background: var(--color-bg-card);
          padding: 0;
          overflow: hidden;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            transform 0.2s ease;

          &:hover {
            border-color: var(--color-primary);
            transform: translateY(-1px);
          }

          img,
          span {
            width: 100%;
            height: 100%;
            display: block;
          }

          span {
            line-height: 3rem;
            text-align: center;
            color: var(--color-text-secondary);
            font-size: 0.8125rem;
          }
        }
      }

      .form-options {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;

          input {
            width: 1rem;
            height: 1rem;
            cursor: pointer;
            accent-color: var(--color-primary);
          }

          span {
            font-size: 0.875rem;
            color: var(--color-text-secondary);
          }
        }

        .forgot-link {
          font-size: 0.875rem;
          color: var(--color-primary);
          background: none;
          border: none;
          padding: 0;
          font-weight: 500;
          cursor: pointer;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .error-message {
        padding: 0.75rem;
        font-size: 0.875rem;
        color: var(--color-danger);
        background: var(--color-danger-light, rgba(248, 113, 113, 0.1));
        border: 1px solid var(--color-danger-light, rgba(248, 113, 113, 0.2));
        border-radius: 0.5rem;
      }

      .login-btn {
        width: 100%;
        height: 3rem;
        background: var(--color-primary);
        color: #fff;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;

        &:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }

    .mode-switch {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      .mode-btn {
        height: 2.75rem;
        border-radius: 0.75rem;
        border: 1px solid var(--color-border);
        background: var(--color-bg-card);
        color: var(--color-text-secondary);
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: var(--color-primary);
          color: var(--color-text-primary);
        }

        &.active {
          border-color: transparent;
          background: linear-gradient(
            135deg,
            var(--color-primary),
            var(--color-primary-dark)
          );
          color: #fff;
          box-shadow: 0 10px 24px rgba(108, 63, 245, 0.2);
        }
      }
    }

    .social-login {
      margin-top: 1.5rem;

      .google-btn {
        width: 100%;
        height: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--color-bg-hover);
        }
      }
    }

    .signup-link {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: var(--color-text-secondary);

      .switch-link {
        background: none;
        border: none;
        padding: 0;
        color: var(--color-text-primary);
        font-weight: 500;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
          color: var(--color-primary);
        }
      }
    }
  }
}
</style>
