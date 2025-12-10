<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'Live Event'
  }
})

const modeClass = computed(() => {
  switch (props.mode) {
    case 'Live Event': return 'mode-live'
    case 'Pre-Show': return 'mode-preshow'
    case 'Afterparty': return 'mode-afterparty'
    case 'Quiet Mode': return 'mode-quiet'
    default: return 'mode-default'
  }
})

const modeLabel = computed(() => {
  return props.mode.toUpperCase()
})
</script>

<template>
  <div class="event-mode-pill" :class="modeClass">
    <span class="status-dot"></span>
    {{ modeLabel }}
  </div>
</template>

<style scoped>
.event-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  margin-left: 10px;
  user-select: none;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

/* Mode Styles */
.mode-live {
  background-color: #ffcccc;
  color: #cc0000;
  border-color: #cc0000;
}

.mode-preshow {
  background-color: #ccf2ff;
  color: #006699;
  border-color: #006699;
}

.mode-afterparty {
  background-color: #e6ccff;
  color: #6600cc;
  border-color: #6600cc;
}

.mode-quiet {
  background-color: #e0e0e0;
  color: #666666;
  border-color: #666666;
}

.mode-default {
  background-color: #f0f0f0;
  color: #333333;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>
