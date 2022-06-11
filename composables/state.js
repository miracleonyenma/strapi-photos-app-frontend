// ./composables/state.js

// READ USER STATE
export const useUser = () => useState("user", () => ({}));
// SET USER STATE
export const useSetUser = (data) => useState("set-user", () => (useUser().value = data));
// USE SESSION STATE
export const useSession = () => useState("session", () => ({ pending: true, data: null }));
// SET SESSION STATE
export const useSetSession = (data) => {
  // save session state to localstorage
  localStorage.setItem("session", JSON.stringify(data));
  useState("set-session", () => {
    // update session state
    useSession().value.pending = false;
    useSession().value.data = data;
    // update user state
    useUser().value = data?.user;
  });
};