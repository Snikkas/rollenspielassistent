# Scherbensturm – Projektregeln für KI-Agenten

## 1. Git- & Live-Schutz (STRIKT)
- Arbeite NIEMALS direkt auf `main` und pushe/merge niemals direkt auf `main`.
- Prüfe vor jeder Änderung mit `git branch`, auf welchem Branch du bist. Wenn du auf `main` bist, erstelle zuerst einen passenden Feature-Branch (z. B. `refactor/...`, `fix/...`, `feature/...`).
- Mache pro logischem Teilschritt einen sauberen, verständlichen Commit auf Deutsch, damit jeder Schritt einzeln rückgängig gemacht werden kann.
- Pushe am Ende nur den Feature-Branch und gib mir den Link zum Erstellen eines Pull Requests (oder erstelle den PR, falls möglich), niemals automatisch mergen.

## 2. Architektur & Hosting
- Hosting läuft über Netlify (`netlify.toml`: `publish = "."`, `functions = "netlify/functions"`).
- Keine Build-Tools (kein Vite/Webpack/React) einführen, sofern nicht ausdrücklich gewünscht – alles muss direkt als statisches HTML/CSS/natives ES-Modul im Browser laufen.
- Backend liegt in `netlify/functions/sheets.mjs` (`@netlify/blobs`), statische Kräfte-Bibliothek in `data/powers-library.json`.

## 3. Qualität & Kompatibilität
- Antworte immer auf Deutsch.
- Bestehende gespeicherte Charakterbögen, Cloud-Daten (`scherbensturm-chars`) und `localStorage`-Keys müssen zu 100 % abwärtskompatibel bleiben. Keine Datenfelder stillschweigend umbenennen oder löschen.
- Keine bestehenden Funktionen entfernen oder einschränken.
- Berücksichtige immer Desktop, Tablet sowie Smartphone (Hoch- und Querformat, iOS-Zoom-Schutz `font-size: 16px`, Safe-Area-Insets, keine doppelten Scrollbars).
- Prüfe jede geänderte JS-Datei (bzw. extrahierte `<script>`-Blöcke) vor jedem Commit zwingend mit `node --check`.
