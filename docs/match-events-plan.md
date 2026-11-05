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
  - Checked in Chrome (EN desktop): create season → add match → season page → match page → edit teams → activities list. Test data removed (`api/tmp/remove_ui_season.mjs`).
  - Follow-up checks, 5 Nov 2026 (FR at 390px): season form, activities list, season page all fit. Empty-form errors: the missing cover error now shows with the other field errors instead of only once everything else is valid. The approved, not-yet-played match badge now reads "On sale / En vente" instead of "Live / En cours".
- **Phase 3 (attendee web): done 5 Nov 2026.**
  - API: public `GET /explore/seasons` lists approved, unsuspended seasons with at least one listed, uncancelled match still to come, each with `matchCount`, `upcomingCount` and `nextMatch` (teams, logos, round, kick-off), soonest next match first. Public event payloads (`GET /events`, `GET /events/:id`) now carry `match` with teams, logos and round, plus `season` (id, name, sport, competition) while the season is approved and not suspended (`publicMatchPreload` in `services/season_matches.ts`). Public season payloads no longer include `coverImageKey`.
  - Season page `/explore/season/[slug]`: cover; upcoming matches (date block, crests, round and time, "From" price, or "Sold out" / "Cancelled") linking to each match; played matches greyed out, most recent first; about; organiser, sport and competition, home venue and map. A cancelled match is listed without a link, because its event page no longer exists.
  - Match page: `MatchBanner` above the image shows both crests with home and away labels, sport · competition · round, and a link to the season. Checkout is the unchanged event checkout.
  - Explore: a "Seasons" row (`SeasonCard`: competition, next match, kick-off, upcoming count) and a Sport filter. The filter lists the sports of the matches and seasons on the page and is hidden when there are none. Seasons answer to search and Sport; any other filter hides them, as it hides raffles and sales. Seasons are also in the sitemap.
  - Also fixed: the category tabs fall back to a capitalised name for a type with no label instead of throwing, and the welcome dialog no longer crashes on a fast double-click of Next.
  - Checked in Chrome (FR, desktop and 390px) with `api/tmp/ui_season_fixture.mjs` (approved football season with 2 upcoming matches and 1 played, plus a basketball season; `remove` deletes everything). Checkout was checked only up to ticket selection; no payment was made.
