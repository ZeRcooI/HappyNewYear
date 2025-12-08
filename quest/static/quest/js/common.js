function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const c = cookie.trim();
      if (c.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(c.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener('DOMContentLoaded', function () {
  const navItems = document.querySelectorAll('.folder-clickable[data-url]');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const url = item.dataset.url;
      if (url) {
        window.location.href = url;
      }
    });
  });
});
