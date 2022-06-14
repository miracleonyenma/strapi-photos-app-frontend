<!-- ./components/Editor.vue -->

<script setup>
// import icons
import { PlusCircleIcon, XCircleIcon } from "@heroicons/vue/solid";

// Get graphqlURL & strapiURL from runtime config
const {
  public: { graphqlURL, strapiURL },
} = useRuntimeConfig();

// Get `user` & `session` application state
const user = useUser();
const session = useSession();

// Get global current post state
const currentPost = usePost();
const setCurrentPost = useSetPost;

// to hold the image data from the current post
const currentImages = ref([]);

// data state
const isLoading = ref(false);
const data = ref(null);

// component states
const imagesURL = ref([]);
const images = ref({});
const fileBtnText = ref("Choose Images");
const caption = ref("");
const action = ref("create");

// header object for fetch request
let headersList = {
  Accept: "*/*",
  // set authorization token
  Authorization: `Bearer ${session.value.data?.jwt}`,
  "Content-Type": "application/json",
};

// function to generate preview URLs for selected images before upload
const previewImg = (e) => {
  // save files to `images` state
  images.value = e.target.files;

  // create iterable array from `FileList`
  let files = Array.from(images.value);

  // iterate over `files` array to create temporary URLs
  // URLs will be used to preview selected images before upload
  imagesURL.value = [];

  files.forEach((file, i) => {
    let url = URL.createObjectURL(file);
    imagesURL.value.push(url);
  });

  // set upload file button content to [number of] files selected
  let length = imagesURL.value.length;
  fileBtnText.value = `${length} file${length != 1 ? "s" : ""} selected`;
};

// function to upload files to Strapi media library and get the uploaded file `ids`
const uploadFiles = async () => {
  // mutation to upload multiple files
  const uploadMultipleMutation = {
    query: `
      mutation($files: [Upload]!){
        multipleUpload(files: $files){
          data{
            id
          }
        }
      }
    `,
    variables: {
      // dynamically generate array with null values to match the number of images selected
      // files: [null, null, null]
      files: imagesURL.value.map((x) => null),
    },
  };

  // image variables map
  /*
  {
    "0": [
        "variables.files.0"
    ],
    "1": [
        "variables.files.1"
    ],
    "2": [
        "variables.files.2"
    ]
  }
  */
  let map = {};

  // init `FormData()`
  const formData = new FormData();

  // append `operations` to FormData(), which conatin the graphQL query
  formData.append("operations", JSON.stringify(uploadMultipleMutation));

  // create map for variable files
  for (let i = 0; i < images.value.length; i++) {
    map[`${i}`] = [`variables.files.${i}`];
  }

  // add map to `FormData()`
  formData.append("map", JSON.stringify(map));

  // append images to formData
  // with names corresponding to the keys in `map`
  for (let i = 0; i < images.value.length; i++) {
    const image = images.value[i];
    formData.append(`${i}`, image);
  }

  try {
    // send request with `formdata` and authorization headers
    let { multipleUpload, errors } = await sendReq(graphqlURL, { body: formData, headers: { Authorization: headersList.Authorization } });
    if (errors) throw Error(errors);
    console.log(multipleUpload);
    return multipleUpload;
  } catch (error) {
    console.log(error);
  }
};

// function to run the create or edit post functions depending on the action
const handleSubmit = (e) => {
  e.preventDefault();
  action.value == "create" ? createPost() : editPost();
};

// function to create post
const createPost = async () => {
  isLoading.value = true;

  // run if images and caption are not null
  if (images.value.length > 0 && caption) {
    // upload images and get the IDs
    let uploads = await uploadFiles();

    // mutation query for creating posts
    let createPostQuery = {
      query: `
      mutation($data: PostInput!){
        createPost(data: $data){
          data{
            id
            attributes{
              caption
              photo{
                data{
                  id
                  attributes{
                    url
                  }
                }
              }
              user{
                data{
                  id
                }
              }
              updatedAt
            }
          }
        }
      }
      `,
      variables: {
        data: {
          caption: caption.value,
          user: user.value.id,
          // photo: [array of uploaded photo ids]
          // e.g. photo: [21, 22, 23]
          photo: uploads.map((file) => file.data.id),
          publishedAt: new Date(),
        },
      },
    };

    try {
      // send request to create post
      const { createPost, errors } = await sendReq(graphqlURL, { body: JSON.stringify(createPostQuery), headers: headersList });
      if (errors) throw Error(errors);

      // save to state
      data.value = createPost;

      // reload page
      window.location.replace("/");
    } catch (error) {
      console.log(error);
    } finally {
      isLoading.value = false;
    }
  }
};

