<!-- ./pages/index.vue -->
<script setup>
const user = useUser();
</script>
<template>
  <main class="home-main">
    <div class="wrapper">
      <header>
        <h1 class="text-4xl font-bold">Hey, {{ user?.username }}</h1>
      </header>
    </div>
  </main>
</template>
<style scoped>
.home-main {
  @apply p-4;
}
.home-main .wrapper {
  @apply m-auto max-w-5xl;
}
</style>
