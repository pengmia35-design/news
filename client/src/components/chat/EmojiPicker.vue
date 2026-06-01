<template>
  <div class="emoji-picker">
    <div class="emoji-cats">
      <button v-for="cat in categories" :key="cat.key" class="cat-btn" :class="{ active: activeCat === cat.key }" @click="activeCat = cat.key" :title="cat.label">
        {{ cat.icon }}
      </button>
    </div>
    <div class="emoji-grid">
      <button v-for="emoji in currentEmojis" :key="emoji" class="emoji-item" @click="$emit('select', emoji)" :title="emoji">
        {{ emoji }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

defineEmits(['select'])

const categories = [
  { key: 'smileys', label: '表情', icon: '😀' },
  { key: 'gestures', label: '手势', icon: '👍' },
  { key: 'hearts', label: '符号', icon: '❤️' },
  { key: 'objects', label: '物品', icon: '🎉' },
  { key: 'nature', label: '自然', icon: '🌸' },
]

const activeCat = ref('smileys')

const emojiMap = {
  smileys: ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😋','😛','😝','🤪','😎','🥳','😏','😒','😞','😔','😣','😖','😫','😩','🥺','😢','😭','😤','😡','🤬','😱','😨','😰','🤔','🤗','😶','😐','🙄','😴','🤤','😪','🤐','🤢','🤮','🤧','😷','🤒','🤑','🤠','🤓','🧐'],
  gestures: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤏','✍️','🙏','🤝','💪','🦵','🦶','👏','🙌','👐','🤲','🤜','🤛','✊','👊'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💯','✅','❌','❓','❗','💬','💭','♻️','⚠️','🔞','☮️','✝️','☪️','🕉️','☸️','✡️','🔯'],
  objects: ['🎉','🎊','🎈','🎀','🎁','🏆','🥇','🥈','🥉','🎖️','🏅','📱','💻','🖥️','⌨️','🖱️','🖨️','📷','🎥','📹','💡','🔦','📕','📗','📘','📙','📝','✏️','🖊️','🖋️','✒️','📌','📍','🔗','💊','💉','🩺','🌡️','🧪','🔬'],
  nature: ['🌸','🌺','🌻','🌹','🌷','🌼','💐','🌈','⭐','🌟','✨','💫','🔥','💧','💦','☀️','🌤️','⛅','🌙','🌍','🌎','🌏','🍀','🌿','🌱','🌴','🌳','🍎','🍊','🍋','🍉','🍇','🍓','🍒','🥝','🍕','🍔','🍩','🎂','☕','🍺'],
}

const currentEmojis = computed(() => emojiMap[activeCat.value] || emojiMap.smileys)
</script>

<style scoped>
.emoji-picker {
  width: 320px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.emoji-cats {
  display: flex;
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid #E2E8F0;
  background: #F8FAFC;
}

.cat-btn {
  flex: 1;
  padding: 6px 0;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  transition: background 0.15s;
}

.cat-btn:hover,
.cat-btn.active {
  background: #E2E8F0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  padding: 8px;
  max-height: 180px;
  overflow-y: auto;
}

.emoji-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  padding: 2px;
  transition: background 0.1s;
}

.emoji-item:hover {
  background: #EFF6FF;
}
</style>
