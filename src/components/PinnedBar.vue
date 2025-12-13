<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

const items = ref([])
const activeIndex = ref(0)
const isExpanded = ref(false)
const autoRotateTimer = ref(null)
const collapseTimer = ref(null)

const activeItems = computed(() => {
    // Client-side filter for start/end time
    const now = new Date()
    return items.value.filter(i => {
       if (!i.is_active) return false
       if (i.start_time && new Date(i.start_time) > now) return false
       if (i.end_time && new Date(i.end_time) < now) return false
       return true
    })
})

const currentItem = computed(() => activeItems.value[activeIndex.value] || null)

// Fetch initial data
const fetchPinnedItems = async () => {
    // In a real Nuxt/Vue app we might use a shared store or API proxy
    // Direct Supabase select for simplicity in this retro app
    const { data } = await supabase
        .from('pinned_items')
        .select('*')
        .order('order_index', { ascending: true })
    
    if (data) items.value = data
}

// Rotation Logic
const startRotation = () => {
    if (autoRotateTimer.value) clearInterval(autoRotateTimer.value)
    
    autoRotateTimer.value = setInterval(() => {
        if (isExpanded.value) return // Don't rotate while reading list
        if (activeItems.value.length < 2) return 

        activeIndex.value = (activeIndex.value + 1) % activeItems.value.length
    }, 4000)
}

// Auto Collapse Logic
const resetCollapseTimer = () => {
    if (collapseTimer.value) clearTimeout(collapseTimer.value)
    if (!isExpanded.value) return

    collapseTimer.value = setTimeout(() => {
        isExpanded.value = false
    }, 6000)
}

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
    if (isExpanded.value) {
        resetCollapseTimer()
    } else {
        if (collapseTimer.value) clearTimeout(collapseTimer.value)
    }
}

// Realtime Config
let subscription = null

onMounted(async () => {
    await fetchPinnedItems()
    startRotation()
    
    subscription = supabase
        .channel('public:pinned_items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pinned_items' }, (payload) => {
            // Refresh full list to keep order correct
            fetchPinnedItems().then(() => {
                 // Reset index if out of bounds
                 if (activeIndex.value >= activeItems.value.length) activeIndex.value = 0
            })
        })
        .subscribe()
})

onUnmounted(() => {
    if (autoRotateTimer.value) clearInterval(autoRotateTimer.value)
    if (collapseTimer.value) clearTimeout(collapseTimer.value)
    if (subscription) supabase.removeChannel(subscription)
})

// Helpers
const getIcon = (type) => {
    switch(type) {
        case 'rules': return '📋'
        case 'daily_topic': return '💡'
        case 'announcement': return '📢'
        case 'featured_link': return '🔗'
        default: return '📌'
    }
}
</script>

<template>
  <div v-if="activeItems.length > 0" class="pinned-bar-container" :class="{ expanded: isExpanded }" @mouseenter="resetCollapseTimer">
      <!-- Minimized Bar -->
      <div class="pinned-strip" @click="toggleExpand">
          <div class="strip-content" v-if="currentItem">
              <span class="icon">{{ getIcon(currentItem.type) }}</span>
              <span class="label" v-if="currentItem.type === 'rules'">RULES:</span>
              <span class="label" v-else-if="currentItem.type === 'daily_topic'">TOPIC:</span>
              <span class="label" v-else-if="currentItem.type === 'announcement'" style="color:red">ALERT:</span>
              
              <div class="text-scroller">
                  <span v-if="currentItem.type === 'featured_link'">
                    <a :href="currentItem.content.url" target="_blank" @click.stop>{{ currentItem.content.title || currentItem.content.url }}</a>
                  </span>
                  <span v-else>{{ currentItem.content.text }}</span>
              </div>
          </div>
          
          <div class="controls">
             <span class="indicator" v-if="activeItems.length > 1">
                 {{ activeIndex + 1 }}/{{ activeItems.length }}
             </span>
             <button class="expand-btn">{{ isExpanded ? '▲' : '▼' }}</button>
          </div>
      </div>

      <!-- Expanded Drawer -->
      <div v-if="isExpanded" class="pinned-drawer">
         <div v-for="item in activeItems" :key="item.id" class="drawer-item" :class="{ 'highlight': item.type === 'announcement' }">
             <div class="drawer-icon">{{ getIcon(item.type) }}</div>
             <div class="drawer-content">
                 <div class="drawer-header">
                    <span class="drawer-type">{{ item.type.replace('_', ' ').toUpperCase() }}</span>
                    <span v-if="item.type === 'featured_link'" class="drawer-emoji">{{ item.content.emoji }}</span>
                 </div>
                 
                 <div class="drawer-body">
                    <a v-if="item.type === 'featured_link'" :href="item.content.url" target="_blank" class="featured-link-btn">
                       {{ item.content.title || 'Visit Link' }}
                    </a>
                    <span v-else>{{ item.content.text }}</span>
                 </div>
             </div>
         </div>
      </div>
  </div>
</template>

<style scoped>
.pinned-bar-container {
    position: relative;
    width: 100%;
    z-index: 90;
    margin-bottom: 4px;
    font-family: 'Arial', sans-serif;
    font-size: 13px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.pinned-strip {
    height: 32px;
    background: #c0c0c0; /* Windows 95 Grey */
    border: 2px outset #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    cursor: pointer;
    user-select: none;
}

.pinned-strip:active {
    border-style: inset;
}

.strip-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
}

.icon { font-size: 16px; flex-shrink: 0; }
.label { font-weight: bold; font-size: 11px; flex-shrink: 0; }

.text-scroller {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
}

.controls {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    flex-shrink: 0; /* Protect controls from shrinking on mobile */
}

.expand-btn {
    width: 20px;
    height: 20px;
    background: #c0c0c0;
    border: 1px outset #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 10px;
}

.expand-btn:active { border-style: inset; }

/* Drawer */
.pinned-drawer {
    position: absolute;
    top: 30px;
    left: 0;
    right: 0;
    background: #fff;
    border: 2px solid #000080;
    border-top: none;
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.drawer-item {
    display: flex;
    gap: 10px;
    padding: 8px;
    border: 1px solid #ccc;
    background: #fdfdfd;
}

.drawer-item.highlight {
    background: #fffbe6;
    border-color: #f59e0b;
}

.drawer-icon {
    font-size: 20px;
    width: 30px;
    text-align: center;
}

.drawer-content {
    flex: 1;
}

.drawer-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.drawer-type {
    font-size: 10px;
    background: #000080;
    color: white;
    padding: 2px 4px;
    border-radius: 2px;
}

.drawer-body {
    font-size: 13px;
    line-height: 1.4;
    color: #333;
}

.featured-link-btn {
    display: inline-block;
    padding: 4px 12px;
    background: #000080;
    color: white;
    text-decoration: none;
    font-weight: bold;
    border: 2px outset #fff;
    box-shadow: 1px 1px 0 #000;
}

.featured-link-btn:active {
    border-style: inset;
}
</style>
