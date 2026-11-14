'use strict';
// Re-implementation of the vCard interaction model: every behaviour is bound
// through data-* hooks (sidebar, nav pages, testimonial modal, category filter,
// form validation). Unlike the original, nav matching uses data-nav-link values
// instead of comparing innerHTML, and the modal is keyboard-accessible.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const data = window.PORTFOLIO_DATA;

const placeholder = (hue, label) =>
  `<div class="ph" style="--h:${hue}"><span>${label}</span></div>`;

/* ---------- sidebar (mobile accordion) ---------- */
const sidebar = $('[data-sidebar]');
const sidebarBtn = $('[data-sidebar-btn]');
sidebarBtn.addEventListener('click', () => {
  const open = sidebar.classList.toggle('active');
  sidebarBtn.setAttribute('aria-expanded', String(open));
  sidebarBtn.querySelector('span').textContent = open ? 'Hide Contacts' : 'Show Contacts';
});

/* ---------- page navigation ---------- */
const navLinks = $$('[data-nav-link]');
const pages = $$('[data-page]');
function showPage(name, push = true) {
  if (!pages.some(p => p.dataset.page === name)) name = 'about';
  pages.forEach(p => p.classList.toggle('active', p.dataset.page === name));
  navLinks.forEach(l => {
    const on = l.dataset.navLink === name;
    l.classList.toggle('active', on);
    l.toggleAttribute('aria-current', on);
  });
  if (push) history.replaceState(null, '', '#' + name);
  window.scrollTo(0, 0);
}
navLinks.forEach(l => l.addEventListener('click', () => showPage(l.dataset.navLink)));
window.addEventListener('hashchange', () => showPage(location.hash.slice(1), false));

/* ---------- testimonials + modal ---------- */
$('[data-testimonials]').innerHTML = data.testimonials.map((t, i) => `
  <li class="testimonials-item">
    <button class="content-card" data-testimonials-item="${i}">
      <figure class="testimonials-avatar-box" style="--h:${t.hue}">${t.initials}</figure>
      <h4 class="h4 testimonials-item-title">${t.name}</h4>
      <p class="testimonials-text">${t.text}</p>
    </button>
  </li>`).join('');

const modal = $('[data-modal-container]');
let lastFocus = null;
function openModal(t) {
  $('[data-modal-avatar]').textContent = t.initials;
  $('[data-modal-avatar]').style.setProperty('--h', t.hue);
  $('[data-modal-title]').textContent = t.name;
  $('[data-modal-text]').innerHTML = `<p>${t.text}</p>`;
  lastFocus = document.activeElement;
  modal.classList.add('active');
  $('[data-modal-close-btn]').focus();
}
function closeModal() {
  modal.classList.remove('active');
  lastFocus?.focus();
}
$$('[data-testimonials-item]').forEach(b =>
  b.addEventListener('click', () => openModal(data.testimonials[+b.dataset.testimonialsItem])));
$('[data-modal-close-btn]').addEventListener('click', closeModal);
$('[data-overlay]').addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });

/* ---------- portfolio filter (buttons ≥580px, custom select below) ---------- */
$('[data-filter-list]').innerHTML = data.categories.map((c, i) =>
  `<li class="filter-item"><button class="${i === 0 ? 'active' : ''}" data-filter-btn="${c}">${c}</button></li>`).join('');
$('[data-select-list]').innerHTML = data.categories.map(c =>
  `<li class="select-item"><button data-select-item="${c}" role="option">${c}</button></li>`).join('');
$('[data-project-list]').innerHTML = data.projects.map(p => `
  <li class="project-item active" data-filter-item data-category="${p.category}">
    <a href="#portfolio">
      <figure class="project-img">
        <div class="project-item-icon-box"><svg><use href="#i-eye"/></svg></div>
        ${placeholder(p.hue, p.title.split(' ')[0])}
      </figure>
      <h3 class="project-title">${p.title}</h3>
      <p class="project-category">${p.category}</p>
    </a>
  </li>`).join('');

const select = $('[data-select]');
const selectValue = $('[data-select-value]');
function applyFilter(category) {
  $$('[data-filter-item]').forEach(item =>
    item.classList.toggle('active', category === 'All' || item.dataset.category === category));
  $$('[data-filter-btn]').forEach(b => b.classList.toggle('active', b.dataset.filterBtn === category));
  selectValue.textContent = category;
}
select.addEventListener('click', () => select.classList.toggle('active'));
$$('[data-select-item]').forEach(b => b.addEventListener('click', () => {
  applyFilter(b.dataset.selectItem);
  select.classList.remove('active');
}));
$$('[data-filter-btn]').forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filterBtn)));

/* ---------- blog ---------- */
const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' });
$('[data-blog-list]').innerHTML = data.posts.map(p => `
  <li class="blog-post-item">
    <a href="#blog">
      <figure class="blog-banner-box">${placeholder(p.hue, p.category)}</figure>
      <div class="blog-content">
        <div class="blog-meta"><p class="blog-category">${p.category}</p><span class="dot"></span>
          <time datetime="${p.date}">${fmt.format(new Date(p.date))}</time></div>
        <h3 class="h3 blog-item-title">${p.title}</h3>
        <p class="blog-text">${p.excerpt}</p>
      </div>
    </a>
  </li>`).join('');

/* ---------- contact form ---------- */
const form = $('[data-form]');
const formBtn = $('[data-form-btn]');
form.addEventListener('input', () => { formBtn.disabled = !form.checkValidity(); });
form.addEventListener('submit', e => {
  e.preventDefault();
  if (!form.checkValidity()) return;
  $('[data-form-status]').textContent = '메시지가 준비되었습니다 (데모: 실제 전송은 하지 않습니다).';
  form.reset();
  formBtn.disabled = true;
});

showPage(location.hash.slice(1) || 'about', false);
