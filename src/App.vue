<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import WindowFrame from './components/WindowFrame.vue'
import ChatInterface from './components/ChatInterface.vue'
import LoginScreen from './components/LoginScreen.vue'
import PinnedBar from './components/PinnedBar.vue'

const isLoggedIn = ref(false)
const username = ref('')
const isChatEnabled = ref(true)
const showHistory = ref(true)
const showAds = ref(true)
const windowTitle = ref('Arts and Entertainment - Red Dragon Inn')
const eventMode = ref('Live Event')
const colorTheme = ref('teal_base')
const borderStyle = ref('system95')
const badgeStyle = ref('star_icon')
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
}

const normalizeToken = (value) => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/_+/g, '_')
  .replace(/^_|_$/g, '')

const normalizeColorTheme = (value) => {
  const map = {
    teal_base: 'teal_base',
    tealbase: 'teal_base',
    graphite: 'graphite',
    noir_terminal: 'noir_terminal',
    noirterminal: 'noir_terminal',
    crt_glow: 'crt_glow',
    crtglow: 'crt_glow',
    plum: 'plum',
    dragon_fire_cult: 'dragon_fire_cult',
    dragonfirecult: 'dragon_fire_cult'
  }
  return map[normalizeToken(value)] || 'teal_base'
}

const normalizeBorderStyle = (value) => {
  const map = {
    system95: 'system95',
    system_95: 'system95',
    hard_pixel: 'hard_pixel',
    hardpixel: 'hard_pixel',
    slate_shell: 'slate_shell',
    slateshell: 'slate_shell',
    vapor_mesh: 'vapor_mesh',
    vapormesh: 'vapor_mesh'
  }
  return map[normalizeToken(value)] || 'system95'
}

const normalizeAdminBadge = (value) => {
  const map = {
    key_icon: 'key_icon',
    keyicon: 'key_icon',
    star_icon: 'star_icon',
    staricon: 'star_icon',
    system_icon: 'system_icon',
    systemicon: 'system_icon'
  }
  return map[normalizeToken(value)] || 'star_icon'
}

const classSuffix = (value) => value.replace(/_/g, '-')

const readBooleanSetting = (value, fallback = true) => {
    if (value === undefined || value === null) return fallback
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase()
        if (['false', '0', 'off', 'no'].includes(normalized)) return false
        if (['true', '1', 'on', 'yes'].includes(normalized)) return true
    }
    return Boolean(value)
}

const resolveShowAds = (data) => {
    if (Object.prototype.hasOwnProperty.call(data, 'show_ads')) {
        return readBooleanSetting(data.show_ads)
    }
    if (Object.prototype.hasOwnProperty.call(data, 'showAds')) {
        return readBooleanSetting(data.showAds)
    }
    return readBooleanSetting(data.show_sponsored ?? data.showSponsored, true)
}

const applyTheme = ({ color, border, badge } = {}) => {
    const nextColorTheme = normalizeColorTheme(color ?? colorTheme.value)
    const nextBorderStyle = normalizeBorderStyle(border ?? borderStyle.value)
    const nextBadgeStyle = normalizeAdminBadge(badge ?? badgeStyle.value)

    colorTheme.value = nextColorTheme
    borderStyle.value = nextBorderStyle
    badgeStyle.value = nextBadgeStyle

    document.documentElement.dataset.colorTheme = nextColorTheme
    document.documentElement.dataset.borderStyle = nextBorderStyle
    document.documentElement.dataset.adminBadge = nextBadgeStyle

    document.documentElement.classList.remove(
      'color-theme-teal-base',
      'color-theme-graphite',
      'color-theme-noir-terminal',
      'color-theme-crt-glow',
      'color-theme-plum',
      'color-theme-dragon-fire-cult',
      'border-style-system95',
      'border-style-hard-pixel',
      'border-style-slate-shell',
      'border-style-vapor-mesh',
      'theme-dragon-fire-cult'
    )
    document.documentElement.classList.add(
      `color-theme-${classSuffix(nextColorTheme)}`,
      `border-style-${classSuffix(nextBorderStyle)}`
    )

    document.body.classList.remove('theme-dragon-fire-cult')
    if (nextColorTheme === 'dragon_fire_cult') {
      document.documentElement.classList.add('theme-dragon-fire-cult')
      document.body.classList.add('theme-dragon-fire-cult')
    }
}

import { API_BASE } from './config'

const checkAdminAuth = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/admin/auth-check`, {
      credentials: 'include' // Important: Send cookies to backend
    })
    
    if (res.ok) {
      const data = await res.json()
      if (data.authenticated) {
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
    
    // Update State
    isChatEnabled.value = data.is_chat_enabled
    showHistory.value = data.show_history
    showAds.value = resolveShowAds(data)

    console.debug('[chat/context] active event ads setting', {
      show_ads: data.show_ads,
      showAds: data.showAds,
      show_sponsored: data.show_sponsored,
      resolvedShowAds: showAds.value
    })
    
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
    
    applyTheme({
      color: data.color_theme,
      border: data.border_style || data.window_border_style,
      badge: data.admin_badge || data.admin_badge_style
    })
    
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
  
  // Persist to localStorage
  localStorage.setItem('chat_username', name)
  
  // Track Room Join
  trackEvent('room_joined', { source: 'web_client' })
}

onMounted(() => {
    getOrCreateClientId()
    applyTheme()
    const params = new URLSearchParams(window.location.search)
    const token = params.get('auth_token')
    if (token) {
        authToken.value = token
        handleLogin('Admin')
    }
  checkAdminAuth()
  checkChatStatus()
  
  // Auto-login from localStorage
  const savedUser = localStorage.getItem('chat_username')
  if (savedUser && !authToken.value) { // Don't override admin token
      handleLogin(savedUser)
  }

  pollInterval = setInterval(checkChatStatus, 1000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  document.body.classList.remove('theme-dragon-fire-cult')
})
</script>

<template>
  <div class="app-container">
    <PinnedBar />
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
          :show-ads="showAds"
          :auth-token="authToken"
          :client-id="clientId"
          :badge-style="badgeStyle"
        />
      </WindowFrame>
    </main>
  </div>
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
    /* Maximize space on mobile: ~10px spacing */
    max-width: calc(100% - 20px); 
    max-height: calc(100% - 20px);
    height: 100%; /* Will be constrained by max-height */
    margin-bottom: 0;
  }
  
  #app {
      height: 100%;
      align-items: center; /* Center Vertically */
  }
}

.app-container {
    width: 100%;
    max-width: 510px;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center; /* Centers main vertically if height allows */
    align-items: center; /* Fix: Centers contents (chatroom) horizontally on mobile */
}

@media (max-width: 600px) {
    .app-container {
        /* User requested 10% margin top and bottom */
        height: 80%; 
        max-height: 80dvh;
    }
}

/* Ensure main doesn't double margin if container handles it */
main {
    margin-bottom: 0;
}
</style>
