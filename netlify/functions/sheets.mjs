import { getStore } from "@netlify/blobs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept"
};

const REGISTRY_ID = "_lobby_meta_registry_";
const ALLOWED_DELTA_KEYS = ["lpCurrent", "mlpCurrent", "apCurrent", "mapCurrent"];

const jsonResp = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" }
  });

const toIntSafe = (v, fallback = 0) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
};

const makeDeStamp = () => {
  try {
    return new Date().toLocaleString("de-DE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch (e) {
    return new Date().toISOString();
  }
};

async function loadRegistryObj(store) {
  try {
    const regBlob = await store.get(REGISTRY_ID, { type: "json" });
    if (regBlob && typeof regBlob === "object" && regBlob.registry) {
      return regBlob.registry;
    }
  } catch (e) {}
  return {};
}

function resolveAuthContext(reg, sheet, charId, body) {
  const actorLow = String(body?.actorUser || "").trim().toLowerCase();
  const reqAdminHash = String(body?.adminHash || "").trim();
  const regAdminHash = String(reg.adminHash || "").trim();
  const isAdmin = Boolean(
    (regAdminHash && reqAdminHash && reqAdminHash === regAdminHash) ||
    (!regAdminHash && body?.isAdmin === true)
  );
  const sheetOwner = String(reg.claims?.[charId] || sheet?.owner || sheet?._summary?.owner || "").trim().toLowerCase();
  const isOwner = Boolean(actorLow && sheetOwner && actorLow === sheetOwner);
  const campId = String(reg.charCampaigns?.[charId] || sheet?.campaignId || sheet?._summary?.campaignId || "default").trim() || "default";
  const globalGms = Array.isArray(reg.gmUsers)
    ? reg.gmUsers.map((u) => String(u || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const isGlobalGm = Boolean(actorLow && globalGms.includes(actorLow));
  const checkCampGm = (cid) => {
    if (!cid || cid === "default") return false;
    const cObj = Array.isArray(reg.campaigns) ? reg.campaigns.find((c) => c && c.id === cid) : null;
    const cGms = Array.isArray(cObj?.gmUsers)
      ? cObj.gmUsers.map((u) => String(u || "").trim().toLowerCase()).filter(Boolean)
      : [];
    return Boolean(isGlobalGm && cGms.includes(actorLow));
  };
  const enemyCampIds = [
    ...(Array.isArray(reg.enemyMeta?.[charId]?.campaignIds) ? reg.enemyMeta[charId].campaignIds : []),
    ...(Array.isArray(sheet?.enemyMeta?.campaignIds) ? sheet.enemyMeta.campaignIds : []),
    ...(Array.isArray(sheet?._summary?.enemyMeta?.campaignIds) ? sheet._summary.enemyMeta.campaignIds : [])
  ].map((c) => String(c || "").trim()).filter(Boolean);
  const isCampaignGm = Boolean(
    (isGlobalGm && campId === "default") ||
    checkCampGm(campId) ||
    enemyCampIds.some((cid) => checkCampGm(cid))
  );
  return { actorLow, isAdmin, sheetOwner, isOwner, campId, isGlobalGm, isCampaignGm };
}

function buildSheetSummaryItem(key, d) {
  const isEnemy = d.sheetType === "enemy" || d._summary?.sheetType === "enemy";
  return {
    id: key,
    name: d.profile?.name || "Unbenannter Charakter",
    ancestry: d.profile?.ancestry || "",
    concept: d.profile?.concept || "",
    avatar: d.profile?.avatar || "",
    owner: d.owner || d._summary?.owner || "",
    campaignId: d.campaignId || d._summary?.campaignId || "default",
    sheetType: isEnemy ? "enemy" : "character",
    enemyMeta: isEnemy ? (d.enemyMeta || d._summary?.enemyMeta || null) : null,
    level: d.progression?.level || 1,
    lpCurrent: d.secondary?.lpCurrent ?? 8,
    lpMax: d._summary?.lpMax ?? 8,
    mlpCurrent: d.secondary?.mlpCurrent ?? 8,
    mlpMax: d._summary?.mlpMax ?? 8,
    apCurrent: d.secondary?.apCurrent ?? 3,
    apMax: d._summary?.apMax ?? 3,
    mapCurrent: d.secondary?.mapCurrent ?? 3,
    mapMax: d._summary?.mapMax ?? 3,
    ini: d._summary?.ini ?? 0,
    hasPin: false,
    updatedAt: d._summary?.updatedAt || "",
    ...(d._trashed ? {
      trashedAt: String(d._trashedAt || ""),
      trashedAtMs: toIntSafe(d._trashedAtMs, 0),
      trashedBy: String(d._trashedBy || "")
    } : {})
  };
}

async function handleDeltaResource(store, body) {
  const charId = String(body?.charId || "").trim();
  if (!charId || charId.startsWith("_")) {
    return jsonResp({ error: "Ungültige oder geschützte Charakter-ID." }, 403);
  }
  const sheet = await store.get(charId, { type: "json" });
  if (!sheet || typeof sheet !== "object") {
    return jsonResp({ error: "Charakterbogen nicht gefunden." }, 404);
  }

  const reg = await loadRegistryObj(store);
  const { isAdmin, isOwner, isCampaignGm } = resolveAuthContext(reg, sheet, charId, body);

  if (!isAdmin && !isOwner && !isCampaignGm) {
    return jsonResp({ error: "Keine Berechtigung für direkten Ressourcenabzug (nur Besitzer, Kampagnen-SL oder Admin)." }, 403);
  }

  const rawDeltas = (body?.deltas && typeof body.deltas === "object") ? body.deltas : {};
  const appliedDeltas = {};
  for (const k of ALLOWED_DELTA_KEYS) {
    if (rawDeltas[k] !== undefined && rawDeltas[k] !== null && rawDeltas[k] !== "") {
      const d = toIntSafe(rawDeltas[k], 0);
      if (d !== 0) appliedDeltas[k] = d;
    }
  }
  if (!Object.keys(appliedDeltas).length) {
    return jsonResp({ error: "Keine gültigen Ressourcen-Änderungen angegeben." }, 400);
  }

  if (!sheet.secondary || typeof sheet.secondary !== "object") {
    sheet.secondary = { lpCurrent: 8, mlpCurrent: 8, apCurrent: 3, mapCurrent: 3 };
  }
  const before = {};
  const after = {};
  for (const [k, d] of Object.entries(appliedDeltas)) {
    const defVal = (k === "apCurrent" || k === "mapCurrent") ? 3 : 8;
    const prev = toIntSafe(sheet.secondary[k], defVal);
    let next = prev + d;
    if (k === "apCurrent" || k === "mapCurrent") next = Math.max(0, next);
    before[k] = prev;
    after[k] = next;
    sheet.secondary[k] = next;
  }

  const ts = String(body?.ts || "").trim() || makeDeStamp();
  const logText = String(body?.logText || "").trim();
  if (logText) {
    if (!Array.isArray(sheet.chronicleLog)) sheet.chronicleLog = [];
    sheet.chronicleLog.unshift({
      id: "chg_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ts,
      text: logText
    });
    if (sheet.chronicleLog.length > 300) sheet.chronicleLog.length = 300;
  }

  if (!sheet._summary || typeof sheet._summary !== "object") sheet._summary = {};
  sheet._summary.updatedAt = ts;
  delete sheet.cloudPin;
  delete sheet._pinProtected;
  delete sheet._pinVerified;

  await store.setJSON(charId, sheet);
  return jsonResp({
    ok: true,
    id: charId,
    name: sheet.profile?.name || "Charakter",
    before,
    after,
    secondary: {
      lpCurrent: toIntSafe(sheet.secondary.lpCurrent, 8),
      mlpCurrent: toIntSafe(sheet.secondary.mlpCurrent, 8),
      apCurrent: toIntSafe(sheet.secondary.apCurrent, 3),
      mapCurrent: toIntSafe(sheet.secondary.mapCurrent, 3)
    },
    updatedAt: ts
  });
}

async function handleTrashSheet(store, body) {
  const charId = String(body?.charId || "").trim();
  if (!charId || charId.startsWith("_")) {
    return jsonResp({ error: "Ungültige oder geschützte Charakter-ID." }, 403);
  }
  const sheet = await store.get(charId, { type: "json" });
  if (!sheet || typeof sheet !== "object") {
    return jsonResp({ ok: true, id: charId, missing: true });
  }
  const reg = await loadRegistryObj(store);
  const { isAdmin, sheetOwner, isOwner, isCampaignGm } = resolveAuthContext(reg, sheet, charId, body);
  const isEnemy = sheet.sheetType === "enemy" || sheet._summary?.sheetType === "enemy" || Boolean(reg.enemyMeta?.[charId]);
  const allowed = isAdmin || isOwner || isCampaignGm || (!sheetOwner && !isEnemy);
  if (!allowed) {
    return jsonResp({ error: "Keine Berechtigung zum Löschen dieses Charakterbogens." }, 403);
  }
  const ts = makeDeStamp();
  const tsMs = Date.now();
  const actorName = String(body?.actorUser || (isAdmin ? "Admin" : "")).trim();
  if (!sheet.owner && reg.claims?.[charId]) sheet.owner = String(reg.claims[charId]);
  if ((!sheet.campaignId || sheet.campaignId === "default") && reg.charCampaigns?.[charId]) {
    sheet.campaignId = String(reg.charCampaigns[charId]);
  }
  if (isEnemy && reg.enemyMeta?.[charId]) {
    sheet.sheetType = "enemy";
    sheet.enemyMeta = reg.enemyMeta[charId];
  }
  sheet._trashed = true;
  sheet._trashedAt = ts;
  sheet._trashedAtMs = tsMs;
  sheet._trashedBy = actorName;
  await store.setJSON(charId, sheet);
  return jsonResp({ ok: true, id: charId, trashed: true, item: buildSheetSummaryItem(charId, sheet) });
}

async function handleRestoreSheet(store, body) {
  const charId = String(body?.charId || "").trim();
  if (!charId || charId.startsWith("_")) {
    return jsonResp({ error: "Ungültige oder geschützte Charakter-ID." }, 403);
  }
  const reg = await loadRegistryObj(store);
  const { isAdmin } = resolveAuthContext(reg, null, charId, body);
  if (!isAdmin) {
    return jsonResp({ error: "Nur der Admin kann Charakterbögen aus dem Papierkorb wiederherstellen." }, 403);
  }
  const sheet = await store.get(charId, { type: "json" });
  if (!sheet || typeof sheet !== "object") {
    return jsonResp({ error: "Charakterbogen im Papierkorb nicht gefunden." }, 404);
  }
  delete sheet._trashed;
  delete sheet._trashedAt;
  delete sheet._trashedAtMs;
  delete sheet._trashedBy;
  await store.setJSON(charId, sheet);
  return jsonResp({ ok: true, id: charId, restored: true, item: buildSheetSummaryItem(charId, sheet) });
}

async function handlePermanentDeleteSheet(store, body) {
  const charId = String(body?.charId || "").trim();
  if (!charId || charId.startsWith("_")) {
    return jsonResp({ error: "Ungültige oder geschützte Charakter-ID." }, 403);
  }
  const reg = await loadRegistryObj(store);
  const { isAdmin } = resolveAuthContext(reg, null, charId, body);
  if (!isAdmin) {
    return jsonResp({ error: "Nur der Admin kann Charakterbögen permanent löschen." }, 403);
  }
  await store.delete(charId);
  return jsonResp({ ok: true, id: charId, permanent: true });
}

async function handleEmptyTrash(store, body) {
  const reg = await loadRegistryObj(store);
  const { isAdmin } = resolveAuthContext(reg, null, "", body);
  if (!isAdmin) {
    return jsonResp({ error: "Nur der Admin kann den Papierkorb leeren." }, 403);
  }
  const { blobs } = await store.list();
  const deletedIds = [];
  for (const b of (blobs || [])) {
    if (!b?.key || b.key.startsWith("_")) continue;
    try {
      const d = await store.get(b.key, { type: "json" });
      if (d && d._trashed === true) {
        await store.delete(b.key);
        deletedIds.push(b.key);
      }
    } catch (e) {}
  }
  return jsonResp({ ok: true, deletedIds });
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const store = getStore("scherbensturm-chars");
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const wantTrashed = url.searchParams.get("trashed") === "1";

    // 1. Einzelnen Charakterbogen abrufen
    if (req.method === "GET" && id) {
      const data = await store.get(id, { type: "json" });
      if (!data) return jsonResp({ error: "Charakterbogen nicht gefunden." }, 404);
      const safeData = { ...data };
      delete safeData.cloudPin;
      delete safeData._pinProtected;
      delete safeData._pinVerified;
      return jsonResp(safeData);
    }

    // 2. Papierkorb-Liste für den Admin abrufen
    if (req.method === "GET" && wantTrashed) {
      const { blobs } = await store.list();
      const items = await Promise.all(
        (blobs || []).map(async (b) => {
          if (!b?.key || b.key.startsWith("_")) return null;
          try {
            const d = await store.get(b.key, { type: "json" });
            if (!d || d._trashed !== true) return null;
            return buildSheetSummaryItem(b.key, d);
          } catch (e) {
            return null;
          }
        })
      );
      const cleanTrash = items
        .filter(Boolean)
        .sort((a, b) => (toIntSafe(b.trashedAtMs, 0) - toIntSafe(a.trashedAtMs, 0)) || String(a.name).localeCompare(String(b.name), "de"));
      return jsonResp(cleanTrash);
    }

    // 3. Übersicht aller aktiven Charakterbögen in der Gruppen-Lobby abrufen
    if (req.method === "GET") {
      const { blobs } = await store.list();
      const items = await Promise.all(
        (blobs || []).map(async (b) => {
          try {
            const d = await store.get(b.key, { type: "json" });
            if (!d || d._trashed === true) return null;
            return buildSheetSummaryItem(b.key, d);
          } catch (e) {
            return null;
          }
        })
      );
      const cleanList = items
        .filter(Boolean)
        .sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));
      return jsonResp(cleanList);
    }

    // 4. Atomarer Ressourcen-Delta-Endpunkt (PATCH oder POST mit action: 'deltaResource')
    if (req.method === "PATCH") {
      const body = await req.json();
      return await handleDeltaResource(store, body);
    }

    // 5. Charakterbogen speichern, aktualisieren oder Spezial-Aktionen ausführen
    if (req.method === "POST") {
      const body = await req.json();
      if (body && body.action === "deltaResource") {
        return await handleDeltaResource(store, body);
      }
      if (body && body.action === "trashSheet") {
        return await handleTrashSheet(store, body);
      }
      if (body && body.action === "restoreSheet") {
        return await handleRestoreSheet(store, body);
      }
      if (body && body.action === "permanentDeleteSheet") {
        return await handlePermanentDeleteSheet(store, body);
      }
      if (body && body.action === "emptyTrash") {
        return await handleEmptyTrash(store, body);
      }
      const charId = String(body.charId || "").trim() || "char_" + Date.now();
      delete body.cloudPin;
      delete body._pinProtected;
      delete body._pinVerified;
      body.charId = charId;
      await store.setJSON(charId, body);
      return jsonResp({ ok: true, id: charId });
    }

    // 6. Charakterbogen in den Papierkorb verschieben (Soft-Delete als sicherer Standard)
    if (req.method === "DELETE" && id) {
      if (id.startsWith("_")) {
        return jsonResp({ error: "Geschützte System-ID kann nicht gelöscht werden." }, 403);
      }
      const sheet = await store.get(id, { type: "json" });
      if (sheet && typeof sheet === "object") {
        sheet._trashed = true;
        sheet._trashedAt = makeDeStamp();
        sheet._trashedAtMs = Date.now();
        sheet._trashedBy = String(url.searchParams.get("actor") || "").trim();
        await store.setJSON(id, sheet);
      }
      return jsonResp({ ok: true, trashed: true });
    }

    return jsonResp({ error: "Ungültige Anfrage." }, 400);
  } catch (err) {
    return jsonResp({ error: "Serverfehler: " + (err.message || String(err)) }, 500);
  }
};
