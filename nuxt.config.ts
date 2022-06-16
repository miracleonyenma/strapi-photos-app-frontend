import { defineNuxtConfig } from 'nuxt';

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },

  runtimeConfig: {
    public: {
      graphqlURL: process.env.STRAPI_GRAPGHQL || 'http://localhost:1337/graphql',
      strapiURL: process.env.STRAPI_URL || 'http://localhost:1337',
    }
  },
});

