
<!-- ./pages/register.vue -->
<script setup>

// retrive GraphQL URL from runtime config
const {
  public: { graphqlURL },
} = useRuntimeConfig();

// session & set session
const session= useSession();
const setSession = useSetSession;

// page state
const isLoading = ref(false);

// form state
const name = ref("");
const email = ref("");
const password = ref("");

// handle form submit
const handleRegister = async (e) => {
  e.preventDefault();
  if (name && email && password) {
    isLoading.value = true;

    // GraphQL Register Query
    let registerQuery = {
      query: `mutation($username: String!, $email: String!, $password: String!,){
      register(input: {username: $username, email: $email, password: $password}){
        jwt
        user{
          id
          username
          email
        }
      }
    }`,
      variables: {
        username: name.value,
        email: email.value,
        password: password.value,
      },
    };

    try {
      const { register, errors } = await sendReq(graphqlURL, { body: JSON.stringify(registerQuery), headers: { "Content-Type": "application/json" } });

      // throw error if any
      if (errors) throw Error(errors);

      // set session, notify and navigate to the home page
      setSession(register);
      alert("Registeration successful!");
      navigateTo("/");
    } catch (error) {
      console.log(error);
    } finally {
      isLoading.value = false;
    }
  }
};
</script>
<template>
  <main class="site-main register-main">
    <div class="wrapper">
      <div class="form-cont">
        <form @submit="handleRegister" class="form auth-form">
          <div class="wrapper">
            <header class="form-header">
              <h3 class="text-3xl mb-4">Sign Up</h3>
            </header>
            <section class="input-section">
              <div class="form-control">
                <label for="name">Name</label>
                <input v-model="name" id="name" name="name" type="text" class="form-input" required />
              </div>
              <div class="form-control">
                <label for="email">Email address</label>
                <input v-model="email" id="email" name="email" type="email" class="form-input" required />
              </div>
              <div class="form-control">
                <label for="password">Password</label>
                <input v-model="password" id="password" name="password" type="password" class="form-input" required />
              </div>
              <div class="action-cont">
                <button :disabled="isLoading" class="cta">{{ isLoading ? "..." : "Register" }}</button>
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>