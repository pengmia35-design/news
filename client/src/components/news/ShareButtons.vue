<template>
  <div class="share-buttons" :class="{ 'is-visible': visible }">
    <!-- 微信 -->
    <div class="share-item" @click="showWechat = true">
      <div class="share-icon wechat">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M8.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5-1.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0zm-.5 6c-2.8 0-5.5-1.2-5.5-3.5 0-1.9 1.5-3.8 4.2-4.2l.3-.7C9.8 6.5 7.2 7 5.5 8.8 3.5 11 3 13.5 4.5 15.3c-.5.8-.8 1.7-.8 2.3 0 1.2 1 1.8 2.2 1.5.7-.2 1.5-.6 2.3-1 .6.2 1.2.3 1.8.3 1.2 0 2.3-.3 3.3-.7l-.3-.7zm5-3.5c0-3.6-3.4-6.5-7.5-6.5s-7.5 2.9-7.5 6.5c0 1.3.5 2.5 1.3 3.6l-.5 1.5 1.6-.5c1.1.5 2.3.8 3.6.8h.7c-.2-.5-.3-1-.3-1.5 0-3 2.8-5.5 6.5-5.5h.6c.3-.6.5-1.2.5-1.9z"/>
        </svg>
      </div>
      <span class="share-label">微信</span>

      <!-- 微信二维码弹窗 -->
      <Teleport to="body">
        <div v-if="showWechat" class="qr-overlay" @click.self="showWechat = false">
          <div class="qr-modal">
            <div class="qr-title">微信扫一扫分享</div>
            <div class="qr-wrapper">
              <canvas ref="qrCanvas"></canvas>
            </div>
            <p class="qr-hint">打开微信，扫一扫即可分享</p>
            <button class="qr-close" @click="showWechat = false">关闭</button>
          </div>
        </div>
      </Teleport>
    </div>

    <!-- 微博 -->
    <div class="share-item" @click="shareWeibo">
      <div class="share-icon weibo">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M10.98 3.04c.53-.08 1.07-.04 1.6.08 1.12.26 2.07.89 2.77 1.76.7.87 1.08 1.92 1.13 3.02.05.85-.1 1.68-.46 2.44-.35.76-.9 1.38-1.6 1.82-.72.44-1.54.66-2.39.66-.88 0-1.73-.25-2.46-.72a4.27 4.27 0 0 1-1.7-1.95c-.36-.8-.48-1.67-.35-2.5.13-.83.5-1.58 1.07-2.16.54-.54 1.22-.91 1.97-1.07.28-.06.56-.08.84-.06l.02-.01zm.05 1.5c-.48.02-.95.15-1.37.4-.42.24-.77.58-1 1-.34.57-.46 1.22-.36 1.85.1.63.4 1.2.85 1.63.44.43 1.01.7 1.63.77.62.07 1.23-.06 1.77-.37.54-.31.96-.78 1.22-1.33.26-.55.35-1.16.24-1.75-.1-.59-.38-1.12-.8-1.52-.43-.4-.96-.64-1.54-.69-.22-.02-.44 0-.64.01zm3.12 13.3c.34.18.5.57.37.92-.13.35-.49.58-.86.6-.6 0-1.4.2-2.2.7-.8.5-1.2 1.1-1.2 1.5 0 .4.4.5 1 .6.6.1 1.4.2 2.2.4.8.2 1.6.6 2.1 1.1.5.5.6 1.1.3 1.4-.3.3-.9.3-1.6.2-.7-.1-1.5-.3-2.4-.4-.9-.1-1.9-.1-2.8 0-.9.1-1.7.4-2.4.7-.7.3-1.3.6-1.8.9-.5.3-.8.6-.8.9 0 .4.6.7 1.6.9 1 .2 2.4.3 3.8.3 1.4 0 2.9-.1 4.1-.4 1.2-.3 2.2-.8 2.8-1.4.6-.6.8-1.4.4-2.1-.4-.7-1.2-1.3-2.3-1.7-1.1-.4-2.5-.7-3.8-1-.6-.3-.9-.7-.8-1 .1-.3.5-.5 1-.5.5 0 1.2.1 2 .1.8 0 1.6-.1 2.4-.2.8-.1 1.5-.4 2-.7.5-.3.8-.7.8-1.1 0-.5-.5-.9-1.3-1.2-.8-.3-1.8-.5-2.9-.6-.7 0-4.5.6-6.1 2-1.5 1.4-1.8 3.2-1.5 4.8.3 1.6 1.6 2.9 3.1 3.6 1.5.7 3.2.9 4.8.7 1.6-.2 3.2-.8 4.3-1.7 1.1-.9 1.7-2.2 1.4-3.5-.1-.8-.6-1.5-1.3-2.1-.7-.6-1.6-1-2.6-1.2-1-.2-2.1-.3-3.1-.2-1 .1-2 .4-2.8.8-.8.4-1.3.9-1.5 1.5-.2.6 0 1.1.3 1.4.3.3.8.3 1.3.2.5-.1 1-.4 1.6-.6.6-.2 1.2-.4 1.8-.5.6-.1 1.2-.1 1.7 0 .5.1.8.3.9.5.1.2.1.4-.1.5-.2.1-.5.2-.9.3-.6.1-1.2.2-1.8.3-1.2.1-2.3.3-3.2.5-.9.2-1.6.5-2 .9-.4.4-.5.9-.3 1.2.2.3.6.4 1.1.4.5 0 1.1-.1 1.7-.2.6-.1 1.3-.2 1.9-.2.6 0 1.2.1 1.7.2.5.1.9.3 1.2.5.3.2.4.4.4.6 0 .3-.3.5-.6.7-.3.2-.8.3-1.3.4-.7.1-1.4-.1-1.9-.4-.4-.2-.7-.5-.7-.8 0-.1.5-.4 1.2-.7.7-.3 1.6-.5 2.4-.5.5 0 .9.1 1.1.3z"/>
        </svg>
      </div>
      <span class="share-label">微博</span>
    </div>

    <!-- QQ -->
    <div class="share-item" @click="shareQQ">
      <div class="share-icon qq">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 3C9.5 3 7.2 4.3 5.8 6.4c-1.4 2.1-1.8 4.8-.9 7.2.2.5.4 1 .6 1.4l-1.2 2.5c-.3.6.2 1.3.9 1.2l2.9-.6c1 .5 2.1.8 3.2.9h1.2c1.1-.1 2.2-.4 3.2-.9l2.9.6c.7.1 1.2-.6.9-1.2l-1.2-2.5c.2-.4.4-.9.6-1.4.9-2.4.5-5.1-.9-7.2C16.8 4.3 14.5 3 12 3zm0 2c1.8 0 3.5.9 4.6 2.5 1.1 1.6 1.4 3.8.7 5.6-.7 1.8-2.1 3.1-3.8 3.4-.5.1-1 .1-1.5 0-1.7-.3-3.1-1.6-3.8-3.4-.7-1.8-.4-4 .7-5.6C8.5 5.9 10.2 5 12 5zm0 2a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0V8a1 1 0 0 0-1-1zm-3 3a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1zm6 0a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v-1a1 1 0 0 0-1-1z"/>
        </svg>
      </div>
      <span class="share-label">QQ</span>
    </div>

    <!-- 返回顶部 -->
    <div class="share-item" @click="scrollToTop">
      <div class="share-icon top">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 4l-8 8h5v8h6v-8h5z"/>
        </svg>
      </div>
      <span class="share-label">顶部</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'

