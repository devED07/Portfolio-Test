"use strict";

// EmailJS configuration (same account as before)
const EMAILJS_PUBLIC_KEY = "0Q3oW5Ez8WwcQN2Ci";
const EMAILJS_SERVICE_ID = "service_cdy2fbc";
const EMAILJS_TEMPLATE_ID = "template_icla4h7";
const EMAILJS_SRC = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";

const root = document.documentElement;
root.classList.add("js");

/* ---------- Theme toggle ---------- */
const themeToggle = document.getElementById("theme-toggle");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  return root.dataset.theme || (systemDark.matches ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch (e) {
    /* storage unavailable: theme still applies for this visit */
  }
});

/* ---------- Mobile menu ---------- */
const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

function setMenu(open) {
  navLinks.classList.toggle("open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

menuToggle.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
navLinks.addEventListener("click", (e) => {
  if (e.target.closest("a")) setMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") setMenu(false);
});

/* ---------- Header border on scroll ---------- */
const header = document.querySelector(".site-header");
function onScroll() {
  header.classList.toggle("scrolled", window.scrollY > 8);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Active nav link ---------- */
const links = [...navLinks.querySelectorAll("a")];
const sections = links
  .map((a) => document.querySelector(a.getAttribute("href")))
  .filter(Boolean);

const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id)
      );
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => spy.observe(s));

/* ---------- Reveal on scroll ---------- */
const reveal = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        reveal.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));

/* ---------- Footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Contact form ---------- */
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("contact-submit");

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = "form-status" + (kind ? " " + kind : "");
}

// EmailJS is loaded only when someone actually sends a message
let emailjsReady;
function loadEmailJS() {
  if (!emailjsReady) {
    emailjsReady = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = EMAILJS_SRC;
      s.onload = () => {
        window.emailjs.init(EMAILJS_PUBLIC_KEY);
        resolve(window.emailjs);
      };
      s.onerror = () => {
        emailjsReady = null;
        reject(new Error("Could not load EmailJS"));
      };
      document.head.appendChild(s);
    });
  }
  return emailjsReady;
}

form.addEventListener("input", (e) => e.target.classList.remove("invalid"));

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fields = [form.elements.name, form.elements.email, form.elements.message];
  const invalid = fields.filter((f) => !f.value.trim() || !f.checkValidity());
  fields.forEach((f) => f.classList.toggle("invalid", invalid.includes(f)));

  if (invalid.length) {
    setStatus(
      invalid[0] === form.elements.email && form.elements.email.value.trim()
        ? "Please enter a valid email address."
        : "Please fill in all fields.",
      "err"
    );
    invalid[0].focus();
    return;
  }

  submitBtn.disabled = true;
  setStatus("Sending…");

  try {
    const emailjs = await loadEmailJS();
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      message: form.elements.message.value.trim(),
    });
    form.reset();
    setStatus("Message sent. Thanks — I’ll get back to you soon.", "ok");
  } catch (error) {
    console.error("EmailJS error:", error);
    setStatus("Couldn’t send your message. Please try again or email me directly.", "err");
  } finally {
    submitBtn.disabled = false;
  }
});
