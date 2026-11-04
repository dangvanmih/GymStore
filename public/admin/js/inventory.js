document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', event => {
    const allStatusButton = event.target.closest('[button-status=""]');
    if (!allStatusButton) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const url = new URL(window.location.href);
    url.searchParams.delete('status');
    url.searchParams.delete('stock');
    url.searchParams.delete('page');
    window.location.href = url.toString();
  }, true);

  const stockFilterButton = document.querySelector('[data-stock-filter]');
  if (!stockFilterButton) return;

  stockFilterButton.addEventListener('click', () => {
    const url = new URL(window.location.href);
    const isActive = url.searchParams.get('stock') === stockFilterButton.dataset.stockFilter;
    if (isActive) url.searchParams.delete('stock');
    else url.searchParams.set('stock', stockFilterButton.dataset.stockFilter);
    url.searchParams.delete('page');
    window.location.href = url.toString();
  });
});
