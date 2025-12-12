<script setup>
import EventModePill from './EventModePill.vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  eventMode: {
    type: String,
    default: ''
  }
})
</script>

<template>
  <div class="window-frame">
    <div class="title-bar">
      <div class="title-bar-left">
        <div class="title-bar-text">{{ title }}</div>
        <EventModePill v-if="eventMode" :mode="eventMode" />
      </div>
      <div class="title-bar-controls">
        <button aria-label="Minimize"></button>
        <button aria-label="Maximize"></button>
        <button aria-label="Close"></button>
      </div>
    </div>
    <div class="window-body">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.window-frame {
  background: var(--window-bg, #c0c0c0);
  /* Classic Windows 95 "Pop Out" Border */
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #000000;
  border-bottom: 2px solid #000000;
  box-shadow: 
    inset 2px 2px 0 0 #dfdfdf,
    inset -2px -2px 0 0 #808080;
  padding: 2px;
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: 'Arial', sans-serif;
}

.title-bar {
  background: linear-gradient(90deg, #000080, #1084d0);
  padding: 3px 2px 3px 3px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.title-bar-left {
  display: flex;
  align-items: center;
  flex: 1; /* Take available space */
  min-width: 0; /* Allow shrinking */
  margin-right: 4px; /* Space before controls */
}

.title-bar-text {
  color: white;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 0.5px;
  margin-left: 2px;
  /* Prevent wrapping */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; 
  margin-right: 6px;
}

.title-bar-controls {
  display: flex;
  gap: 2px;
}

.title-bar-controls button {
  width: 16px;
  height: 14px;
  background: #c0c0c0;
  border: 1px outset #ffffff;
  box-shadow: inset -1px -1px #404040;
  padding: 0;
  font-size: 9px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-bar-controls button:active {
  border-style: inset;
}

.window-body {
  flex-grow: 1;
  padding: 2px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
