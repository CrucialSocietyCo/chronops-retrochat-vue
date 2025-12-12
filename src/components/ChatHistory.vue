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
const historyRef = ref(null)
const isAtBottom = ref(true)
const hasUnreadMessages = ref(false)

const handleScroll = (e) => {
    const el = e.target
    // Check if we are close to bottom - User wants to catch it sooner
    const bottomThreshold = 150 
    const currentlyAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < bottomThreshold
    
    isAtBottom.value = currentlyAtBottom
    
    // If we scroll to bottom, clear unread flag
    if (currentlyAtBottom) {
        hasUnreadMessages.value = false
    }
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000'

const fetchMessages = async () => {
  // Skip fetching if we updated locally recently
  if (Date.now() - lastLocalUpdate < 2000) return

  try {
    // Poll since the last known message time (minus small buffer for safety)
    const pollTime = lastMessageTime > 0 ? lastMessageTime - 100 : 0
    // Include Client ID header for reaction personalization
    const res = await fetch(`${API_BASE}/api/messages?since=${pollTime}`, {
        headers: {
            'x-session-id': props.clientId
        }
    })

    if (res.ok) {
      const newMessages = await res.json()
      console.log(`[ChatHistory] Polling: sent ${pollTime}, got ${newMessages.length} messages`)
      
      if (newMessages.length > 0) {
          // Process Reactions for ALL fetched messages (Initial or New)
          newMessages.forEach(msg => {
            if (msg.reactions) {
                reactionCounts[msg.id] = msg.reactions.counts
                myReactions[msg.id] = new Set(msg.reactions.myReactions)
            }
          })

          // If we have new messages, append them
          
          // Initial Load Case (since == 0)
          if (lastMessageTime === 0) {
               // We want to insert history after Welcome, but keep any optimistic messages we typed while loading
               const existingOptimistic = messages.value.filter(m => m.id !== 'welcome')
               
               // Filter out optimistic messages that might match new server messages (basic dedup by content/sender)
               const filteredOptimistic = existingOptimistic.filter(optimistic => {
                   const isDuplicate = newMessages.some(serverMsg => 
                       serverMsg.content === optimistic.content && 
                       serverMsg.sender === optimistic.sender
                   )
                   return !isDuplicate
               })

               messages.value = [welcomeMessage, ...newMessages, ...filteredOptimistic]
                // Trigger Scroll Forcefully on load
               scrollToBottom(true)
          } else {
               // Append only
               // Dedup: Filter out BOTH server duplicates (by ID) AND server equivalents of local optimistic messages
               const reallyNew = []
               
               for (const serverMsg of newMessages) {
                   // 1. Check if we already have this ID (Standard Dedup)
                   if (messages.value.some(m => m.id === serverMsg.id)) continue
                   
                   // 2. Check if this replaces an optimistic message (Pending + Same Content/Sender)
                   const optimisticIndex = messages.value.findIndex(m => 
                       m.pending === true &&
                       m.sender.toLowerCase() === serverMsg.sender.toLowerCase() &&
                       m.content.trim() === serverMsg.content.trim()
                   )

                   if (optimisticIndex !== -1) {
                       // FOUND OPTIMISTIC MATCH!
                       messages.value[optimisticIndex] = serverMsg
                       // We don't push to reallyNew
                   } else {
                       // Truly new message from someone else
                       reallyNew.push(serverMsg)
                   }
               }
               
               if (reallyNew.length > 0) {
                   messages.value = [...messages.value, ...reallyNew]
                   // Only scroll if we added new items
                   if (isAtBottom.value) {
                       scrollToBottom()
                   } else {
                       hasUnreadMessages.value = true
                   }
               }
          }

          // Update timestamp from the very last message in the NEW batch
          const lastMsg = newMessages[newMessages.length - 1]
          if (lastMsg && lastMsg.created_at) {
              const ts = new Date(lastMsg.created_at).getTime()
              if (ts > lastMessageTime) lastMessageTime = ts
          }
      } 
      // Removed the 'else if (lastMessageTime === 0)' block which cleared messages to [welcome]

    }
  } catch (err) {
    console.error('Failed to fetch messages:', err)
  }
}

const props = defineProps({
  showHistory: {
    type: Boolean,
    default: true
  },
  clientId: {
    type: String,
    required: false
  },
  badgeStyle: {
    type: String,
    default: 'Star Icon'
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
    content: text, 
    sender,
    isAdmin,
    type: 'user',
    pending: true // Mark as pending for deduplication
  })
  // Scroll to bottom
  scrollToBottom()
}

const scrollToBottom = (force = false) => {
  setTimeout(() => {
    const container = historyRef.value
    if (!container) return
    
    // Check if user is near the bottom (within 100px)
    // If they are scrolling up (>100px from bottom), DO NOT disturb them.
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    
    if (force || isNearBottom) {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
        })
    }
  }, 0)
}

