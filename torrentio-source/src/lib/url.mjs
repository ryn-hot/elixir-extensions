// Minimal URL / URLSearchParams for the source-js-v1 runtime (QuickJS has no
// WHATWG URL). Supports exactly what the ported providers use: http(s) and
// opaque `magnet:` URLs, origin, userinfo, pathname/search/hash get/set and a
// live, form-encoded searchParams. Not a general WHATWG URL implementation.

const FORM_SAFE = /[A-Za-z0-9*\-._]/u;

function formEncode(value) {
  let out = "";
  for (const char of String(value)) {
    if (char === " ") {
      out += "+";
    } else if (FORM_SAFE.test(char)) {
      out += char;
    } else {
      out += encodeURIComponent(char).replace(/[!'()~]/gu, (c) =>
        `%${c.charCodeAt(0).toString(16).toUpperCase()}`
      );
    }
  }
  return out;
}

function formDecode(value) {
  const text = String(value).replace(/\+/gu, " ");
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

export class URLSearchParams {
  #pairs = [];
  #onChange = null;

  constructor(init = "", onChange = null) {
    const text = String(init ?? "").replace(/^\?/u, "");
    if (text) {
      for (const part of text.split("&")) {
        if (!part) continue;
        const index = part.indexOf("=");
        const name = index < 0 ? part : part.slice(0, index);
        const value = index < 0 ? "" : part.slice(index + 1);
        this.#pairs.push([formDecode(name), formDecode(value)]);
      }
    }
    this.#onChange = onChange;
  }
  #changed() {
    if (this.#onChange) this.#onChange(this.toString());
  }
  get(name) {
    const found = this.#pairs.find(([key]) => key === name);
    return found ? found[1] : null;
  }
  getAll(name) {
    return this.#pairs.filter(([key]) => key === name).map(([, value]) => value);
  }
  has(name) {
    return this.#pairs.some(([key]) => key === name);
  }
  set(name, value) {
    const key = String(name);
    const text = String(value);
    const index = this.#pairs.findIndex(([existing]) => existing === key);
    if (index < 0) {
      this.#pairs.push([key, text]);
    } else {
      this.#pairs[index] = [key, text];
      this.#pairs = this.#pairs.filter(([existing], i) => existing !== key || i === index);
    }
    this.#changed();
  }
  append(name, value) {
    this.#pairs.push([String(name), String(value)]);
    this.#changed();
  }
  delete(name) {
    this.#pairs = this.#pairs.filter(([key]) => key !== name);
    this.#changed();
  }
  keys() {
    return this.#pairs.map(([key]) => key)[Symbol.iterator]();
  }
  entries() {
    return this.#pairs.map((pair) => [...pair])[Symbol.iterator]();
  }
  values() {
    return this.#pairs.map(([, value]) => value)[Symbol.iterator]();
  }
  get size() {
    return this.#pairs.length;
  }
  sort() {
    // Stable sort by name (UTF-16 code units), like WHATWG.
    this.#pairs = this.#pairs
      .map((pair, index) => [pair, index])
      .sort(([[left], li], [[right], ri]) => (left < right ? -1 : left > right ? 1 : li - ri))
      .map(([pair]) => pair);
    this.#changed();
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  forEach(callback) {
    for (const [key, value] of this.#pairs) callback(value, key, this);
  }
  toString() {
    return this.#pairs.map(([key, value]) => `${formEncode(key)}=${formEncode(value)}`).join("&");
  }
}

// WHATWG userinfo percent-encode set (query set + path set + / : ; = @ [ \ ] ^ |).
const USERINFO_ENCODE = /[\u0000-\u001f\u007f-\uffff "#<>?`{}/:;=@[\\\]^|]/gu;
function encodeUserinfo(value) {
  return String(value).replace(USERINFO_ENCODE, (char) =>
    char === "%" ? char : encodeURIComponent(char).replace(/[!'()*~]/gu, (c) =>
      `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    ).replace(/^[A-Za-z0-9\-_.]$/u, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`)
  );
}

// RFC 3986 section 5.2 reference resolution against a hierarchical base.
function removeDotSegments(path) {
  const input = path.split("/");
  const output = [];
  for (let index = 0; index < input.length; index += 1) {
    const segment = input[index];
    const last = index === input.length - 1;
    if (segment === ".") {
      if (last) output.push("");
    } else if (segment === "..") {
      if (output.length > 1) output.pop();
      if (last) output.push("");
    } else {
      output.push(segment);
    }
  }
  const joined = output.join("/");
  return joined.startsWith("/") ? joined : `/${joined}`;
}

function resolveReference(reference, base) {
  if (base.protocol && base.origin === "null") {
    throw new TypeError(`Invalid URL: ${reference}`);
  }
  const origin = `${base.protocol}//${base.username || base.password
    ? `${base.username}${base.password ? `:${base.password}` : ""}@` : ""}${base.host}`;
  if (reference.startsWith("//")) return `${base.protocol}${reference}`;
  const match = /^([^?#]*)(\?[^#]*)?(#.*)?$/u.exec(reference);
  const [, path, query = "", fragment = ""] = match;
  if (path === "") {
    return `${origin}${base.pathname}${query || base.search}${fragment}`;
  }
  const merged = path.startsWith("/")
    ? path
    : `${base.pathname.replace(/[^/]*$/u, "")}${path}`;
  return `${origin}${removeDotSegments(merged)}${query}${fragment}`;
}

const HIERARCHICAL = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/u;
const OPAQUE = /^([a-zA-Z][a-zA-Z0-9+.-]*):([^?#]*)(\?[^#]*)?(#.*)?$/u;
const DEFAULT_PORTS = { "http:": "80", "https:": "443" };

export class URL {
  #protocol = "";
  #username = "";
  #password = "";
  #hostname = "";
  #port = "";
  #pathname = "";
  #search = "";
  #hash = "";
  #opaque = false;
  #params;

  constructor(input, base) {
    let text = String(input instanceof URL ? input.href : input ?? "").trim();
    if (base !== undefined && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/u.test(text)) {
      text = resolveReference(text, base instanceof URL ? base : new URL(base));
    }
    const hierarchical = HIERARCHICAL.exec(text);
    if (hierarchical) {
      this.#protocol = `${hierarchical[1].toLowerCase()}:`;
      const authority = hierarchical[2];
      const at = authority.lastIndexOf("@");
      const userinfo = at < 0 ? "" : authority.slice(0, at);
      const hostport = at < 0 ? authority : authority.slice(at + 1);
      if (userinfo) {
        const colon = userinfo.indexOf(":");
        this.#username = colon < 0 ? userinfo : userinfo.slice(0, colon);
        this.#password = colon < 0 ? "" : userinfo.slice(colon + 1);
      }
      const portMatch = /^(\[[^\]]+\]|[^:]*)(?::(\d*))?$/u.exec(hostport);
      if (!portMatch || !portMatch[1]) {
        throw new TypeError(`Invalid URL: ${text}`);
      }
      this.#hostname = portMatch[1].toLowerCase();
      const port = portMatch[2] ?? "";
      this.#port = port === DEFAULT_PORTS[this.#protocol] ? "" : port;
      this.#pathname = hierarchical[3] ? removeDotSegments(hierarchical[3]) : "/";
      this.#search = hierarchical[4] && hierarchical[4] !== "?" ? hierarchical[4] : "";
      this.#hash = hierarchical[5] && hierarchical[5] !== "#" ? hierarchical[5] : "";
    } else {
      const opaque = OPAQUE.exec(text);
      if (!opaque) {
        throw new TypeError(`Invalid URL: ${text}`);
      }
      this.#opaque = true;
      this.#protocol = `${opaque[1].toLowerCase()}:`;
      this.#pathname = opaque[2];
      this.#search = opaque[3] && opaque[3] !== "?" ? opaque[3] : "";
      this.#hash = opaque[4] && opaque[4] !== "#" ? opaque[4] : "";
    }
    this.#params = new URLSearchParams(this.#search, (serialized) => {
      this.#search = serialized ? `?${serialized}` : "";
    });
  }

  get protocol() { return this.#protocol; }
  set protocol(value) {
    const scheme = String(value).replace(/:.*$/su, "").toLowerCase();
    // Like WHATWG: switching between special and opaque schemes is ignored.
    if (/^[a-z][a-z0-9+.-]*$/u.test(scheme) && !this.#opaque) {
      this.#protocol = `${scheme}:`;
      if (this.#port === DEFAULT_PORTS[this.#protocol]) this.#port = "";
    }
  }
  get username() { return this.#username; }
  set username(value) { this.#username = encodeUserinfo(value); }
  get password() { return this.#password; }
  set password(value) { this.#password = encodeUserinfo(value); }
  get hostname() { return this.#hostname; }
  set hostname(value) {
    const text = String(value).toLowerCase();
    if (!this.#opaque && text && !/[\s/?#@]/u.test(text)) this.#hostname = text;
  }
  get port() { return this.#port; }
  get host() { return this.#port ? `${this.#hostname}:${this.#port}` : this.#hostname; }
  get origin() { return this.#opaque ? "null" : `${this.#protocol}//${this.host}`; }
  get pathname() { return this.#pathname; }
  set pathname(value) {
    const text = String(value);
    this.#pathname = this.#opaque ? text : text.startsWith("/") ? text : `/${text}`;
  }
  get search() { return this.#search; }
  set search(value) {
    const text = String(value).replace(/^\?/u, "");
    this.#search = text ? `?${text}` : "";
    this.#params = new URLSearchParams(this.#search, (serialized) => {
      this.#search = serialized ? `?${serialized}` : "";
    });
  }
  get searchParams() { return this.#params; }
  get hash() { return this.#hash; }
  set hash(value) {
    const text = String(value).replace(/^#/u, "");
    this.#hash = text ? `#${text}` : "";
  }
  get href() { return this.toString(); }
  toString() {
    if (this.#opaque) {
      return `${this.#protocol}${this.#pathname}${this.#search}${this.#hash}`;
    }
    const userinfo = this.#username || this.#password
      ? `${this.#username}${this.#password ? `:${this.#password}` : ""}@`
      : "";
    return `${this.#protocol}//${userinfo}${this.host}${this.#pathname}${this.#search}${this.#hash}`;
  }
  toJSON() { return this.toString(); }
}
