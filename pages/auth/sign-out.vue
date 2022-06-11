<!-- ./pages/sign-out.vue -->

<script setup>
onMounted(() => {
  // set session to null
  useSetSession(null);

  setTimeout(() => {
    alert("You've signed out. See you back soon!");
    navigateTo("/");
  }, 1000);
});
</script>
<template>
  <main class="sign-out-main auth-main">
    <div class="wrapper">
      <h3 class="text-3xl">Signing Out...</h3>
    </div>
  </main>
</template>