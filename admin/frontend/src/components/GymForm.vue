<template>
  <div class="gym-form-container">
    <h2>{{ isEditMode ? 'Редактирование студии' : 'Добавление фитнес-студии' }}</h2>
    <form @submit.prevent="submitForm" class="gym-form">
      <div class="form-group">
        <label>Название студии</label>
        <input 
          v-model="formData.name" 
          type="text" 
          required 
          placeholder="Введите название студии"
        />
      </div>

      <div class="form-group">
        <label>Телефон</label>
        <input 
          v-model="formData.phone" 
          type="tel" 
          required 
          placeholder="+7 (___) ___-__-__"
        />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input 
          v-model="formData.email" 
          type="email" 
          required 
          placeholder="example@email.com"
        />
      </div>

      <div class="form-group port-input-group">
        <label>Порт сервера</label>
        <div class="port-input-wrapper">
          <div class="port-input-container">
            <input 
              v-model.number="formData.port" 
              type="number" 
              min="1024" 
              max="65535"
              placeholder="Автоматический"
              class="port-input"
            />
            <div class="port-input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="M9 12l2 2 4-4"></path>
              </svg>
            </div>
          </div>
          <small class="port-hint">
            Диапазон 1024-65535. Оставьте пустым для автоматического назначения.
          </small>
        </div>
      </div>

      <div class="form-group">
        <label>Услуги</label>
        <div class="services-container">
          <label v-for="service in services" :key="service" class="service-item">
            <input 
              type="checkbox" 
              :value="service" 
              v-model="formData.selectedServices"
            />
            {{ service }}
          </label>
        </div>
      </div>

      <div v-if="isEditMode" class="form-group server-status">
        <label>Статус сервера</label>
        <div class="status-controls">
          <div 
            class="server-toggle" 
            :class="{ 
              'is-running': formData.status === 'running', 
              'disabled': isServerActionInProgress 
            }"
            @click="toggleServerStatus"
          >
            <div class="server-toggle-handle"></div>
            <span class="server-toggle-label">
              {{ formData.status === 'running' ? 'Сервер запущен' : 'Сервер остановлен' }}
            </span>
            <div v-if="isServerActionInProgress" class="loading-overlay">
              <div class="spinner"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="submit-btn" :disabled="isSubmitting">
          {{ isEditMode ? 'Сохранить изменения' : 'Добавить студию' }}
        </button>
        <button 
          v-if="isEditMode" 
          type="button" 
          class="reset-btn" 
          @click="resetForm"
        >
          Отмена
        </button>
        <button 
          v-if="!isEditMode" 
          type="button" 
          class="reset-btn" 
          @click="resetForm"
        >
          Очистить
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'
import { Gym } from './GymList.vue'

const props = defineProps<{
  initialGym?: Gym
}>()

const emit = defineEmits(['gym-updated', 'edit-cancelled'])

const services = [
  'Тренажерный зал',
  'Групповые занятия',
  'Бассейн',
  'Йога',
  'Кардио-зона',
  'Массаж',
  'Сауна'
]

const isEditMode = ref(!!props.initialGym)

const formData = ref<Gym>({
  _id: props.initialGym?._id || '',
  name: props.initialGym?.name || '',
  phone: props.initialGym?.phone || '',
  email: props.initialGym?.email || '',
  services: props.initialGym?.services || [],
  selectedServices: props.initialGym?.services || [],
  status: props.initialGym?.status || 'stopped',
  port: props.initialGym?.port || null
})

const isSubmitting = ref(false)
const isServerActionInProgress = ref(false)
const error = ref('')

const toggleServerStatus = async () => {
  if (!formData.value._id) return

  try {
    isServerActionInProgress.value = true
    const action = formData.value.status === 'running' ? 'stop' : 'start'
    
    const response = await fetch(`http://localhost:8000/api/gyms/${formData.value._id}/server`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action })
    })

    if (!response.ok) {
      throw new Error('Не удалось изменить статус сервера')
    }

    const result = await response.json()
    formData.value.status = result.status
    
    // Обновляем родительский компонент
    emit('gym-updated', { ...formData.value })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Произошла ошибка при управлении сервером'
  } finally {
    isServerActionInProgress.value = false
  }
}

const createGym = async (data: Gym) => {
  const response = await fetch('http://localhost:8000/api/gyms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email,
      services: data.selectedServices,
      port: data.port
    })
  })

  if (!response.ok) {
    throw new Error('Ошибка при создании студии')
  }

  return response.json()
}

const updateGym = async (data: Gym) => {
  const response = await fetch(`http://localhost:8000/api/gyms/${data._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email,
      services: data.selectedServices,
      status: data.status,
      port: data.port
    })
  })

  if (!response.ok) {
    throw new Error('Ошибка при обновлении студии')
  }

  return response.json()
}

const submitForm = async () => {
  try {
    isSubmitting.value = true
    error.value = ''
    
    const gymData = {
      ...formData.value,
      services: formData.value.selectedServices
    }

    if (isEditMode.value) {
      await updateGym(gymData)
      emit('gym-updated', gymData)
      alert('Студия успешно обновлена!')
    } else {
      await createGym(gymData)
      resetForm()
      alert('Студия успешно создана!')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Произошла ошибка'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  if (isEditMode.value) {
    emit('edit-cancelled')
  } else {
    formData.value = {
      _id: '',
      name: '',
      phone: '',
      email: '',
      services: [],
      selectedServices: [],
      status: 'stopped',
      port: null
    }
  }
  error.value = ''
}
</script>

<style scoped>
.gym-form-container {
  max-width: 600px;
  margin: 0 auto;
}

.gym-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

input[type="text"],
input[type="tel"],
input[type="email"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.services-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}

.service-item input[type="checkbox"] {
  margin: 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.submit-btn,
.reset-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn {
  background-color: #007bff;
  color: white;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.reset-btn {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
}

.reset-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  background-color: #0056b3;
}

.reset-btn:not(:disabled):hover {
  background-color: #e2e6ea;
}

.error-message {
  margin-top: 20px;
  padding: 10px;
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.server-status {
  margin-top: 20px;
}

.status-controls {
  display: flex;
  align-items: center;
}

.server-toggle {
  position: relative;
  width: 250px;
  height: 40px;
  background-color: #e0e0e0;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.server-toggle.is-running {
  background-color: #28a745;
}

.server-toggle-handle {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 36px;
  height: 36px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.server-toggle.is-running .server-toggle-handle {
  transform: translateX(210px);
}

.server-toggle-label {
  margin-left: 50px;
  color: white;
  font-weight: bold;
  transition: color 0.3s ease;
}

.server-toggle:not(.is-running) .server-toggle-label {
  color: #333;
}

.server-toggle.disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 20px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #007bff;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.port-input-group {
  position: relative;
}

.port-input-wrapper {
  display: flex;
  flex-direction: column;
}

.port-input-container {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.port-input {
  flex-grow: 1;
  padding: 10px 40px 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  appearance: textfield;
  -webkit-appearance: textfield;
}

.port-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.port-input::-webkit-inner-spin-button,
.port-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.port-input-icon {
  position: absolute;
  right: 10px;
  width: 24px;
  height: 24px;
  color: #6c757d;
  pointer-events: none;
}

.port-input-icon svg {
  width: 100%;
  height: 100%;
  transition: color 0.3s ease;
}

.port-input:focus + .port-input-icon {
  color: #007bff;
}

.port-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 5px;
}

.port-hint::before {
  content: "ℹ️";
  font-size: 14px;
}
</style> 