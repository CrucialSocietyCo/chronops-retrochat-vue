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
const clientId = ref('')
let pollInterval

const getOrCreateClientId = () => {
    let id = localStorage.getItem('chat_client_id')
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : 'client-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
        localStorage.setItem('chat_client_id', id)
    }
    clientId.value = id
    console.log('Client ID:', id)
}

const applyTheme = (theme) => {
    // ...
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
    } else if (res.status === 401) {
        // Expected for normal users, fail silently
    } else {
        // Real error
        console.warn('Admin auth check failed:', res.status)
    }
  } catch (err) {
    // Network errors, etc
    console.debug('Failed to check admin auth (network):', err)
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

const trackEvent = async (eventType, payload = {}) => {
  try {
    await fetch(`${API_BASE}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken.value ? { 'Authorization': `Bearer ${authToken.value}` } : {})
      },
      body: JSON.stringify({
        event_type: eventType,
        payload: {
           username: username.value,
           ...payload
        }
      })
    })
  } catch (err) {
    // Fail silently for analytics
    console.warn('Tracking failed', err)
  }
}

const handleLogin = (name) => {
  username.value = name
  isLoggedIn.value = true
  
  // Track Room Join
  trackEvent('room_joined', { source: 'web_client' })
}

onMounted(() => {
    getOrCreateClientId()
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
        :client-id="clientId"
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
    /* Create ~30px spacing around the dialog */
    max-width: calc(100% - 60px); 
    max-height: calc(100% - 60px);
    height: 100%; /* Will be constrained by max-height */
    margin-bottom: 0;
  }
  
  #app {
      height: 100%;
      align-items: center; /* Center Vertically */
  }
}
</style>
