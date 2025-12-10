<script setup>
import { ref } from 'vue'

const props = defineProps({
  isChatEnabled: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['login'])
const username = ref('')
const error = ref('')

const validateAndLogin = () => {
  if (!props.isChatEnabled) return

  const name = username.value.trim()
  
  // Reset error
  error.value = ''

  // Validation rules
  if (name.length < 3) {
    error.value = 'Username must be at least 3 characters.'
    return
  }

  if (!/^[a-zA-Z0-9]+$/.test(name)) {
    error.value = 'Username must contain only letters and numbers.'
    return
  }

  const lowerName = name.toLowerCase()
  if (lowerName === 'admin' || lowerName === 'onlinehost') {
    error.value = 'That username is reserved.'
    return
  }

  // Success
  emit('login', name)
}
</script>

<template>
  <div class="login-screen">
    <div class="login-window">
      <div class="title-bar">
        <div class="title-bar-text">Welcome to Red Dragon Inn</div>
      </div>
      <div class="window-body">
        <div class="login-content">
          <p class="instruction">Please enter your screen name:</p>
          <input 
            v-model="username" 
            @keydown.enter="validateAndLogin"
            type="text" 
            class="username-input"
            placeholder="Screen Name"
            maxlength="16"
            :disabled="!isChatEnabled"
          />
          <div v-if="!isChatEnabled" class="error-message text-danger">
            Chat is currently disabled by admin.
          </div>
          <div v-else-if="error" class="error-message">{{ error }}</div>
          
          <div class="button-container">
            <button 
              class="enter-button" 
              @click="validateAndLogin"
              :disabled="!isChatEnabled"
            >
              Enter
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.login-window {
  background: #c0c0c0;
  border: 2px solid #dfdfdf;
  border-right-color: #404040;
  border-bottom-color: #404040;
  box-shadow: 1px 1px 0 0 #000;
  padding: 2px;
  width: 300px;
  font-family: 'Arial', sans-serif;
}

.title-bar {
  background: linear-gradient(90deg, #000080, #1084d0);
  padding: 3px 2px;
  margin-bottom: 2px;
}

.title-bar-text {
  color: white;
  font-weight: bold;
  font-size: 13px;
  margin-left: 2px;
}

.window-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.instruction {
  margin: 0 0 10px 0;
  font-size: 14px;
}

.username-input {
  width: 100%;
  padding: 4px;
  margin-bottom: 10px;
  border: 2px solid #808080;
  border-right-color: #ffffff;
  border-bottom-color: #ffffff;
  box-shadow: inset 1px 1px 0 0 #000;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
}

.error-message {
  color: red;
  font-size: 12px;
  margin-bottom: 10px;
  text-align: center;
}

.button-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.enter-button {
  background: #c0c0c0;
  border: 2px solid #dfdfdf;
  border-right-color: #404040;
  border-bottom-color: #404040;
  box-shadow: 1px 1px 0 0 #000;
  padding: 4px 16px;
  font-family: 'Arial', sans-serif;
  font-size: 14px;
  cursor: pointer;
  min-width: 80px;
}

.enter-button:active {
  border: 2px solid #404040;
  border-right-color: #dfdfdf;
  border-bottom-color: #dfdfdf;
  transform: translate(1px, 1px);
}
</style>
