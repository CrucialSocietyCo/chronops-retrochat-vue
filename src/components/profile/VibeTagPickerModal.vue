<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VIBE_TAGS } from '@/constants/vibeTags'
import { API_BASE } from '@/config'

const props = defineProps({
    currentVibe: {
        type: String,
        default: null
    },
    clientId: { // Used for auth/identification headers
        type: String,
        required: true
    }
})

const emit = defineEmits(['close', 'save'])

const searchQuery = ref('')
const selectedTag = ref(props.currentVibe)
const listboxRef = ref(null)

const filteredTags = computed(() => {
    if (!searchQuery.value) return VIBE_TAGS
    const q = searchQuery.value.toLowerCase()
    return VIBE_TAGS.filter(t => t.toLowerCase().includes(q))
})

const selectTag = (tag) => {
    selectedTag.value = tag
}

const handleSave = async () => {
    if (!selectedTag.value) return
    
    try {
        const res = await fetch(`${API_BASE}/api/personas/vibe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-session-id': props.clientId
            },
            body: JSON.stringify({ vibe_tag: selectedTag.value })
        })
        
        if (!res.ok) throw new Error('Failed to save')
        
        const data = await res.json()
        emit('save', selectedTag.value)
        emit('close')
    } catch (e) {
        alert('Error: Could not save vibe tag. Try again.')
        console.error(e)
    }
}

// Keyboard Support
const handleKeydown = (e) => {
    if (e.key === 'Escape') emit('close')
    if (e.key === 'Enter' && selectedTag.value) handleSave()
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
})

</script>

<template>
<div class="modal-overlay" @click.self="$emit('close')">
    <Transition name="win95-pop">
    <div class="win95-window modal-window" v-if="true"> <!-- Always true if parent v-if is true, but needed for transition if toggled -->
        <!-- Title Bar -->
        <div class="title-bar">
            <div class="title-bar-text">
                <span class="icon">🏷️</span> Select Vibe Tag
            </div>
            <div class="title-bar-controls">
                <button aria-label="Close" @click="$emit('close')">X</button>
            </div>
        </div>

        <!-- Body -->
        <div class="window-body">
            <p class="instruction">Choose one tag (shown on your profile card).</p>

            <!-- Search -->
            <div class="field-row">
                <label>Find:</label>
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="type to filter"
                    class="win95-inset"
                    autofocus
                />
            </div>

            <!-- Listbox -->
            <div class="listbox win95-inset" ref="listboxRef">
                <div 
                    v-for="tag in filteredTags" 
                    :key="tag"
                    class="list-item"
                    :class="{ selected: selectedTag === tag }"
                    @click="selectTag(tag)"
                >
                    {{ tag }}
                </div>
            </div>

            <!-- Preview -->
            <div class="field-row preview-row">
                <label>Preview:</label>
                <div class="win95-inset preview-box">
                    <span v-if="selectedTag">You’ll show as: <strong>{{ selectedTag }}</strong></span>
                    <span v-else class="placeholder">Select a tag...</span>
                </div>
            </div>

            <!-- Footer Buttons -->
            <div class="button-row">
                <button @click="handleSave" :disabled="!selectedTag">OK</button>
                <button @click="$emit('close')">Cancel</button>
            </div>
            
            <div class="clear-link">
                <button class="link-btn" @click="() => { selectedTag = null; handleSave(); }">[ Clear ]</button>
            </div>
        </div>
    </div>
    </Transition>
</div>
</template>

<style scoped>
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

/* Animation */
.win95-pop-enter-active,
.win95-pop-leave-active {
  transition: opacity 0.15s ease-out, transform 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.win95-pop-enter-from,
.win95-pop-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.win95-window {
    background: #c0c0c0;
    border-top: 2px solid #dfdfdf;
    border-left: 2px solid #dfdfdf;
    border-right: 2px solid #000000;
    border-bottom: 2px solid #000000;
    box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    width: 360px;
    max-width: 92vw;
    display: flex;
    flex-direction: column;
    font-family: 'Arial', sans-serif;
    font-size: 13px;
}

.title-bar {
    background: #000080; /* System Blue */
    color: white;
    padding: 2px 3px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}

.title-bar-controls button {
    background: #c0c0c0;
    border-top: 1px solid #dfdfdf;
    border-left: 1px solid #dfdfdf;
    border-right: 1px solid #000000;
    border-bottom: 1px solid #000000;
    width: 16px;
    height: 14px;
    font-size: 10px;
    line-height: 10px;
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;
    padding: 0;
}
.title-bar-controls button:active {
    border-top: 1px solid #000000;
    border-left: 1px solid #000000;
    border-right: 1px solid #dfdfdf;
    border-bottom: 1px solid #dfdfdf;
}

.window-body {
    padding: 12px;
}

.instruction {
    margin: 0 0 10px 0;
}

.field-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.win95-inset {
    background: white;
    border-top: 2px solid #808080;
    border-left: 2px solid #808080;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
    padding: 2px 4px;
}

.field-row input {
    flex-grow: 1;
    border: none;
    outline: none;
    padding: 3px;
    font-family: inherit;
    background: transparent;
}

.listbox {
    height: 180px;
    overflow-y: scroll; /* Always show scrollbar track like Win95 */
    margin-bottom: 10px;
    background: white;
}

.list-item {
    padding: 2px 4px;
    cursor: default;
    user-select: none;
}

.list-item:hover {
    background: #e0e0e0; /* Minimal hover */
}

.list-item.selected {
    background: #000080;
    color: white;
}

.preview-box {
    flex-grow: 1;
    background: #f0f0f0;
    color: #444;
}

.button-row {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
}

button {
    min-width: 70px;
    padding: 4px 12px;
    background: #c0c0c0;
    border-top: 2px solid #ffffff;
    border-left: 2px solid #ffffff;
    border-right: 2px solid #000000;
    border-bottom: 2px solid #000000;
    cursor: pointer;
    font-family: inherit;
}

button:active, button:disabled:active {
    border-top: 2px solid #000000;
    border-left: 2px solid #000000;
    border-right: 2px solid #ffffff;
    border-bottom: 2px solid #ffffff;
    transform: translate(1px, 1px);
}

button:disabled {
    color: #808080;
    text-shadow: 1px 1px white;
}

.link-btn {
    border: none;
    background: none;
    padding: 0;
    min-width: 0;
    color: #555;
    font-size: 10px;
    margin-top: -20px; /* Hacky placement to match bottom left requirement */
    position: absolute;
    bottom: 16px;
    left: 12px;
}
.link-btn:active {
    border: none; 
    transform: none;
    color: black;
}
</style>
