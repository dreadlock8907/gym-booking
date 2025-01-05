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
          placeholder="Введите номер телефона"
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

      <div class="form-group icon-upload-group">
        <label>Иконка студии</label>
        <div class="icon-upload-container">
          <input 
            type="file" 
            id="gymIcon" 
            accept="image/jpeg,image/png,image/webp"
            @change="handleIconUpload"
            class="icon-file-input"
          />
          <label for="gymIcon" class="icon-upload-label">
            <div v-if="!iconPreview && !formData.icon" class="icon-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2h-18a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7l2 3h7a2 2 0 0 1 2 2z"></path>
                <line x1="12" y1="11" x2="12" y2="17"></line>
                <line x1="9" y1="14" x2="15" y2="14"></line>
              </svg>
              <span>Выбрать иконку</span>
            </div>
            <div v-else class="icon-preview">
              <img 
                :src="iconPreview || formData.icon" 
                alt="Иконка студии" 
                class="preview-image"
              />
              <button 
                type="button" 
                class="remove-icon-btn" 
                @click.prevent="removeIcon"
                title="Удалить иконку"
              >
                ✕
              </button>
            </div>
          </label>
          <div class="icon-upload-hints">
            <small>
              • Максимальный размер: 512x512 пикселей
              • Форматы: JPEG, PNG, WebP
              • Максимальный размер файла: 5 МБ
            </small>
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
        <button 
          v-if="isEditMode" 
          type="button" 
          class="delete-btn" 
          @click="confirmDelete"
        >
          Удалить студию
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>

    <div v-if="showDeleteConfirmation" class="modal-overlay">
      <div class="modal-content">
        <h3>Подтверждение удаления</h3>
        <p>Вы уверены, что хотите удалить эту студию? Это действие нельзя будет отменить.</p>
        <div class="modal-actions">
          <button @click="deleteGym" class="confirm-delete-btn">Удалить</button>
          <button @click="showDeleteConfirmation = false" class="cancel-btn">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue'
import { Gym } from './GymList.vue'

const props = defineProps<{
  initialGym?: Gym
}>()

const emit = defineEmits(['gym-updated', 'edit-cancelled', 'gym-deleted'])

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
  phone: props.initialGym?.phone ? formatPhoneNumber(props.initialGym.phone) : '+7(',
  email: props.initialGym?.email || '',
  services: props.initialGym?.services || [],
  selectedServices: props.initialGym?.services || [],
  status: props.initialGym?.status || 'stopped',
  port: props.initialGym?.port || null,
  icon: props.initialGym?.icon || null
})

const iconFile = ref<File | null>(null)
const iconPreview = ref<string | null>(null)

const handleIconUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]
    
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'Размер файла не должен превышать 5 МБ'
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      error.value = 'Допустимы только изображения в форматах JPEG, PNG и WebP'
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        if (img.width > 512 || img.height > 512) {
          error.value = 'Максимальный размер изображения 512x512 пикселей'
          iconFile.value = null
          iconPreview.value = null
          return
        }
        
        iconPreview.value = e.target?.result as string
        iconFile.value = file
        error.value = ''
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const removeIcon = () => {
  iconFile.value = null
  iconPreview.value = null
  formData.value.icon = null
}

const isSubmitting = ref(false)
const isServerActionInProgress = ref(false)
const error = ref('')
const showDeleteConfirmation = ref(false)

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
      port: data.port,
      icon: iconPreview.value
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
      port: data.port,
      icon: iconPreview.value === null ? null : (iconPreview.value || data.icon)
    })
  })

  if (!response.ok) {
    throw new Error('Ошибка при обновлении студии')
  }

  return response.json()
}

// Функция валидации email
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// Функция форматирования телефона
const formatPhoneNumber = (value: string): string => {
  return value
}

const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  formData.value.phone = input.value
}

const handlePhoneDelete = () => {
  // Пустая функция, больше не нужна
}

// Валидация формы перед отправкой
const validateForm = (): boolean => {
  // Сбрасываем предыдущие ошибки
  error.value = ''

  // Валидация email
  if (!validateEmail(formData.value.email)) {
    error.value = 'Некорректный формат электронной почты'
    return false
  }

  // Валидация телефона (должен содержать только цифры и начинаться с +7)
  const phoneRegex = /^\+7\d{10}$/
  if (!phoneRegex.test(formData.value.phone)) {
    error.value = 'Номер телефона должен начинаться с +7 и содержать 10 цифр'
    return false
  }

  return true
}

// Обновляем submitForm
const submitForm = async () => {
  try {
    // Добавляем валидацию
    if (!validateForm()) return

    isSubmitting.value = true
    error.value = ''
    
    const gymData = {
      ...formData.value,
      services: formData.value.selectedServices,
      // Оставляем номер телефона как есть
      phone: formData.value.phone
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

// Обновляем resetForm для корректного сброса телефона
const resetForm = () => {
  if (isEditMode.value) {
    emit('edit-cancelled')
  } else {
    formData.value = {
      _id: '',
      name: '',
      phone: '+7', // Просто +7 без сложного форматирования
      email: '',
      services: [],
      selectedServices: [],
      status: 'stopped',
      port: null,
      icon: null
    }
  }
  error.value = ''
  iconPreview.value = null
  iconFile.value = null
}

const confirmDelete = () => {
  showDeleteConfirmation.value = true
}

const deleteGym = async () => {
  if (!formData.value._id) return

  try {
    const response = await fetch(`http://localhost:8000/api/gyms/${formData.value._id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Не удалось удалить студию')
    }

    // Закрываем модальное окно
    showDeleteConfirmation.value = false

    // Уведомляем родительский компонент об удалении
    emit('gym-deleted', formData.value._id)

    // Возвращаемся к списку студий
    alert('Студия успешно удалена!')
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Произошла ошибка при удалении студии'
  }
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

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background-color: #c82333;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.confirm-delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.icon-upload-group {
  margin-top: 20px;
}

.icon-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-file-input {
  display: none;
}

.icon-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  margin-top: 10px;
}

.icon-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.icon-placeholder:hover {
  border-color: #007bff;
}

.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #f0f0f0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-icon-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  cursor: pointer;
  color: white;
  font-size: 14px;
}

.icon-upload-hints {
  margin-top: 10px;
  text-align: center;
  color: #6c757d;
  font-size: 12px;
}
</style> 