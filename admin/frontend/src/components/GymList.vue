<template>
  <div class="gym-list-container">
    <h2>Список фитнес-студий</h2>
    <div v-if="loading" class="loading">Загрузка...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="gyms.length === 0" class="no-gyms">
      Пока нет созданных студий
    </div>
    <div v-else class="gym-grid">
      <div 
        v-for="gym in gyms" 
        :key="gym._id" 
        class="gym-card"
        @click="$emit('select-gym', gym)"
      >
        <div class="gym-card-header">
          <div class="gym-header-content">
            <img 
              v-if="gym.icon" 
              :src="gym.icon" 
              :alt="`Иконка ${gym.name}`" 
              class="gym-icon"
            />
            <h3>{{ gym.name }}</h3>
          </div>
          <span 
            class="server-status-badge" 
            :class="gym.status === 'running' ? 'running' : 'stopped'"
          >
            {{ gym.status === 'running' ? 'Работает' : 'Остановлен' }}
          </span>
        </div>
        <div class="gym-details">
          <p><strong>Телефон:</strong> {{ formatPhoneNumber(gym.phone) }}</p>
          <p><strong>Email:</strong> {{ gym.email }}</p>
          <p v-if="gym.port"><strong>Порт:</strong> {{ gym.port }}</p>
          <div class="services">
            <strong>Услуги:</strong>
            <ul v-if="gym.services && gym.services.length > 0" class="selected-services-list">
              <li 
                v-for="serviceId in gym.services" 
                :key="serviceId" 
                class="selected-service-tag"
              >
                {{ getServiceNameById(serviceId) }}
              </li>
            </ul>
            <p v-else>Услуги не выбраны</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

export interface Gym {
  _id: string
  name: string
  phone: string
  email: string
  services: string[]
  status?: 'running' | 'stopped'
  port?: number | null
  icon?: string | null
}

const emit = defineEmits(['select-gym'])

const gyms = ref<Gym[]>([])
const loading = ref(true)
const error = ref('')
const services = ref<Service[]>([])

const fetchServices = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/services')
    services.value = await response.json()
  } catch (e) {
    console.error('Ошибка при загрузке услуг:', e)
  }
}

const fetchGyms = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/gyms')
    
    if (!response.ok) {
      throw new Error('Не удалось загрузить список студий')
    }
    
    gyms.value = await response.json()
    loading.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Произошла ошибка'
    loading.value = false
  }
}

// Функция форматирования телефона
const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10) return phone

  return `+7(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
}

const getServiceNameById = (serviceId) => {
  const service = services.value.find(s => s._id === serviceId)
  return service ? service.name : serviceId
}

onMounted(fetchGyms)
onMounted(fetchServices)
</script>

<style scoped>
.gym-list-container {
  max-width: 1200px;
  margin: 0 auto;
}

.gym-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.gym-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  cursor: pointer;
}

.gym-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.server-status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.server-status-badge.running {
  background-color: #28a745;
  color: white;
}

.server-status-badge.stopped {
  background-color: #dc3545;
  color: white;
}

.gym-card:hover {
  transform: scale(1.02);
  background-color: #f0f0f0;
}

.gym-details {
  margin-top: 10px;
}

.services ul {
  list-style-type: disc;
  padding-left: 20px;
  margin-top: 5px;
}

.loading, .error, .no-gyms {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #dc3545;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.delete-btn:hover {
  background-color: #c82333;
}

.gym-header-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.gym-icon {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #f0f0f0;
}

.selected-services {
  margin-bottom: 15px;
}

.selected-services h5 {
  margin-bottom: 10px;
  font-size: 14px;
  color: #6c757d;
}

.selected-services-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-service-tag {
  background-color: #e9ecef;
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 13px;
  color: #495057;
}
</style> 