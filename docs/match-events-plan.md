# Match events: draft plan

_Status: brainstorm agreed 2 Nov 2026. Open questions at the end must be answered before the implementation spec._

## Model
- **Season**: a new activity type (like raffles and sales). Holds the competition/league, sport, default home venue, cover, description and season pass types. Has its own public page listing all its matches. No places integration in v1, entry only.
- **Match**: a normal physical event linked to a season, plus home and away teams (name + logo) and matchday/round. Own ticket types and prices, same as a basic event. Starts with the season's venue; the organiser can change it per match. Matches can be added during the season.
- **Season pass**: one QR code valid at every match of the season, including matches added later. An organiser can sell several pass types (e.g. "Pass Tribune", "Pass VIP"), each with its own price and quantity. Each pass type is mapped, per match, to one of that match's ticket types. Every pass sold takes one seat from the mapped ticket type at every match, so a match can never be oversold. On sale at a fixed price until the last match.
- **Printed season ticket**: belongs to the season and a pass type (category). Rules:
  - the first scan at a match locks it to that match;
  - check in and out as many times as needed during that match;
  - void once that match ends;
  - never scanned: stays valid for a later match;
  - outside capacity, like printed tickets today.

## Money and changes
- **Payout**: pass money stays pending. Each time a match ends, release the season's pending pass money divided by the number of matches still to play (counting the one that just ended); the last match releases whatever is left. Handles matches added or cancelled mid-season.
- **Pass returns**: full refund to the wallet, only before the season's first match starts. No returns after.
- **Postponed match**: new date; every ticket and pass stays valid.
- **Cancelled match**: single-match tickets refunded as today. Pass holders lose that match; its share of pass money moves to the remaining matches.
- **Pass extras in v1**: discount codes, ticket returns, transfer/gift, rewards.

## Build phases
1. **API**: season tables (season, season pass types, pass type ↔ match ticket type mapping), match fields, season/match create, edit and approval.
2. **Organisation dashboard**: create a season, add matches pre-filled from it, sell single-match tickets like a basic event, check in with the existing scanner.
3. **Attendee web**: season page, match page ("Home vs Away", competition, matchday), Explore filter by sport, single-match checkout.
4. **Season passes**: pass types and per-match mapping, capacity reservation, checkout, pass in My tickets with one QR, gate scanning.
5. **Printed season tickets**: admin prints batches per season and pass type; lock/void rules in the scanner.
6. **Money**: per-match payout, pass returns, match cancel/postpone.
7. **Pass extras**: discount codes, rewards, transfer/gift.
8. **Mobile app**: season and match pages, purchase, passes in the tickets tab.
9. **Admin**: season and match review, views of passes and printed tickets.

Phases 1–3 deliver working single matches; season passes follow.

## Progress
- **Phase 1 (API): done 2 Nov 2026.**
  - Tables: `seasons` (activity type `season`) and `matches` (1:1 with events, keyed by event_id). Migrations 1785400000004/5, applied on staging.
  - A match is created through the existing `POST /events/in-person/:organisationId`, with `seasonId`, `homeTeamName`, `awayTeamName`, `round`, `homeTeamLogo` and `awayTeamLogo` on the same form. The response adds `seasonId`. Dates, venue and tickets are edited through the normal event edit; teams and round through `PUT /seasons/:org/:season/matches/:eventId`.
  - Season routes: `POST|GET /seasons/:org`, `GET|PUT|DELETE /seasons/:org/:season` (delete only when the season has no matches), `GET /seasons/validation/name`, public `GET /explore/seasons/:slugOrId`.
  - Admin: `GET /admin/season/:id`, `PATCH /admin/season/:id/status`. Seasons also show in Admin › Activities (`type=season`). Approving a season only opens its public page; each match is still approved as an event.
  - Editing a rejected season sends it back to review. Editing an approved one keeps it live and posts to Discord.
  - Test: `api.ticketwaze.com/tmp/test_seasons.mjs` (staging, 34 checks).
  - Defaults while questions 4–5 are open: both teams are free text, so the home team doesn't have to be the organiser's; only ticketed matches are stored.
  - Season pass tables moved to phase 4, so they're designed together with pass checkout.
- **Phase 2 (org dashboard): done 2 Nov 2026.**
  - "Sports season" card in Create Activity, leading to `/events/create/season` (`components/season/SeasonForm.tsx`, shared with `/events/season/[slug]/edit`). Name check as you type, sport, competition, description of at least 150 characters, home venue with a required map pin, cover.
  - Season page `/events/season/[slug]`: review banner; competition, venue and date-range facts; matches split into upcoming and played, each with crests, round, sold/total and a status badge. Add match, edit, and delete (delete only while the season has no matches).
  - Add match `/events/season/[slug]/matches/new`: the normal in-person wizard with a `season` prop.
    - A Match section (teams, logos, round) comes first.
    - The event name follows "Home vs Away · Round" until the organiser edits it.
    - Venue, map pin, description, sport tag and cover come from the season; the category is Tournament.
    - KYC-gated like every create; returns to the season page.
  - On a match's event page: `MatchHeader` (season link, teams, "Edit teams" dialog). Tickets, check-in and the rest are unchanged.
  - Activities list: `SeasonCard` plus a "Seasons" category filter. A season is upcoming, ongoing or past by its first and last match. Matches still appear as events.
  - API additions: the season list returns `startsAt`/`endsAt`; the organiser's event list and detail preload `match` (detail also includes the season name). Season description must be at least 150 characters and the pin is required.
  - Checked in Chrome (EN desktop): create season → add match → season page → match page → edit teams → activities list. Test data removed (`api/tmp/remove_ui_season.mjs`). Not checked: French at 390px, and the empty-form errors (the Chrome extension disconnected).

## Open questions
1. **Figma**: are there frames for the season page, match page, create flow and pass?
2. **Transfer/gift**: no ticket can be transferred today. Simple version (holder enters recipient's email, pass moves to their account)? Transferable after it has been used?
3. **Rewards**: rule is "one reward per event". One reward per season for a pass?
4. **Home team**: always the organiser's own team, or can an organiser (e.g. a league) sell matches between two other teams?
5. **Away matches**: show them on the season page as fixtures without tickets, or only matches that sell tickets?
