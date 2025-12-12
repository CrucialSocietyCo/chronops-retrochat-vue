<template>
  <div class="voice-drop-container">
    <button 
      class="record-btn"
      :class="{ 
         'is-recording': isRecording, 
         'is-sending': isSending, 
         'is-cooling-down': cooldown > 0 
      }"
      @mousedown="handleStart"
      @mouseup="handleStop"
      @mouseleave="handleCancel"
      @touchstart.prevent="handleStart"
      @touchend.prevent="handleStop"
      :disabled="disabled || isSending || cooldown > 0"
      :title="cooldown > 0 ? `Please wait ${cooldown}s` : 'Hold to Record Voice Drop'"
    >
      <!-- Idle State -->
      <span v-if="!isRecording && !isSending && cooldown === 0" class="icon">🎤</span>
      
      <!-- Recording State -->
      <span v-else-if="isRecording" class="recording-content">
         <span class="dot"></span>
         <span class="timer">{{ formatTime(durationMs) }}</span>
      </span>

      <!-- Sending State -->
      <span v-else-if="isSending" class="sending-dots">
        ⌛
      </span>

      <!-- Cooldown State -->
      <span v-else-if="cooldown > 0" class="cooldown-text">
        {{ cooldown }}s
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useVoiceRecorder } from '../composables/useVoiceRecorder'
import { useVoiceDropsApi } from '../composables/useVoiceDropsApi'

const props = defineProps({
  disabled: Boolean,
  isAdmin: Boolean,
  authToken: String
})

const { 
  isRecording, 
  audioBlob, 
  durationMs, 
  startRecording, 
  stopRecording, 
  cancelRecording 
} = useVoiceRecorder()

const { uploadVoiceDrop } = useVoiceDropsApi()

const isSending = ref(false)
const cooldown = ref(0)
let cooldownTimer = null

const handleStart = async () => {
    if (props.disabled || isSending.value || cooldown.value > 0) return
    await startRecording()
}

const handleStop = async () => {
   if (!isRecording.value) return
   stopRecording()
   // Watcher on audioBlob will trigger upload
}

const handleCancel = () => {
    if (isRecording.value) cancelRecording()
}

// Watch for finished blob
watch(audioBlob, async (newBlob) => {
    if (newBlob) {
        // Validation
        const durationSec = durationMs.value / 1000
        if (durationSec < 0.8) {
            console.warn('Voice drop too short')
            // Visual feedback?
            return
        }

        // Upload
        try {
            isSending.value = true
            await uploadVoiceDrop(newBlob, durationMs.value, props.authToken)
            startCooldown(15) // 15s cooldown per spec
        } catch (e) {
            alert('Failed to send voice drop: ' + e.message)
        } finally {
            isSending.value = false
        }
    }
})

const startCooldown = (seconds) => {
    cooldown.value = seconds
    if (cooldownTimer) clearInterval(cooldownTimer)
    cooldownTimer = setInterval(() => {
        cooldown.value--
        if (cooldown.value <= 0) clearInterval(cooldownTimer)
    }, 1000)
}

const formatTime = (ms) => {
    const s = Math.floor(ms / 1000)
    const dec = Math.floor((ms % 1000) / 100)
    return `0:0${s}.${dec}`
}

onUnmounted(() => {
    if (cooldownTimer) clearInterval(cooldownTimer)
})
</script>

<style scoped>
.voice-drop-container {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 4px;
}

.record-btn {
    width: 36px;
    height: 36px;
    border: 2px outset #fff;
    background: #c0c0c0;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
}

.record-btn:active, .record-btn.is-recording {
    border-style: inset;
    background: #e0e0e0;
}

.record-btn.is-recording {
    background: #000;
    color: #fff;
    width: auto;
    padding: 0 8px;
    min-width: 60px;
    border: 2px inset #808080;
}

.recording-content {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: monospace;
    font-size: 12px;
}

.dot {
    width: 8px;
    height: 8px;
    background: #ff0000;
    border-radius: 50%;
    animation: pulse 0.8s infinite;
}

.timer {
    color: #fff;
}

.record-btn.is-cooling-down {
    background: #a0a0a0;
    cursor: not-allowed;
    font-size: 10px;
    font-family: monospace;
    color: #404040;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}
</style>
