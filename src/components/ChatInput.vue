<script setup>
import { ref, computed } from 'vue'
import RetroModal from './RetroModal.vue'

const props = defineProps({
  username: {
    type: String,
    required: true
  },
  isChatEnabled: {
    type: Boolean,
    default: true
  },
  authToken: {
    type: String,
    default: ''
  },
  clientId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['message-sent'])
const inputRef = ref(null)

// Modal State
const showModal = ref(false)
const modalTitle = ref('')
const modalMessage = ref('')
const modalType = ref('info')
const modalTimer = ref(0)
let timerInterval = null

const triggerModal = (title, message, type = 'info', durationSeconds = 0) => {
    modalTitle.value = title
    modalMessage.value = message
    modalType.value = type
    showModal.value = true

    if (timerInterval) clearInterval(timerInterval)
    modalTimer.value = durationSeconds
    
    if (durationSeconds > 0) {
        timerInterval = setInterval(() => {
            modalTimer.value--
            if (modalTimer.value <= 0) clearInterval(timerInterval)
        }, 1000)
    }
}

// Moderation State
const moderationLock = ref(false)
const lockExpiry = ref(null)
const moderationReason = ref('')
const lockRemainingSeconds = ref(0)
let lockTimer = null

const LOCK_STORAGE_KEY = 'chat_moderation_lock'
import { onMounted } from 'vue'

const startLockCountdown = (expiresAt) => {
    const expiresDate = new Date(expiresAt)
    moderationLock.value = true
    lockExpiry.value = expiresDate
    
    // Save to Checkpoint
    localStorage.setItem(LOCK_STORAGE_KEY, JSON.stringify({
        expiresAt: expiresAt,
        reason: moderationReason.value || 'Temporarily disabled'
    }))
    
    // Initial calc
    const now = new Date()
    lockRemainingSeconds.value = Math.max(0, Math.ceil((expiresDate - now) / 1000))
    
    if (lockTimer) clearInterval(lockTimer)
    
    lockTimer = setInterval(() => {
        const now = new Date()
        const diff = Math.ceil((lockExpiry.value - now) / 1000)
        lockRemainingSeconds.value = Math.max(0, diff)

        if (now >= lockExpiry.value) {
            moderationLock.value = false
            moderationReason.value = ''
            lockRemainingSeconds.value = 0
            localStorage.removeItem(LOCK_STORAGE_KEY)
            clearInterval(lockTimer)
            lockTimer = null
        }
    }, 1000)
}

onMounted(() => {
    const savedLock = localStorage.getItem(LOCK_STORAGE_KEY)
    if (savedLock) {
        try {
            const { expiresAt, reason } = JSON.parse(savedLock)
            const expiry = new Date(expiresAt)
            if (expiry > new Date()) {
                moderationReason.value = reason
                startLockCountdown(expiry)
            } else {
                localStorage.removeItem(LOCK_STORAGE_KEY)
            }
        } catch (e) {
            console.error('Failed to parse saved lock', e)
        }
    }
})

const isInputActive = computed(() => props.isChatEnabled && !moderationLock.value)
const placeholderText = computed(() => {
    if (moderationLock.value) {
        let text = `Muted: ${moderationReason.value || 'Temporarily disabled'}`
        if (lockRemainingSeconds.value > 0) {
            text += ` (${lockRemainingSeconds.value}s)`
        }
        return text
    }
    return ''
})

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const executeCommand = async (command, args) => {
  if (!props.authToken) {
    triggerModal('Access Denied', 'You must be an admin to use commands.', 'error')
    return
  }

  const [targetUsername, durationOrReason, ...reasonParts] = args
  const reason = reasonParts.join(' ') || (durationOrReason && !durationOrReason.match(/^\d+[mh]$/) ? durationOrReason : 'No reason provided')

  let endpoint = ''
  let body = {}

  if (command === '/mute') {
    endpoint = '/api/moderation/mute'
    body = { targetUsername, duration: durationOrReason, reason }
  } else if (command === '/unmute') {
    endpoint = '/api/moderation/unmute'
    body = { targetUsername }
  } else if (command === '/ban') {
    endpoint = '/api/moderation/ban'
    body = { targetUsername, reason: durationOrReason + ' ' + reason }
  } else {
    triggerModal('Error', 'Unknown command', 'error')
    return
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${props.authToken}`
      },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.statusMessage || data.message || 'Command failed')
    
    triggerModal('Success', data.message, 'info')
  } catch (err) {
    triggerModal('Command Failed', err.message, 'error')
  }
}

const sendMessage = async () => {
  if (!props.isChatEnabled) return
  if (!inputRef.value) return
  
  // Get content (innerHTML for formatting, innerText for command check)
  const content = inputRef.value.innerHTML
  const textContent = inputRef.value.innerText.trim()

  if (!textContent && !content.includes('<img')) return 

  // Check for commands
  if (textContent.startsWith('/')) {
    const parts = textContent.split(' ')
    const command = parts[0]
    const args = parts.slice(1)
    
    if (['/mute', '/unmute', '/ban'].includes(command)) {
      await executeCommand(command, args)
      inputRef.value.innerHTML = '' // Clear input
      return
    }
  }

  // Optimistic update
  inputRef.value.innerHTML = ''
  emit('message-sent', content)

  try {
    const headers = { 
      'Content-Type': 'application/json',
      'x-client-id': props.clientId,
      'x-session-id': props.clientId 
    }
    if (props.authToken) {
      headers['Authorization'] = `Bearer ${props.authToken}`
    }

    const res = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers,
      credentials: 'include', 
      body: JSON.stringify({
        content: content,
        sender: props.username
      })
    })

    if (!res.ok) {
      const data = await res.json()
      
      // Handle Moderation Errors Niceley
      if (data.data?.code === 'RATE_LIMITED') {
          // Calculate remaining time
          const expires = new Date(data.data.expires_at)
          const now = new Date()
          const diffSeconds = Math.ceil((expires - now) / 1000)
          
          triggerModal('System Alert', data.data.message, 'error', diffSeconds > 0 ? diffSeconds : 0)
          moderationReason.value = "Rate Limited"
          startLockCountdown(data.data.expires_at)

      } else if (data.data?.code === 'BANNED') {
           triggerModal('BANNED', data.data.message, 'error')
           moderationLock.value = true
           moderationReason.value = "Banned"

      } else if (data.data?.code === 'MUTED') {
           triggerModal('Muted', data.data.message, 'warning')
           // If we had expiry here we could use it, assume perm or untimed for now unless logic updated
           // Actually backend sends expires_at for mutes too now
           if (data.data.expires_at) {
               startLockCountdown(data.data.expires_at)
           } else {
               moderationLock.value = true // Permanent/Indefinite
           }
           moderationReason.value = "Muted"

      } else if (data.data?.code === 'MESSAGE_TOO_LONG') {
         triggerModal('Message Rejected', data.data.message, 'warning')
      } else if (data.data?.code === 'CONTENT_BLOCKED') {
         triggerModal('Content Filter', data.data.message, 'warning')
      } else {
         triggerModal('Error', data.statusMessage || 'Unknown Error', 'error')
      }
    }
  } catch (err) {
    console.error('Failed to send message:', err)
    triggerModal('Network Error', err.message, 'error')
  }
}

const showEmoticons = ref(false)
// Generate array of 100 local emoticon paths
const emoticons = Array.from({ length: 244 }, (_, i) => `/emoticons/smiley_${i}.png`)
const emoticonPickerRef = ref(null)
const emoticonButtonRef = ref(null)

const toggleEmoticons = () => {
  showEmoticons.value = !showEmoticons.value
  if (showEmoticons.value) {
    showGifPicker.value = false // Close other picker
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
}

const insertEmoticon = (url) => {
  if (!inputRef.value) return
  inputRef.value.focus()
  document.execCommand('insertImage', false, url)
  showEmoticons.value = false
  document.removeEventListener('click', handleClickOutside)
}

const formatText = (command) => {
  document.execCommand(command, false, null)
  if (inputRef.value) inputRef.value.focus()
}

const changeFont = (event) => {
  const font = event.target.value
  document.execCommand('fontName', false, font)
  if (inputRef.value) inputRef.value.focus()
}

const showGifPicker = ref(false)
const gifSearchQuery = ref('')
const gifResults = ref([])
const gifPickerRef = ref(null)
const gifButtonRef = ref(null)

const toggleGifPicker = () => {
  showGifPicker.value = !showGifPicker.value
  if (showGifPicker.value) {
    showEmoticons.value = false // Close other picker
    // Load trending if empty
    if (gifResults.value.length === 0) searchGifs()
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
}

const handleClickOutside = (event) => {
  // Check GIF picker
  if (showGifPicker.value && 
      gifPickerRef.value && !gifPickerRef.value.contains(event.target) && 
      gifButtonRef.value && !gifButtonRef.value.contains(event.target)) {
    showGifPicker.value = false
  }
  
  // Check Emoticon picker
  if (showEmoticons.value && 
      emoticonPickerRef.value && !emoticonPickerRef.value.contains(event.target) && 
      emoticonButtonRef.value && !emoticonButtonRef.value.contains(event.target)) {
    showEmoticons.value = false
  }

  // Remove listener if both are closed
  if (!showGifPicker.value && !showEmoticons.value) {
    document.removeEventListener('click', handleClickOutside)
  }
}

const searchGifs = async () => {
  const query = gifSearchQuery.value || 'trending'
  const key = 'LIVDSRZULELA' // Legacy public key
  try {
    const res = await fetch(`https://g.tenor.com/v1/search?q=${query}&key=${key}&limit=10`)
    const data = await res.json()
    gifResults.value = data.results
  } catch (err) {
    console.error('Failed to fetch GIFs:', err)
  }
}

const insertGif = (url) => {
  if (!inputRef.value) return
  inputRef.value.focus()
  // Insert image with max-height style and class for targeting
  const html = `<img src="${url}" class="chat-gif" style="max-height: 26px;">`
  document.execCommand('insertHTML', false, html)
  showGifPicker.value = false
  document.removeEventListener('click', handleClickOutside)
}
</script>

<template>
  <div class="chat-input-area">
    <RetroModal 
      v-model="showModal" 
      :title="modalTitle" 
      :message="modalMessage" 
      :type="modalType"
      :timer="modalTimer"
    />
    <div class="toolbar">
      <select class="font-select" @change="changeFont" :disabled="!isChatEnabled">
        <option value="Arial">Arial</option>
        <option value="'Courier Prime', monospace">Courier Prime</option>
        <option value="'VT323', monospace">VT323</option>
        <option value="'Press Start 2P', cursive">Press Start 2P</option>
        <option value="'Comic Neue', cursive">Comic Neue</option>
      </select>
      <div class="format-buttons">
        <button @click="formatText('bold')" :disabled="!isChatEnabled">B</button>
        <button @click="formatText('italic')" :disabled="!isChatEnabled">I</button>
        <button @click="formatText('underline')" :disabled="!isChatEnabled">U</button>
        <div class="gif-wrapper">
          <button ref="gifButtonRef" @click="toggleGifPicker" title="Insert GIF" :disabled="!isChatEnabled">GIF</button>
          <div v-if="showGifPicker" ref="gifPickerRef" class="gif-picker">
            <input 
              v-model="gifSearchQuery" 
              @keydown.enter.prevent="searchGifs"
              placeholder="Search GIFs..." 
              class="gif-search"
            />
            <div class="gif-results">
              <img 
                v-for="(gif, index) in gifResults" 
                :key="index" 
                :src="gif.media[0].tinygif.url" 
                @click="insertGif(gif.media[0].tinygif.url)"
                class="gif-option"
              />
            </div>
          </div>
        </div>
        <div class="emoticon-wrapper">
          <button ref="emoticonButtonRef" @click="toggleEmoticons" class="icon-btn" :disabled="!isChatEnabled">
            <img src="/emoticon_button.png" alt="Emoticons" />
          </button>
          <div v-if="showEmoticons" ref="emoticonPickerRef" class="emoticon-picker">
            <img 
              v-for="(url, index) in emoticons" 
              :key="index" 
              :src="url" 
              @click="insertEmoticon(url)"
              class="emoticon-option"
            />
          </div>
        </div>
      </div>
      <button class="send-btn" @click="sendMessage" :disabled="!isInputActive">Send</button>
    </div>
    <div 
      ref="inputRef" 
      class="input-box" 
      :contenteditable="isInputActive" 
      @keydown.enter.prevent="sendMessage"
      :style="{ 
        backgroundColor: isInputActive ? '#ffffff' : '#e0e0e0', 
        cursor: isInputActive ? 'text' : 'not-allowed',
        color: isInputActive ? 'inherit' : '#808080'
      }"
      :data-placeholder="placeholderText" 
    ></div>
  </div>
