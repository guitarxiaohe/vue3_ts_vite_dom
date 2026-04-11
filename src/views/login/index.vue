<template>
  <div class="login-container">
    <!-- 左侧内容区 -->
    <div class="login-left">
      <div class="left-content">
        <div class="logo-area">
          <div class="logo-icon">
            <Sparkles :size="16" />
          </div>
          <span>YourBrand</span>
        </div>

        <!-- 卡通角色区 -->
        <div class="characters-area">
          <div class="characters-wrapper">
            <!-- 紫色高个角色 - 背景层 -->
            <div
              ref="purpleRef"
              class="character-purple"
              :class="{
                'typing-active':
                  isTyping || (formData.password.length > 0 && !showPassword),
                'password-visible':
                  formData.password.length > 0 && showPassword,
              }"
              :style="{
                transform: getCharacterTransform('purple'),
                height: getCharacterHeight(),
              }"
            >
              <div
                class="eyes-wrapper"
                :style="{
                  left: getEyesPosition('purple').left,
                  top: getEyesPosition('purple').top,
                }"
              >
                <EyeBall
                  :size="18"
                  :pupil-size="7"
                  :max-distance="5"
                  eye-color="white"
                  pupil-color="#2D2D2D"
                  :is-blinking="isPurpleBlinking"
                  :force-look-x="getForceLookX('purple')"
                  :force-look-y="getForceLookY('purple')"
                />
                <EyeBall
                  :size="18"
                  :pupil-size="7"
                  :max-distance="5"
                  eye-color="white"
                  pupil-color="#2D2D2D"
                  :is-blinking="isPurpleBlinking"
                  :force-look-x="getForceLookX('purple')"
                  :force-look-y="getForceLookY('purple')"
                />
              </div>
            </div>

            <!-- 黑色高个角色 - 中间层 -->
            <div
              ref="blackRef"
              class="character-black"
              :class="{
                looking: isLookingAtEachOther,
                'password-visible':
                  formData.password.length > 0 && showPassword,
              }"
              :style="{
                transform: getCharacterTransform('black'),
              }"
            >
              <div
                class="eyes-wrapper"
                :style="{
                  left: getEyesPosition('black').left,
                  top: getEyesPosition('black').top,
                }"
              >
                <EyeBall
                  :size="16"
                  :pupil-size="6"
                  :max-distance="4"
                  eye-color="white"
                  pupil-color="#2D2D2D"
                  :is-blinking="isBlackBlinking"
                  :force-look-x="getForceLookX('black')"
                  :force-look-y="getForceLookY('black')"
                />
                <EyeBall
                  :size="16"
                  :pupil-size="6"
                  :max-distance="4"
                  eye-color="white"
                  pupil-color="#2D2D2D"
                  :is-blinking="isBlackBlinking"
                  :force-look-x="getForceLookX('black')"
                  :force-look-y="getForceLookY('black')"
                />
              </div>
            </div>

            <!-- 橙色半圆角色 - 左前 -->
            <div
              ref="orangeRef"
              class="character-orange"
              :class="{
                'password-visible':
                  formData.password.length > 0 && showPassword,
              }"
              :style="{
                transform: getCharacterTransform('orange'),
              }"
            >
              <div
                class="pupils-wrapper"
                :style="{
                  left: getPupilsPosition('orange').left,
                  top: getPupilsPosition('orange').top,
                }"
              >
                <Pupil
                  :size="12"
                  :max-distance="5"
                  pupil-color="#2D2D2D"
                  :force-look-x="getForceLookX('orange')"
                  :force-look-y="getForceLookY('orange')"
                />
                <Pupil
                  :size="12"
                  :max-distance="5"
                  pupil-color="#2D2D2D"
                  :force-look-x="getForceLookX('orange')"
                  :force-look-y="getForceLookY('orange')"
                />
              </div>
            </div>

            <!-- 黄色高个角色 - 右前 -->
            <div
              ref="yellowRef"
              class="character-yellow"
              :class="{
                'password-visible':
                  formData.password.length > 0 && showPassword,
              }"
              :style="{
                transform: getCharacterTransform('yellow'),
              }"
            >
              <div
                class="pupils-wrapper"
                :style="{
                  left: getPupilsPosition('yellow').left,
                  top: getPupilsPosition('yellow').top,
                }"
              >
                <Pupil
                  :size="12"
                  :max-distance="5"
                  pupil-color="#2D2D2D"
                  :force-look-x="getForceLookX('yellow')"
                  :force-look-y="getForceLookY('yellow')"
                />
                <Pupil
                  :size="12"
                  :max-distance="5"
                  pupil-color="#2D2D2D"
                  :force-look-x="getForceLookX('yellow')"
                  :force-look-y="getForceLookY('yellow')"
                />
              </div>
              <div
                class="mouth"
                :style="{
                  left: getMouthPosition().left,
                  top: getMouthPosition().top,
                }"
              />
            </div>
          </div>
        </div>

        <!-- 底部链接 -->
        <div class="footer-links">
          <a href="#">{{ t('login.privacyPolicy') }}</a>
          <a href="#">{{ t('login.termsOfService') }}</a>
          <a href="#">{{ t('login.contact') }}</a>
        </div>

        <!-- 装饰元素 -->
        <div class="bg-grid" />
        <div class="blur-1" />
        <div class="blur-2" />
      </div>
    </div>

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
          <h1>{{ t('login.welcomeBack') }}</h1>
          <p>{{ t('login.enterDetails') }}</p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-field">
            <label>{{ t('login.email') }}</label>
            <input
              v-model="formData.username"
              type="text"
              :placeholder="t('login.emailPlaceholder')"
              autocomplete="off"
              @focus="isTyping = true"
              @blur="isTyping = false"
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

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="rememberMe" />
              <span>{{ t('login.rememberFor30Days') }}</span>
            </label>
            <a href="#" class="forgot-link">{{ t('user.forgotPassword') }}</a>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? t('login.signIn') : t('login.logIn') }}
          </button>
        </form>

        <!-- 社交登录 -->
        <div class="social-login">
          <button type="button" class="google-btn">
            <Mail :size="20" />
            {{ t('login.loginWithGoogle') }}
          </button>
        </div>

        <!-- 注册链接 -->
        <div class="signup-link">
          {{ t('user.noAccount') }}
          <a href="#">{{ t('user.signUp') }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Sparkles, Eye, EyeOff, Mail } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import Pupil from '@/components/login/Pupil.vue';
