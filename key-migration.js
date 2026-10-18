// key-migration.js
// Storage keys were renamed in October 2026 when the former client prefix was
// dropped. Loaded as a plain script before any other script reads storage:
//   1. each old localStorage / sessionStorage key is copied to its new name
//      (unless the new key already holds a value) and the old key is deleted,
//      so saved locks, moves and settings carry over;
//   2. window.renameLegacyKey is used by Import State, so snapshots exported
//      before the rename still restore under the new names.
// The legacy prefixes below are the only place the old names survive. Same
// mapping as the CCTV and PIPE_RELINING tools' src/shared/key-migration.js.
(function () {
  var LEGACY_PREFIXES = [
    ['nbcCctv', 'cctv'],
    ['nbcRelining', 'relining'],
    ['nbc-', 'stormwater-'],
    ['nbc_', 'stormwater_']
  ];
  // The old sign-in flag belonged to the removed passphrase gate: dropped, not renamed.
  var DROPPED = ['nbc_rain_auth'];

  function renameLegacyKey(key) {
    var k = String(key);
    for (var i = 0; i < LEGACY_PREFIXES.length; i++) {
      var p = LEGACY_PREFIXES[i];
      if (k.indexOf(p[0]) === 0) return p[1] + k.slice(p[0].length);
    }
    return k;
  }

  function migrateStorage(store) {
    var legacy = [];
    for (var i = 0; i < store.length; i++) {
      var k = store.key(i);
      if (k && (DROPPED.indexOf(k) !== -1 || renameLegacyKey(k) !== k)) legacy.push(k);
    }
    legacy.forEach(function (oldKey) {
      if (DROPPED.indexOf(oldKey) === -1) {
        var newKey = renameLegacyKey(oldKey);
        var value = store.getItem(oldKey);
        if (value !== null && store.getItem(newKey) === null) store.setItem(newKey, value);
      }
      store.removeItem(oldKey);
    });
    return legacy.length;
  }

  try { migrateStorage(window.localStorage); } catch (_) { /* storage may throw in private mode */ }
  try { migrateStorage(window.sessionStorage); } catch (_) {}
  window.renameLegacyKey = renameLegacyKey;
  window.migrateLegacyStorage = migrateStorage;
})();