</template>

<style scoped>
/* ... existing styles ... */
.gif-wrapper {
  position: relative;
  display: inline-block;
}

.gif-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #c0c0c0;
  border: 2px solid #dfdfdf;
  border-right-color: #404040;
  border-bottom-color: #404040;
  box-shadow: 1px 1px 0 0 #000;
  padding: 4px;
  width: 220px;
  z-index: 101;
}

.gif-search {
  width: 100%;
  margin-bottom: 4px;
  padding: 2px;
  font-size: 12px;
  border: 2px inset #ffffff;
}

.gif-results {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.gif-option {
  width: 100%;
  height: 80px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid transparent;
}

.gif-option:hover {
  border: 1px dotted #000;
}

.emoticon-wrapper {
  position: relative;
  display: inline-block;
}

.emoticon-picker {
  position: absolute;
  bottom: 100%;
  left: 0;
  background: #c0c0c0;
  border: 2px solid #dfdfdf;
  border-right-color: #404040;
  border-bottom-color: #404040;
  box-shadow: 1px 1px 0 0 #000;
  padding: 4px;
  display: grid;
  grid-template-columns: repeat(10, 1fr); /* Increased columns for 100 icons */
  gap: 2px;
  width: 320px; /* Increased width to prevent horizontal scrollbar */
  max-height: 200px; /* Scrollable if needed */
  overflow-y: scroll; /* Force vertical scrollbar */
  overflow-x: hidden; /* Hide horizontal scrollbar */
  z-index: 100;
}

.emoticon-option {
  width: 24px;
  height: 24px;
  cursor: pointer;
  border: 1px solid transparent;
}

.emoticon-option:hover {
  border: 1px dotted #000;
  background: white;
}

.emoticon-picker::-webkit-scrollbar {
  width: 16px;
}

.emoticon-picker::-webkit-scrollbar-track {
  background: #c0c0c0;
}

.emoticon-picker::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border: 1px outset #ffffff;
  box-shadow: inset -1px -1px #404040;
}