import EyeBall from '@/components/login/EyeBall.vue';
import { useAppQuery } from '@/composables/useQuery';
import { httpClient } from '@/api/client';
import { useUserStore } from '@/stores';
import router from '@/router';

const { t } = useI18n();

// 响应式数据
const showPassword = ref(false);
const formData = ref({
  username: 'admin',
  password: 'admin123',
});
const error = ref('');
const isLoading = ref(false);
const rememberMe = ref(false);

const mouseX = ref(0);
const mouseY = ref(0);
const isPurpleBlinking = ref(false);
const isBlackBlinking = ref(false);
const isTyping = ref(false);
const isLookingAtEachOther = ref(false);
const isPurplePeeking = ref(false);

// DOM 引用
const purpleRef = ref<HTMLElement | null>(null);
const blackRef = ref<HTMLElement | null>(null);
const yellowRef = ref<HTMLElement | null>(null);
const orangeRef = ref<HTMLElement | null>(null);

// 鼠标移动监听
const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = e.clientX;
  mouseY.value = e.clientY;
};

// 计算角色变换
const calculatePosition = (ref: HTMLElement | null) => {
  if (!ref) return { faceX: 0, faceY: 0, bodySkew: 0 };

  const rect = ref.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 3;

  const deltaX = mouseX.value - centerX;
  const deltaY = mouseY.value - centerY;

  const faceX = Math.max(-15, Math.min(15, deltaX / 20));
  const faceY = Math.max(-10, Math.min(10, deltaY / 30));
  const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

  return { faceX, faceY, bodySkew };
};

