<template>
  <div class="auth-container">
    <div class="auth-form">
      <h2>{{ formTitle }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Email владельца</label>
          <input 
            type="email" 
            v-model="email" 
            required 
            placeholder="Введите email"
            :disabled="isEmailConfirmed"
          />
        </div>

        <div v-if="isEmailConfirmed && isFirstLogin" class="form-group">
          <label>Придумайте пароль</label>
          <input 
            type="password" 
            v-model="password" 
            required 
            placeholder="Введите пароль"
            minlength="8"
          />
        </div>

        <div v-if="isEmailConfirmed && !isFirstLogin" class="form-group">
          <label>Пароль</label>
          <input 
            type="password" 
            v-model="password" 
            required 
            placeholder="Введите пароль"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="isSubmitting">
          {{ submitButtonText }}
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'

export default defineComponent({
  name: 'AuthForm',
  setup() {
    const email = ref('')
    const password = ref('')
    const isEmailConfirmed = ref(false)
    const isFirstLogin = ref(false)
    const error = ref('')
    const isSubmitting = ref(false)

    const formTitle = computed(() => {
      if (!isEmailConfirmed.value) return 'Вход в систему'
      return isFirstLogin.value 
        ? 'Придумайте пароль' 
        : 'Введите пароль'
    })

    const submitButtonText = computed(() => {
      if (!isEmailConfirmed.value) return 'Продолжить'
      return isFirstLogin.value 
        ? 'Установить пароль' 
        : 'Войти'
    })

    const handleSubmit = async () => {
      error.value = ''
      isSubmitting.value = true

      try {
        if (!isEmailConfirmed.value) {
          // Проверка email
          const response = await fetch('http://localhost:8000/api/auth/first-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.value })
          })

          const result = await response.json()

          if (!response.ok) {
            error.value = result.message
            return
          }

          isEmailConfirmed.value = true
          isFirstLogin.value = result.isNewUser
        } else {
          // Логин или установка пароля
          const endpoint = isFirstLogin.value 
            ? 'http://localhost:8000/api/auth/set-password'
            : 'http://localhost:8000/api/auth/login'

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              email: email.value, 
              password: password.value 
            })
          })

          const result = await response.json()

          if (!response.ok) {
            error.value = result.message
            return
          }

          // Успешная авторизация
          alert(`Добро пожаловать, ${result.gymName}!`)
          // TODO: Добавить переход в личный кабинет
        }
      } catch (e) {
        error.value = 'Произошла ошибка. Попробуйте снова.'
        console.error(e)
      } finally {
        isSubmitting.value = false
      }
    }

    return {
      email,
      password,
      isEmailConfirmed,
      isFirstLogin,
      error,
      isSubmitting,
      formTitle,
      submitButtonText,
      handleSubmit
    }
  }
})
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.auth-form {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

input:disabled {
  background-color: #f9f9f9;
  cursor: not-allowed;
}

button {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  margin-bottom: 15px;
  text-align: center;
}
</style> 