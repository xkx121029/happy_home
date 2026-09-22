// 参数化查询助手。
// 这些函数原本在 db.js / server.js 里各写了一份，抽取到这里集中维护，
// 行为保持完全一致（sql.js 的 prepare/step/getAsObject 用法未变）。

function execQuery(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const results = [];
  if (params.length > 0) {
    stmt.bind(params);
  }
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function getSingle(db, sql, params = []) {
  const results = execQuery(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

// sql.js 无法绑定 undefined（会抛 Wrong API use），会把整个请求打成 500。
// 统一规整为 null：配合 SQL 里的 COALESCE(NULL, col) 恰好等于「不修改该列」，
// 这正是部分更新的语义 —— 例如只传 { sticky: true } 时不应影响标题与正文。
function bindable(params = []) {
  return params.map((value) => (value === undefined ? null : value));
}

// 执行写语句（INSERT/UPDATE/DELETE 等），参数化绑定
function run(db, sql, params = []) {
  return db.run(sql, params);
}

module.exports = { execQuery, getSingle, bindable, run };