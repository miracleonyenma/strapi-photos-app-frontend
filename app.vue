
<!-- ./app.vue -->
<script setup>
import "@/assets/css/main.css";
const router = useRouter();
const session = useSession();
onMounted(() => {
  // set session from localStorage
  useSetSession(JSON.parse(localStorage.getItem("session")));

  // route guard to prevent users from routing to 
  // sign in and register page when alrady logged in
  router.beforeEach((to, from) => {
    if ((to.path === "/auth/register" || to.path === "/auth/sign-in") && session.value?.jwt) {
      return false;
    }
  });
});
</script>
<template>
  <NuxtLayout name="default">
    <!-- Render page depending on route -->
    <NuxtPage />
  </NuxtLayout>
</template>