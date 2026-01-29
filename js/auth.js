
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

/* Firebase config */
const firebaseConfig = {
  apiKey: "AIzaSyCgh_VG1YgS_ZTO9BTfFQNsBepVBPSmBXY",
  authDomain: "manulife-bb2e8.firebaseapp.com",
  projectId: "manulife-bb2e8",
  storageBucket: "manulife-bb2e8.firebasestorage.app",
  messagingSenderId: "1013037827161",
  appId: "1:1013037827161:web:6e9d4b9474700518f95d48",
  measurementId: "G-FKFD4ZXVTT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  /* Header controls index.html*/
  const openBtn = document.getElementById("openAuth"); 
  const logoutBtn = document.getElementById("logoutBtn"); 
  const authNick = document.getElementById("authNick"); 

  /* Modal index.html */
  const modal = document.getElementById("authModal");
  const modalCloseEls = modal ? modal.querySelectorAll("[data-close]") : [];
  const modalTabs = modal ? Array.from(modal.querySelectorAll(".auth-modal__tab")) : [];
  const modalPanes = modal ? Array.from(modal.querySelectorAll(".auth-modal__form")) : [];

  /* Forms auth.html */
  const regForm =
    document.getElementById("registerFormModal") || document.getElementById("registerForm");

  const logForm = document.getElementById("loginFormModal") || document.getElementById("loginForm");

  const regMsg = document.getElementById("regMsgModal") || document.getElementById("regMsg");
  const logMsg = document.getElementById("logMsgModal") || document.getElementById("logMsg");

  const resetBtn =
    document.getElementById("resetBtnModal") || document.getElementById("resetBtn");

  /* Helpers */
  const setMsg = (node, text) => {
    if (node) node.textContent = text || "";
  };

  const openModal = () => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  };

  const setTab = (name) => {
    modalTabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === name));
    modalPanes.forEach((p) => p.classList.toggle("is-active", p.dataset.pane === name));
    setMsg(regMsg, "");
    setMsg(logMsg, "");
  };

  const getEl = (idModal, idPage) =>
    document.getElementById(idModal) || document.getElementById(idPage);

  /* Wire modal open/close */
  openBtn?.addEventListener("click", openModal);
  modalCloseEls.forEach((el) => el.addEventListener("click", closeModal));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  /* Tabs */
  modalTabs.forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));

  /* Logout */
  const doLogout = async () => {
    try {
      await signOut(auth);
      closeModal();
    } catch (e) {
      console.warn("[auth] signOut error:", e);
    }
  };
  logoutBtn?.addEventListener("click", doLogout);

  /* Register (with email verification + message, no redirect) */
  regForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(regMsg, "");

    const email = getEl("regEmailModal", "regEmail")?.value?.trim() || "";
    const pass = getEl("regPassModal", "regPass")?.value || "";
    const nickRaw = getEl("regNickModal", "regNick")?.value?.trim() || "";

    if (!email || !pass) {
      setMsg(regMsg, "Заполните почту и пароль.");
      return;
    }
    if (pass.length < 6) {
      setMsg(regMsg, "Пароль должен быть минимум 6 символов.");
      return;
    }

    const fallbackNick = nickRaw && nickRaw.length >= 2 ? nickRaw : email.split("@")[0];

    try {

      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      await updateProfile(cred.user, { displayName: fallbackNick });

      await sendEmailVerification(cred.user);

      await signOut(auth);

      setMsg(
        regMsg,
        "✅ Письмо для подтверждения отправлено! Откройте почту, перейдите по ссылке в письме, затем войдите через вкладку «Вход»."
      );
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") setMsg(regMsg, "Эта почта уже зарегистрирована.");
      else if (code === "auth/invalid-email") setMsg(regMsg, "Некорректная почта.");
      else if (code === "auth/weak-password")
        setMsg(regMsg, "Слишком простой пароль (минимум 6 символов).");
      else setMsg(regMsg, err?.message || "Ошибка регистрации");
    }
  });

  /*Login (block if email not verified)*/
  logForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(logMsg, "");

    const email = getEl("logEmailModal", "logEmail")?.value?.trim() || "";
    const pass = getEl("logPassModal", "logPass")?.value || "";

    if (!email || !pass) {
      setMsg(logMsg, "Заполните почту и пароль.");
      return;
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);

      await cred.user.reload();

      if (!cred.user.emailVerified) {
        setMsg(
          logMsg,
          "Почта не подтверждена. Откройте письмо и подтвердите email. Затем попробуйте войти снова."
        );
        await signOut(auth);
        return;
      }

      setMsg(logMsg, "Успешный вход!");
      closeModal();
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password")
        setMsg(logMsg, "Неверная почта или пароль.");
      else if (code === "auth/user-not-found")
        setMsg(logMsg, "Пользователь не найден.");
      else if (code === "auth/invalid-email")
        setMsg(logMsg, "Некорректная почта.");
      else setMsg(logMsg, err?.message || "Ошибка входа");
    }
  });

  /*Reset password */
  resetBtn?.addEventListener("click", async () => {
    setMsg(logMsg, "");
    const email = getEl("logEmailModal", "logEmail")?.value?.trim() || "";

    if (!email) {
      setMsg(logMsg, "Введите почту и нажмите ещё раз.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg(logMsg, "Письмо для сброса пароля отправлено.");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-email") setMsg(logMsg, "Некорректная почта.");
      else if (code === "auth/user-not-found") setMsg(logMsg, "Пользователь не найден.");
      else setMsg(logMsg, err?.message || "Не удалось отправить письмо");
    }
  });

  


  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        await user.reload();
      } catch (_) {}
    }

    const isVerified = !!user && (user.emailVerified || !user.email);

    if (user && isVerified) {
      if (openBtn) openBtn.hidden = true;
      if (logoutBtn) logoutBtn.hidden = false;

      if (authNick) {
        authNick.hidden = false;
        authNick.textContent = user.displayName || user.email || "Пользователь";
      }
    } else {
      if (openBtn) openBtn.hidden = false;
      if (logoutBtn) logoutBtn.hidden = true;

      if (authNick) {
        authNick.hidden = true;
        authNick.textContent = "";
      }
    }
  });

  setTab("register");
});