.emoticon-picker::-webkit-scrollbar-button {
  background: #c0c0c0;
  border: 1px outset #ffffff;
  box-shadow: inset -1px -1px #404040;
  width: 16px;
  height: 16px;
  display: block;
}
</style>

<style scoped>
.chat-input-area {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toolbar {
  display: flex;
  gap: 4px;
  align-items: center;
  background: #f0f0f0; /* Default button face color */
  padding: 2px;
  border-bottom: 1px solid #c0c0c0;
}

.font-select {
  height: 22px;
  font-size: 11px;
  border: 2px inset #ffffff;
  border-right-color: #dfdfdf;
  border-bottom-color: #dfdfdf;
}

.format-buttons {
  display: flex;
  gap: 2px;
}

.format-buttons button {
  min-width: 22px; /* Changed from fixed width to min-width to accommodate "GIF" text */
  height: 22px;
  background: #f0f0f0;
  border: 1px outset #ffffff;
  box-shadow: inset -1px -1px #404040;
  font-weight: bold;
  font-family: 'Times New Roman', serif;
  font-size: 14px;
  cursor: pointer;
  padding: 0 2px; /* Add padding for text buttons */
}

.format-buttons button:active {
  border-style: inset;
}

.icon-btn {
  padding: 1px !important; /* Override default padding */
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn img {
  width: 16px;
  height: 16px;
  display: block;
}

.send-btn {
  margin-left: auto;
  padding: 2px 12px;
  background: #f0f0f0;
  border: 2px outset #ffffff;
  box-shadow: inset -1px -1px #404040;
  font-family: 'Arial', sans-serif;
  font-size: 12px;
  cursor: pointer;
}

.send-btn:active {
  border-style: inset;
}

.input-box {
  flex-grow: 1;
  height: 68px; /* Increased by ~13% from 60px */
  background: #ffffff; /* White background as requested */
  /* Classic Windows 95 "Sunken" Field */
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  box-shadow: 
    inset 2px 2px 0 0 #000000,
    inset -2px -2px 0 0 #c0c0c0;
  padding: 4px;
  font-family: 'Arial', sans-serif;
  font-size: 13px;
  resize: none;
  outline: none;
  overflow-y: auto;
}

.input-box:empty:not(:focus):before {
  content: attr(data-placeholder);
  color: #ff0000;
  font-style: italic;
  font-weight: bold;
}

.input-box :deep(img) {
  max-width: 24px;
  max-height: 24px;
  vertical-align: middle;
}

.input-box :deep(img.chat-gif) {
  max-width: 36px;
  max-height: 26px;
}
</style>
