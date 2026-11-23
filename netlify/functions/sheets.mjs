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

async function handleDeltaResource(store, body) {
  const charId = String(body?.charId || "").trim();
  if (!charId || charId.startsWith("_")) {
    return jsonResp({ error: "Ungültige oder geschützte Charakter-ID." }, 403);
  }
  const sheet = await store.get(charId, { type: "json" });
  if (!sheet || typeof sheet !== "object") {
    return jsonResp({ error: "Charakterbogen nicht gefunden." }, 404);
  }

  let reg = {};
  try {
    const regBlob = await store.get(REGISTRY_ID, { type: "json" });
    if (regBlob && typeof regBlob === "object" && regBlob.registry) {
      reg = regBlob.registry;
    }
  } catch (e) {}

  const actorLow = String(body?.actorUser || "").trim().toLowerCase();
  const reqAdminHash = String(body?.adminHash || "").trim();
  const regAdminHash = String(reg.adminHash || "").trim();
  const isAdmin = Boolean(
    (regAdminHash && reqAdminHash && reqAdminHash === regAdminHash) ||
    (!regAdminHash && body?.isAdmin === true)
  );
  const sheetOwner = String(reg.claims?.[charId] || sheet.owner || sheet._summary?.owner || "").trim().toLowerCase();
  const isOwner = Boolean(actorLow && sheetOwner && actorLow === sheetOwner);
  const campId = String(reg.charCampaigns?.[charId] || sheet.campaignId || sheet._summary?.campaignId || "default").trim() || "default";
  const globalGms = Array.isArray(reg.gmUsers)
    ? reg.gmUsers.map((u) => String(u || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const isGlobalGm = Boolean(actorLow && globalGms.includes(actorLow));
  const campObj = Array.isArray(reg.campaigns) ? reg.campaigns.find((c) => c && c.id === campId) : null;
  const campGms = Array.isArray(campObj?.gmUsers)
    ? campObj.gmUsers.map((u) => String(u || "").trim().toLowerCase()).filter(Boolean)
    : [];
  const isCampaignGm = Boolean(isGlobalGm && (campId === "default" || campGms.includes(actorLow)));

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

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const store = getStore("scherbensturm-chars");
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

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

    // 2. Übersicht aller Charakterbögen in der Gruppen-Lobby abrufen
    if (req.method === "GET") {
      const { blobs } = await store.list();
      const items = await Promise.all(
        (blobs || []).map(async (b) => {
          try {
            const d = await store.get(b.key, { type: "json" });
            if (!d) return null;
            return {
              id: b.key,
              name: d.profile?.name || "Unbenannter Charakter",
              ancestry: d.profile?.ancestry || "",
              concept: d.profile?.concept || "",
              avatar: d.profile?.avatar || "",
              owner: d.owner || d._summary?.owner || "",
              campaignId: d.campaignId || d._summary?.campaignId || "default",
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
              updatedAt: d._summary?.updatedAt || ""
            };
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

    // 3. Atomarer Ressourcen-Delta-Endpunkt (PATCH oder POST mit action: 'deltaResource')
    if (req.method === "PATCH") {
      const body = await req.json();
      return await handleDeltaResource(store, body);
    }

    // 4. Charakterbogen speichern oder aktualisieren
    if (req.method === "POST") {
      const body = await req.json();
      if (body && body.action === "deltaResource") {
        return await handleDeltaResource(store, body);
      }
      const charId = String(body.charId || "").trim() || "char_" + Date.now();
      delete body.cloudPin;
      delete body._pinProtected;
      delete body._pinVerified;
      body.charId = charId;
      await store.setJSON(charId, body);
      return jsonResp({ ok: true, id: charId });
    }

    // 5. Charakterbogen aus der Lobby löschen
    if (req.method === "DELETE" && id) {
      await store.delete(id);
      return jsonResp({ ok: true });
    }

    return jsonResp({ error: "Ungültige Anfrage." }, 400);
  } catch (err) {
    return jsonResp({ error: "Serverfehler: " + (err.message || String(err)) }, 500);
  }
};
