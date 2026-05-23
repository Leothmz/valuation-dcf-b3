const OPS_KEY = 'portfolio_operations'
const RF_KEY = 'portfolio_fixed_income'

function _read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function _write(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function generateId() {
  return crypto.randomUUID()
}

export function getOperations() {
  return _read(OPS_KEY)
}

export function saveOperation(op) {
  const ops = _read(OPS_KEY)
  const idx = ops.findIndex(o => o.id === op.id)
  if (idx >= 0) ops[idx] = op
  else ops.push(op)
  _write(OPS_KEY, ops)
}

export function deleteOperation(id) {
  _write(OPS_KEY, _read(OPS_KEY).filter(o => o.id !== id))
}

export function getFixedIncome() {
  return _read(RF_KEY)
}

export function saveFixedIncomeTitle(title) {
  const titles = _read(RF_KEY)
  const idx = titles.findIndex(t => t.id === title.id)
  if (idx >= 0) titles[idx] = title
  else titles.push(title)
  _write(RF_KEY, titles)
}

export function deleteFixedIncomeTitle(id) {
  _write(RF_KEY, _read(RF_KEY).filter(t => t.id !== id))
}

export function addDeposit(titleId, deposit) {
  const titles = _read(RF_KEY)
  const title = titles.find(t => t.id === titleId)
  if (!title) return
  title.deposits.push(deposit)
  _write(RF_KEY, titles)
}

export function deleteDeposit(titleId, depositId) {
  const titles = _read(RF_KEY)
  const title = titles.find(t => t.id === titleId)
  if (!title) return
  title.deposits = title.deposits.filter(d => d.id !== depositId)
  _write(RF_KEY, titles)
}
