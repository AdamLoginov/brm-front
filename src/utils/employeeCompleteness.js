// новый код chat: общие правила заполненности и независимые условия фильтрации
export const normalizeEmployeeText = value => String(value ?? '').trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/\s+/g, ' ');
const hasValue = value => value !== null && value !== undefined && String(value).trim() !== '';
const text = value => String(value ?? '').trim();
const datePresent = value => hasValue(value) && !String(value).startsWith('0001-') && Number.isFinite(Date.parse(value));
const dateLabel = value => new Intl.DateTimeFormat('ru-RU').format(new Date(value));
const money = value => Number(value).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
export const employeeFullName = employee => [employee.surname, employee.name, employee.middle_name].filter(hasValue).map(text).join(' ') || 'Без имени';
export const employeePhones = employee => {
  const phones = (employee.phones || []).filter(hasValue).map(text);
  return [...new Set(phones.length ? phones : [employee.phone].filter(hasValue).map(text))];
};
const field = (key, label, group, extra = {}) => ({ key, label, group, kind: 'text', ...extra });
export const employeeFields = [
  field('surname', 'Фамилия', 'Основное'),
  field('name', 'Имя', 'Основное'),
  field('middle_name', 'Отчество', 'Основное'),
  field('status', 'Статус', 'Основное', { kind: 'boolean', yes: 'Уволен', no: 'Работает' }),
  field('profession', 'Должность', 'Работа и оплата'),
  field('specializations', 'Специализации', 'Работа и оплата', { kind: 'list', read: e => (e.specializations || []).map(s => s.name).filter(hasValue) }),
  field('is_itr', 'Сотрудник ИТР', 'Работа и оплата', { kind: 'boolean' }),
  field('agreement_id', 'Договор / место работы', 'Работа и оплата', { present: e => Number(e.agreement_id) > 0, format: e => e.agreement?.short_name || e.agreement?.name || 'Договор № ' + e.agreement_id }),
  field('start_date', 'Начало работы', 'Работа и оплата', { kind: 'date' }),
  field('salary_rate', 'Ставка за смену', 'Работа и оплата'),
  field('officially_employed', 'Устроен официально', 'Работа и оплата', { kind: 'boolean' }),
  field('monthly_salary_kopecks', 'Официальная зарплата в месяц', 'Работа и оплата', { applies: e => e.officially_employed === true, format: e => money(e.monthly_salary_kopecks / 100) }),
  field('date_of_birth', 'Дата рождения', 'Личные данные', { kind: 'date' }),
  field('place_of_residence', 'Город проживания', 'Личные данные'),
  field('marital_status', 'Семейное положение', 'Личные данные'),
  field('education', 'Образование', 'Личные данные'),
  field('experience', 'Опыт работы', 'Личные данные'),
  field('phones', 'Телефоны', 'Контакты', { kind: 'list', read: employeePhones }),
  field('email', 'Электронная почта', 'Контакты'),
  field('pasport_serial', 'Серия паспорта', 'Паспорт и СНИЛС'),
  field('pasport_number', 'Номер паспорта', 'Паспорт и СНИЛС'),
  field('snils', 'СНИЛС', 'Паспорт и СНИЛС'),
  field('clothing_size', 'Размер одежды', 'Рабочая одежда'),
  field('shoe_size', 'Размер обуви', 'Рабочая одежда'),
  field('height_cm', 'Рост', 'Рабочая одежда', { present: e => Number(e.height_cm) > 0, format: e => e.height_cm + ' см' }),
];

// Категории определяются по ID; документы без действующей категории не теряются.
export const buildDocumentColumns = (categories, employees) => {
  const known = new Map(categories.map(category => [String(category.ID), { key: 'document:' + category.ID, label: category.category_name || 'Категория № ' + category.ID, group: 'Документы', kind: 'documents', categoryID: String(category.ID), requiredCategory: true }]));
  const extra = new Map();
  for (const employee of employees) {
    for (const document of employee.employee_documents || []) {
      const id = String(document.category_employee_document_id ?? document.category_document_card?.ID ?? 0);
      if (!known.has(id) && !extra.has(id)) extra.set(id, { key: 'document:' + id, label: document.category_document_card?.category_name || (id === '0' ? 'Без категории' : 'Категория № ' + id + ' (вне справочника)'), group: 'Документы', kind: 'documents', categoryID: id, requiredCategory: false });
    }
  }
  return [...known.values(), ...extra.values()];
};
export const employeeCell = (employee, column) => {
  if (column.applies && !column.applies(employee)) return { state: 'na', text: 'Не применяется', files: [] };
  if (column.kind === 'documents') {
    const files = (employee.employee_documents || []).filter(document => String(document.category_employee_document_id ?? document.category_document_card?.ID ?? 0) === column.categoryID);
    return { state: files.length ? 'filled' : 'missing', text: files.length ? files.map(f => f.file_name || f.document_name || 'Файл № ' + f.ID).join('; ') : 'Нет файлов', files };
  }
  const value = column.read ? column.read(employee) : employee[column.key];
  const present = column.present ? column.present(employee) : column.kind === 'date' ? datePresent(value) : column.kind === 'boolean' ? typeof value === 'boolean' : Array.isArray(value) ? value.length > 0 : hasValue(value);
  if (!present) return { state: 'missing', text: 'Не заполнено', files: [] };
  const label = column.format ? column.format(employee) : column.kind === 'boolean' ? (value ? column.yes || 'Да' : column.no || 'Нет') : column.kind === 'date' ? dateLabel(value) : Array.isArray(value) ? value.join('; ') : text(value);
  return { state: 'filled', text: label, files: [] };
};
export const buildEmployeeRow = (employee, columns) => {
  const cells = Object.fromEntries(columns.map(column => [column.key, employeeCell(employee, column)]));
  return {
    employee, cells, name: employeeFullName(employee),
    missingFields: columns.filter(c => c.kind !== 'documents' && cells[c.key].state === 'missing').length,
    missingDocuments: columns.filter(c => c.requiredCategory && cells[c.key].state === 'missing').length,
  };
};
export const matchesEmployeeConditions = (row, conditions, mode = 'all') => {
  const active = conditions.filter(condition => condition.key && condition.operator);
  if (!active.length) return true;
  const matches = condition => {
    const cell = row.cells[condition.key];
    if (!cell) return false;
    if (condition.operator === 'filled') return cell.state === 'filled';
    if (condition.operator === 'missing') return cell.state === 'missing';
    if (condition.operator === 'na') return cell.state === 'na';
    if (cell.state !== 'filled') return false;
    const expected = normalizeEmployeeText(condition.value);
    if (!expected) return false;
    const actual = normalizeEmployeeText(cell.text);
    if (condition.operator === 'contains') return actual.includes(expected);
    if (condition.operator === 'equals') return actual === expected;
    return false;
  };
  return mode === 'any' ? active.some(matches) : active.every(matches);
};
