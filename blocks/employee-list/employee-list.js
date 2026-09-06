import { fetchPlaceholders } from '/scripts/placeholders.js';

const PAGE_SIZE = 10;
const EMPLOYEE_DATA_URL = '/employees.json';

// If the placeholders sheet is under a locale folder, use:
// const PLACEHOLDER_LOCALE = 'en';
const PLACEHOLDER_LOCALE = null;

const EMPLOYEE_COLUMNS = [
  'Name',
  'Department',
  'Experience',
  'City',
];

function appendCell(row, tagName, value) {
  const cell = document.createElement(tagName);
  cell.textContent = value ?? '';
  row.append(cell);
}

function appendEmployees(tbody, employees) {
  employees.forEach((employee) => {
    const row = document.createElement('tr');

    EMPLOYEE_COLUMNS.forEach((column) => {
      appendCell(row, 'td', employee[column]);
    });

    tbody.append(row);
  });
}

async function getPlaceholders() {
  if (PLACEHOLDER_LOCALE) {
    return fetchPlaceholders(PLACEHOLDER_LOCALE);
  }

  return fetchPlaceholders();
}

export default async function decorate(block) {
  block.replaceChildren();

  const table = document.createElement('table');
  table.className = 'employee-list__table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  EMPLOYEE_COLUMNS.forEach((column) => {
    appendCell(headerRow, 'th', column);
  });

  thead.append(headerRow);

  const tbody = document.createElement('tbody');
  table.append(thead, tbody);

  const controls = document.createElement('div');
  controls.className = 'employee-list__controls';

  const status = document.createElement('p');
  status.className = 'employee-list__status';
  status.setAttribute('role', 'status');

  const loadMoreButton = document.createElement('button');
  loadMoreButton.className = 'employee-list__load-more';
  loadMoreButton.type = 'button';

  const placeholders = await getPlaceholders();
  const loadMoreLabel = placeholders.loadMore;

  if (!loadMoreLabel) {
    throw new Error('Missing required placeholder: load-more');
  }

  loadMoreButton.textContent = loadMoreLabel;
  loadMoreButton.setAttribute(
    'aria-label',
    loadMoreLabel,
  );

  controls.append(loadMoreButton, status);
  block.append(table, controls);

  let offset = 0;
  let total = 0;
  let loading = false;

  async function loadNextPage() {
    if (loading || (total > 0 && offset >= total)) {
      return;
    }

    loading = true;
    loadMoreButton.disabled = true;
    status.textContent = 'Loading employees…';

    try {
      const url = new URL(
        EMPLOYEE_DATA_URL,
        window.location.origin,
      );

      url.searchParams.set('limit', String(PAGE_SIZE));
      url.searchParams.set('offset', String(offset));

      const response = await fetch(url, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          `Employee data request failed: ${response.status}`,
        );
      }

      const payload = await response.json();

      if (!Array.isArray(payload.data)) {
        throw new Error('Employee JSON does not contain a data array');
      }

      appendEmployees(tbody, payload.data);

      offset += payload.data.length;
      total = Number(payload.total ?? offset);

      const hasMoreEmployees =
        payload.data.length > 0 && offset < total;

      loadMoreButton.hidden = !hasMoreEmployees;
      status.textContent = `${offset} of ${total} employees displayed`;
    } catch (error) {
      console.error(error);
      status.textContent = 'Unable to load employees.';
      loadMoreButton.hidden = false;
    } finally {
      loading = false;
      loadMoreButton.disabled = loadMoreButton.hidden;
    }
  }

  loadMoreButton.addEventListener('click', loadNextPage);

  await loadNextPage();
}