// 获取角色变换样式
const getCharacterTransform = (character: string) => {
  let pos: { faceX: number; faceY: number; bodySkew: number };

  switch (character) {
    case 'purple':
      pos = calculatePosition(purpleRef.value);
      if (formData.value.password.length > 0 && showPassword.value)
        return 'skewX(0deg)';
      if (
        isTyping.value ||
        (formData.value.password.length > 0 && !showPassword.value)
      ) {
        return `skewX(${(pos.bodySkew || 0) - 12}deg) translateX(40px)`;
      }
      return `skewX(${pos.bodySkew || 0}deg)`;
    case 'black':
      pos = calculatePosition(blackRef.value);
      if (formData.value.password.length > 0 && showPassword.value)
        return 'skewX(0deg)';
      if (isLookingAtEachOther.value) {
        return `skewX(${(pos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`;
      }
      if (
        isTyping.value ||
        (formData.value.password.length > 0 && !showPassword.value)
      ) {
        return `skewX(${(pos.bodySkew || 0) * 1.5}deg)`;
      }
      return `skewX(${pos.bodySkew || 0}deg)`;
    case 'orange':
      pos = calculatePosition(orangeRef.value);
      if (formData.value.password.length > 0 && showPassword.value)
        return 'skewX(0deg)';
      return `skewX(${pos.bodySkew || 0}deg)`;
    case 'yellow':
      pos = calculatePosition(yellowRef.value);
      if (formData.value.password.length > 0 && showPassword.value)
        return 'skewX(0deg)';
      return `skewX(${pos.bodySkew || 0}deg)`;
    default:
      return 'skewX(0deg)';
  }
};

// 获取角色高度
const getCharacterHeight = () => {
  if (
    isTyping.value ||
    (formData.value.password.length > 0 && !showPassword.value)
  ) {
    return '440px';
  }
  return '400px';
};

// 获取眼睛位置
const getEyesPosition = (character: string) => {
  const pos = calculatePosition(
    character === 'purple' ? purpleRef.value : blackRef.value
  );
  const isPasswordVisible =
    formData.value.password.length > 0 && showPassword.value;

  if (character === 'purple') {
    if (isPasswordVisible) {
      return { left: '20px', top: '35px' };
    }
    if (isLookingAtEachOther.value) {
      return { left: '55px', top: '65px' };
    }
    return {
      left: `${45 + (pos.faceX || 0)}px`,
      top: `${40 + (pos.faceY || 0)}px`,
    };
  } else {
    if (isPasswordVisible) {
      return { left: '10px', top: '28px' };
    }
    if (isLookingAtEachOther.value) {
      return { left: '32px', top: '12px' };
    }
    return {
      left: `${26 + (pos.faceX || 0)}px`,
      top: `${32 + (pos.faceY || 0)}px`,
    };
  }
};

// 获取瞳孔位置
const getPupilsPosition = (character: string) => {
  const pos = calculatePosition(
    character === 'orange' ? orangeRef.value : yellowRef.value
  );
  const isPasswordVisible =
    formData.value.password.length > 0 && showPassword.value;

  if (character === 'orange') {
    if (isPasswordVisible) {
      return { left: '50px', top: '85px' };
    }
    return {
      left: `${82 + (pos.faceX || 0)}px`,
      top: `${90 + (pos.faceY || 0)}px`,
    };
  } else {
    if (isPasswordVisible) {
      return { left: '20px', top: '35px' };
    }
    return {
      left: `${52 + (pos.faceX || 0)}px`,
      top: `${40 + (pos.faceY || 0)}px`,
    };
  }
};

// 获取嘴巴位置
const getMouthPosition = () => {
  const pos = calculatePosition(yellowRef.value);
  const isPasswordVisible =
    formData.value.password.length > 0 && showPassword.value;

  if (isPasswordVisible) {
    return { left: '10px', top: '88px' };
  }
  return {
    left: `${40 + (pos.faceX || 0)}px`,
    top: `${88 + (pos.faceY || 0)}px`,
  };
};

// 获取强制视线方向
const getForceLookX = (character: string) => {
  const isPasswordVisible =
    formData.value.password.length > 0 && showPassword.value;

  if (!isPasswordVisible) {
    if (character === 'purple' && isLookingAtEachOther.value) return 3;
    if (character === 'black' && isLookingAtEachOther.value) return 0;
    return undefined;
  }

  if (character === 'purple') {
    return isPurplePeeking.value ? 4 : -4;
  }
  if (character === 'black') {
    return -4;
  }
  return -5;
};

