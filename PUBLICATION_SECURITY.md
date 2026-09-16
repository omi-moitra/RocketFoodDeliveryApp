# Publication security

Demo seeding is disabled by default. It requires the `demo` Spring profile,
`app.demo.enabled=true`, and a locally configured `app.demo.password` with at
least 16 characters. Use a disposable database. Set the empty Postman
`demoPassword` variable locally; never export populated credentials.

The previously committed JWT signing key must be retired in every running
environment. Local configuration has been rotated, but changing a file does
not restart a running server or change independently deployed copies.

Existing databases are not migrated by this cleanup. Disable or reset
previously documented demo accounts before exposing a server. Password storage
still uses the original development-only plaintext encoder; do not use this
application with real account passwords until password hashing and migration
have been implemented.

Private submission files, unverified-contact wireframe images, and challenge
screenshots have been excluded from the publication history. Their originals
are retained in the private recovery archive, outside this repository.

Keep `.env` files, local Spring configuration, generated output, private keys,
and service-account exports out of commits and release archives.

Before changing GitHub visibility, review all remote branches/tags, releases,
actions artifacts, pull-request refs, and video access settings. A local history
rewrite does not erase remote copies, forks, or other clones.
