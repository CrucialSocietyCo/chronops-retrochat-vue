<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const welcomeMessages = [
  "*** Did you know? The first computer programmer was a woman named Ada Lovelace. ***",
  "*** Life Hack: Use a binder clip to organize your cables and keep them from falling off your desk. ***",
  "*** Black History Fact: Garrett Morgan invented the three-position traffic signal in 1923. ***",
  "*** Quote: 'The only way to do great work is to love what you do.' - Steve Jobs ***",
  "*** Life Hack: Put your phone in a cup to amplify the sound like a speaker. ***",
  "*** Black History Fact: Shirley Chisholm was the first African American woman elected to Congress in 1968. ***",
  "*** Quote: 'It always seems impossible until it is done.' - Nelson Mandela ***",
  "*** Did you know? Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old. ***",
  "*** Life Hack: Use a spring from an old pen to protect your phone charger from bending and breaking. ***",
  "*** Black History Fact: Dr. Mae Jemison was the first African American woman to travel in space in 1992. ***"
]

const getRandomWelcome = () => {
  const index = Math.floor(Math.random() * welcomeMessages.length)
  return welcomeMessages[index]
}

const welcomeMessage = {
  id: 'welcome',
  sender: 'OnlineHost',
  content: getRandomWelcome(),
  type: 'system'
}

const messages = ref([welcomeMessage])
let pollInterval
let lastLocalUpdate = 0
let lastMessageTime = 0 // Track the internal latest timestamp
const sessionStart = Date.now()

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const fetchMessages = async () => {
  // Skip fetching if we updated locally recently
  if (Date.now() - lastLocalUpdate < 2000) return

  try {
    // Poll since the last known message time (minus small buffer for safety)
    const pollTime = lastMessageTime > 0 ? lastMessageTime - 100 : 0
    const res = await fetch(`${API_BASE}/api/messages?since=${pollTime}`)
    if (res.ok) {
      const newMessages = await res.json()
      console.log(`[ChatHistory] Polling: sent ${pollTime}, got ${newMessages.length} messages`)
      
      if (newMessages.length > 0) {
          // If we have new messages, append them (filtering duplicates if necessary)
          // For simplicity, assuming backend returns strictly newer messages
          
          // Initial Load Case (since == 0)
          if (lastMessageTime === 0) {
               messages.value = [welcomeMessage, ...newMessages]
          } else {
               // Append only
               // Dedup based on ID just in case
               const newUnique = newMessages.filter(nm => !messages.value.find(m => m.id === nm.id))
               messages.value = [...messages.value, ...newUnique]
          }

          // Trigger Scroll
          scrollToBottom()

          // Update timestamp from the very last message in the NEW batch
          // Be careful with sorting. Backend returns reverse?
          // messages.get.ts: return messages.reverse() -> So they are Oldest -> Newest.
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg && lastMsg.created_at) {
              const ts = new Date(lastMsg.created_at).getTime()
              if (ts > lastMessageTime) lastMessageTime = ts
          }
      } else if (lastMessageTime === 0) {
          // Explicitly empty history on first load if returned []
          messages.value = [welcomeMessage]
      }
    }
  } catch (err) {
    console.error('Failed to fetch messages:', err)
  }
}

const props = defineProps({
  showHistory: {
    type: Boolean,
    default: true
  }
})

// ...

// Watch for history toggle
import { watch } from 'vue' // Ensure watch is imported

watch(() => props.showHistory, (newVal, oldVal) => {
    console.log(`[ChatHistory] Show History changed: ${oldVal} -> ${newVal}`)
    if (newVal === false) {
        // History hidden: Clear messages (keep welcome?)
        messages.value = [welcomeMessage]
        // We do NOT reset lastMessageTime because we still want to receive NEW realtime messages?
        // Actually, if history is hidden, we might still want to see *future* messages.
        // But if we hide history, the *visible* list should be cleared.
    } else {
        // History shown: Refetch all (since=0)
        lastMessageTime = 0
        fetchMessages()
    }
})

onMounted(() => {
  fetchMessages()
  pollInterval = setInterval(fetchMessages, 1000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})

const addMessage = (text, sender, isAdmin = false) => {
  lastLocalUpdate = Date.now()
  messages.value.push({
    id: Date.now(), // Temp ID
    content: text, // Changed from 'text' to 'content' to match DB schema if possible, or mapping
    sender,
    isAdmin,
    type: 'user'
  })
  // Scroll to bottom
  scrollToBottom()
}

const scrollToBottom = () => {
  setTimeout(() => {
    const container = document.querySelector('.chat-history')
    if (container) container.scrollTop = container.scrollHeight
  }, 0)
}

defineExpose({
  fetchMessages,
  addMessage,
  scrollToBottom
})
</script>

<template>
  <div class="chat-history">
    <div v-for="msg in messages" :key="msg.id" class="message-line">
      <span class="sender" :class="{ system: msg.type === 'system', admin: msg.isAdmin }">
        <span v-if="msg.isAdmin" class="admin-star">★ </span>
        {{ msg.sender }}:
      </span>
      <span class="content" :class="{ system: msg.type === 'system', admin: msg.isAdmin }" v-html="msg.content || msg.text"></span>
    </div>
  </div>
</template>

<style scoped>
.chat-history {
  flex-grow: 1;
  background: white;
  border: 2px solid #808080;
  border-right-color: #ffffff;
  border-bottom-color: #ffffff;
  box-shadow: inset 1px 1px 0 0 #000;
  overflow-y: scroll; /* Always show scrollbar */
  padding: 4px;
  font-family: 'Arial', sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

.message-line {
  margin-bottom: 2px;
}

.sender {
  font-weight: bold;
  color: blue;
  margin-right: 4px;
}

.sender.system {
  color: blue;
}

.sender.admin {
  color: #ff0000;
  text-shadow: 0.5px 0 0 #ff0000; /* Faux bold */
}

.admin-star {
  color: #ffd700;
  text-shadow: 1px 1px 0 #000;
}

.content {
  color: black;
}

.content.system {
  color: black;
}

.content.admin {
  color: #8b0000;
  font-weight: bold;
}

.content :deep(img) {
  max-width: 24px;
  max-height: 24px;
  vertical-align: middle;
}

.content :deep(img.chat-gif) {
  max-width: 72px;
  max-height: 72px;
  border-radius: 4px;
}
</style>