const route = useRoute()
const visible = ref(false)
const showWechat = ref(false)
const qrCanvas = ref(null)

onMounted(() => {
  checkVisibility()
  window.addEventListener('scroll', checkVisibility)
})

function checkVisibility() {
  visible.value = window.scrollY > 300
}

function getShareUrl() {
  return window.location.href
}

function getShareTitle() {
  return document.title || 'TechAI 资讯'
}

function shareWeibo() {
  const url = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(getShareTitle())}&url=${encodeURIComponent(getShareUrl())}&pic=`
  window.open(url, '_blank', 'width=600,height=500')
}

function shareQQ() {
  const url = `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(getShareTitle())}&url=${encodeURIComponent(getShareUrl())}&desc=`
  window.open(url, '_blank', 'width=600,height=500')
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch(showWechat, async (val) => {
  if (val) {
    await nextTick()
    if (qrCanvas.value) {
      QRCode.toCanvas(qrCanvas.value, getShareUrl(), {
        width: 180,
        margin: 2,
        color: { dark: '#1a1a1a', light: '#ffffff' }
      })
    }
  }
})
</script>

<style scoped>
.share-buttons {
  position: fixed;
  right: 24px;
  top: 50%;
  transform: translateY(-50%) translateX(60px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 100;
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
}

.share-buttons.is-visible {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
  pointer-events: auto;
}

.share-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
}

.share-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.share-icon:hover {
  transform: scale(1.1);
}

.share-icon.wechat {
  background: #07C160;
  color: #fff;
}

.share-icon.weibo {
  background: #FF8200;
  color: #fff;
}

.share-icon.qq {
  background: #12B7F5;
  color: #fff;
}

.share-icon.top {
  background: var(--color-muted);
  color: var(--color-muted-foreground);
}

.share-icon.top:hover {
  background: var(--color-primary);
  color: #fff;
}

.share-label {
  font-size: 10px;
  color: var(--color-muted-foreground);
  white-space: nowrap;
}

/* QR 弹窗 */
.qr-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.qr-modal {
  background: var(--color-card);
  border-radius: var(--card-radius);
  padding: 28px;
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.qr-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-foreground);
  margin-bottom: 16px;
}

.qr-wrapper {
  background: var(--color-card);
  border-radius: 8px;
  padding: 12px;
  display: inline-block;
}

.qr-hint {
  font-size: 13px;
  color: var(--color-muted-foreground);
  margin: 12px 0 16px;
}

.qr-close {
  background: var(--color-primary);
  color: #fff;
  border: none;
  padding: 8px 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.qr-close:hover {
  background: var(--color-primary-hover);
}

/* 大屏显式，小屏隐藏 */
@media (max-width: 1200px) {
  .share-buttons {
    display: none;
  }
}
</style>
