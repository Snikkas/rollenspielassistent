import { getStore } from "@netlify/blobs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept"
};

const jsonResp = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json; charset=utf-8" }
  });

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const store = getStore("scherbensturm-chars");
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const pin = (url.searchParams.get("pin") || "").trim();

    // 1. Einzelnen Charakterbogen abrufen
    if (req.method === "GET" && id) {
      const data = await store.get(id, { type: "json" });
      if (!data) return jsonResp({ error: "Charakterbogen nicht gefunden." }, 404);
      const savedPin = String(data.cloudPin || "").trim();
      const pinVerified = !savedPin || savedPin === pin;
      const safeData = {
        ...data,
        cloudPin: pinVerified ? savedPin : "",
        _pinProtected: Boolean(savedPin),
        _pinVerified: pinVerified
      };
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
              hasPin: Boolean(String(d.cloudPin || "").trim()),
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

    // 3. Charakterbogen speichern oder aktualisieren
    if (req.method === "POST") {
      const body = await req.json();
      const charId = String(body.charId || "").trim() || "char_" + Date.now();
      const existing = await store.get(charId, { type: "json" });
      if (existing) {
        const existingPin = String(existing.cloudPin || "").trim();
        const incomingPin = String(body.cloudPin || "").trim();
        if (existingPin && existingPin !== incomingPin) {
          return jsonResp(
            { error: "Dieser Charakter ist mit einer Schutz-PIN gesichert. Bitte richtige PIN eingeben." },
            403
          );
        }
      }
      body.charId = charId;
      await store.setJSON(charId, body);
      return jsonResp({ ok: true, id: charId });
    }

    // 4. Charakterbogen aus der Lobby löschen
    if (req.method === "DELETE" && id) {
      const existing = await store.get(id, { type: "json" });
      if (existing) {
        const existingPin = String(existing.cloudPin || "").trim();
        if (existingPin && existingPin !== pin) {
          return jsonResp(
            { error: "Zum Löschen dieses Charakters wird die Schutz-PIN benötigt." },
            403
          );
        }
      }
      await store.delete(id);
      return jsonResp({ ok: true });
    }

    return jsonResp({ error: "Ungültige Anfrage." }, 400);
  } catch (err) {
    return jsonResp({ error: "Serverfehler: " + (err.message || String(err)) }, 500);
  }
};
