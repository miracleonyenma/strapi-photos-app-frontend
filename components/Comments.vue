
<!-- ./components/Comments.vue -->

<script setup>
// import icons
import { ChatIcon, PaperAirplaneIcon, XCircleIcon } from "@heroicons/vue/solid";
import { RefreshIcon } from "@heroicons/vue/outline";

// define component props
const { post } = defineProps(["post"]);

// Get graphqlURL from runtime config
const {
  public: { graphqlURL },
} = useRuntimeConfig();

// Get `user` & `session` application state
const user = useUser();
const session = useSession();

// component state
const comments = ref([]);
const comment = ref({});
const action = ref("create");
const isLoading = ref(false);

// ref for comment <ul> list item
const commentList = ref(null);

// header object for fetch request
let headersList = {
  Authorization: `Bearer ${session.value?.data?.jwt}`,
  "Content-Type": "application/json",
};

// helper to get and display date
const showDateTime = (dateString) => new Date(dateString).toDateString() + " | " + new Date(dateString).toLocaleTimeString();

// function to activate edit action
const handleEdit = (data) => {
  comment.value = { ...data };
  action.value = "edit";
};

// function to reset comment state
const resetAction = () => {
  comment.value = {};
  action.value = "create";
};


// function to get comments
const getComments = async () => {
  // comments query
  const commentsQuery = {
    query: `
    query($relation: String!) {
      findAllFlat(relation: $relation, sort: "updatedAt:desc") {
        data {
          id
          content
          approvalStatus
          updatedAt
          author {
            id
            name
          }
        }
      }
    }
  `,
    variables: {
      relation: `api::post.post:${post?.id}`,
    },
  };
  try {
    // send request and return results or errors
    let { findAllFlat, errors } = await sendReq(graphqlURL, { body: JSON.stringify(commentsQuery), headers: { "Content-Type": "application/json" } });
    if (errors) throw Error(errors);
    return findAllFlat;
  } catch (error) {
    console.log({ error });
  }
};


// function to either create or edit comments
const handleSubmit = (e) => {
  e.preventDefault();
  action.value == "create" ? createComment() : editComment(comment.value?.id);
};

