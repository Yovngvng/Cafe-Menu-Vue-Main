const REMEMBER_FLAG = "cafe-admin-remember";

export function setRememberMe(remember) {
  try {
    if (remember) {
      localStorage.setItem(REMEMBER_FLAG, "1");
      sessionStorage.removeItem(REMEMBER_FLAG);
    } else {
      sessionStorage.setItem(REMEMBER_FLAG, "0");
      localStorage.removeItem(REMEMBER_FLAG);
    }
  } catch (e) {
    console.warn("remember flag failed", e);
  }
}

export function getRememberMe() {
  try {
    if (localStorage.getItem(REMEMBER_FLAG) === "1") return true;
    if (sessionStorage.getItem(REMEMBER_FLAG) === "0") return false;
  } catch (e) {
    /* ignore */
  }
  return null;
}

function writeStore() {
  const remembered = getRememberMe();
  if (remembered === false) return sessionStorage;
  return localStorage;
}

export const authStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem(key, value) {
    try {
      const store = writeStore();
      const other = store === localStorage ? sessionStorage : localStorage;
      store.setItem(key, value);
      other.removeItem(key);
    } catch (e) {
      console.warn("auth storage write failed", e);
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  },
};

export function clearRememberMe() {
  try {
    localStorage.removeItem(REMEMBER_FLAG);
    sessionStorage.removeItem(REMEMBER_FLAG);
  } catch (e) {
    /* ignore */
  }
};
