<template>
  <div class="app">
    <nav class="app-nav">
      <button 
        @click="currentView = 'form'" 
        :class="{ active: currentView === 'form' }"
      >
        Добавить студию
      </button>
      <button 
        @click="currentView = 'list'" 
        :class="{ active: currentView === 'list' }"
      >
        Список студий
      </button>
    </nav>
    <main>
      <GymForm 
        v-if="currentView === 'form'" 
        :initial-gym="selectedGym"
        @gym-updated="handleGymUpdate"
        @edit-cancelled="cancelGymEdit"
      />
      <GymList 
        v-else-if="currentView === 'list'"
        @select-gym="selectGymForEdit"
      />
    </main>
  </div>
</template>
  
<script setup lang="ts">
import { ref } from 'vue'
import GymForm from './components/GymForm.vue'
import GymList from './components/GymList.vue'
import { Gym } from './components/GymList.vue'

const currentView = ref('list')
const selectedGym = ref<Gym | undefined>(undefined)
const studioConfig = ref({
  primaryColor: '#007bff'
})

const selectGymForEdit = (gym: Gym) => {
  selectedGym.value = gym
  currentView.value = 'form'
}

const handleGymUpdate = (updatedGym: Gym) => {
  selectedGym.value = undefined
  currentView.value = 'list'
}

const cancelGymEdit = () => {
  selectedGym.value = undefined
  currentView.value = 'list'
}
</script>
  
<style>
.app {
  font-family: Arial, sans-serif;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.app-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.app-nav button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  background-color: #f8f9fa;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.app-nav button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

main {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
  padding: 20px;
}
</style> 