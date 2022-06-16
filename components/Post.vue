<!-- ./components/Post.vue -->

<script setup>
// import icons
import { ChatIcon, PaperAirplaneIcon, DotsHorizontalIcon, PencilIcon, TrashIcon } from "@heroicons/vue/solid";

// define `post` props
const props = defineProps(["post"]);

// Get graphqlURL from runtime config
const {
  public: { graphqlURL, strapiURL },
} = useRuntimeConfig();

// Get global session and user state
const session = useSession();
const user = useUser();

// Get & Set global curresnt post state
const currentPost = usePost();
const setCurrentPost = useSetPost;

// header object for fetch request
let headersList = {
  Accept: "*/*",
  Authorization: `Bearer ${session.value?.data?.jwt}`,
  "Content-Type": "application/json",
};

// helper function to get username from `post` attributes
const getUsername = (post) => post?.attributes?.user.data?.attributes?.username;

// helper to get and display date
const showDateTime = (post) => new Date(post?.attributes?.updatedAt).toDateString() + " | " + new Date(post?.attributes?.updatedAt).toLocaleTimeString();

// helper function to get username from `post` attributes
const getUserID = (post) => post?.attributes?.user.data?.id;

// function to edit post
const editPost = () => {
  // get post data from props
  const post = props.post;
  // set post action to edit
  post.action = "edit";
  // set modified post to global state
  setCurrentPost(post);
};

// function to delete post
const deletePost = async () => {
  // confirm deletion
  const confirmDelete = confirm("Are you sure you want to delete this post?");
  // run if user confirms deletion
  if (confirmDelete) {
    // mutation query for deleting post
    let deletePostQuery = {
      query: `
        mutation($id: ID!){
          deletePost(id: $id){
            data{
              id
            }
          }
        }
      `,
      variables: {
        id: props.post.id,
      },
    };
    try {
      // send request to delete post
      const { deletePost, errors } = await sendReq(graphqlURL, { body: JSON.stringify(deletePostQuery), headers: headersList });
      if (errors) throw Error(errors);

      // reload page
      window.location.reload();
    } catch (error) {
      console.log(error);
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<template>
  <li class="post">
    <header class="post-header">
      <div class="author-cont">
        <div class="avatar">
          <!-- Get first letter in user name -->
          <p>{{ getUsername(post)?.substr(0, 1) }}</p>
        </div>
        <p class="username">{{ getUsername(post) }}</p>
      </div>
      <!-- Render if logged in user id matches with post user id -->
      <div v-if="user.id == getUserID(post)" class="options dropdown">
        <button class="dropdown-btn">
          <DotsHorizontalIcon class="icon solid" />
        </button>
        <ul class="dropdown-list">
          <li>
            <button @click="editPost" class="w-icon w-full">
              <PencilIcon class="icon solid" />
              <span>Edit</span>
            </button>
          </li>
          <li>
            <button @click="deletePost" class="w-icon w-full">
              <TrashIcon class="icon solid" />
              <span>Delete</span>
            </button>
          </li>
        </ul>
      </div>
    </header>
    <ul class="photos">
      <li v-for="photo in post?.attributes?.photo.data" :key="photo.id" class="photo">
        <div class="img-cont">
          <img :src="photo?.attributes?.url" :alt="post?.attributes?.caption" />
        </div>
      </li>
    </ul>
    <article class="details">
      <h3 class="caption">{{ post?.attributes?.caption }}</h3>
      <span class="time">{{ showDateTime(post) }}</span>
    </article>
    <Comments :post="post" />
  </li>
</template>

<style scoped>
.post {
  @apply flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-xl;
}

.author-cont {
  @apply flex items-center gap-2 pb-4;
}

.author-cont .avatar {
  @apply flex items-center justify-center w-8 h-8 text-xl text-white bg-gray-800 rounded-full;
}

.author-cont .username {
  @apply font-semibold;
}

.photos {
  @apply flex w-full overflow-x-auto;
  @apply snap-x snap-mandatory;
}

.photo {
  @apply min-w-full snap-start snap-always;
}

.post .post-header {
  @apply flex items-center justify-between gap-4;
}

.post .img-cont img {
  @apply w-full object-cover rounded-xl;
}

.caption {
  @apply font-medium break-words;
}

.time {
  @apply text-xs text-gray-400;
}
</style>