- **Phase 4 (season passes): in progress.**
  - Done 5 Nov 2026, API foundation:
    - **Tables** (migration 1785400000006, applied on staging):
      - `season_pass_types`: name, description, price in HTG + USD + currency, quantity, sold. A check constraint keeps sold ≤ quantity.
      - `season_pass_mappings`: one per pass type per match, giving the match ticket type it seats holders in and `seats_reserved`.
      - `tickets.season_pass_type_id`: a pass will be an ordinary ticket row under the season's activity id.
    - **Seats**: each pass sold counts one seat in its mapped ticket type's `ticket_type_quantity_sold` at every match still to play. Every existing availability check therefore keeps the seat with no change. `seats_reserved` records how many of those sold seats are passes.
      - Every seat change runs in one transaction with row locks (pass type, then ticket types in id order).
      - Services are in `services/season_passes.ts`:
        - `setPassTypeMappings`
        - `reservePassSeats` (for checkout)
        - `releasePassSeats` (for returns)
        - `seatPassesAtNewMatch`
        - `repointPassMappings`
    - **Rules**:
      - A pass type must be mapped at every match still to play, to a ticket type of that match.
      - Remapping moves the reserved seats, and is refused when the new ticket type lacks room.
      - Quantity can't go below the number sold.
      - Only an unsold pass type can be deleted.
      - Creating a pass type is KYC-gated, and passes are paid only.
    - **New match in a season with passes**: the create form must send `passMappings` (`[{ seasonPassTypeId, ticketTypeName }]`), and the named ticket type must have room for every pass sold. A refusal happens before the event exists.
    - **Event edits**: an edit can't remove a ticket type holding pass seats, or shrink it below its sold count (422 `PASS_TICKET_TYPE_IN_USE`). Because edits recreate ticket types, the mappings follow them to their new ids.
    - **Routes**: `GET|POST /seasons/:org/:season/passes` and `PUT|DELETE /seasons/:org/:season/passes/:passTypeId`. The organiser's season GET includes `passTypes` with their mappings. The public season page includes `passTypes` with `remaining`, and no mappings.
    - **Test**: `api/tmp/test_season_passes.mjs` (staging, 22 checks). Pass sales are simulated in SQL until the checkout exists.
  - Done 5 Nov 2026, pass checkout (`app/controllers/season_pass_payments_controller.ts`):
    - **Methods, same as events**:
      - wallet, MonCash, NatCash and Stripe, signed in: `POST /season-passes/:passTypeId/payments/{wallet|moncash|natcash|stripe}`, with `GET /season-passes/stripe/finish/:sessionId`;
      - MonCash, NatCash and Stripe as a guest: `/guest/season-passes/...`.
      - Body: `{ quantity }` (1–10). Guests add `guest` and `discountCode`; members send the reduction headers.
    - **Settlement**: MonCash and NatCash settle through the existing callbacks, which now dispatch `activityType === 'season'` to `finishSeasonPassGatewayPayment`. The mobile app's Stripe PaymentIntent flow waits for phase 8.
    - **Pricing**: `planUniformCheckout` with the event fee schedule (`eventUnitCharge`). The buyer pays the fees, since a season has no absorb option. Discount codes and tokens work as for events.
    - **The pass**: one ticket row per pass under the season's activity id, with `seasonPassTypeId`, `ticketType` set to the pass name and a `PAS…` code. The confirmation email attaches each pass's QR code as PNG and PDF (`services/emails/season_passes.ts`).
    - **When seats are taken**:
      - The wallet and the Stripe return take them in the same transaction as the sale, as its first lock.
      - MonCash and NatCash take them when the gateway confirms. A pending payment holds no seat, as for event tickets.
      - If seats ran out in between, the order fails and #logs gets a `SeasonPassPaidNotSeated` alert to refund the payer.
    - **Locking**: the organiser credit is an atomic increment. A read-then-lock version deadlocked two concurrent buyers through the share lock that the order insert's foreign key takes.
    - **Test**: `api/tmp/test_season_pass_checkout.mjs` (staging, 20 checks, passed 3 runs in a row).
      - Covered: a wallet purchase end to end (tickets, seats at both matches, pass stock, organiser pending balance, ledger, wallet debit), two buyers racing for the last seat (exactly one wins, and the loser keeps their money), refusals, and Stripe test-mode sessions for members and guests.
      - Not covered: MonCash and NatCash are never called, because the local `.env` uses the live MonCash host. Their settlement shares the seat and credit code with the wallet. The rendered pass PDF hasn't been looked at.
  - Done 5 Nov 2026, gate scanning and My tickets:
    - **Scanner** (`services/ticket_checking.ts`):
      - When no ticket of the event matches the scanned code, it looks for a pass of that match's season (a `Checkable` of kind `pass`). Only passes from a SUCCESSFUL order count, because a gateway pass is written before payment.
      - The open-session check and the attendance summaries count only the event being scanned, for every kind of ticket. A pass left "inside" at one match is not refused at the next.
      - A scan doesn't mark a pass CHECKED, since it stays valid at every later match.
      - Test: `api/tmp/test_season_pass_scanning.mjs` (staging, 12 checks). It runs a real match whose check-in window is open now.
    - **My tickets**:
      - API: `GET /season-passes/mine` lists the seasons the user holds a paid, unreturned pass for while a match is still to play. `GET /season-passes/mine/:seasonId` returns the season, organiser, passes (with the ticket id as the QR) and matches.
      - Attendee app:
        - Upcoming lists each pass season first, with a countdown to the next kick-off and "N abonnements".
        - `/upcoming/season/[slug]` shows the pass QR (same QR settings as event tickets, with a 1/N switcher), the matches it covers, the organiser, and a link to the season page.
    - **Checked** with headless Chrome (`api/tmp/ui_shots.mjs`): FR, 390px and desktop, no overflow, no console errors. The fixture was removed afterwards.
  - Done 5 Nov 2026, organisation dashboard:
    - **Season page**: a "Season passes" section (`components/season/PassTypesSection.tsx`).
      - Each pass type gets a card: price, sold/total with a bar, and where it sits ("Tribune à 2 matchs").
      - The create/edit dialog (`PassTypeDialog.tsx`) is loaded on first open through `next/dynamic` + `MountOnOpen`. It has name, description, price with HTG/USD, quantity, and for every match still to play a ticket-type picker that shows seats left.
      - An unsold pass type can be deleted.
      - The API's `NOT_ENOUGH_SEATS` refusal appears on the match concerned.
      - The section is hidden on a rejected season, and its add button waits until a match exists.
    - **Add match**: when the season has pass types, the ticket step asks which of the new match's ticket types each pass sits in (`NewMatchPassMappings.tsx`). Before submitting it checks that each named ticket type exists and has room for every holder, mirroring the API, then sends `passMappings`.
    - **Server actions**: `SavePassType` and `DeletePassType` (JSON bodies). `loadSeason` also returns `passTypes`. Strings are under `Events.season.passes` (EN/FR).
    - **Checked** headless (`UI_BASE=http://localhost:3002 node tmp/ui_shots.mjs …`, with `#click=` to open the dialog): the season page and dialog in FR at 390px and desktop, with no overflow or console errors.
    - **Not looked at**: the add-match pass step, which sits behind the wizard's required fields.
  - Done 5 Nov 2026, attendee buy flow (phase 4 complete):
    - **Season page**: a "Season passes" block above the fixtures, shown while a match is still to play. Each pass has its name, description, how many are left, its price, and "Buy" (or "Sold out").
    - **Checkout** (`/explore/season/[slug]/checkout?pass=<id>`, `PassCheckout.tsx`): quantity (1–10, capped by stock), guest details when signed out, then MonCash / NatCash / card / wallet.
      - Every total comes from the new public `GET /season-passes/:passTypeId/quote?quantity=`, which runs the same planner as the payment and applies the fee waiver when a bearer token is sent. No fee math lives in the browser.
      - Card opens the embedded Stripe checkout. MonCash and NatCash go to the gateway and come back through the existing return pages, which follow the API's `redirectUrl`.
      - The wallet pays immediately.
    - **Where buyers land**: account holders on `/upcoming/season/[slug]` (their QR), guests on the public season page. Stripe returns are `checkout/success/season/stripe` and `checkout/success/season/guest-stripe`.
    - **Checked** headless (FR, 390px and desktop, no overflow or console errors). Two wallet purchases went through the real UI, and the database showed the new orders and passes. The checkout test still passes.
    - **Not covered**: real MonCash, NatCash and Stripe payments (the live MonCash host, and Stripe's test card wasn't driven). There is no discount-code field in the pass checkout yet (phase 7); the API already accepts codes.
  - Phase 4 is complete apart from the mobile app (phase 8).
