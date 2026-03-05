# MongoDB Connection String URL Encoding

When a MongoDB Atlas (or any MongoDB) password contains special characters, those characters **must be percent-encoded** (URL-encoded) before being embedded in the connection string.  
Failure to encode them causes the driver to misparse the URI and the connection to fail.

---

## Why Encoding Is Required

A connection string URI has the form:

```
mongodb+srv://username:PASSWORD@cluster.mongodb.net/database?retryWrites=true&w=majority
```

Characters such as `@`, `#`, `$`, `%`, `&`, `:`, `/`, `?`, `+`, `=`, and spaces have **reserved meanings** in URIs.  
If your password contains any of these characters, the MongoDB driver cannot tell where the password ends and the rest of the URI begins unless you encode them.

---

## Common Encoding Reference

| Character | Encoded form |
|-----------|--------------|
| `@`       | `%40`        |
| `!`       | `%21`        |
| `#`       | `%23`        |
| `$`       | `%24`        |
| `%`       | `%25`        |
| `&`       | `%26`        |
| `'`       | `%27`        |
| `(`       | `%28`        |
| `)`       | `%29`        |
| `*`       | `%2A`        |
| `+`       | `%2B`        |
| `,`       | `%2C`        |
| `/`       | `%2F`        |
| `:`       | `%3A`        |
| `;`       | `%3B`        |
| `=`       | `%3D`        |
| `?`       | `%3F`        |
| `[`       | `%5B`        |
| `]`       | `%5D`        |
| space     | `%20`        |

---

## Quick Encoding with Node.js

Node.js provides the built-in `encodeURIComponent` function, which correctly encodes all characters that are not safe inside a URI component:

```js
const password = 'p@$$w0rd!#secret';
const encoded  = encodeURIComponent(password);
// encodeURIComponent encodes all characters that are not "unreserved" in RFC 3986.
// Safe characters such as ! are left as-is; special URI characters are percent-encoded.
// Result: 'p%40%24%24w0rd!%23secret'

const uri = [
    'mongodb+srv://myUser:',
    encoded,
    '@cluster.mongodb.net/myDatabase',
    '?retryWrites=true&w=majority',
].join('');
console.log(uri);
```

You can also run the project helper script directly from the terminal:

```bash
node backend/utils/encodeMongoPassword.js 'your-raw-password'
```

It will print the encoded password and the full connection-string template for you to paste into Railway (or any other host's environment variable settings).

---

## Setting the Variable in Railway

1. In the Railway dashboard open your service → **Variables**.
2. Add (or update) the `MONGODB_URI` variable.
3. Use the **already-encoded** password in the value, e.g.

   ```
   MONGODB_URI=mongodb+srv://myUser:p%40%24%24w0rd%21%23secret@cluster.mongodb.net/myDatabase?retryWrites=true&w=majority
   ```

   Breaking it down for clarity:

   | Part | Value |
   |------|-------|
   | scheme | `mongodb+srv://` |
   | username | `myUser` |
   | password (encoded) | `p%40%24%24w0rd%21%23secret` |
   | host | `cluster.mongodb.net` |
   | database | `myDatabase` |
   | options | `retryWrites=true&w=majority` |

4. Railway does **not** automatically decode the value before injecting it into `process.env`, so the string must be ready-to-use when the driver receives it.

---

## Verifying the Connection

After setting the variable, start the server and check the health endpoint:

```bash
curl -i https://<your-railway-url>/health
```

A successful response looks like:

```json
{"status":"OK","message":"Resilience Atlas server is running","db":"connected"}
```

If `db` is `"disconnected"`, double-check that every special character in your password is encoded and that the rest of the URI (cluster host, database name) is correct.

---

## Further Reading

- [MongoDB URI Connection String format](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [RFC 3986 – Uniform Resource Identifier](https://datatracker.ietf.org/doc/html/rfc3986)
- Node.js [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
