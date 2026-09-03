document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('.plant-button');

  links.forEach((link) => {
    const image = link.querySelector('.plant-image[data-bm]');
    if (!image) return;

    const original = image.getAttribute('src');
    const bitmap = image.getAttribute('data-bm');
    if (!original || !bitmap) return;

    const showBitmap = () => {
      image.src = bitmap;
    };

    const showOriginal = () => {
      image.src = original;
    };

    link.addEventListener('mouseenter', showBitmap);
    link.addEventListener('mouseleave', showOriginal);
    link.addEventListener('focus', showBitmap);
    link.addEventListener('blur', showOriginal);
  });
});