// function to create comments
const createComment = async () => {
  // check if the comment is not empty or just spaces
  if (comment.value.content.trim()) {
    isLoading.value = true;
    // create comment mutation
    const createCommentQuery = {
      query: `
        mutation($input: CreateComment!) {
          createComment(input: $input) {
            id
            content
            approvalStatus
            updatedAt
            author {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: { relation: `api::post.post:${post?.id}`, content: comment.value.content.trim() },
      },
    };
    try {
      // send request and return results or errors
      let { createComment, errors } = await sendReq(graphqlURL, { body: JSON.stringify(createCommentQuery), headers: headersList });
      if (errors) throw Error(errors);

      // add created comment to top of comments array
      comments.value.data = [createComment, ...comments.value.data];

      // reset comment and action state
      resetAction();
    } catch (error) {
      console.log({ error });
    } finally {
      isLoading.value = false;
    }
  }
};


// function to edit comment based on it's `id`
const editComment = async (id) => {
  // check if the comment is not empty or just spac
  if (comment.value.content.trim()) {
    isLoading.value = true;
    // update comment mutataion
    const updateCommentQuery = {
      query: `
        mutation($input: UpdateComment!) {
          updateComment(input: $input) {
            id
            content
            approvalStatus
            updatedAt
            author {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: { id, relation: `api::post.post:${post?.id}`, content: comment.value.content.trim() },
      },
    };
    try {
      // send request and return results or errors
      let { updateComment, errors } = await sendReq(graphqlURL, { body: JSON.stringify(updateCommentQuery), headers: headersList });
      if (errors) throw Error(errors);
      // get index of comment to edit
      let editIndex = comments.value.data.findIndex(({ id }) => id == updateComment.id);
      // remove comment from array at that index
      comments.value.data.splice(editIndex, 1);
      // add edited comment to top of array
      comments.value.data.unshift(updateComment);
      // reset comment and action state
      resetAction();
    } catch (error) {
      console.log({ error });
    } finally {
      isLoading.value = false;
    }
  }
};


// function to remove comment
const removeComment = async (id) => {
  // confirm if the user wants to proceed to remove the comment
  let confirmRemove = confirm("Are you sure you want to remove this comment?");
  // if confirmed
  if (confirmRemove) {
    isLoading.value = true;
    // remove comment mutation
    const removeCommentQuery = {
      query: `
        mutation($input: RemoveComment!) {
          removeComment(input: $input) {
            id
            content
            approvalStatus
            author {
              id
              name
            }
          }
        }
      `,
      variables: {
        input: { relation: `api::post.post:${post?.id}`, id },
      },
    };
    try {
      // reset comment and action state
      let { removeComment, errors } = await sendReq(graphqlURL, { body: JSON.stringify(removeCommentQuery), headers: headersList });
      if (errors) throw Error(errors);

      // get index of comment to remove
      let removeIndex = comments.value.data.findIndex(({ id }) => id == removeComment.id);
      // remove comment from array
      comments.value.data.splice(removeIndex, 1);
    } catch (error) {
      console.log({ error });
    } finally {
      isLoading.value = false;
    }
  }
};

// watch function to update the comments list scroll postion
watch(
  comments,
  (comments) => {
    // if commentList element exists
    if (commentList.value) {
      setTimeout(() => {
        // scoll comment list to the top
        commentList.value.scroll(0, 0);
      }, 100);
    }
  },
  { deep: true }
);

// fetch comments and save to acomments array
comments.value = await getComments();
</script>

<template>
  <div class="comments">
    <ul ref="commentList" class="comment-list" :class="{ 'border-t': comments.data[0] }">
      <li v-for="comment in comments?.data" :key="comment.id" class="comment">
        <main class="body">
          <p class="author">
            {{ comment.author?.name }}
          </p>
          <pre class="content">{{ comment?.content }}</pre>
        </main>
        <footer class="actions">
          <span class="details"> {{ showDateTime(comment?.updatedAt) }} </span>
          <div v-if="user?.id == comment.author?.id" class="options">
            <button @click="() => handleEdit(comment)">Edit</button> |
            <button @click="() => removeComment(comment.id)" class="hover:text-red-500">Remove</button>
          </div>
        </footer>
      </li>
    </ul>
    <div v-if="user?.id" class="comment-cont">
      <ChatIcon class="icon solid" />
      <form @submit="handleSubmit" class="comment-form">
        <div class="form-control">
          <textarea
            v-model="comment.content"
            name="comment"
            id="comment"
            cols="30"
            rows="1"
            class="form-textarea comment-textarea"
            placeholder="Leave a comment"
            required
          >
          </textarea>
        </div>
        <!-- Reset button -->
        <button @click="resetAction" type="button" v-show="action == 'edit'" class="cta submit-btn">
          <XCircleIcon class="icon solid" />
        </button>
        <!-- Send Button -->
        <button :disabled="isLoading" class="cta submit-btn">
          <PaperAirplaneIcon v-if="!isLoading" class="icon solid rotate-90" />
          <RefreshIcon v-else class="icon stroke animate-rotate" />
        </button>
      </form>
    </div>
  </div>
</template>
<style scoped>
* {
  @apply text-sm;
}

.comment-cont {
  @apply flex items-center gap-4 pt-4 border-t border-t-gray-200;
}

.comment-list,
.comment {
  @apply flex gap-4 flex-col;
}

.comment-list {
  @apply gap-0 max-h-[10rem] overflow-y-auto border-t-gray-200;
}

.comment {
  @apply gap-1 py-2 text-sm;
}

.comment .body {
  @apply inline-block;
}

.comment .content {
  @apply font-sans whitespace-pre-wrap;
}

.body > * {
  @apply inline first-of-type:mr-2;
}

.body .author {
  @apply font-bold;
}

.comment .details {
  @apply text-xs text-gray-400;
}

.actions {
  @apply flex gap-4 justify-between items-center;
}

.comment .options {
  @apply flex flex-nowrap gap-1 items-center text-xs max-w-0 overflow-hidden;
}

.actions:hover .options,
.actions:active .options,
.actions:focus .options {
  @apply max-w-none;
}

.comment-form {
  @apply flex gap-2 w-full;
}

.comment-form .comment-textarea {
  @apply w-full;
}

.submit-btn {
  @apply h-min;
}
</style>
