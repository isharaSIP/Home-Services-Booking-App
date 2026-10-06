# Explore directory checks

Run from the repository root:

```sh
node --test backend/tests/providers.test.js frontend/tests/explore.test.mjs
```

Explore uses authenticated `GET /api/providers` and `GET /api/providers/:id`.
Only email-verified providers approved by an admin are returned. Responses use
an inclusive public-field projection; passwords, OTPs, contact details, NIC
images and certificate uploads are never included.

Existing providers remain compatible. Optional `providerDetails` fields are
`bio`, `serviceArea`, `latitude`, `longitude`, `price`, `priceUnit`, `rating`,
`reviewCount`, and `nextAvailableAt`. Missing values remain unknown rather than
being replaced with design examples. Coordinates represent the public service
location. Nearest sorting requests foreground location only when selected.

The existing registration/admin flows do not yet provide editors for these new
optional fields. Until real values are populated, the screen shows “Price on
request”, “Location not listed”, “Ask about availability”, and “New”. There is
no demo-data fallback or automatic database seeding.

`View profile` opens a read-only profile sheet. Booking and messaging remain
separate features; the directory does not create bookings or contact providers.
