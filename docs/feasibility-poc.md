# Acquisition feasibility PoC

## Decision

Desktop feature development is gated on seven days of evidence from the installed
Codex CLI. The PoC tests one question: can quota data be collected locally, safely,
and with enough semantic detail to justify a history product?

The verified local protocol is Codex CLI 0.144.1 `account/rateLimits/read`. Its
generated schema exposes window limits, multi-bucket `limitId` values, plan type,
credits, individual spend controls, and reset-credit summaries. This is local
protocol evidence, not a promise that a public third-party quota API exists or that
the wire shape will never change.

## Run

One sample, followed by an auditable report:

```bash
just poc-once output="/absolute/path/to/evidence.jsonl"
just poc-report input="/absolute/path/to/evidence.jsonl"
```

Seven-day monitor, using the default 900-second interval and 168-hour duration:

```bash
just poc-monitor output="/absolute/path/to/evidence.jsonl"
```

The monitor samples at startup, then every 15 minutes. Four unchanged payloads
double the interval; twelve unchanged payloads increase it to at most one hour.
A payload change or acquisition failure returns the interval to the baseline.
The report keeps seven-day coverage, 95% success rate, and continuity as separate
gates. A gap longer than two hours fails continuity, so two successful samples a
week apart can never be reported as a completed PoC.

The JSONL file is created with mode `0600`. Each line contains:

- acquisition status and duration;
- Codex CLI version and observation time as a Unix timestamp;
- SHA-256 hash of the original payload;
- raw local payload with opaque reset-credit IDs redacted;
- normalized pool observations with source, pool type, remaining value/unit,
  reset time, plan, model context, and confidence;
- explicit error text when acquisition or parsing fails.

No password, browser cookie, auth file, or token is read or copied. The PoC does
not call a private ChatGPT HTTP endpoint and does not consume reset credits.

## Interpretation rules

- `remaining_value` comes from the observed percentage or credits balance.
- `rolling_window`, `weekly`, and `monthly` are inferred only from the observed
  `windowDurationMins`; their confidence is therefore `inferred`.
- Missing or unfamiliar durations remain `unknown`.
- Missing model context remains `null`; it is never guessed from the plan or pool.
- A parseable response without any usable pool becomes `unavailable`.
- An acquisition/parsing failure becomes `error`; no previous value is copied
  forward as a current observation.
- Staleness is derived from the age of the last successful observation by a
  consumer; it is not fabricated as a new sample.

## Pass and stop gates

Pass acquisition only when all of the following are true:

- no password or uploaded authentication information is required;
- failures do not interfere with normal Codex use;
- success, error, unavailable/unknown, and stale presentation states are distinct;
- seven-day acquisition success is at least 95%;
- minor client changes fail closed instead of producing a plausible wrong quota;
- multiple observed quota-pool shapes remain distinguishable.

Stop full product development if collection requires full browser cookies, the
source changes without detectable failures, multiple pools cannot be separated,
collection creates account-safety risk, or two consecutive weeks remain below 95%.

Passing phase one authorizes evaluation of the existing local storage layer. It
does not authorize prediction, alerts, or additional UI charts. Those require
deduplication/restart/migration evidence first, followed by at least three complete
cycles of prediction backtesting.
