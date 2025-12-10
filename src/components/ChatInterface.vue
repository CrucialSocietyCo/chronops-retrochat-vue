<script setup>
import { ref } from 'vue'
import ChatHistory from './ChatHistory.vue'
import ChatInput from './ChatInput.vue'

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
  }
})

const historyRef = ref(null)

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
    <ChatHistory ref="historyRef" :show-history="showHistory" />
    <ChatInput 
      :username="username" 
      :is-chat-enabled="isChatEnabled"
      :auth-token="authToken"
      @message-sent="handleMessageSent" 
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
