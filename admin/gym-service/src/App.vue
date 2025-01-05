   <!-- src/App.vue -->
   <template>
    <div id="app">
      <AuthForm />
    </div>
  </template>

  <script lang="ts">
  import { defineComponent } from 'vue'
  import AuthForm from './components/AuthForm.vue'

  export default defineComponent({
    name: "App",
    components: {
      AuthForm
    }
  });
  </script>

  <style>
  #app {
    font-family: Arial, sans-serif;
  }
  </style>