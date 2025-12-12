<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import ChatHistory from './ChatHistory.vue'
import ChatInput from './ChatInput.vue'
import JoinBannerRow from './JoinBannerRow.vue'
import TypingIndicatorRow from './TypingIndicatorRow.vue'
import { useJoinBanner } from '../composables/useJoinBanner.js'
import { useTyping } from '../composables/useTyping.js'
import { createClient } from '@supabase/supabase-js'

const props = defineProps({
  username: {
    type: String,
    required: true
  },
  isChatEnabled: {
    type: Boolean,
    default: true
  },
  showHistory: {
    type: Boolean,
    default: true
  },
  showSponsored: {
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
  },
  badgeStyle: {
    type: String,
    default: 'Star Icon'
  }
})

const historyRef = ref(null)
const { joinBanner, handleUserJoined } = useJoinBanner()
const { isTypingVisible, startTyping, handleTypingUpdate } = useTyping(props.authToken, props.clientId)

// Realtime Setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
let supabase = null
let channel = null

onMounted(async () => {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey)
    
    // Subscribe to room
    channel = supabase.channel('room:general')
    
    channel
      .on('broadcast', { event: 'user_joined' }, (payload) => {
        handleUserJoined(payload.payload)
      })
      .on('broadcast', { event: 'typing_update' }, (payload) => {
        handleTypingUpdate(payload.payload.activeUserIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
           // Emit my join event
           await channel.send({
             type: 'broadcast',
             event: 'user_joined',
             payload: {
               user_id: props.clientId, // Use clientId as anonymous user_id
               username: props.username,
               joined_at: new Date().toISOString()
             }
           })
        }
      })
  } else {
    console.warn('Supabase URL/Key missing. Join Banner disabled.')
  }
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

const handleMessageSent = (text) => {
  if (historyRef.value) {
    // If authToken is present, we are admin
    const isAdmin = !!props.authToken
    historyRef.value.addMessage(text, props.username, isAdmin)
    
    // We expect the backend to have the message available eventually
    // The historyRef.value.fetchMessages() call will be debounced by ChatHistory's 2s guard anyway
    historyRef.value.fetchMessages()
  }
}
</script>

<template>
  <div class="chat-interface">
    <ChatHistory ref="historyRef" :show-history="showHistory" :client-id="clientId" :badge-style="badgeStyle" />
    <JoinBannerRow :banner="joinBanner" />
    <TypingIndicatorRow :is-visible="isTypingVisible" />
    <ChatInput 
      :username="username" 
      :is-chat-enabled="isChatEnabled"
      :auth-token="authToken"
      :client-id="clientId"
      :is-admin="!!authToken"
      @message-sent="handleMessageSent" 
      @typing="startTyping"
    />
    <div v-if="showSponsored" class="text-ad-container">
      <div class="text-ad">
        <div class="ad-header">SPONSORED LINKS</div>
        <div class="ad-body">
          <span class="arrow">➤</span>
          <span class="ad-content"><b>Visit</b> Our website <b>HBCUSociety</b>Co<b>.com</b>. <a href="http://hbcusocietyco.com" target="_blank">Click here</a></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 4px;
}

.text-ad-container {
  border: 2px solid #dfdfdf;
  border-right-color: #404040;
  border-bottom-color: #404040;
  background: #c0c0c0;
  padding: 4px;
  margin-top: 2px;
}

.text-ad {
  background: #ffffff;
  border: 1px solid #000000;
  font-family: 'Verdana', sans-serif;
  display: flex;
  flex-direction: column;
}

.ad-header {
  background: #000080;
  color: white;
  padding: 2px 4px;
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
}

.ad-body {
  padding: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #ffffcc; /* Retro ad yellow */
  font-size: 11px;
}

.arrow {
  color: #ff0000;
  font-size: 10px;
}

.ad-content a {
  color: #0000ff;
  text-decoration: underline;
}
</style>