// function to edit post
const editPost = async () => {
  isLoading.value = true;
  // if caption is not null
  if (caption) {
    // set uploads to uploaded files if user selects new files to upload
    // else, set uploads to images from the current post data
    let uploads = images.value.length > 0 ? await uploadFiles().then((res) => res.map((file) => file.data)) : currentImages.value;
    console.log({ uploads });
    // query to update post
    let updatePostQuery = {
      query: `
        mutation($id: ID!, $data: PostInput!) {
          updatePost(id: $id, data: $data) {
            data {
              id
              attributes {
                user {
                  data {
                    id
                  }
                }
                caption
                photo {
                  data {
                    id
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        // set id to current post id
        id: currentPost.value.id,
        data: {
          caption: caption.value,

          // photo: [array of uploaded photo ids]
          // e.g. photo: [21, 22, 23]
          photo: uploads.map((file) => file.id),
        },
      },
    };
    try {
      // send request to update post
      const { updatePost, errors } = await sendReq(graphqlURL, { body: JSON.stringify(updatePostQuery), headers: headersList });

      if (errors) throw Error(errors);

      // save to state
      data.value = updatePost;
      // reload page
      window.location.replace("/");
    } catch (error) {
      console.log(error);
    } finally {
      isLoading.value = false;
    }
  }
};

// function to reset action to "create"
const resetAction = () => {
  // set current post to empty object
  setCurrentPost({});
  console.log({ currentPost });
  // reset component state
  action.value = "create";
  caption.value = "";
  imagesURL.value = [];
};

// watch for changes in the current post data
watch(
  currentPost,
  (post) => {
    console.log(currentPost.value, post);
    // catch block catches errors that occur whenever the state is reset
    try {
      // destructure post data
      const {
        attributes: { photo, caption: _caption },
        action: _action,
      } = post;
      // generate image URLs and ids from post photo data
      currentImages.value = photo.data.map((image) => {
        console.log({image});
        let src = strapiURL + "" + image.attributes.url;
        let id = image.id;
        return { src, id };
      });
      // set imagesURL to currentImages `src`
      imagesURL.value = currentImages.value.map((image) => image.src);
      // update component state to post data
      caption.value = _caption;
      action.value = _action;
    } catch (error) {
      console.log(error);
    }
  },
  { deep: true }
);
</script>
<template>
  <form :disabled="isLoading || data" @submit="handleSubmit" class="upload-form">
    <div class="wrapper">
      <div class="form-control file">
        <div class="img-cont upload-img-cont">
          <!-- Selected image previews -->
          <ul v-if="imagesURL.length >= 1" class="images">
            <li v-for="(src, i) in imagesURL" :key="i" class="image">
              <img :src="src" alt="Image" class="upload-img" />
            </li>
          </ul>
        </div>
        <label for="image-input" class="file-label" :class="{ 'mt-4': imagesURL.length > 0 }">
          <span type="button" class="cta file-btn">
            {{ fileBtnText }}
          </span>
          <input :disabled="isLoading || data" @change="previewImg" id="image-input" class="file-input" type="file" accept=".png, .jpg, .jpeg" multiple />
        </label>
      </div>
      <div class="form-control">
        <label for="caption">Caption</label>
        <textarea
          :disabled="isLoading || data"
          v-model="caption"
          name="caption"
          id="caption"
          cols="30"
          rows="1"
          class="form-textarea caption-textarea"
          placeholder="Enter you caption"
          required
        >
        </textarea>
      </div>
      <div class="action-cont">
        <!-- Submit button -->
        <button :disabled="isLoading || data" type="submit" class="cta w-icon capitalize">
          <PlusCircleIcon v-if="!data" class="icon solid" />
          <span v-if="!data">{{ !isLoading ? `${action} Post` : "Hang on..." }}</span>
          <span v-else>Successfull! 🚀</span>
        </button>
        <!-- Reset button -->
        <button @click="resetAction" type="button" v-show="action == 'edit'" class="cta w-icon">
          <XCircleIcon class="icon solid" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.upload-form {
  @apply p-2 h-min bg-white border border-gray-200 rounded-xl;
}
.upload-form .wrapper {
  @apply flex flex-col gap-2;
}

.form-control.file {
  @apply flex items-center justify-center gap-0 p-4 bg-gray-50 rounded-lg;
}

.upload-img-cont {
  @apply w-full overflow-auto;
}

.upload-img-cont .images {
  @apply flex flex-nowrap gap-2;
}

.images .image {
  @apply max-w-[17rem] grow shrink-0;
}

.upload-img {
  @apply w-full h-36 object-contain;
}

.file-label .file-btn {
  @apply flex gap-2 w-fit !py-3 cursor-pointer;
}

.file-label .file-input {
  @apply absolute opacity-0 w-[0.1px] h-[0.1px];
}
</style>
