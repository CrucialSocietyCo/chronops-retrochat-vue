<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    messageId: { type: String, required: true },
    myReactions: { type: Set, default: () => new Set() },
    position: { type: Object, default: () => ({ top: 0, left: 0 }) }
})

const emit = defineEmits(['select', 'close'])

const REACTIONS = [
    { type: 'like', emoji: '👍' },
    { type: 'love', emoji: '❤️' },
    { type: 'laugh', emoji: '😂' },
    { type: 'shock', emoji: '😮' },
    { type: 'angry', emoji: '😡' },
    { type: 'eyes', emoji: '👀' }
]

const paletteRef = ref(null)

// Close on click outside
const handleClickOutside = (e) => {
    if (paletteRef.value && !paletteRef.value.contains(e.target)) {
        emit('close')
    }
}

onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('touchstart', handleClickOutside)
})

const onSelect = (type) => {
    emit('select', type)
    emit('close')
}
</script>

<template>
  <div 
    ref="paletteRef"
    class="reaction-palette"
    :style="{ top: position.top + 'px', left: position.left + 'px' }"
  >
    <button 
        v-for="r in REACTIONS" 
        :key="r.type"
        class="reaction-btn"
        :class="{ active: myReactions.has(r.type) }"
        @click.stop="onSelect(r.type)"
        :title="r.type"
    >
        {{ r.emoji }}
    </button>
  </div>
</template>

<style scoped>
.reaction-palette {
    position: fixed;
    z-index: 9999;
    background: #c0c0c0; /* Windows 95 light grey */
    border-top: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #000000;
    border-bottom: 1px solid #000000;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    padding: 2px;
    display: flex;
    flex-wrap: nowrap;
    gap: 2px;
}

.reaction-btn {
    background: transparent;
    border: 1px dotted transparent;
    cursor: pointer;
    font-size: 14px; /* Reduced from 16px (~13%) */
    padding: 1px 3px; /* Reduced padding */
    line-height: 1;
    border-radius: 0;
}

.reaction-btn:hover {
    background: #000080;
    border-color: #ffffff;
}

.reaction-btn.active {
    background: #e0e0e0;
    border: 1px inset #ffffff;
}
</style>
