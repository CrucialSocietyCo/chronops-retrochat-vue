<script setup>
import { ref } from 'vue'

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
  }
})

const emit = defineEmits(['message-sent'])
const inputRef = ref(null)

const sendMessage = async () => {
  if (!props.isChatEnabled) return
  if (!inputRef.value) return
  
  // Get content (innerHTML for formatting, innerText for empty check)
  const content = inputRef.value.innerHTML
  const textContent = inputRef.value.innerText

  if (!textContent.trim() && !content.includes('<img')) return // Allow images if we had them, but mostly check text

  // Optimistic update
  inputRef.value.innerHTML = ''
  emit('message-sent', content)


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (props.authToken) {
      headers['Authorization'] = `Bearer ${props.authToken}`
    }

    const res = await fetch(`${API_BASE}/api/messages`, {
      method: 'POST',
      headers,
      credentials: 'include', // Important: Send auth cookies
      body: JSON.stringify({
        content: content,
        sender: props.username
      })
    })

    if (!res.ok) {
      const data = await res.json()
      // ALERT THE RAW ERROR FOR DEBUGGING
      alert(`Message Failed: ${data.statusMessage || data.error || 'Unknown Error'} \n\nDetails: ${JSON.stringify(data.data || {})}`)
    }
  } catch (err) {
    console.error('Failed to send message:', err)
    alert(`Network/Client Error: ${err.message}`)
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
      <button class="send-btn" @click="sendMessage" :disabled="!isChatEnabled">Send</button>
    </div>
    <div 
      ref="inputRef" 
      class="input-box" 
      :contenteditable="isChatEnabled" 
      @keydown.enter.prevent="sendMessage"
      :style="{ backgroundColor: isChatEnabled ? '#ffffff' : '#f0f0f0', cursor: isChatEnabled ? 'text' : 'not-allowed' }"
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
