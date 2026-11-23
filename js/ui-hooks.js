// Zentrale Callback-Registry zur Vermeidung zirkulärer ES-Modul-Imports.
// Tiefere Schichten (state, calc, cloud, dice, notes, tabs, modals) rufen
// übergeordnete Render- oder Sync-Funktionen über `hooks.<name>(...)` auf.
// Die konkrete Verdrahtung erfolgt einmalig beim Start in `js/app.js`.

export const hooks = Object.create(null);

export function registerHooks(map) {
  if (!map || typeof map !== 'object') return;
  Object.assign(hooks, map);
}
