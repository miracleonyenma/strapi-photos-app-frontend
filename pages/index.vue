<!-- ./pages/index.vue -->

<script setup>
import { RefreshIcon } from "@heroicons/vue/outline";

const {
  public: { graphqlURL, strapiURL },
} = useRuntimeConfig();

const session = useSession();
const user = useUser();

// page state
const isLoading = ref(false);
const posts = ref({});
const error = ref({});

// function to get posts
const getPosts = async (page) => {
  // post query with page and page size variables
  const postsQuery = {
    query: `query($page: Int, $pageSize: Int) {
  posts(pagination: {page: $page, pageSize:$pageSize}, sort: "updatedAt:desc") {
    data {
      id
      attributes {
        user {
          data {
            id
            attributes {
              username
            }
          }
        }
        photo {
          data {
            id
            attributes {
              url
            }
          }
        }
        caption
        updatedAt
      }
    }
    meta {
      pagination {
        total
        pageSize
        page
        pageCount
      }
    }
  }
}
`,
    variables: {
      page: parseInt(page),
      pageSize: 10,
    },
  };
  try {
    let { posts, errors } = await sendReq(graphqlURL, { body: JSON.stringify(postsQuery), headers: { "Content-Type": "application/json" } });
    if (errors) throw Error(errors);
    return posts;
  } catch (error) {
    console.log({ error });
  }
};

// Get current route page by destructuring useAsyncData context to get route > query > page
const { data } = await useAsyncData("posts", async ({ _route: { query } }) => {
  let { page } = query;
  return await getPosts(page);
});
</script>

<template>
  <main class="site-main home-main">
    <div class="wrapper">
      <header>
        <h1 class="text-4xl font-bold">Hey, {{ user?.username || "Stranga!" }}</h1>
      </header>
      <div class="content-wrapper">
        <aside class="create-post-aside">
          <div class="wrapper">
            <header class="px-2 mb-2">
              <h3 class="font-medium">Create a new post</h3>
            </header>
            <!-- Render editor if session is not pending -->
            <div v-if="!session.pending" class="editor-con">
              <Editor v-if="user?.email" />
              <div v-else class="unauthenticated-message px-2">
                <p>Sorry, you have to sign in to post</p>
              </div>
            </div>
            <div v-if="session.pending" :class="{ 'loading-state': session.pending }">
              <RefreshIcon class="icon stroke animate-rotate" />
            </div>
            <Pagination :pagination="data?.meta?.pagination" />
          </div>
        </aside>
        <section class="posts-section">
          <ul class="posts">
            <Post v-for="post in data?.data" :key="post.id" :post="post" />
          </ul>
        </section>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home-main .content-wrapper {
  @apply grid sm:grid-cols-7 gap-4 py-8;
}
.posts-section {
  @apply sm:col-span-4 sm:row-start-1;
}

.posts {
  @apply flex gap-4 flex-col;
}

.create-post-aside {
  @apply sm:col-span-3 sm:col-start-5 h-full;
}
.create-post-aside .wrapper {
  @apply sticky top-[4.5rem] h-min;
}
</style>