defineExpose({
  fetchMessages,
  addMessage,
  scrollToBottom
})

/* --- REACTIONS LOGIC --- */
import { reactive, computed } from 'vue'
import { supabase } from '../lib/supabase'
import ReactionPills from './ReactionPills.vue'
import ReactionPalette from './ReactionPalette.vue'

// Determine if mobile (simple check)
const isMobile = window.matchMedia("(max-width: 768px)").matches

const activePalette = ref(null)
const hoveredMessageId = ref(null)
const reactionCounts = reactive({}) // msgId -> { like: 0, ... }
const myReactions = reactive({}) // msgId -> Set('like', 'love')

const badgeIcon = computed(() => {
    switch (props.badgeStyle) {
        case 'Key Icon': return '🔑'
        case 'System Icon': return '🛡️'
        case 'Star Icon':
        default: return '★'
    }
})

const openPalette = (event, messageId) => {
    const rect = event.target.getBoundingClientRect()
    // Open to the right of the button
    activePalette.value = {
        messageId,
        position: {
            top: rect.top - 8, // Align vertically center-ish
            left: rect.right + 5 // Beside it
        }
    }
}

const toggleReaction = async (messageId, type) => {
    // Optimistic Update
    if (!reactionCounts[messageId]) reactionCounts[messageId] = {}
    if (!myReactions[messageId]) myReactions[messageId] = new Set()

    const mySet = myReactions[messageId]
    const currentCount = reactionCounts[messageId][type] || 0
    const isRemoving = mySet.has(type)

    // Update Local State
    if (isRemoving) {
        mySet.delete(type)
        reactionCounts[messageId][type] = Math.max(0, currentCount - 1)
    } else {
        mySet.add(type)
        reactionCounts[messageId][type] = currentCount + 1
    }

    // Call API
    try {
        const endpoint = isRemoving ? '/api/reactions/remove' : '/api/reactions/add'
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-session-id': props.clientId // Use Client ID as Session ID
            },
            body: JSON.stringify({ messageId, reactionType: type })
        })

        if (!res.ok) throw new Error('Reaction failed')

        // If success, we *could* update from response, but realtime will handle authoritative sync
    } catch (e) {
        console.error('Reaction toggle failed', e)
        // Rollback
        if (isRemoving) {
            mySet.add(type)
            reactionCounts[messageId][type] = currentCount
        } else {
            mySet.delete(type)
            reactionCounts[messageId][type] = currentCount
        }
    }
}

// Subscribe to Reaction Updates
onMounted(() => {
    if (supabase) {
        const channel = supabase.channel('room:global')
        channel.on('broadcast', { event: 'reaction_update' }, ({ payload }) => {
            // Apply authoritative counts
            reactionCounts[payload.messageId] = payload.counts
        }).subscribe()
    }
})
</script>

<template>
  <div class="history-wrapper">
    <div ref="historyRef" class="chat-history" @scroll="handleScroll">
      <div 
        v-for="msg in messages" 
        :key="msg.id" 
        class="message-line" 
        :class="{ 'admin-line': msg.isAdmin, 'system-line': msg.type === 'system' }"
        @mouseenter="hoveredMessageId = msg.id"
        @mouseleave="hoveredMessageId = null"
      >
        <span class="sender" :class="{ system: msg.type === 'system', admin: msg.isAdmin }">
          <span v-if="msg.isAdmin" class="admin-star">{{ badgeIcon }} </span>
          {{ msg.sender }}:
        </span>
        <span class="content" :class="{ system: msg.type === 'system' }" v-html="msg.content || msg.text"></span>
        
        <!-- Inline Reactions -->
        <ReactionPills 
            :counts="reactionCounts[msg.id] || {}"
            :my-reactions="myReactions[msg.id] || new Set()"
            @toggle="(type) => toggleReaction(msg.id, type)"
        />

        <!-- Hover Add Button (Inline) -->
        <button 
            v-if="hoveredMessageId === msg.id && msg.type !== 'system'" 
            class="add-reaction-btn"
            @click.stop="openPalette($event, msg.id)"
            title="React"
        >
            +
        </button>
      </div>
    </div>
    
    <Transition name="pop-up">
        <button 
            v-if="!isAtBottom" 
            class="jump-btn" 
            :class="{ 'has-new': hasUnreadMessages }"
            @click="scrollToBottom(true)"
            :title="hasUnreadMessages ? 'New Messages' : 'Scroll to Bottom'"
        >
            <span v-if="hasUnreadMessages">New!</span>
            <span v-else>▼</span>
        </button>
    </Transition>

    <ReactionPalette 
        v-if="activePalette"
        :message-id="activePalette.messageId"
        :my-reactions="myReactions[activePalette.messageId] || new Set()"
        :position="activePalette.position"
        @select="(type) => toggleReaction(activePalette.messageId, type)"
        @close="activePalette = null"
    />
  </div>
