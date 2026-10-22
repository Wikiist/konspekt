# Konspekt

Gotowy konspekt zajęć dla przedszkola i klas I–III, według wytycznych nauczyciela i zgodny z **nową podstawą programową** (rozporządzenie MEN z 11 marca 2026 r., Dz.U. 2026 poz. 378: załącznik nr 1 i załącznik nr 2, I etap edukacyjny).

Nauczyciel podaje temat, grupę, czas, swoje wytyczne (zapamiętywane w przeglądarce) i potrzeby dzieci w grupie. Dostaje:

- cel ogólny i cele operacyjne,
- kody z podstawy z oficjalnym brzmieniem (sprawdzane z tekstem rozporządzenia, nieistniejące są odrzucane),
- metody, formy pracy i pomoce, domyślnie prawdziwe materiały zamiast ekranu,
- przebieg minuta po minucie: co mówi nauczyciel, co robią dzieci, pytania otwarte,
- różnicowanie dla dzieci, które szybko kończą, i dla tych, które potrzebują wsparcia, oraz dostosowania (ADHD, spektrum autyzmu, dysleksja, niedosłuch, mutyzm i inne),
- sposób sprawdzenia, co dzieci zrozumiały, zasady bezpieczeństwa,
- wiadomość dla rodziców z zadaniem bez ekranu i wpis do dziennika.

Pomysł z rozmowy z nauczycielką edukacji wczesnoszkolnej, która chciała „aplikację dla nauczycieli robiącą gotowe konspekty zajęć według moich wytycznych”, bez kilkunastu godzin przygotowań.

**Live:** https://konspekt.vercel.app

## Jak działa
- `data/annex1-preschool.txt`, `data/annex2-klasy-1-3.txt` to tekst rozporządzenia. `scripts/parse.mjs` robi z załącznika nr 2 plik `data/klasy-1-3.json` (293 wymagania w 9 edukacjach, kody typu `5.1.f`, i 17 doświadczeń edukacyjnych). `data/przedszkole.json` to 113 osiągnięć przedszkolnych z projektu [wpis-z-dnia](https://github.com/Wikiist/wpis-z-dnia).
- `api/plan.js` wysyła temat, wytyczne i listę kodów do modelu (Gemini) z wymuszonym schematem JSON i sprawdza zwrócone kody.
- `public/index.html` to jedna strona bez frameworka. Konspekt można skopiować albo wydrukować.
- Prywatność: nic nie jest zapisywane na serwerze; wytyczne zostają w przeglądarce nauczyciela.

## Uruchomienie
```
node --test
GEMINI_API_KEY=... vercel dev
```
