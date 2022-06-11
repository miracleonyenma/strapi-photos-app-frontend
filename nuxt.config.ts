import { defineNuxtConfig } from 'nuxt';

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  runtimeConfig: {
    public: {
      graphqlURL: 'http://localhost:1337/graphql' || process.env.STRAPI_GRAPGHQL,
      strapiURL: 'http://localhost:1337' || process.env.STRAPI_URL,
    }
  },
});
