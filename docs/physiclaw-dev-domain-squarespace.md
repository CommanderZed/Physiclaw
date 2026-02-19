# physiclaw.dev Domain Setup (Squarespace → Vercel)

Use these steps to point **physiclaw.dev** (and **www.physiclaw.dev**) from Squarespace to your Vercel project.

---

## 1. Add the domain in Vercel

1. Open your [Vercel dashboard](https://vercel.com/dashboard) and select the **Physiclaw** project.
2. Go to **Settings** → **Domains**.
3. Add **physiclaw.dev** and **www.physiclaw.dev**.
4. Vercel will show “Invalid Configuration” until DNS is set. Note the DNS records it suggests (they should match below).

---

## 2. In Squarespace: open DNS settings

1. Log in at [Squarespace](https://account.squarespace.com) (or your Squarespace site).
2. Go to **Settings** → **Domains** (or **Domains** in the main menu).
3. Click **physiclaw.dev**.
4. Open **DNS Settings** or **Advanced Settings** → **Custom Records** (wording may vary by plan).

If you see “Use external host” or “Connect to external host,” choose that so you can add custom records. If the domain is registered with Squarespace, you’ll add the records in the **Custom Records** section.

---

## 3. Add DNS records in Squarespace

Add these **custom records**. Remove or avoid conflicting A/CNAME records for the same hosts (e.g. Squarespace’s default A record for the apex).

### Apex domain: physiclaw.dev

| Type | Host | Value / Data | TTL (if asked) |
|------|------|--------------|-----------------|
| **A** | `@` (or leave blank for apex) | `76.76.21.21` | 3600 or default |

- **Host:** Usually `@` or blank for the root domain. In Squarespace it might be “@” or “physiclaw.dev” or “(root)”. Use whatever Squarespace uses for the apex.
- **Value:** `76.76.21.21` (Vercel’s IP).

### www subdomain: www.physiclaw.dev

| Type | Host | Value / Data | TTL (if asked) |
|------|------|--------------|-----------------|
| **CNAME** | `www` | `cname.vercel-dns.com` | 3600 or default |

- **Host:** `www`.
- **Value:** `cname.vercel-dns.com`.

### If Squarespace already has records for the apex

- If there’s an existing **A** record for the apex pointing to Squarespace, **edit** it to `76.76.21.21` (or delete and add the record above).
- If there’s a **CNAME** for the apex, remove it (apex should use the A record, not CNAME, unless Squarespace supports ALIAS/ANAME and you use Vercel’s suggested target).

Save the records.

---

## 4. Wait for DNS and verification

- Propagation often takes **5–60 minutes**; sometimes up to 24–48 hours.
- In Vercel, **Settings** → **Domains**: after propagation, both **physiclaw.dev** and **www.physiclaw.dev** should show as verified (green checkmark).
- Vercel will issue SSL automatically.

---

## 5. Optional: redirect www to apex (or vice versa)

In Vercel **Settings** → **Domains**, you can set the primary domain and choose “Redirect www to apex” or “Redirect apex to www” so one URL consistently redirects to the other.

---

## Quick reference

| Purpose | Type | Host | Value |
|--------|------|------|--------|
| Root domain (physiclaw.dev) | A | @ (or apex) | 76.76.21.21 |
| www (www.physiclaw.dev) | CNAME | www | cname.vercel-dns.com |

If Vercel shows different values when you add the domain, use the values Vercel shows for your project.
