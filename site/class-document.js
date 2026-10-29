/* Reading layout and keyboard access shared by all classroom summaries. */
(() => {
  document.body.classList.add('document-page');
  const provenance = document.querySelector('main>section:first-of-type>p.source');
  if (provenance) {
    const details = document.createElement('details');
    details.className = 'document-provenance';
    const summary = document.createElement('summary');
    summary.textContent = '資料來源與整理範圍';
    provenance.before(details);
    details.append(summary, provenance);
  }
  for (const table of document.querySelectorAll('main table')) {
    let region = table.parentElement;
    if (!region.matches('.scroll,.table-scroll,.document-table-scroll') &&
        !['auto', 'scroll'].includes(getComputedStyle(region).overflowX)) {
      region = document.createElement('div');
      table.before(region);
      region.append(table);
    }
    region.classList.add('document-table-scroll');
    region.tabIndex = 0;
    if (!region.hasAttribute('role')) region.setAttribute('role', 'region');
    if (!region.hasAttribute('aria-label')) {
      const heading = table.closest('section')?.querySelector('h2,h3');
      region.setAttribute('aria-label', (heading?.textContent.trim() || '比較表') + '，可左右捲動');
    }
  }
})();
