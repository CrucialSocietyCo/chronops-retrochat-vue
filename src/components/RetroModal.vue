<template>
  <div v-if="modelValue" class="modal-overlay" @click.self="close">
    <div class="retro-modal-window">
      <div class="title-bar" :class="{ 'error-mode': type === 'error' }">
        <div class="title-bar-text">{{ title }}</div>
        <div class="title-bar-controls">
          <button aria-label="Close" @click="close"></button>
        </div>
      </div>
      <div class="window-body">
        <div class="modal-content">
            <div class="icon-section">
                <span v-if="type === 'error'" class="retro-icon">⛔</span>
                <span v-else-if="type === 'warning'" class="retro-icon">⚠️</span>
                <span v-else class="retro-icon">ℹ️</span>
            </div>
            <div class="message-section">
                <p v-for="(line, index) in messageLines" :key="index">{{ line }}</p>
                <div v-if="timer > 0" class="timer-countdown">
                    Please wait {{ timer }} seconds...
                </div>
            </div>
        </div>
        <div class="modal-actions">
           <button class="retro-btn" @click="close">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'System Message' },
  message: { type: String, default: '' },
  type: { type: String, default: 'info' }, // info, warning, error
  timer: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue', 'close'])

const messageLines = computed(() => props.message.split('\n'))

const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.retro-modal-window {
  width: 320px;
  background: #c0c0c0;
  border: 2px solid #ffffff;
  border-right-color: #000000;
  border-bottom-color: #000000;
  box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
  font-family: 'MS Sans Serif', sans-serif;
}

.title-bar {
  background: #000080;
  padding: 2px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-bar.error-mode {
    background: #800000; /* Red for errors */
}

.title-bar-text {
  color: white;
  font-weight: bold;
  font-size: 12px;
  padding-left: 2px;
}

.title-bar-controls button {
  min-width: 16px;
  min-height: 14px;
  padding: 0;
  background: #c0c0c0;
  border: 1px outset #ffffff;
  font-family: 'Arial', sans-serif;
  font-size: 10px;
  font-weight: bold;
  line-height: 10px;
  cursor: pointer;
}

.title-bar-controls button:active {
    border-style: inset;
}

/* X Icon using CSS roughly */
.title-bar-controls button::before {
    content: 'X';
    color: black;
}

.window-body {
  padding: 10px;
}

.modal-content {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
}

.message-section {
    flex: 1;
    font-size: 12px;
    line-height: 1.4;
    color: black;
}

.message-section p {
    margin: 0 0 8px 0;
}

.timer-countdown {
    margin-top: 5px;
    font-weight: bold;
    color: #800000;
}

.modal-actions {
    display: flex;
    justify-content: center;
}

.retro-btn {
    min-width: 70px;
    padding: 2px 8px;
    background: #c0c0c0;
    border: 2px solid #ffffff;
    border-right-color: #000000;
    border-bottom-color: #000000;
    font-size: 11px;
    cursor: pointer;
}

.retro-btn:active {
    border: 2px solid #000000;
    border-right-color: #ffffff;
    border-bottom-color: #ffffff;
}

.retro-btn:focus {
    outline: 1px dotted black;
    outline-offset: -4px;
}

.retro-icon {
    font-size: 32px;
    line-height: 1;
}
</style>
