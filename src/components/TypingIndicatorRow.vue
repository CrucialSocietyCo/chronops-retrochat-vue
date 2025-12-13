<script setup>
import { computed } from 'vue'

const props = defineProps({
  activeTypers: {
    type: Array, // Array of { id, name }
    default: () => []
  },
  currentUserId: {
    type: String,
    default: ''
  }
})

const typingText = computed(() => {
    // Filter out self just in case (though backend handles it usually, better safe)
    const others = props.activeTypers.filter(t => t.id !== props.currentUserId)
    
    if (others.length === 0) return ''
    if (others.length === 1) return `${others[0].name} is typing<span class="dots">...</span>`
    if (others.length === 2) return `${others[0].name} and ${others[1].name} are typing<span class="dots">...</span>`
    return `Multiple people are typing<span class="dots">...</span>`
})

const isVisible = computed(() => props.activeTypers.length > 0)
</script>

<template>
  <Transition name="fade-slide">
    <div v-if="isVisible" class="typing-row">
      <span class="icon">✍️</span>
      <span class="text" v-html="typingText"></span>
    </div>
  </Transition>
</template>

<style scoped>
.typing-row {
  margin-top: 2px;
  margin-bottom: 2px; /* Close to input */
  padding: 2px 8px;
  font-family: 'Verdana', sans-serif;
  font-size: 10px;
  color: #606060;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon {
  font-size: 10px;
}

/* Retro Blink Animation */
.dots {
  animation: blink 1.5s steps(3, end) infinite;
}

@keyframes blink {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(5px);
}
</style>
