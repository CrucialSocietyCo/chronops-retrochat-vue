<template>
  <div class="voice-drop-message" :class="{ 'is-live': isLive }">
    <!-- Live Badge -->
    <div v-if="isLive" class="live-badge">LIVE</div>
    
    <div class="tape-container">
      <!-- Tape Icon SVG -->
      <svg width="24" height="24" viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="14" rx="1" fill="#222" stroke="#000" stroke-width="2"/>
          <rect x="4" y="6" width="16" height="8" fill="#5BC8C4" stroke="#000" stroke-width="1"/>
          <!-- Reels -->
          <circle cx="8" cy="10" r="2.5" fill="#D6B26A" stroke="#000" stroke-width="1"/>
          <circle cx="16" cy="10" r="2.5" fill="#D6B26A" stroke="#000" stroke-width="1"/>
          <!-- Tape Window -->
          <rect x="10" y="8" width="4" height="4" fill="#fff" stroke="#000" stroke-width="1"/>
      </svg>
    </div>

    <div class="content-col">
       <div class="header-row">
           <span class="admin-name">{{ adminName }}</span>
           <span class="label">Voice Drop</span>
       </div>
       
       <div class="controls-row">
           <button class="play-btn" @click="togglePlay">
             <span v-if="isPlaying">STOP</span>
             <span v-else>PLAY</span>
           </button>
           
           <div class="waveform" :class="{ playing: isPlaying }">
              <!-- Pixel Bars -->
              <div v-for="i in 8" :key="i" class="pixel-bar"></div>
           </div>
           
           <span class="duration">{{ formatTime(currentTime) }} / {{ formatTime(durationMs / 1000) }}</span>
       </div>
    </div>

    <audio 
      ref="audioEl" 
      :src="audioUrl" 
      @ended="isPlaying = false"
      @timeupdate="onTimeUpdate"
      preload="auto"
    ></audio>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
    audioUrl: String,
    durationMs: Number,
    adminName: String,
    createdAt: String,
    isLiveRecent: Boolean // passed from parent based on timestamp age
})

const audioEl = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const isLive = ref(false)

const togglePlay = () => {
    if (!audioEl.value) return
    if (isPlaying.value) {
        audioEl.value.pause()
        audioEl.value.currentTime = 0
        isPlaying.value = false
    } else {
        audioEl.value.play().catch(e => console.error(e))
        isPlaying.value = true
    }
}

const onTimeUpdate = () => {
    if (audioEl.value) currentTime.value = audioEl.value.currentTime
}

const formatTime = (s) => {
    if (!s) return '0:00'
    const sec = Math.floor(s)
    return `0:${sec.toString().padStart(2, '0')}`
}

onMounted(() => {
    // Determine Logic for "LIVE" badge
    // Parent should pass isLiveRecent if msg is < 15s old
    if (props.isLiveRecent) {
        isLive.value = true
        setTimeout(() => isLive.value = false, 4000)
    }
})
</script>

<style scoped>
.voice-drop-msg {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #E1E1E1;
    border: 1px solid #000;
    padding: 6px 8px;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
    position: relative;
    max-width: 300px;
    font-family: 'MS Sans Serif', sans-serif;
}

.is-live {
    border-color: #EA3D3D;
    animation: borderFlash 2s infinite;
}

.live-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #EA3D3D;
    color: #fff;
    font-size: 9px;
    font-weight: bold;
    padding: 2px 4px;
    border: 1px solid #000;
    box-shadow: 1px 1px 0 #000;
    z-index: 5;
    animation: flash 1s infinite;
}

.tape-container {
    display: flex;
    align-items: center;
}

.content-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
}

.admin-name {
    font-weight: bold;
    color: #000;
}

.label {
    color: #666;
    text-transform: uppercase;
    font-size: 9px;
}

.controls-row {
    display: flex;
    align-items: center;
    gap: 8px;
}

.play-btn {
    background: #fff;
    border: 1px solid #404040;
    font-size: 9px;
    font-weight: bold;
    min-width: 36px;
    cursor: pointer;
    padding: 2px;
}

.play-btn:active {
    background: #000;
    color: #fff;
}

.waveform {
    display: flex;
    align-items: flex-end;
    gap: 1px;
    height: 12px;
    width: 60px;
}

.pixel-bar {
    flex: 1;
    background: #999;
    height: 20%;
    transition: height 0.1s;
}

.waveform.playing .pixel-bar {
    background: #5BC8C4;
    animation: eq 0.6s infinite alternate;
}

/* Stagger animations */
.waveform.playing .pixel-bar:nth-child(odd) { animation-duration: 0.4s; }
.waveform.playing .pixel-bar:nth-child(2n) { animation-duration: 0.7s; }

.duration {
    font-size: 10px;
    font-family: monospace;
    color: #333;
}

@keyframes flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes borderFlash {
    0%, 100% { border-color: #EA3D3D; }
    50% { border-color: #E1E1E1; }
}

@keyframes eq {
    0% { height: 20%; }
    100% { height: 100%; }
}
</style>
