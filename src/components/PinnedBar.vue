<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

const items = ref([])
const activeIndex = ref(0)
const autoRotateTimer = ref(null)

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
        if (activeItems.value.length < 2) return 

        activeIndex.value = (activeIndex.value + 1) % activeItems.value.length
    }, 4000)
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
  <div v-if="activeItems.length > 0" class="pinned-bar-container">
      <div class="pinned-strip">
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
          
          <div class="controls" v-if="activeItems.length > 1">
             <span class="indicator">
                 {{ activeIndex + 1 }}/{{ activeItems.length }}
             </span>
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

@media (max-width: 600px) {
    .pinned-bar-container {
        width: calc(100% - 20px);
        margin-left: auto;
        margin-right: auto;
    }
}

.pinned-strip {
    height: 32px;
    background: #c0c0c0; /* Windows 95 Grey */
    border: 2px outset #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    user-select: none;
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

</style>
