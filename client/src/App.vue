<template>
  <div id="techai-app">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter />
    <ChatWidget />
  </div>
</template>

<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ChatWidget from '@/components/chat/ChatWidget.vue'
</script>

<style scoped>
#techai-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 24px;
  padding-bottom: 48px;
}
</style>
