<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import WindowFrame from './components/WindowFrame.vue'
import ChatInterface from './components/ChatInterface.vue'
import LoginScreen from './components/LoginScreen.vue'

const isLoggedIn = ref(false)
const username = ref('')
const isChatEnabled = ref(true)
const showHistory = ref(true)
const showSponsored = ref(true)
const windowTitle = ref('Arts and Entertainment - Red Dragon Inn')
const eventMode = ref('Live Event')
const colorTheme = ref('Teal Base')
const authToken = ref('')
let pollInterval

const applyTheme = (theme) => {
  console.log('Applying theme:', theme)
  const root = document.documentElement
  const body = document.body
  
  switch (theme) {
    case 'Graphite':
      root.style.setProperty('--bg-color', '#404040')
      root.style.setProperty('--window-bg', '#808080')
      root.style.setProperty('--text-color', '#ffffff')
      body.style.backgroundColor = '#404040'
      break
    case 'Noir Terminal':
      root.style.setProperty('--bg-color', '#000000')
      root.style.setProperty('--window-bg', '#1a1a1a')
      root.style.setProperty('--text-color', '#00ff00')
      body.style.backgroundColor = '#000000'
      break
    case 'CRT Glow':
      root.style.setProperty('--bg-color', '#1a001a')
      root.style.setProperty('--window-bg', '#2b002b')
      root.style.setProperty('--text-color', '#ff00ff')
      body.style.backgroundColor = '#1a001a'
      break
    default: // Teal Base
      console.log('Defaulting to Teal Base')
      root.style.setProperty('--bg-color', '#008080')
      root.style.setProperty('--window-bg', '#c0c0c0')
      root.style.setProperty('--text-color', '#000000')
      body.style.backgroundColor = '#008080'
  }
}


const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const checkAdminAuth = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/admin/auth-check`, {
      credentials: 'include' // Important: Send cookies to backend
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.authenticated) {
        console.log('Admin authenticated via backend session')
        handleLogin('Admin')
      }
    }
  } catch (err) {
    console.error('Failed to check admin auth:', err)
  }
}

const checkChatStatus = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/chat/context`)
    const data = await res.json()
    // console.log('Chat context:', data) // Reduce noise
    
    // Update State
    isChatEnabled.value = data.is_chat_enabled
    showHistory.value = data.show_history
    showSponsored.value = data.show_sponsored !== false // Default true if undefined
    
    // Construct Window Title
    // data.window_title comes from the events table (via chat/context API)
    if (data.window_title) {
        // Show both Window Title and Event Name
        const eName = data.event_name ? `${data.event_name} - ` : ''
        windowTitle.value = `${eName}${data.window_title}`
    } else {
        const appName = "Arts and Entertainment"
        const eventName = data.event_name ? ` - ${data.event_name}` : ''
        const mode = data.chat_mode ? ` [${data.chat_mode}]` : ''
        windowTitle.value = `${appName}${eventName}${mode}`
    }
    
    if (data.chat_mode) eventMode.value = data.chat_mode
    
    // Theme handling
    if (data.color_theme) {
      if (data.color_theme !== colorTheme.value) {
        colorTheme.value = data.color_theme
        applyTheme(data.color_theme)
      }
    }
    
    // Dynamic Favicon
    updateFavicon(isChatEnabled.value)

  } catch (err) {
    console.error('Failed to check chat status:', err)
  }
}

const updateFavicon = (enabled) => {
    const link = document.querySelector("link[rel~='icon']")
    if (!link) return
    
    const activeIcon = '/favicon_chat_active.png'
    const disabledIcon = '/favicon_chat_disabled.jpg'
    
    if (enabled) {
        if (link.href.indexOf(activeIcon) === -1) link.href = activeIcon
    } else {
        if (link.href.indexOf(disabledIcon) === -1) link.href = disabledIcon
    }
}

const handleLogin = (name) => {
  username.value = name
  isLoggedIn.value = true
}

onMounted(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('auth_token')
    if (token) {
        authToken.value = token
        console.log('Captured Auth Token from URL')
        handleLogin('Admin')
    }
  checkAdminAuth()
  checkChatStatus()
  pollInterval = setInterval(checkChatStatus, 1000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <main>
    <LoginScreen 
      v-if="!isLoggedIn" 
      @login="handleLogin" 
      :is-chat-enabled="isChatEnabled"
    />
    <WindowFrame v-else :title="windowTitle" :event-mode="eventMode">
      <ChatInterface 
        :username="username" 
        :is-chat-enabled="isChatEnabled"
        :show-history="showHistory" 
        :show-sponsored="showSponsored"
        :auth-token="authToken"
      />
    </WindowFrame>
  </main>
</template>

<style>
/* Reset and base styles */
:root {
  --bg-color: #008080;
  --window-bg: #c0c0c0;
  --text-color: #000000;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  /* Fixed viewport for mobile "App" feel */
  height: 100dvh; 
  width: 100vw;
  overflow: hidden; /* Prevent body scroll */
  font-family: 'Arial', sans-serif;
  transition: background-color 0.5s ease;
}

#app {
  width: 100%;
  display: flex;
  justify-content: center;
}

main {
  width: 100%;
  max-width: 510px; /* 15% smaller than 600px */
  height: 510px;    /* 15% smaller than 600px */
  /* Fallback height for mobile */
  /* If screen is smaller than 530px height, use almost full height */
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  main {
    max-width: 100%; /* Full width */
    height: 100%;    /* Full Height of the parent (body is 100dvh) */
    margin-bottom: 0;
    /* Optional small padding if desired, but 100% is cleaner "App" look */
  }
  
  #app {
      height: 100%; /* Ensure container is full height */
      align-items: center; /* Center Vertically */
  }
}
</style>
