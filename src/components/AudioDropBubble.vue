<template>
  <div class="audio-drop-bubble" :class="{ 'is-live': isLive }">
    <!-- Live Badge (Fades out after 2-3s) -->
    <div v-if="isLive" class="live-badge">LIVE</div>
    
    <div class="bubble-content">
      <!-- Tape Icon -->
      <div class="tape-icon">
        <svg viewBox="0 0 24 24" width="24" height="24">
          <rect x="2" y="4" width="20" height="14" rx="1" fill="#333" stroke="#000" stroke-width="2"/>
          <rect x="4" y="6" width="16" height="8" fill="#5BC8C4" stroke="#000" stroke-width="1"/>
          <circle cx="8" cy="10" r="2" fill="#D6B26A" stroke="#000" stroke-width="1"/>
          <circle cx="16" cy="10" r="2" fill="#D6B26A" stroke="#000" stroke-width="1"/>
          <rect x="6" y="15" width="12" height="2" fill="#111"/>
        </svg>
      </div>

      <div class="info-col">
        <div class="label">Admin Voice Drop</div>
        
        <div class="controls-row">
           <button class="play-btn" @click="togglePlay">
             <span v-if="isPlaying">⏸️</span>
             <span v-else>▶️</span>
           </button>
           
           <div class="waveform" :class="{ playing: isPlaying }">
              <!-- Simulated Waveform Bars -->
              <div class="bar" v-for="i in 6" :key="i"></div>
           </div>
           
           <div class="duration-chip">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
        </div>
      </div>
    </div>

    <!-- Hidden Audio Element -->
    <audio 
       ref="audioEl" 
       :src="src" 
       @ended="isPlaying = false" 
       @timeupdate="updateTime" 
       preload="auto"
    ></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps({
    src: String,
    duration: Number, // Expected in seconds
    timestamp: String, // To calculate if it's "LIVE"
    autoplayEnabled: { type: Boolean, default: false }
})

const audioEl = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const isLive = ref(false)

// Check if message is "recieved" just now (within last 10s)
const checkLiveStatus = () => {
   if (!props.timestamp) return
   const msgTime = new Date(props.timestamp).getTime()
   const now = Date.now()
   // If message is less than 15s old, show LIVE badge
   if (now - msgTime < 15000) {
       isLive.value = true
       // Verify fade out
       setTimeout(() => isLive.value = false, 5000)
   }
}

const togglePlay = () => {
    if (!audioEl.value) return
    if (isPlaying.value) {
        audioEl.value.pause()
        isPlaying.value = false
    } else {
        audioEl.value.play().catch(e => console.warn('Playback failed:', e))
        isPlaying.value = true
    }
}

const updateTime = () => {
    if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

const formatTime = (t) => {
    if (!t) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
    checkLiveStatus()
    
    if (props.autoplayEnabled && isLive.value) {
        // Try autoplay
        if (audioEl.value) {
            audioEl.value.volume = 0.4 // Low volume as requested
            audioEl.value.play()
                .then(() => isPlaying.value = true)
                .catch(() => { /* Autoplay blocked, ignore */ })
        }
    }
})
</script>

<style scoped lang="scss">
.audio-drop-bubble {
    position: relative;
    display: inline-block;
    background: #E1E1E1;
    border: 1px solid #404040;
    border-radius: 4px; /* Slightly rounded as requested */
    padding: 6px 10px;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
    margin: 4px 0;
    max-width: 280px;
    font-family: 'MS Sans Serif', sans-serif;
    
    /* "Incoming" animation */
    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.is-live {
    border-color: #EA3D3D;
    box-shadow: 0 0 5px rgba(234, 61, 61, 0.4);
}

.live-badge {
    position: absolute;
    top: -8px; 
    right: -5px;
    background: #EA3D3D;
    color: white;
    font-size: 9px;
    font-weight: bold;
    padding: 2px 4px;
    border: 1px solid #000;
    box-shadow: 1px 1px 0 #000;
    animation: flash 1s infinite;
    z-index: 10;
}

.bubble-content {
    display: flex;
    align-items: center;
    gap: 10px;
}

.info-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.label {
    font-size: 10px;
    color: #404040;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.controls-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.play-btn {
    background: white;
    border: 1px solid #404040;
    width: 24px; height: 24px;
    display: flex; 
    align-items: center; 
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    padding: 0;
    
    &:hover { background: #5BC8C4; color: white; border-color: #000; }
}

.waveform {
    display: flex;
    gap: 2px;
    align-items: flex-end;
    height: 16px;
    
    .bar {
        width: 3px;
        background: #B8B8B8;
        height: 4px;
        transition: height 0.1s ease;
    }
    
    &.playing .bar {
        background: #4B90F0;
        animation: dance 0.5s infinite alternate;
        
        &:nth-child(1) { animation-delay: 0s; height: 60%; }
        &:nth-child(2) { animation-delay: 0.1s; height: 100%; }
        &:nth-child(3) { animation-delay: 0.2s; height: 50%; }
        &:nth-child(4) { animation-delay: 0.3s; height: 80%; }
        &:nth-child(5) { animation-delay: 0.15s; height: 40%; }
        &:nth-child(6) { animation-delay: 0.05s; height: 90%; }
    }
}

.duration-chip {
    background: #1D1D1D;
    color: white;
    font-size: 9px;
    padding: 2px 4px;
    border-radius: 2px;
    font-family: monospace;
}

@keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

@keyframes popIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes dance {
    0% { height: 20%; }
    100% { height: 100%; }
}
</style>