</template>

<style scoped>
.history-wrapper {
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-history {
  flex-grow: 1;
  background: white;
  /* Classic Windows 95 "Sunken" Field */
  border-top: 2px solid #808080;
  border-left: 2px solid #808080;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  box-shadow: 
    inset 2px 2px 0 0 #000000,
    inset -2px -2px 0 0 #c0c0c0;
  overflow-y: scroll; /* Always show scrollbar */
  padding: 4px;
  font-family: 'Arial', sans-serif;
  font-size: 13px;
  line-height: 1.4;
}

.message-line {
    position: relative; /* Anchor for absolute button */
}

.add-reaction-btn {
    display: inline-block;
    position: absolute; /* Float on top */
    left: 0;
    top: 2px; /* Align with text roughly */
    margin-left: 0; /* Clear previous margin */
    background: rgba(255, 255, 255, 0.9); /* Semi-transparent background to make button readable over text? User said floats on top ok. Let's stick to transparent first or maybe slight bg. */
    background: transparent; 
    border: none;
    color: #999;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 4px;
    opacity: 0.8; /* More visible since it overlays */
    z-index: 10;
}

/* Use Smiley Face */
.add-reaction-btn::before {
    content: '☺'; 
    margin-right: -2px; /* Pull + closer to ☺ */
}

@media (hover: hover) {
    .add-reaction-btn:hover {
        color: #444; /* Darker than #999 */
        opacity: 1;
        background: transparent;
        /* Removed font-weight: bold */
    }
}
/* Active state for mobile touch feedback */
.add-reaction-btn:active {
    color: #000;
    opacity: 1;
}
.add-reaction-btn::after {
    content: none;
}

.message-line.admin-line {
  background-color: #fffbdd; /* Subtle yellow highlight */
  border-top: 1px dotted #e0e0e0;
  border-bottom: 1px dotted #e0e0e0;
  margin-top: 2px;
  padding: 2px 0;
}

.sender {
  font-weight: bold;
  color: blue;
  margin-right: 4px;
}

.message-line.system-line {
  background-color: #f8f8ff; /* GhostWhite */
  border-left: 3px solid #6A5ACD; /* SlateBlue */
  padding-left: 6px; /* Offset text slightly */
  margin-bottom: 4px;
}

.sender.system {
  color: #6A5ACD; /* SlateBlue */
}

.sender.system::before {
  content: "✨ ";
}

.sender.admin {
  color: #cc0000; /* Slightly darker red */
  text-shadow: none;
}

.admin-star {
  color: #ffaa00;
  text-shadow: none;
  font-size: 11px;
}

.content {
  color: black;
}

.content.system {
  color: black;
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

.jump-btn {
  position: absolute;
  bottom: 15px; /* Increased margin from bottom */
  right: 30px; /* Increased margin from right */
  width: 25px; /* Smaller size (less "padding") */
  height: 25px;
  background: #c0c0c0;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  border-right: 2px solid #000000;
  border-bottom: 2px solid #000000;
  box-shadow: 1px 1px 0px 0px #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace, sans-serif;
  font-size: 11px; /* Smaller font for smaller button */
  cursor: pointer;
  z-index: 100;
  color: #000;
  image-rendering: pixelated;
}

.jump-btn:active {
  background: #c0c0c0;
  border-top: 2px solid #000000;
  border-left: 2px solid #000000;
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: translate(1px, 1px);
  box-shadow: none;
}

.jump-btn:hover {
  background: #e0e0e0;
}

.jump-btn.has-new {
  background: #ffff00; /* Hot Yellow */
  color: red;
  border-color: #000;
  /* Hard blinking effect */
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { background: #ff0000; color: #ffff00; }
}

/* Transition Styles */
.pop-up-enter-active,
.pop-up-leave-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.pop-up-enter-from,
.pop-up-leave-to {
  opacity: 0;
  transform: scale(0.5) translateY(20px);
}

.jump-btn.has-new {
  color: red;
  border-color: #ff0000; /* Red border for urgency */
  /* No background change, just icon/border color */
}

.jump-btn:active {
  border-style: inset;
}
</style>