const getForceLookY = (character: string) => {
  const isPasswordVisible =
    formData.value.password.length > 0 && showPassword.value;

  if (!isPasswordVisible) {
    if (character === 'purple' && isLookingAtEachOther.value) return 4;
    if (character === 'black' && isLookingAtEachOther.value) return -4;
    return undefined;
  }

  if (character === 'purple') {
    return isPurplePeeking.value ? 5 : -4;
  }
  if (character === 'black') {
    return -4;
  }
  return -4;
};

// 眨眼效果
let purpleBlinkInterval: ReturnType<typeof setTimeout>;
let blackBlinkInterval: ReturnType<typeof setTimeout>;

const startBlinking = () => {
  const getRandomInterval = () => Math.random() * 4000 + 3000;

  const schedulePurpleBlink = () => {
    purpleBlinkInterval = setTimeout(() => {
      isPurpleBlinking.value = true;
      setTimeout(() => {
        isPurpleBlinking.value = false;
        schedulePurpleBlink();
      }, 150);
    }, getRandomInterval());
  };

  const scheduleBlackBlink = () => {
    blackBlinkInterval = setTimeout(() => {
      isBlackBlinking.value = true;
      setTimeout(() => {
        isBlackBlinking.value = false;
        scheduleBlackBlink();
      }, 150);
    }, getRandomInterval());
  };

  schedulePurpleBlink();
  scheduleBlackBlink();
};

// 监听 typing 状态
watch(isTyping, (newVal) => {
  if (newVal) {
    isLookingAtEachOther.value = true;
    setTimeout(() => {
      isLookingAtEachOther.value = false;
    }, 800);
  } else {
    isLookingAtEachOther.value = false;
  }
});

// 监听密码可见状态
let peekTimeout: ReturnType<typeof setTimeout>;

watch(
  [() => formData.value.password, showPassword],
  ([newPassword, newShowPassword]) => {
    if (newPassword.length > 0 && newShowPassword) {
      const schedulePeek = () => {
        peekTimeout = setTimeout(
          () => {
            isPurplePeeking.value = true;
            setTimeout(() => {
              isPurplePeeking.value = false;
            }, 800);
          },
          Math.random() * 3000 + 2000
        );
      };
      schedulePeek();
    } else {
      isPurplePeeking.value = false;
      if (peekTimeout) clearTimeout(peekTimeout);
    }
  }
);
const userStore = useUserStore();
// 表单提交
const handleSubmit = async () => {
  error.value = '';
  isLoading.value = true;
  try {
    await userStore.logout();

    await userStore.loginAction(formData.value);
    router.push('/components');
  } catch (error: any) {
    error.value = error.message || t('user.loginFailed');
  } finally {
    isLoading.value = false;
  }
};
// 生命周期
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
  startBlinking();
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  if (purpleBlinkInterval) clearTimeout(purpleBlinkInterval);
  if (blackBlinkInterval) clearTimeout(blackBlinkInterval);
  if (peekTimeout) clearTimeout(peekTimeout);
});
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