- **Phase 5 (printed season tickets): done 5 Nov 2026.**
  - `physical_tickets` gains `season_id`, `season_pass_type_id` and `bound_event_id` (migration 1785400000008). A season ticket has `season_id` set and `event_id` null, so the per-event printed records never count it.
  - Admin: `/admin/season/:seasonId/print/batches` (list, create, PDF, void), in a new "Season tickets" tab of the print dialog on any match. The admin sets the printed price (one match); the dialog offers the mapped tier's price at the next match. Printing needs an approved, unsuspended season with a match still to play (or none yet).
  - Scanner: the first **check-in** (not a mere scan) binds the ticket to that match; then in and out there while its window is open, refused at every other match, void once that match ends. Never used = good for any later match. Two doors racing on one ticket: one binds it (row lock).
  - Still a side stock: no seat taken from the mapped tier, no sale, no money.
  - Organiser: "Billets imprimés" on the season page (record only).
  - Sheet: season name, "Valable pour : un match de la saison", venue, the one-match note.
  - Test: `api/tmp/test_season_printed.mjs` (27 checks). Headless: `api/tmp/ui_admin_print.mjs` (throwaway admin through the real login).
- **Phase 6 (money): done 5 Nov 2026.**
  - **Per-match payout** (`task/balance_release_notify.ts`, `releaseSeasonPassShare`). When a match's balance is released (the hourly fanout, once the match is over), the same transaction also releases a share of the season's pass money:
    - the share is (pass earnings of unreturned paid passes − already released) ÷ (approved, uncancelled, undeleted matches not yet released, this one included);
    - the last match releases the rest;
    - two pending → available ledger rows are written under the season's id;
    - the season row is locked, so two matches released together take their shares in turn;
    - running a release again pays nothing twice.
    - New `seasons.pass_released_htg/usd` columns (migration 1785400000007, applied on staging).
    - A cancelled match counts for nothing, so its share moves to the matches after it. A match added mid-season takes a share of whatever is still pending.
  - **Pass returns**: `POST /season-passes/return { tickets: [...] }`.
    - Allowed until the season's first match kicks off (`seasonFirstMatchStartsAt`: approved, listed, uncancelled matches); refused after with `RETURN_CLOSED`.
    - Only the buyer can return. The refund is the pass's `ticketPrice` (what was paid before fees, as for any ticket return), credited to the same wallet buckets as an event return.
    - One transaction (the wallet is locked first, then the pass types, as in checkout):
      - every match seat and the pass stock are freed;
      - the organiser is debited what it earned;
      - `ticket_returns` rows are written under the season;
      - the passes are marked RETURNED (kept, not deleted);
      - a fully returned order becomes RETURNED and gives back its discount slot and tokens.
    - The usual return email is sent.
    - **Attendee app**: "Rendre cet abonnement" under the pass QR, with a confirmation showing the amount, that fees aren't refunded, and the deadline. The pass-page API now sends `returnsCloseAt` and a per-pass `canReturn`.
  - **Cancelled or postponed match**:
    - Postponing needs nothing: passes are valid at whichever date the match has.
    - A match's season-pass holders are now included in its holder lists (`holderActivityIds` in `services/season_matches.ts`, used by `liveHolders` and `ticketHoldersToNotify`). They get the change notice and email, and the bell for a scheduled deletion.
    - An admin cancel-and-refund of a match emails its pass holders (`sendMatchCancelledToPassHolders`, FR + EN in one message): nothing is refunded, and the pass stays valid for every other match.
  - **Test**: `api/tmp/test_season_pass_money.mjs` (staging, 14 checks). Releases go through the real `/tasks/balance-release/notify` route with a QStash signature made from the `.env` key.
  - **Notes**:
    - App ace commands don't run on this Windows machine (the command loader reports "Invalid URL" for every file in `commands/`, even from the build), so the test signs the task request instead.
    - If every match left is cancelled, the pass money stays pending until an admin decides; nothing releases it automatically. in the org dashboard and the new-match wizard
    - the buy section on the attendee season page
  - Phase 6 must add a season branch to the hourly balance release: pass money sits in pending until then, and the fanout only scans events and raffles.
  - Found while mapping checkout, all pre-existing:
    - No event checkout locks ticket-type stock (two buyers can oversell).
    - The wallet route writes outside its own transaction, which may deadlock when tokens are spent.
    - The scanner does not check the order status.

## Open questions
1. **Figma**: are there frames for the season page, match page, create flow and pass?
2. **Transfer/gift**: no ticket can be transferred today. Simple version (holder enters recipient's email, pass moves to their account)? Transferable after it has been used?
3. **Rewards**: rule is "one reward per event". One reward per season for a pass?
4. **Home team**: always the organiser's own team, or can an organiser (e.g. a league) sell matches between two other teams?
5. **Away matches**: show them on the season page as fixtures without tickets, or only matches that sell tickets?
