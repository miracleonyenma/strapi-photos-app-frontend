
<!-- ./components/SiteHeader.vue -->
<script setup>
import { RefreshIcon } from "@heroicons/vue/outline";
const session = useSession();
console.log({ session: session });
</script>
<template>
  <header class="site-header">
    <div class="wrapper">
      <NuxtLink to="/">
        <figure class="site-logo"><h1>Photos</h1></figure>
      </NuxtLink>
      <nav class="site-nav">
        <!-- Hide if session state is pending -->
        <ul v-if="!session.pending" class="links">
          <!-- Render Register link if no user in session -->
          <li v-if="!session.data?.user" class="link">
            <NuxtLink to="/auth/register">
              <button class="cta">Register</button>
            </NuxtLink>
          </li>
          <!-- Render Sign in link if no user in session -->
          <li v-if="!session.data?.user" class="link">
            <NuxtLink to="/auth/sign-in">
              <button class="cta">Sign in</button>
            </NuxtLink>
          </li>
          <!-- Else, Render Sign out link if user in session -->
          <li v-else class="link">
            <NuxtLink to="/auth/sign-out">
              <button class="cta">Sign out</button>
            </NuxtLink>
          </li>
        </ul>
        <!-- Display loading if session state is pending -->
        <div v-else class="cta">
          <RefreshIcon class="icon stroke animate-rotate" />
        </div>
      </nav>
    </div>
  </header>
</template>

<style scoped>

.site-header {
  @apply sticky top-0 w-full p-2 px-4 bg-white bg-opacity-60 backdrop-blur-md;
}
.site-header .wrapper {
  @apply flex items-center gap-4 justify-between m-auto max-w-5xl;
}

.site-nav {
  @apply flex items-center gap-4 justify-end;
}

.site-nav .links {
  @apply flex gap-4;
}
</style>