// 左侧样式
.login-left {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(135deg, #6c3ff5 0%, #5b2ee3 50%, #4a1ed1 100%);
  padding: 3rem;
  color: white;

  @media (max-width: 1024px) {
    display: none;
  }

  .left-content {
    position: relative;
    z-index: 20;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .logo-area {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;

    .logo-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .characters-area {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    height: 500px;

    .characters-wrapper {
      position: relative;
      width: 550px;
      height: 400px;
    }
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 2rem;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.6);

    a {
      text-decoration: none;
      color: inherit;
      transition: color 0.2s;

      &:hover {
        color: white;
      }
    }
  }

  // 装饰元素
  .bg-grid {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px
    );
    background-size: 20px 20px;
    pointer-events: none;
  }

  .blur-1 {
    position: absolute;
    top: 25%;
    right: 25%;
    width: 16rem;
    height: 16rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    filter: blur(64px);
    pointer-events: none;
  }

  .blur-2 {
    position: absolute;
    bottom: 25%;
    left: 25%;
    width: 24rem;
    height: 24rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    filter: blur(96px);
    pointer-events: none;
  }
}

// 角色样式
.character-purple {
  position: absolute;
  bottom: 0;
  left: 70px;
  width: 180px;
  background-color: #6c3ff5;
  border-radius: 10px 10px 0 0;
  z-index: 1;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;

  .eyes-wrapper {
    position: absolute;
    display: flex;
    gap: 2rem;
    transition: all 0.7s ease-in-out;
  }
}

.character-black {
  position: absolute;
  bottom: 0;
  left: 240px;
  width: 120px;
  height: 310px;
  background-color: #2d2d2d;
  border-radius: 8px 8px 0 0;
  z-index: 2;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;

  .eyes-wrapper {
    position: absolute;
    display: flex;
    gap: 1.5rem;
    transition: all 0.7s ease-in-out;
  }
}

.character-orange {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 240px;
  height: 200px;
  background-color: #ff9b6b;
  border-radius: 120px 120px 0 0;
  z-index: 3;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;

  .pupils-wrapper {
    position: absolute;
    display: flex;
    gap: 2rem;
    transition: all 0.2s ease-out;
  }
}

.character-yellow {
  position: absolute;
  bottom: 0;
  left: 310px;
  width: 140px;
  height: 230px;
  background-color: #e8d754;
  border-radius: 70px 70px 0 0;
  z-index: 4;
  transition: all 0.7s ease-in-out;
  transform-origin: bottom center;

  .pupils-wrapper {
    position: absolute;
    display: flex;
    gap: 1.5rem;
    transition: all 0.2s ease-out;
  }

  .mouth {
    position: absolute;
    width: 5rem;
    height: 4px;
    background-color: #2d2d2d;
    border-radius: 9999px;
    transition: all 0.2s ease-out;
  }
}

// 右侧样式
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #ffffff;

  @media (prefers-color-scheme: dark) {
    background-color: #0f0f12;
  }

  .login-form-wrapper {
    width: 100%;
    max-width: 420px;

    .mobile-logo {
      display: none;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 3rem;

      @media (max-width: 1024px) {
        display: flex;
      }

      .logo-icon {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        background: rgba(108, 63, 245, 0.1);
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
        color: #18181b;
      }

      p {
        font-size: 0.875rem;
        color: #71717a;
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
          color: #18181b;
        }

        input {
          height: 3rem;
          padding: 0 1rem;
          border: 1px solid #e4e4e7;
          border-radius: 0.5rem;
          background: #ffffff;
          font-size: 0.875rem;
          transition: all 0.2s;

          &:focus {
            outline: none;
            border-color: #6c3ff5;
            box-shadow: 0 0 0 2px rgba(108, 63, 245, 0.1);
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
            color: #71717a;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;

            &:hover {
              color: #18181b;
            }
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
          }

          span {
            font-size: 0.875rem;
            color: #71717a;
          }
        }

        .forgot-link {
          font-size: 0.875rem;
          color: #6c3ff5;
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .error-message {
        padding: 0.75rem;
        font-size: 0.875rem;
        color: #f87171;
        background: rgba(248, 113, 113, 0.1);
        border: 1px solid rgba(248, 113, 113, 0.2);
        border-radius: 0.5rem;
      }

      .login-btn {
        width: 100%;
        height: 3rem;
        background: #6c3ff5;
        color: white;
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;

        &:hover:not(:disabled) {
          background: #5b2ee3;
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
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
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #18181b;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: #f4f4f5;
        }
      }
    }

    .signup-link {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.875rem;
      color: #71717a;

      a {
        color: #18181b;
        font-weight: 500;
        text-decoration: none;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .login-right .login-form-wrapper {
    .form-header h1 {
      color: #fafafa;
    }

    .form-field label {
      color: #fafafa;
    }

    .form-field input {
      background: #1f1f24;
      border-color: #27272a;
      color: #fafafa;
    }

    .form-options .checkbox-label span {
      color: #a1a1aa;
    }

    .social-login .google-btn {
      background: #1f1f24;
      border-color: #27272a;
      color: #fafafa;

      &:hover {
        background: #27272a;
      }
    }

    .signup-link a {
      color: #fafafa;
    }
  }
}
</style>
