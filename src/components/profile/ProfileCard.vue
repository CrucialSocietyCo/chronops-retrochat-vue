<script setup>
import { computed, ref } from 'vue'
import { useProfileCard } from '@/composables/useProfileCard'
import VibeTagPickerModal from '@/components/profile/VibeTagPickerModal.vue'

const props = defineProps({
    currentActorId: {
        type: String, // Needs to be passed down to check ownership
        default: null
    },
    clientId: {
        type: String,
        required: true
    }
})

const { isCardOpen, isLoading, cardData, closeCard, openCard } = useProfileCard()
const showVibePicker = ref(false)

const joinedText = computed(() => {
    if (!cardData.value?.joined_at) return 'Unknown'
    try {
        const date = new Date(cardData.value.joined_at)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        
        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} mins ago`
        
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} hours ago`
        
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} days ago`
    } catch (e) { return 'Unknown' }
})

const isOwner = computed(() => {
   // The backend would need to return the OWNER actor_id for this persona.
   // But wait, the view doesn't expose actor_id (privacy).
   // Spec: "If the current viewer’s actor_id owns this active persona"
   
   // CHANGE OF PLAN: The public view `persona_cards` DOES NOT expose actor_id.
   // Correct implementation: The check should happen by Comparing if the persona_id 
   // matches the 'active' persona of the current user locally? 
   // OR, the `getPersonaCard` endpoint could return `is_owner: true` if the request session matches.
   // Let's assume the endpoint returns `is_owner` computed field.
   
   return cardData.value?.is_owner || false
})

const vibeTag = computed(() => cardData.value?.vibe_tag || 'Just Vibing')
const activityTier = computed(() => cardData.value?.activity_tier || 'New')

const handleVibeSave = (newTag) => {
    // Optimistic update
    if (cardData.value) cardData.value.vibe_tag = newTag
}

defineExpose({ openCard, closeCard })


</script>

<template>
<Teleport to="body">
<Transition name="slide-dock">
<div v-if="isCardOpen" class="overlay-container" @click.self="closeCard">
    <div 
        class="win95-window profile-window side-dock"
    >
        <!-- Title Bar -->
        <div class="title-bar">
            <div class="title-bar-text">User Info</div>
            <button class="close-btn" @click="closeCard">X</button>
        </div>

        <!-- Body -->
        <div class="window-body">
            <div v-if="isLoading">Loading...</div>
            <div v-else-if="!cardData">User not found</div>
            <div v-else class="content-grid">
                
                <div class="row">
                    <span class="label">Name:</span>
                    <span class="value name">{{ cardData.display_name }}</span>
                </div>
                
                <div class="row">
                    <span class="label">Joined:</span>
                    <span class="value">{{ joinedText }}</span>
                </div>

                <div class="row">
                    <span class="label">Status:</span>
                    <span class="value badge">{{ activityTier }}</span>
                </div>
                
                <div class="row">
                    <span class="label">Vibe:</span>
                    <span class="value vibe-pill">{{ vibeTag }}</span>
                </div>

                <div class="row">
                    <span class="label">Presence:</span>
                    <span class="value presence">
                        <span class="dot online">●</span> Online
                        <!-- Basic mock, real presence needs logic -->
                    </span>
                </div>

            </div>

            <!-- Footer Actions -->
            <div class="actions" v-if="cardData && isOwner">
                <button @click="showVibePicker = true">Set Vibe</button>
            </div>
            <!-- Admin Actions Placeholder -->
        </div>

    </div>

    <!-- Modals -->
    <VibeTagPickerModal 
        v-if="showVibePicker"
        :current-vibe="vibeTag"
        :client-id="clientId"
        @close="showVibePicker = false"
        @save="handleVibeSave"
    />
</div>
</Transition>
</Teleport>
</template>

<style scoped>
.overlay-container {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 9900;
    pointer-events: none;
}
.overlay-container > * {
    pointer-events: auto;
}

/* Animation: Slide In From Right */
.slide-dock-enter-active,
.slide-dock-leave-active {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
}

.slide-dock-enter-from,
.slide-dock-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.win95-window.side-dock {
    position: fixed;
    top: 100px;
    right: 20px;
    bottom: auto;
    width: 240px;
    z-index: 10000;
    /* No transform on base state to keep animation clean */
} 

.win95-window {
    background: #c0c0c0;
    border: 2px solid #000; /* Flat border for cleaner look? Or keep retro? User said "clunky" vibe tag, maybe keep window retro but positioning clean. */
    /* Keeping retro window border */
    border-top: 2px solid #dfdfdf;
    border-left: 2px solid #dfdfdf;
    border-right: 2px solid #000000;
    border-bottom: 2px solid #000000;
    box-shadow: -4px 4px 10px rgba(0,0,0,0.2);
    font-family: 'Times New Roman', Times, serif; /* Or MS Sans Serif if imported */
    font-size: 13px;
    color: black;
}

.title-bar {
    background: #000080; /* Classic Blue */
    padding: 2px 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    font-weight: bold;
    font-family: 'Arial', sans-serif; /* Title bar usually sans */
}

.close-btn {
    background: #c0c0c0;
    border-top: 1px solid #dfdfdf;
    border-left: 1px solid #dfdfdf;
    border-right: 1px solid #000000;
    border-bottom: 1px solid #000000;
    width: 14px;
    height: 14px;
    font-size: 10px;
    line-height: 10px;
    padding: 0;
    cursor: pointer;
    font-weight: bold;
}
.close-btn:active {
    border-style: inset;
}

.window-body {
    padding: 6px 8px; /* Tighter padding */
}

.content-grid {
    display: flex;
    flex-direction: column;
    gap: 4px; /* Tighter gap */
}

.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label {
    color: #000; /* Max contrast */
    font-family: 'Verdana', sans-serif; /* Readable but retro-ish */
    font-size: 11px;
}

.value {
    font-weight: bold;
    text-align: right;
    font-family: 'Arial', sans-serif;
}

.vibe-pill {
    background: #008080;
    color: white;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: bold;
    border: 1px solid #004040; /* Flat border, no 3D bezel */
    box-shadow: none;
    text-shadow: none;
    letter-spacing: 0.5px;
}

.presence .online {
    color: #00ff00;
    text-shadow: 0 0 2px #000;
}

.actions {
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1px solid #808080;
    border-bottom: 1px solid #fff;
    display: flex;
    justify-content: center;
}

button {
    background: #c0c0c0;
    border-top: 2px solid #fff;
    border-left: 2px solid #fff;
    border-right: 2px solid #000;
    border-bottom: 2px solid #000;
    padding: 2px 12px;
    cursor: pointer;
    font-family: 'Sysfont', 'Arial', sans-serif;
}
button:active {
    border-top: 2px solid #000;
    border-left: 2px solid #000;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: translate(1px, 1px);
}
</style>
