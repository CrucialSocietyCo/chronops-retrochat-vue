<script setup>
defineProps({
  banner: {
    type: Object,
    default: null
  }
})
</script>

<template>
  <Transition name="banner-slide">
    <div v-if="banner" class="join-banner-row">
      <span class="icon">👋</span>
      <span class="text">
        <span class="username">@{{ banner.username }}</span> entered the room
      </span>
    </div>
  </Transition>
</template>

<style scoped>
.join-banner-row {
  margin-top: 4px;
  margin-bottom: 2px;
  padding: 4px 8px;
  background-color: #e0e0e0;
  border: 1px solid #808080;
  border-radius: 0;
  box-shadow: 
    inset 1px 1px 0 #ffffff,
    inset -1px -1px 0 #404040;
  
  display: flex;
  align-items: center;
  gap: 8px;
  
  font-family: 'Verdana', sans-serif;
  font-size: 11px;
  color: #404040;
}

.icon {
  font-size: 12px;
}

.username {
  font-weight: bold;
  color: #000080; /* Retro Navy */
}

/* Animations */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: all 0.3s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(-5px);
  margin-bottom: -30px; /* Collapse space */
}
</style>
