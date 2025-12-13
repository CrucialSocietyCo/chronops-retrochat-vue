import { ref, reactive } from 'vue'
import { API_BASE } from '@/config'

const isCardOpen = ref(false)
const isLoading = ref(false)
const activePersonaId = ref(null)
const cardPosition = reactive({ top: 0, left: 0 })
const cardData = ref(null)

export function useProfileCard() {

    const openCard = async (personaId) => {
        if (!personaId) return

        // Position Logic REMOVED for Side Dock Layout
        // The CSS in ProfileCard.vue will handle fixed positioning.

        activePersonaId.value = personaId
        isCardOpen.value = true
        isLoading.value = true
        cardData.value = null

        try {
            const res = await fetch(`${API_BASE}/api/personas/${personaId}`)
            if (res.ok) {
                cardData.value = await res.json()
            } else {
                console.error('[useProfileCard] Failed to fetch persona card')
                // Optional: show error state or close
            }
        } catch (e) {
            console.error('[useProfileCard] Fetch Error:', e)
        } finally {
            isLoading.value = false
        }
    }

    const closeCard = () => {
        isCardOpen.value = false
        activePersonaId.value = null
    }

    return {
        isCardOpen,
        isLoading,
        activePersonaId,
        cardPosition,
        cardData,
        openCard,
        closeCard
    }
}
