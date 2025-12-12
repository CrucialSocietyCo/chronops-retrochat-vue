<script setup>
import { computed } from 'vue'

const props = defineProps({
    counts: { type: Object, default: () => ({}) },
    myReactions: { type: Set, default: () => new Set() }
})

const emit = defineEmits(['toggle'])

const EMOJI_MAP = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
    shock: '😮',
    angry: '😡',
    eyes: '👀'
}

const activePills = computed(() => {
    // Return array of { type, count, hasReacted }
    const list = []
    for (const [type, count] of Object.entries(props.counts)) {
        if (count > 0) {
            list.push({
                type,
                count,
                emoji: EMOJI_MAP[type] || '❓',
                hasReacted: props.myReactions.has(type)
            })
        }
    }
    // Sort logic could go here (e.g. by count), but default order is fine or sorted by type
    return list
})
</script>

<template>
  <div class="reaction-pills" v-if="activePills.length > 0">
    <button 
        v-for="pill in activePills" 
        :key="pill.type"
        class="pill"
        :class="{ active: pill.hasReacted }"
        @click.stop="emit('toggle', pill.type)"
    >
        {{ pill.emoji }} <span class="count">{{ pill.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.reaction-pills {
    display: inline-flex;
    flex-wrap: nowrap;
    gap: 3px;
    margin-left: 6px;
    vertical-align: middle;
}

.pill {
    background: transparent;
    border: 1px solid transparent;
    border-radius: 2px;
    
    font-family: 'Arial', sans-serif;
    font-size: 10px;
    padding: 0 2px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    color: #555;
    line-height: normal;
}

.pill.active {
    background: #e6e6ff;
    border: 1px dotted #000080;
    color: #000080;
}

.pill:hover {
    background: #e0e0e0;
    border: 1px solid #c0c0c0;
    color: #000;
}

.count {
    font-size: 9px;
    opacity: 0.8;
}
</style>
