self.__POLYFILL__||(importScripts("/polyfills.js"),self.__POLYFILL__=!0);var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
(function() {
  "use strict";
  /**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: Apache-2.0
   */
  const proxyMarker = Symbol("Comlink.proxy");
  const createEndpoint = Symbol("Comlink.endpoint");
  const releaseProxy = Symbol("Comlink.releaseProxy");
  const finalizer = Symbol("Comlink.finalizer");
  const throwMarker = Symbol("Comlink.thrown");
  const isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
  const proxyTransferHandler = {
    canHandle: (val) => isObject(val) && val[proxyMarker],
    serialize(obj) {
      const { port1, port2 } = new MessageChannel();
      expose(obj, port1);
      return [port2, [port2]];
    },
    deserialize(port) {
      port.start();
      return wrap(port);
    }
  };
  const throwTransferHandler = {
    canHandle: (value) => isObject(value) && throwMarker in value,
    serialize({ value }) {
      let serialized;
      if (value instanceof Error) {
        serialized = {
          isError: true,
          value: {
            message: value.message,
            name: value.name,
            stack: value.stack
          }
        };
      } else {
        serialized = { isError: false, value };
      }
      return [serialized, []];
    },
    deserialize(serialized) {
      if (serialized.isError) {
        throw Object.assign(new Error(serialized.value.message), serialized.value);
      }
      throw serialized.value;
    }
  };
  const transferHandlers = /* @__PURE__ */ new Map([
    ["proxy", proxyTransferHandler],
    ["throw", throwTransferHandler]
  ]);
  function isAllowedOrigin(allowedOrigins, origin) {
    for(let   allowedOrigin of allowedOrigins) {
      if (origin === allowedOrigin || allowedOrigin === "*") {
        return true;
      }
      if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
        return true;
      }
    }
    return false;
  }
  function expose(obj, ep = globalThis, allowedOrigins = ["*"]) {
    ep.addEventListener("message", function callback(ev) {
      if (!ev || !ev.data) {
        return;
      }
      if (!isAllowedOrigin(allowedOrigins, ev.origin)) {
        console.warn(`Invalid origin '${ev.origin}' for comlink proxy`);
        return;
      }
      const { id, type, path } = Object.assign({ path: [] }, ev.data);
      const argumentList = (ev.data.argumentList || []).map(fromWireValue);
      let returnValue;
      try {
        const parent = path.slice(0, -1).reduce((obj2, prop) => obj2[prop], obj);
        const rawValue = path.reduce((obj2, prop) => obj2[prop], obj);
        switch (type) {
          case "GET":
            {
              returnValue = rawValue;
            }
            break;
          case "SET":
            {
              parent[path.slice(-1)[0]] = fromWireValue(ev.data.value);
              returnValue = true;
            }
            break;
          case "APPLY":
            {
              returnValue = rawValue.apply(parent, argumentList);
            }
            break;
          case "CONSTRUCT":
            {
              const value = new rawValue(...argumentList);
              returnValue = proxy(value);
            }
            break;
          case "ENDPOINT":
            {
              const { port1, port2 } = new MessageChannel();
              expose(obj, port2);
              returnValue = transfer(port1, [port1]);
            }
            break;
          case "RELEASE":
            {
              returnValue = void 0;
            }
            break;
          default:
            return;
        }
      } catch (value) {
        returnValue = { value, [throwMarker]: 0 };
      }
      Promise.resolve(returnValue).catch((value) => {
        return { value, [throwMarker]: 0 };
      }).then((returnValue2) => {
        const [wireValue, transferables] = toWireValue(returnValue2);
        ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
        if (type === "RELEASE") {
          ep.removeEventListener("message", callback);
          closeEndPoint(ep);
          if (finalizer in obj && typeof obj[finalizer] === "function") {
            obj[finalizer]();
          }
        }
      }).catch((error) => {
        const [wireValue, transferables] = toWireValue({
          value: new TypeError("Unserializable return value"),
          [throwMarker]: 0
        });
        ep.postMessage(Object.assign(Object.assign({}, wireValue), { id }), transferables);
      });
    });
    if (ep.start) {
      ep.start();
    }
  }
  function isMessagePort(endpoint) {
    return endpoint.constructor.name === "MessagePort";
  }
  function closeEndPoint(endpoint) {
    if (isMessagePort(endpoint))
      endpoint.close();
  }
  function wrap(ep, target) {
    const pendingListeners = /* @__PURE__ */ new Map();
    ep.addEventListener("message", function handleMessage(ev) {
      const { data } = ev;
      if (!data || !data.id) {
        return;
      }
      const resolver = pendingListeners.get(data.id);
      if (!resolver) {
        return;
      }
      try {
        resolver(data);
      } finally {
        pendingListeners.delete(data.id);
      }
    });
    return createProxy(ep, pendingListeners, [], target);
  }
  function throwIfProxyReleased(isReleased) {
    if (isReleased) {
      throw new Error("Proxy has been released and is not useable");
    }
  }
  function releaseEndpoint(ep) {
    return requestResponseMessage(ep, /* @__PURE__ */ new Map(), {
      type: "RELEASE"
    }).then(() => {
      closeEndPoint(ep);
    });
  }
  const proxyCounter = /* @__PURE__ */ new WeakMap();
  const proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((ep) => {
    const newCount = (proxyCounter.get(ep) || 0) - 1;
    proxyCounter.set(ep, newCount);
    if (newCount === 0) {
      releaseEndpoint(ep);
    }
  });
  function registerProxy(proxy2, ep) {
    const newCount = (proxyCounter.get(ep) || 0) + 1;
    proxyCounter.set(ep, newCount);
    if (proxyFinalizers) {
      proxyFinalizers.register(proxy2, ep, proxy2);
    }
  }
  function unregisterProxy(proxy2) {
    if (proxyFinalizers) {
      proxyFinalizers.unregister(proxy2);
    }
  }
  function createProxy(ep, pendingListeners, path = [], target = function() {
  }) {
    let isProxyReleased = false;
    const proxy2 = new Proxy(target, {
      get(_target, prop) {
        throwIfProxyReleased(isProxyReleased);
        if (prop === releaseProxy) {
          return () => {
            unregisterProxy(proxy2);
            releaseEndpoint(ep);
            pendingListeners.clear();
            isProxyReleased = true;
          };
        }
        if (prop === "then") {
          if (path.length === 0) {
            return { then: () => proxy2 };
          }
          const r = requestResponseMessage(ep, pendingListeners, {
            type: "GET",
            path: path.map((p) => p.toString())
          }).then(fromWireValue);
          return r.then.bind(r);
        }
        return createProxy(ep, pendingListeners, [...path, prop]);
      },
      set(_target, prop, rawValue) {
        throwIfProxyReleased(isProxyReleased);
        const [value, transferables] = toWireValue(rawValue);
        return requestResponseMessage(ep, pendingListeners, {
          type: "SET",
          path: [...path, prop].map((p) => p.toString()),
          value
        }, transferables).then(fromWireValue);
      },
      apply(_target, _thisArg, rawArgumentList) {
        throwIfProxyReleased(isProxyReleased);
        const last = path[path.length - 1];
        if (last === createEndpoint) {
          return requestResponseMessage(ep, pendingListeners, {
            type: "ENDPOINT"
          }).then(fromWireValue);
        }
        if (last === "bind") {
          return createProxy(ep, pendingListeners, path.slice(0, -1));
        }
        const [argumentList, transferables] = processArguments(rawArgumentList);
        return requestResponseMessage(ep, pendingListeners, {
          type: "APPLY",
          path: path.map((p) => p.toString()),
          argumentList
        }, transferables).then(fromWireValue);
      },
      construct(_target, rawArgumentList) {
        throwIfProxyReleased(isProxyReleased);
        const [argumentList, transferables] = processArguments(rawArgumentList);
        return requestResponseMessage(ep, pendingListeners, {
          type: "CONSTRUCT",
          path: path.map((p) => p.toString()),
          argumentList
        }, transferables).then(fromWireValue);
      }
    });
    registerProxy(proxy2, ep);
    return proxy2;
  }
  function myFlat(arr) {
    return Array.prototype.concat.apply([], arr);
  }
  function processArguments(argumentList) {
    const processed = argumentList.map(toWireValue);
    return [processed.map((v2) => v2[0]), myFlat(processed.map((v2) => v2[1]))];
  }
  const transferCache = /* @__PURE__ */ new WeakMap();
  function transfer(obj, transfers) {
    transferCache.set(obj, transfers);
    return obj;
  }
  function proxy(obj) {
    return Object.assign(obj, { [proxyMarker]: true });
  }
  function toWireValue(value) {
    for(let   [name, handler] of transferHandlers) {
      if (handler.canHandle(value)) {
        const [serializedValue, transferables] = handler.serialize(value);
        return [
          {
            type: "HANDLER",
            name,
            value: serializedValue
          },
          transferables
        ];
      }
    }
    return [
      {
        type: "RAW",
        value
      },
      transferCache.get(value) || []
    ];
  }
  function fromWireValue(value) {
    switch (value.type) {
      case "HANDLER":
        return transferHandlers.get(value.name).deserialize(value.value);
      case "RAW":
        return value.value;
    }
  }
  function requestResponseMessage(ep, pendingListeners, msg, transfers) {
    return new Promise((resolve) => {
      const id = generateUUID();
      pendingListeners.set(id, resolve);
      if (ep.start) {
        ep.start();
      }
      ep.postMessage(Object.assign({ id }, msg), transfers);
    });
  }
  function generateUUID() {
    return new Array(4).fill(0).map(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16)).join("-");
  }
  function i(r) {
    for (var a = r.rgba, n = r.width, i2 = r.height, t2 = Math.floor(n / 2), e2 = Math.floor(i2 / 2), f2 = new Uint8Array(t2 * e2 * 4), u2 = 0, l2 = 0; l2 + 1 < i2; l2 += 2)
      for (var c2 = 0; c2 + 1 < n; u2 += 4, c2 += 2)
        f2[u2] = (a[4 * (c2 + l2 * n)] + a[4 * (c2 + 1 + l2 * n)] + a[4 * (c2 + (l2 + 1) * n)] + a[4 * (c2 + 1 + (l2 + 1) * n)]) / 4, f2[u2 + 1] = (a[4 * (c2 + l2 * n) + 1] + a[4 * (c2 + 1 + l2 * n) + 1] + a[4 * (c2 + (l2 + 1) * n) + 1] + a[4 * (c2 + 1 + (l2 + 1) * n) + 1]) / 4, f2[u2 + 2] = (a[4 * (c2 + l2 * n) + 2] + a[4 * (c2 + 1 + l2 * n) + 2] + a[4 * (c2 + (l2 + 1) * n) + 2] + a[4 * (c2 + 1 + (l2 + 1) * n) + 2]) / 4, f2[u2 + 3] = (a[4 * (c2 + l2 * n) + 3] + a[4 * (c2 + 1 + l2 * n) + 3] + a[4 * (c2 + (l2 + 1) * n) + 3] + a[4 * (c2 + 1 + (l2 + 1) * n) + 3]) / 4;
    return { rgba: f2, width: t2, height: e2 };
  }
  var t = {};
  function e(r) {
    if (!r)
      throw Error("assert :P");
  }
  function f(r, a, n) {
    for (var i2 = 0; 4 > i2; i2++)
      if (r[a + i2] != n.charCodeAt(i2))
        return true;
    return false;
  }
  function u(r, a, n, i2, t2) {
    for (var e2 = 0; e2 < t2; e2++)
      r[a + e2] = n[i2 + e2];
  }
  function l(r, a, n, i2) {
    for (var t2 = 0; t2 < i2; t2++)
      r[a + t2] = n;
  }
  function c(r) {
    return new Int32Array(r);
  }
  function o(r, a) {
    for (var n = [], i2 = 0; i2 < r; i2++)
      n.push(new a());
    return n;
  }
  function s(r, a) {
    var n = [];
    return function r2(n2, i2, t2) {
      for (var e2 = t2[i2], f2 = 0; f2 < e2 && (n2.push(t2.length > i2 + 1 ? [] : new a()), !(t2.length < i2 + 1)); f2++)
        r2(n2[f2], i2 + 1, t2);
    }(n, 0, r), n;
  }
  var h = function() {
    function a(r, a2) {
      for (var n2 = 1 << a2 - 1 >>> 0; r & n2; )
        n2 >>>= 1;
      return n2 ? (r & n2 - 1) + n2 : r;
    }
    function n(r, a2, n2, i3, t2) {
      e(!(i3 % n2));
      do {
        r[a2 + (i3 -= n2)] = t2;
      } while (0 < i3);
    }
    function i2(r, i3, t2, f2, u2) {
      if (e(2328 >= u2), 512 >= u2)
        var l2 = c(512);
      else if (null == (l2 = c(u2)))
        return 0;
      return function(r2, i4, t3, f3, u3, l3) {
        var o2, s2, b3 = i4, d3 = 1 << t3, v3 = c(16), w2 = c(16);
        for (e(0 != u3), e(null != f3), e(null != r2), e(0 < t3), s2 = 0; s2 < u3; ++s2) {
          if (15 < f3[s2])
            return 0;
          ++v3[f3[s2]];
        }
        if (v3[0] == u3)
          return 0;
        for (w2[1] = 0, o2 = 1; 15 > o2; ++o2) {
          if (v3[o2] > 1 << o2)
            return 0;
          w2[o2 + 1] = w2[o2] + v3[o2];
        }
        for (s2 = 0; s2 < u3; ++s2)
          o2 = f3[s2], 0 < f3[s2] && (l3[w2[o2]++] = s2);
        if (1 == w2[15])
          return (f3 = new h2()).g = 0, f3.value = l3[0], n(r2, b3, 1, d3, f3), d3;
        var g2, P2 = -1, k2 = d3 - 1, m2 = 0, p2 = 1, A2 = 1, L2 = 1 << t3;
        for (s2 = 0, o2 = 1, u3 = 2; o2 <= t3; ++o2, u3 <<= 1) {
          if (p2 += A2 <<= 1, 0 > (A2 -= v3[o2]))
            return 0;
          for (; 0 < v3[o2]; --v3[o2])
            (f3 = new h2()).g = o2, f3.value = l3[s2++], n(r2, b3 + m2, u3, L2, f3), m2 = a(m2, o2);
        }
        for (o2 = t3 + 1, u3 = 2; 15 >= o2; ++o2, u3 <<= 1) {
          if (p2 += A2 <<= 1, 0 > (A2 -= v3[o2]))
            return 0;
          for (; 0 < v3[o2]; --v3[o2]) {
            if (f3 = new h2(), (m2 & k2) != P2) {
              for (b3 += L2, g2 = 1 << (P2 = o2) - t3; 15 > P2 && !(0 >= (g2 -= v3[P2])); )
                ++P2, g2 <<= 1;
              d3 += L2 = 1 << (g2 = P2 - t3), r2[i4 + (P2 = m2 & k2)].g = g2 + t3, r2[i4 + P2].value = b3 - i4 - P2;
            }
            f3.g = o2 - t3, f3.value = l3[s2++], n(r2, b3 + (m2 >> t3), u3, L2, f3), m2 = a(m2, o2);
          }
        }
        return p2 != 2 * w2[15] - 1 ? 0 : d3;
      }(r, i3, t2, f2, u2, l2);
    }
    function h2() {
      this.value = this.g = 0;
    }
    function b2() {
      this.value = this.g = 0;
    }
    function d2() {
      this.G = o(5, h2), this.H = c(5), this.jc = this.Qb = this.qb = this.nd = 0, this.pd = o(Hn, b2);
    }
    function v2(r, a2, n2, i3) {
      e(null != r), e(null != a2), e(2147483648 > i3), r.Ca = 254, r.I = 0, r.b = -8, r.Ka = 0, r.oa = a2, r.pa = n2, r.Jd = a2, r.Yc = n2 + i3, r.Zc = 4 <= i3 ? n2 + i3 - 4 + 1 : n2, V(r);
    }
    function w(r, a2) {
      for (var n2 = 0; 0 < a2--; )
        n2 |= G(r, 128) << a2;
      return n2;
    }
    function g(r, a2) {
      var n2 = w(r, a2);
      return B(r) ? -n2 : n2;
    }
    function P(r, a2, n2, i3) {
      var t2, f2 = 0;
      for (e(null != r), e(null != a2), e(4294967288 > i3), r.Sb = i3, r.Ra = 0, r.u = 0, r.h = 0, 4 < i3 && (i3 = 4), t2 = 0; t2 < i3; ++t2)
        f2 += a2[n2 + t2] << 8 * t2;
      r.Ra = f2, r.bb = i3, r.oa = a2, r.pa = n2;
    }
    function k(r) {
      for (; 8 <= r.u && r.bb < r.Sb; )
        r.Ra >>>= 8, r.Ra += r.oa[r.pa + r.bb] << Kn - 8 >>> 0, ++r.bb, r.u -= 8;
      R(r) && (r.h = 1, r.u = 0);
    }
    function m(r, a2) {
      if (e(0 <= a2), !r.h && a2 <= Wn) {
        var n2 = L(r) & Dn[a2];
        return r.u += a2, k(r), n2;
      }
      return r.h = 1, r.u = 0;
    }
    function p() {
      this.b = this.Ca = this.I = 0, this.oa = [], this.pa = 0, this.Jd = [], this.Yc = 0, this.Zc = [], this.Ka = 0;
    }
    function A() {
      this.Ra = 0, this.oa = [], this.h = this.u = this.bb = this.Sb = this.pa = 0;
    }
    function L(r) {
      return r.Ra >>> (r.u & Kn - 1) >>> 0;
    }
    function R(r) {
      return e(r.bb <= r.Sb), r.h || r.bb == r.Sb && r.u > Kn;
    }
    function y(r, a2) {
      r.u = a2, r.h = R(r);
    }
    function _(r) {
      r.u >= Nn && (e(r.u >= Nn), k(r));
    }
    function V(r) {
      e(null != r && null != r.oa), r.pa < r.Zc ? (r.I = (r.oa[r.pa++] | r.I << 8) >>> 0, r.b += 8) : (e(null != r && null != r.oa), r.pa < r.Yc ? (r.b += 8, r.I = r.oa[r.pa++] | r.I << 8) : r.Ka ? r.b = 0 : (r.I <<= 8, r.b += 8, r.Ka = 1));
    }
    function B(r) {
      return w(r, 1);
    }
    function G(r, a2) {
      var n2 = r.Ca;
      0 > r.b && V(r);
      var i3 = r.b, t2 = n2 * a2 >>> 8, e2 = (r.I >>> i3 > t2) + 0;
      for (e2 ? (n2 -= t2, r.I -= t2 + 1 << i3 >>> 0) : n2 = t2 + 1, i3 = n2, t2 = 0; 256 <= i3; )
        t2 += 8, i3 >>= 8;
      return i3 = 7 ^ t2 + Yn[i3], r.b -= i3, r.Ca = (n2 << i3) - 1, e2;
    }
    function C(r, a2, n2) {
      r[a2 + 0] = n2 >> 24 & 255, r[a2 + 1] = n2 >> 16 & 255, r[a2 + 2] = n2 >> 8 & 255, r[a2 + 3] = n2 >> 0 & 255;
    }
    function I(r, a2) {
      return r[a2 + 0] << 0 | r[a2 + 1] << 8;
    }
    function U(r, a2) {
      return I(r, a2) | r[a2 + 2] << 16;
    }
    function M(r, a2) {
      return I(r, a2) | I(r, a2 + 2) << 16;
    }
    function F(r, a2) {
      var n2 = 1 << a2;
      return e(null != r), e(0 < a2), r.X = c(n2), null == r.X ? 0 : (r.Mb = 32 - a2, r.Xa = a2, 1);
    }
    function j(r, a2) {
      e(null != r), e(null != a2), e(r.Xa == a2.Xa), u(a2.X, 0, r.X, 0, 1 << a2.Xa);
    }
    function O() {
      this.X = [], this.Xa = this.Mb = 0;
    }
    function S(r, a2, n2, i3) {
      e(null != n2), e(null != i3);
      var t2 = n2[0], f2 = i3[0];
      return 0 == t2 && (t2 = (r * f2 + a2 / 2) / a2), 0 == f2 && (f2 = (a2 * t2 + r / 2) / r), 0 >= t2 || 0 >= f2 ? 0 : (n2[0] = t2, i3[0] = f2, 1);
    }
    function T(r, a2) {
      return r + (1 << a2) - 1 >>> a2;
    }
    function H(r, a2) {
      return ((4278255360 & r) + (4278255360 & a2) >>> 0 & 4278255360) + ((16711935 & r) + (16711935 & a2) >>> 0 & 16711935) >>> 0;
    }
    function D(r, a2) {
      t[a2] = function(a3, n2, i3, e2, f2, u2, l2) {
        var c2;
        for (c2 = 0; c2 < f2; ++c2) {
          var o2 = t[r](u2[l2 + c2 - 1], i3, e2 + c2);
          u2[l2 + c2] = H(a3[n2 + c2], o2);
        }
      };
    }
    function W() {
      this.ud = this.hd = this.jd = 0;
    }
    function K(r, a2) {
      return ((4278124286 & (r ^ a2)) >>> 1) + (r & a2) >>> 0;
    }
    function N(r) {
      return 0 <= r && 256 > r ? r : 0 > r ? 0 : 255 < r ? 255 : void 0;
    }
    function Y(r, a2) {
      return N(r + (r - a2 + 0.5 >> 1));
    }
    function J(r, a2, n2) {
      return Math.abs(a2 - n2) - Math.abs(r - n2);
    }
    function x(r, a2, n2, i3, t2, e2, f2) {
      for (i3 = e2[f2 - 1], n2 = 0; n2 < t2; ++n2)
        e2[f2 + n2] = i3 = H(r[a2 + n2], i3);
    }
    function z(r, a2, n2, i3, t2) {
      var e2;
      for (e2 = 0; e2 < n2; ++e2) {
        var f2 = r[a2 + e2], u2 = f2 >> 8 & 255, l2 = 16711935 & (l2 = (l2 = 16711935 & f2) + ((u2 << 16) + u2));
        i3[t2 + e2] = (4278255360 & f2) + l2 >>> 0;
      }
    }
    function E(r, a2) {
      a2.jd = r >> 0 & 255, a2.hd = r >> 8 & 255, a2.ud = r >> 16 & 255;
    }
    function X(r, a2, n2, i3, t2, e2) {
      var f2;
      for (f2 = 0; f2 < i3; ++f2) {
        var u2 = a2[n2 + f2], l2 = u2 >>> 8, c2 = u2, o2 = 255 & (o2 = (o2 = u2 >>> 16) + ((r.jd << 24 >> 24) * (l2 << 24 >> 24) >>> 5));
        c2 = 255 & (c2 = (c2 += (r.hd << 24 >> 24) * (l2 << 24 >> 24) >>> 5) + ((r.ud << 24 >> 24) * (o2 << 24 >> 24) >>> 5)), t2[e2 + f2] = (4278255360 & u2) + (o2 << 16) + c2;
      }
    }
    function $(r, a2, n2, i3, e2) {
      t[a2] = function(r2, a3, n3, t2, f2, u2, l2, c2, o2) {
        for (t2 = l2; t2 < c2; ++t2)
          for (l2 = 0; l2 < o2; ++l2)
            f2[u2++] = e2(n3[i3(r2[a3++])]);
      }, t[r] = function(r2, a3, f2, u2, l2, c2, o2) {
        var s2 = 8 >> r2.b, h3 = r2.Ea, b3 = r2.K[0], d3 = r2.w;
        if (8 > s2)
          for (r2 = (1 << r2.b) - 1, d3 = (1 << s2) - 1; a3 < f2; ++a3) {
            var v3, w2 = 0;
            for (v3 = 0; v3 < h3; ++v3)
              v3 & r2 || (w2 = i3(u2[l2++])), c2[o2++] = e2(b3[w2 & d3]), w2 >>= s2;
          }
        else
          t["VP8LMapColor" + n2](u2, l2, b3, d3, c2, o2, a3, f2, h3);
      };
    }
    function Z(r, a2, n2, i3, t2) {
      for (n2 = a2 + n2; a2 < n2; ) {
        var e2 = r[a2++];
        i3[t2++] = e2 >> 16 & 255, i3[t2++] = e2 >> 8 & 255, i3[t2++] = e2 >> 0 & 255;
      }
    }
    function q(r, a2, n2, i3, t2) {
      for (n2 = a2 + n2; a2 < n2; ) {
        var e2 = r[a2++];
        i3[t2++] = e2 >> 16 & 255, i3[t2++] = e2 >> 8 & 255, i3[t2++] = e2 >> 0 & 255, i3[t2++] = e2 >> 24 & 255;
      }
    }
    function Q(r, a2, n2, i3, t2) {
      for (n2 = a2 + n2; a2 < n2; ) {
        var e2 = (f2 = r[a2++]) >> 16 & 240 | f2 >> 12 & 15, f2 = f2 >> 0 & 240 | f2 >> 28 & 15;
        i3[t2++] = e2, i3[t2++] = f2;
      }
    }
    function rr(r, a2, n2, i3, t2) {
      for (n2 = a2 + n2; a2 < n2; ) {
        var e2 = (f2 = r[a2++]) >> 16 & 248 | f2 >> 13 & 7, f2 = f2 >> 5 & 224 | f2 >> 3 & 31;
        i3[t2++] = e2, i3[t2++] = f2;
      }
    }
    function ar(r, a2, n2, i3, t2) {
      for (n2 = a2 + n2; a2 < n2; ) {
        var e2 = r[a2++];
        i3[t2++] = e2 >> 0 & 255, i3[t2++] = e2 >> 8 & 255, i3[t2++] = e2 >> 16 & 255;
      }
    }
    function nr(r, a2, n2, i3, t2, e2) {
      if (0 == e2)
        for (n2 = a2 + n2; a2 < n2; )
          C(
            i3,
            ((e2 = r[a2++])[0] >> 24 | e2[1] >> 8 & 65280 | e2[2] << 8 & 16711680 | e2[3] << 24) >>> 0
          ), t2 += 32;
      else
        u(i3, t2, r, a2, n2);
    }
    function ir(r, a2) {
      t[a2][0] = t[r + "0"], t[a2][1] = t[r + "1"], t[a2][2] = t[r + "2"], t[a2][3] = t[r + "3"], t[a2][4] = t[r + "4"], t[a2][5] = t[r + "5"], t[a2][6] = t[r + "6"], t[a2][7] = t[r + "7"], t[a2][8] = t[r + "8"], t[a2][9] = t[r + "9"], t[a2][10] = t[r + "10"], t[a2][11] = t[r + "11"], t[a2][12] = t[r + "12"], t[a2][13] = t[r + "13"], t[a2][14] = t[r + "0"], t[a2][15] = t[r + "0"];
    }
    function tr(r) {
      return r == Ni || r == Yi || r == Ji || r == xi;
    }
    function er() {
      this.eb = [], this.size = this.A = this.fb = 0;
    }
    function fr() {
      this.y = [], this.f = [], this.ea = [], this.F = [], this.Tc = this.Ed = this.Cd = this.Fd = this.lb = this.Db = this.Ab = this.fa = this.J = this.W = this.N = this.O = 0;
    }
    function ur() {
      this.Rd = this.height = this.width = this.S = 0, this.f = {}, this.f.RGBA = new er(), this.f.kb = new fr(), this.sd = null;
    }
    function lr() {
      this.width = [0], this.height = [0], this.Pd = [0], this.Qd = [0], this.format = [0];
    }
    function cr() {
      this.Id = this.fd = this.Md = this.hb = this.ib = this.da = this.bd = this.cd = this.j = this.v = this.Da = this.Sd = this.ob = 0;
    }
    function or(r) {
      console.info("Stickers decoder: WebPSamplerProcessPlane");
      return r.T;
    }
    function sr(r, a2) {
      var n2 = r.T, i3 = a2.ba.f.RGBA, t2 = i3.eb, e2 = i3.fb + r.ka * i3.A, f2 = gt[a2.ba.S], l2 = r.y, c2 = r.O, o2 = r.f, s2 = r.N, h3 = r.ea, b3 = r.W, d3 = a2.cc, v3 = a2.dc, w2 = a2.Mc, g2 = a2.Nc, P2 = r.ka, k2 = r.ka + r.T, m2 = r.U, p2 = m2 + 1 >> 1;
      for (0 == P2 ? f2(l2, c2, null, null, o2, s2, h3, b3, o2, s2, h3, b3, t2, e2, null, null, m2) : (f2(a2.ec, a2.fc, l2, c2, d3, v3, w2, g2, o2, s2, h3, b3, t2, e2 - i3.A, t2, e2, m2), ++n2); P2 + 2 < k2; P2 += 2)
        d3 = o2, v3 = s2, w2 = h3, g2 = b3, s2 += r.Rc, b3 += r.Rc, e2 += 2 * i3.A, f2(l2, (c2 += 2 * r.fa) - r.fa, l2, c2, d3, v3, w2, g2, o2, s2, h3, b3, t2, e2 - i3.A, t2, e2, m2);
      return c2 += r.fa, r.j + k2 < r.o ? (u(a2.ec, a2.fc, l2, c2, m2), u(a2.cc, a2.dc, o2, s2, p2), u(a2.Mc, a2.Nc, h3, b3, p2), n2--) : 1 & k2 || f2(l2, c2, null, null, o2, s2, h3, b3, o2, s2, h3, b3, t2, e2 + i3.A, null, null, m2), n2;
    }
    function hr(r, a2, n2) {
      var i3 = r.F, t2 = [r.J];
      if (null != i3) {
        var f2 = r.U, u2 = a2.ba.S, l2 = u2 == Di || u2 == Ji;
        a2 = a2.ba.f.RGBA;
        var c2 = [0], o2 = r.ka;
        c2[0] = r.T, r.Kb && (0 == o2 ? --c2[0] : (--o2, t2[0] -= r.width), r.j + r.ka + r.T == r.o && (c2[0] = r.o - r.j - o2));
        var s2 = a2.eb;
        o2 = a2.fb + o2 * a2.A, r = yi(i3, t2[0], r.width, f2, c2, s2, o2 + (l2 ? 0 : 3), a2.A), e(n2 == c2), r && tr(u2) && Li(s2, o2, l2, f2, c2, a2.A);
      }
      return 0;
    }
    function br(r) {
      var a2 = r.ma, n2 = a2.ba.S, i3 = 11 > n2, t2 = n2 == Si || n2 == Hi || n2 == Di || n2 == Wi || 12 == n2 || tr(n2);
      if (a2.memory = null, a2.Ib = null, a2.Jb = null, a2.Nd = null, !On(a2.Oa, r, t2 ? 11 : 12))
        return 0;
      if (t2 && tr(n2) && kn(), r.da) {
        console.info("Stickers decoder: use_scaling");
      } else {
        if (i3) {
          if (a2.Ib = or, r.Kb) {
            if (n2 = r.U + 1 >> 1, a2.memory = c(r.U + 2 * n2), null == a2.memory)
              return 0;
            a2.ec = a2.memory, a2.fc = 0, a2.cc = a2.ec, a2.dc = a2.fc + r.U, a2.Mc = a2.cc, a2.Nc = a2.dc + n2, a2.Ib = sr, kn();
          }
        } else {
          console.info("Stickers decoder: EmitYUV");
        }
        t2 && (a2.Jb = hr, i3 && gn());
      }
      if (i3 && !It) {
        for (r = 0; 256 > r; ++r)
          Ut[r] = 89858 * (r - 128) + _t >> yt, jt[r] = -22014 * (r - 128) + _t, Ft[r] = -45773 * (r - 128), Mt[r] = 113618 * (r - 128) + _t >> yt;
        for (r = Vt; r < Bt; ++r)
          a2 = 76283 * (r - 16) + _t >> yt, Ot[r - Vt] = xr(a2, 255), St[r - Vt] = xr(a2 + 8 >> 4, 15);
        It = 1;
      }
      return 1;
    }
    function dr(r) {
      var a2 = r.ma, n2 = r.U, i3 = r.T;
      return e(!(1 & r.ka)), 0 >= n2 || 0 >= i3 ? 0 : (n2 = a2.Ib(r, a2), null != a2.Jb && a2.Jb(r, a2, n2), a2.Dc += n2, 1);
    }
    function vr(r) {
      r.ma.memory = null;
    }
    function wr(r, a2, n2, i3) {
      return 47 != m(r, 8) ? 0 : (a2[0] = m(r, 14) + 1, n2[0] = m(r, 14) + 1, i3[0] = m(r, 1), 0 != m(r, 3) ? 0 : !r.h);
    }
    function gr(r, a2) {
      if (4 > r)
        return r + 1;
      var n2 = r - 2 >> 1;
      return (2 + (1 & r) << n2) + m(a2, n2) + 1;
    }
    function Pr(r, a2) {
      return 120 < a2 ? a2 - 120 : 1 <= (n2 = ((n2 = qi[a2 - 1]) >> 4) * r + (8 - (15 & n2))) ? n2 : 1;
      var n2;
    }
    function kr(r, a2, n2) {
      var i3 = L(n2), t2 = r[a2 += 255 & i3].g - 8;
      return 0 < t2 && (y(n2, n2.u + 8), i3 = L(n2), a2 += r[a2].value, a2 += i3 & (1 << t2) - 1), y(n2, n2.u + r[a2].g), r[a2].value;
    }
    function mr(r, a2, n2) {
      return n2.g += r.g, n2.value += r.value << a2 >>> 0, e(8 >= n2.g), r.g;
    }
    function pr(r, a2, n2) {
      var i3 = r.xc;
      return e((a2 = 0 == i3 ? 0 : r.vc[r.md * (n2 >> i3) + (a2 >> i3)]) < r.Wb), r.Ya[a2];
    }
    function Ar(r, a2, n2, i3) {
      var t2 = r.ab, f2 = r.c * a2, l2 = r.C;
      a2 = l2 + a2;
      var c2 = n2, o2 = i3;
      for (i3 = r.Ta, n2 = r.Ua; 0 < t2--; ) {
        var s2 = r.gc[t2], h3 = l2, b3 = a2, d3 = c2, v3 = o2, w2 = (o2 = i3, c2 = n2, s2.Ea);
        switch (e(h3 < b3), e(b3 <= s2.nc), s2.hc) {
          case 2:
            zn(d3, v3, (b3 - h3) * w2, o2, c2);
            break;
          case 0:
            var g2 = h3, P2 = b3, k2 = o2, m2 = c2, p2 = (_2 = s2).Ea;
            0 == g2 && (Jn(d3, v3, null, null, 1, k2, m2), x(d3, v3 + 1, 0, 0, p2 - 1, k2, m2 + 1), v3 += p2, m2 += p2, ++g2);
            for (var A2 = 1 << _2.b, L2 = A2 - 1, R2 = T(p2, _2.b), y2 = _2.K, _2 = _2.w + (g2 >> _2.b) * R2; g2 < P2; ) {
              var V2 = y2, B2 = _2, G2 = 1;
              for (xn(d3, v3, k2, m2 - p2, 1, k2, m2); G2 < p2; ) {
                var C2 = (G2 & ~L2) + A2;
                C2 > p2 && (C2 = p2), (0, qn[V2[B2++] >> 8 & 15])(d3, v3 + +G2, k2, m2 + G2 - p2, C2 - G2, k2, m2 + G2), G2 = C2;
              }
              v3 += p2, m2 += p2, ++g2 & L2 || (_2 += R2);
            }
            b3 != s2.nc && u(o2, c2 - w2, o2, c2 + (b3 - h3 - 1) * w2, w2);
            break;
          case 1:
            for (w2 = d3, P2 = v3, p2 = (d3 = s2.Ea) - (m2 = d3 & ~(k2 = (v3 = 1 << s2.b) - 1)), g2 = T(d3, s2.b), A2 = s2.K, s2 = s2.w + (h3 >> s2.b) * g2; h3 < b3; ) {
              for (L2 = A2, R2 = s2, y2 = new W(), _2 = P2 + m2, V2 = P2 + d3; P2 < _2; )
                E(L2[R2++], y2), Qn(y2, w2, P2, v3, o2, c2), P2 += v3, c2 += v3;
              P2 < V2 && (E(L2[R2++], y2), Qn(y2, w2, P2, p2, o2, c2), P2 += p2, c2 += p2), ++h3 & k2 || (s2 += g2);
            }
            break;
          case 3:
            if (d3 == o2 && v3 == c2 && 0 < s2.b) {
              for (P2 = o2, d3 = w2 = c2 + (b3 - h3) * w2 - (m2 = (b3 - h3) * T(s2.Ea, s2.b)), v3 = o2, k2 = c2, g2 = [], m2 = (p2 = m2) - 1; 0 <= m2; --m2)
                g2[m2] = v3[k2 + m2];
              for (m2 = p2 - 1; 0 <= m2; --m2)
                P2[d3 + m2] = g2[m2];
              En(s2, h3, b3, o2, w2, o2, c2);
            } else
              En(s2, h3, b3, d3, v3, o2, c2);
        }
        c2 = i3, o2 = n2;
      }
      o2 != n2 && u(i3, n2, c2, o2, f2);
    }
    function Lr(r, a2) {
      var n2 = r.V, i3 = r.Ba + r.c * r.C, t2 = a2 - r.C;
      if (e(a2 <= r.l.o), e(16 >= t2), 0 < t2) {
        var f2 = r.l, u2 = r.Ta, l2 = r.Ua, c2 = f2.width;
        if (Ar(r, t2, n2, i3), t2 = l2 = [l2], e((n2 = r.C) < (i3 = a2)), e(f2.v < f2.va), i3 > f2.o && (i3 = f2.o), n2 < f2.j) {
          var o2 = f2.j - n2;
          n2 = f2.j, t2[0] += o2 * c2;
        }
        if (n2 >= i3 ? n2 = 0 : (t2[0] += 4 * f2.v, f2.ka = n2 - f2.j, f2.U = f2.va - f2.v, f2.T = i3 - n2, n2 = 1), n2) {
          if (l2 = l2[0], 11 > (n2 = r.ca).S) {
            var s2 = n2.f.RGBA, h3 = (i3 = n2.S, t2 = f2.U, f2 = f2.T, o2 = s2.eb, s2.A), b3 = f2;
            for (s2 = s2.fb + r.Ma * s2.A; 0 < b3--; ) {
              var d3 = u2, v3 = l2, w2 = t2, g2 = o2, P2 = s2;
              switch (i3) {
                case Oi:
                  ri(d3, v3, w2, g2, P2);
                  break;
                case Si:
                  ai(d3, v3, w2, g2, P2);
                  break;
                case Ni:
                  ai(d3, v3, w2, g2, P2), Li(g2, P2, 0, w2, 1, 0);
                  break;
                case Ti:
                  ti(d3, v3, w2, g2, P2);
                  break;
                case Hi:
                  nr(d3, v3, w2, g2, P2, 1);
                  break;
                case Yi:
                  nr(d3, v3, w2, g2, P2, 1), Li(g2, P2, 0, w2, 1, 0);
                  break;
                case Di:
                  nr(d3, v3, w2, g2, P2, 0);
                  break;
                case Ji:
                  nr(d3, v3, w2, g2, P2, 0), Li(g2, P2, 1, w2, 1, 0);
                  break;
                case Wi:
                  ni(d3, v3, w2, g2, P2);
                  break;
                case xi:
                  ni(d3, v3, w2, g2, P2), Ri(g2, P2, w2, 1, 0);
                  break;
                case Ki:
                  ii(d3, v3, w2, g2, P2);
                  break;
                default:
                  e(0);
              }
              l2 += c2, s2 += h3;
            }
            r.Ma += f2;
          } else {
            console.info(`Stickers decoder: EmitRescaledRowsYUVA`);
          }
          e(r.Ma <= n2.height);
        }
      }
      r.C = a2, e(r.C <= r.i);
    }
    function Rr(r) {
      var a2;
      if (0 < r.ua)
        return 0;
      for (a2 = 0; a2 < r.Wb; ++a2) {
        var n2 = r.Ya[a2].G, i3 = r.Ya[a2].H;
        if (0 < n2[1][i3[1] + 0].g || 0 < n2[2][i3[2] + 0].g || 0 < n2[3][i3[3] + 0].g)
          return 0;
      }
      return 1;
    }
    function yr(r, a2, n2, i3, t2, f2) {
      if (0 != r.Z) {
        var u2 = r.qd, l2 = r.rd;
        for (e(null != wt[r.Z]); a2 < n2; ++a2)
          wt[r.Z](u2, l2, i3, t2, i3, t2, f2), u2 = i3, l2 = t2, t2 += f2;
        r.qd = u2, r.rd = l2;
      }
    }
    function _r(r, a2) {
      var n2 = r.l.ma, i3 = 0 == n2.Z || 1 == n2.Z ? r.l.j : r.C;
      if (i3 = r.C < i3 ? i3 : r.C, e(a2 <= r.l.o), a2 > i3) {
        var t2 = r.l.width, f2 = n2.ca, u2 = n2.tb + t2 * i3, l2 = r.V, c2 = r.Ba + r.c * i3, o2 = r.gc;
        e(1 == r.ab), e(3 == o2[0].hc), $n(o2[0], i3, a2, l2, c2, f2, u2), yr(n2, i3, a2, f2, u2, t2);
      }
      r.C = r.Ma = a2;
    }
    function Vr(r, a2, n2, i3, t2, f2, u2) {
      var l2 = r.$ / i3, c2 = r.$ % i3, o2 = r.m, s2 = r.s, h3 = n2 + r.$, b3 = h3;
      t2 = n2 + i3 * t2;
      var d3 = n2 + i3 * f2, v3 = 280 + s2.ua, w2 = r.Pb ? l2 : 16777216, g2 = 0 < s2.ua ? s2.Wa : null, P2 = s2.wc, k2 = h3 < d3 ? pr(s2, c2, l2) : null;
      e(r.C < f2), e(d3 <= t2);
      var m2 = false;
      r:
        for (; ; ) {
          for (; m2 || h3 < d3; ) {
            var p2 = 0;
            if (l2 >= w2) {
              var A2 = h3 - n2;
              e((w2 = r).Pb), w2.wd = w2.m, w2.xd = A2, 0 < w2.s.ua && j(w2.s.Wa, w2.s.vb), w2 = l2 + rt;
            }
            if (c2 & P2 || (k2 = pr(s2, c2, l2)), e(null != k2), k2.Qb && (a2[h3] = k2.qb, m2 = true), !m2)
              if (_(o2), k2.jc) {
                p2 = o2, A2 = a2;
                var V2 = h3, B2 = k2.pd[L(p2) & Hn - 1];
                e(k2.jc), 256 > B2.g ? (y(p2, p2.u + B2.g), A2[V2] = B2.value, p2 = 0) : (y(p2, p2.u + B2.g - 256), e(256 <= B2.value), p2 = B2.value), 0 == p2 && (m2 = true);
              } else
                p2 = kr(k2.G[0], k2.H[0], o2);
            if (o2.h)
              break;
            if (m2 || 256 > p2) {
              if (!m2)
                if (k2.nd)
                  a2[h3] = (k2.qb | p2 << 8) >>> 0;
                else {
                  if (_(o2), m2 = kr(k2.G[1], k2.H[1], o2), _(o2), A2 = kr(k2.G[2], k2.H[2], o2), V2 = kr(k2.G[3], k2.H[3], o2), o2.h)
                    break;
                  a2[h3] = (V2 << 24 | m2 << 16 | p2 << 8 | A2) >>> 0;
                }
              if (m2 = false, ++h3, ++c2 >= i3 && (c2 = 0, ++l2, null != u2 && l2 <= f2 && !(l2 % 16) && u2(r, l2), null != g2))
                for (; b3 < h3; )
                  p2 = a2[b3++], g2.X[(506832829 * p2 & 4294967295) >>> g2.Mb] = p2;
            } else if (280 > p2) {
              if (p2 = gr(p2 - 256, o2), A2 = kr(k2.G[4], k2.H[4], o2), _(o2), A2 = Pr(i3, A2 = gr(A2, o2)), o2.h)
                break;
              if (h3 - n2 < A2 || t2 - h3 < p2)
                break r;
              for (V2 = 0; V2 < p2; ++V2)
                a2[h3 + V2] = a2[h3 + V2 - A2];
              for (h3 += p2, c2 += p2; c2 >= i3; )
                c2 -= i3, ++l2, null != u2 && l2 <= f2 && !(l2 % 16) && u2(r, l2);
              if (e(h3 <= t2), c2 & P2 && (k2 = pr(s2, c2, l2)), null != g2)
                for (; b3 < h3; )
                  p2 = a2[b3++], g2.X[(506832829 * p2 & 4294967295) >>> g2.Mb] = p2;
            } else {
              if (!(p2 < v3))
                break r;
              for (m2 = p2 - 280, e(null != g2); b3 < h3; )
                p2 = a2[b3++], g2.X[(506832829 * p2 & 4294967295) >>> g2.Mb] = p2;
              p2 = h3, e(!(m2 >>> (A2 = g2).Xa)), a2[p2] = A2.X[m2], m2 = true;
            }
            m2 || e(o2.h == R(o2));
          }
          if (r.Pb && o2.h && h3 < t2)
            e(r.m.h), r.a = 5, r.m = r.wd, r.$ = r.xd, 0 < r.s.ua && j(r.s.vb, r.s.Wa);
          else {
            if (o2.h)
              break r;
            null != u2 && u2(r, l2 > f2 ? f2 : l2), r.a = 0, r.$ = h3 - n2;
          }
          return 1;
        }
      return r.a = 3, 0;
    }
    function Br(r) {
      e(null != r), r.vc = null, r.yc = null, r.Ya = null;
      var a2 = r.Wa;
      null != a2 && (a2.X = null), r.vb = null, e(null != r);
    }
    function Gr() {
      var r = new un();
      return null == r ? null : (r.a = 0, r.xb = vt, ir("Predictor", "VP8LPredictors"), ir("Predictor", "VP8LPredictors_C"), ir("PredictorAdd", "VP8LPredictorsAdd"), ir("PredictorAdd", "VP8LPredictorsAdd_C"), zn = z, Qn = X, ri = Z, ai = q, ni = Q, ii = rr, ti = ar, t.VP8LMapColor32b = Xn, t.VP8LMapColor8b = Zn, r);
    }
    function Cr(r, a2, n2, t2, f2) {
      var u2 = 1, s2 = [r], b3 = [a2], v3 = t2.m, w2 = t2.s, g2 = null, P2 = 0;
      r:
        for (; ; ) {
          if (n2)
            for (; u2 && m(v3, 1); ) {
              var k2 = s2, p2 = b3, A2 = t2, R2 = 1, V2 = A2.m, B2 = A2.gc[A2.ab], G2 = m(V2, 2);
              if (A2.Oc & 1 << G2)
                u2 = 0;
              else {
                switch (A2.Oc |= 1 << G2, B2.hc = G2, B2.Ea = k2[0], B2.nc = p2[0], B2.K = [null], ++A2.ab, e(4 >= A2.ab), G2) {
                  case 0:
                  case 1:
                    B2.b = m(V2, 3) + 2, R2 = Cr(T(B2.Ea, B2.b), T(B2.nc, B2.b), 0, A2, B2.K), B2.K = B2.K[0];
                    break;
                  case 3:
                    var C2, I2 = m(V2, 8) + 1, U2 = 16 < I2 ? 0 : 4 < I2 ? 1 : 2 < I2 ? 2 : 3;
                    if (k2[0] = T(B2.Ea, U2), B2.b = U2, C2 = R2 = Cr(I2, 1, 0, A2, B2.K)) {
                      var M2, j2 = I2, O2 = B2, S2 = 1 << (8 >> O2.b), D2 = c(S2);
                      if (null == D2)
                        C2 = 0;
                      else {
                        var W2 = O2.K[0], K2 = O2.w;
                        for (D2[0] = O2.K[0][0], M2 = 1; M2 < 1 * j2; ++M2)
                          D2[M2] = H(W2[K2 + M2], D2[M2 - 1]);
                        for (; M2 < 4 * S2; ++M2)
                          D2[M2] = 0;
                        O2.K[0] = null, O2.K[0] = D2, C2 = 1;
                      }
                    }
                    R2 = C2;
                    break;
                  case 2:
                    break;
                  default:
                    e(0);
                }
                u2 = R2;
              }
            }
          if (s2 = s2[0], b3 = b3[0], u2 && m(v3, 1) && !(u2 = 1 <= (P2 = m(v3, 4)) && 11 >= P2)) {
            t2.a = 3;
            break r;
          }
          var N2;
          if (N2 = u2)
            a: {
              var Y2, J2, x2, z2 = t2, E2 = s2, X2 = b3, $2 = P2, Z2 = n2, q2 = z2.m, Q2 = z2.s, rr2 = [null], ar2 = 1, nr2 = 0, ir2 = Qi[$2];
              n:
                for (; ; ) {
                  if (Z2 && m(q2, 1)) {
                    var tr2 = m(q2, 3) + 2, er2 = T(E2, tr2), fr2 = T(X2, tr2), ur2 = er2 * fr2;
                    if (!Cr(er2, fr2, 0, z2, rr2))
                      break n;
                    for (rr2 = rr2[0], Q2.xc = tr2, Y2 = 0; Y2 < ur2; ++Y2) {
                      var lr2 = rr2[Y2] >> 8 & 65535;
                      rr2[Y2] = lr2, lr2 >= ar2 && (ar2 = lr2 + 1);
                    }
                  }
                  if (q2.h)
                    break n;
                  for (J2 = 0; 5 > J2; ++J2) {
                    var cr2 = Xi[J2];
                    !J2 && 0 < $2 && (cr2 += 1 << $2), nr2 < cr2 && (nr2 = cr2);
                  }
                  var or2 = o(ar2 * ir2, h2), sr2 = ar2, hr2 = o(sr2, d2);
                  if (null == hr2)
                    var br2 = null;
                  else
                    e(65536 >= sr2), br2 = hr2;
                  var dr2 = c(nr2);
                  if (null == br2 || null == dr2 || null == or2) {
                    z2.a = 1;
                    break n;
                  }
                  var vr2 = or2;
                  for (Y2 = x2 = 0; Y2 < ar2; ++Y2) {
                    var wr2 = br2[Y2], gr2 = wr2.G, Pr2 = wr2.H, kr2 = 0, pr2 = 1, Ar2 = 0;
                    for (J2 = 0; 5 > J2; ++J2) {
                      cr2 = Xi[J2], gr2[J2] = vr2, Pr2[J2] = x2, !J2 && 0 < $2 && (cr2 += 1 << $2);
                      i: {
                        var Lr2, Rr2 = cr2, yr2 = z2, _r2 = dr2, Gr2 = vr2, Ir2 = x2, Ur2 = 0, Mr2 = yr2.m, Fr2 = m(Mr2, 1);
                        if (l(_r2, 0, 0, Rr2), Fr2) {
                          var jr2 = m(Mr2, 1) + 1, Or2 = m(Mr2, 1), Sr2 = m(Mr2, 0 == Or2 ? 1 : 8);
                          _r2[Sr2] = 1, 2 == jr2 && (_r2[Sr2 = m(Mr2, 8)] = 1);
                          var Tr2 = 1;
                        } else {
                          var Hr2 = c(19), Dr2 = m(Mr2, 4) + 4;
                          if (19 < Dr2) {
                            yr2.a = 3;
                            var Wr2 = 0;
                            break i;
                          }
                          for (Lr2 = 0; Lr2 < Dr2; ++Lr2)
                            Hr2[Zi[Lr2]] = m(Mr2, 3);
                          var Kr2 = void 0, Nr2 = void 0, Yr2 = yr2, Jr2 = Hr2, xr2 = Rr2, zr2 = _r2, Er2 = 0, Xr2 = Yr2.m, $r2 = 8, Zr2 = o(128, h2);
                          t:
                            for (; i2(Zr2, 0, 7, Jr2, 19); ) {
                              if (m(Xr2, 1)) {
                                var qr2 = 2 + 2 * m(Xr2, 3);
                                if ((Kr2 = 2 + m(Xr2, qr2)) > xr2)
                                  break t;
                              } else
                                Kr2 = xr2;
                              for (Nr2 = 0; Nr2 < xr2 && Kr2--; ) {
                                _(Xr2);
                                var Qr2 = Zr2[0 + (127 & L(Xr2))];
                                y(Xr2, Xr2.u + Qr2.g);
                                var ra2 = Qr2.value;
                                if (16 > ra2)
                                  zr2[Nr2++] = ra2, 0 != ra2 && ($r2 = ra2);
                                else {
                                  var aa2 = 16 == ra2, na2 = ra2 - 16, ia2 = Ei[na2], ta2 = m(Xr2, zi[na2]) + ia2;
                                  if (Nr2 + ta2 > xr2)
                                    break t;
                                  for (var ea2 = aa2 ? $r2 : 0; 0 < ta2--; )
                                    zr2[Nr2++] = ea2;
                                }
                              }
                              Er2 = 1;
                              break t;
                            }
                          Er2 || (Yr2.a = 3), Tr2 = Er2;
                        }
                        (Tr2 = Tr2 && !Mr2.h) && (Ur2 = i2(Gr2, Ir2, 8, _r2, Rr2)), Tr2 && 0 != Ur2 ? Wr2 = Ur2 : (yr2.a = 3, Wr2 = 0);
                      }
                      if (0 == Wr2)
                        break n;
                      if (pr2 && 1 == $i[J2] && (pr2 = 0 == vr2[x2].g), kr2 += vr2[x2].g, x2 += Wr2, 3 >= J2) {
                        var fa2, ua2 = dr2[0];
                        for (fa2 = 1; fa2 < cr2; ++fa2)
                          dr2[fa2] > ua2 && (ua2 = dr2[fa2]);
                        Ar2 += ua2;
                      }
                    }
                    if (wr2.nd = pr2, wr2.Qb = 0, pr2 && (wr2.qb = (gr2[3][Pr2[3] + 0].value << 24 | gr2[1][Pr2[1] + 0].value << 16 | gr2[2][Pr2[2] + 0].value) >>> 0, 0 == kr2 && 256 > gr2[0][Pr2[0] + 0].value && (wr2.Qb = 1, wr2.qb += gr2[0][Pr2[0] + 0].value << 8)), wr2.jc = !wr2.Qb && 6 > Ar2, wr2.jc) {
                      var la2, ca2 = wr2;
                      for (la2 = 0; la2 < Hn; ++la2) {
                        var oa2 = la2, sa2 = ca2.pd[oa2], ha2 = ca2.G[0][ca2.H[0] + oa2];
                        256 <= ha2.value ? (sa2.g = ha2.g + 256, sa2.value = ha2.value) : (sa2.g = 0, sa2.value = 0, oa2 >>= mr(ha2, 8, sa2), oa2 >>= mr(ca2.G[1][ca2.H[1] + oa2], 16, sa2), oa2 >>= mr(ca2.G[2][ca2.H[2] + oa2], 0, sa2), mr(ca2.G[3][ca2.H[3] + oa2], 24, sa2));
                      }
                    }
                  }
                  Q2.vc = rr2, Q2.Wb = ar2, Q2.Ya = br2, Q2.yc = or2, N2 = 1;
                  break a;
                }
              N2 = 0;
            }
          if (!(u2 = N2)) {
            t2.a = 3;
            break r;
          }
          if (0 < P2) {
            if (w2.ua = 1 << P2, !F(w2.Wa, P2)) {
              t2.a = 1, u2 = 0;
              break r;
            }
          } else
            w2.ua = 0;
          var ba2 = t2, da2 = s2, va2 = b3, wa2 = ba2.s, ga2 = wa2.xc;
          if (ba2.c = da2, ba2.i = va2, wa2.md = T(da2, ga2), wa2.wc = 0 == ga2 ? -1 : (1 << ga2) - 1, n2) {
            t2.xb = dt;
            break r;
          }
          if (null == (g2 = c(s2 * b3))) {
            t2.a = 1, u2 = 0;
            break r;
          }
          u2 = (u2 = Vr(t2, g2, 0, s2, b3, b3, null)) && !v3.h;
          break r;
        }
      return u2 ? (null != f2 ? f2[0] = g2 : (e(null == g2), e(n2)), t2.$ = 0, n2 || Br(w2)) : Br(w2), u2;
    }
    function Ir(r, a2) {
      var n2 = r.c * r.i, i3 = n2 + a2 + 16 * a2;
      return e(r.c <= a2), r.V = c(i3), null == r.V ? (r.Ta = null, r.Ua = 0, r.a = 1, 0) : (r.Ta = r.V, r.Ua = r.Ba + n2 + a2, 1);
    }
    function Ur(r, a2) {
      var n2 = r.C, i3 = a2 - n2, t2 = r.V, f2 = r.Ba + r.c * n2;
      for (e(a2 <= r.l.o); 0 < i3; ) {
        var u2 = 16 < i3 ? 16 : i3, l2 = r.l.ma, c2 = r.l.width, o2 = c2 * u2, s2 = l2.ca, h3 = l2.tb + c2 * n2, b3 = r.Ta, d3 = r.Ua;
        Ar(r, u2, t2, f2), _i(b3, d3, s2, h3, o2), yr(l2, n2, n2 + u2, s2, h3, c2), i3 -= u2, t2 += u2 * r.c, n2 += u2;
      }
      e(n2 == a2), r.C = r.Ma = a2;
    }
    function Mr() {
      this.ub = this.yd = this.td = this.Rb = 0;
    }
    function Fr() {
      this.Kd = this.Ld = this.Ud = this.Td = this.i = this.c = 0;
    }
    function jr() {
      this.Fb = this.Bb = this.Cb = 0, this.Zb = c(4), this.Lb = c(4);
    }
    function Or() {
      this.Yb = function() {
        var r = [];
        return function r2(a2, n2, i3) {
          for (var t2 = i3[n2], e2 = 0; e2 < t2 && (a2.push(i3.length > n2 + 1 ? [] : 0), !(i3.length < n2 + 1)); e2++)
            r2(a2[e2], n2 + 1, i3);
        }(r, 0, [3, 11]), r;
      }();
    }
    function Sr() {
      this.jb = c(3), this.Wc = s([4, 8], Or), this.Xc = s([4, 17], Or);
    }
    function Tr() {
      this.Pc = this.wb = this.Tb = this.zd = 0, this.vd = new c(4), this.od = new c(4);
    }
    function Hr() {
      this.ld = this.La = this.dd = this.tc = 0;
    }
    function Dr() {
      this.Na = this.la = 0;
    }
    function Wr() {
      this.Sc = [0, 0], this.Eb = [0, 0], this.Qc = [0, 0], this.ia = this.lc = 0;
    }
    function Kr() {
      this.ad = c(384), this.Za = 0, this.Ob = c(16), this.$b = this.Ad = this.ia = this.Gc = this.Hc = this.Dd = 0;
    }
    function Nr() {
      this.uc = this.M = this.Nb = 0, this.wa = Array(new Hr()), this.Y = 0, this.ya = Array(new Kr()), this.aa = 0, this.l = new zr();
    }
    function Yr() {
      this.y = c(16), this.f = c(8), this.ea = c(8);
    }
    function Jr() {
      this.cb = this.a = 0, this.sc = "", this.m = new p(), this.Od = new Mr(), this.Kc = new Fr(), this.ed = new Tr(), this.Qa = new jr(), this.Ic = this.$c = this.Aa = 0, this.D = new Nr(), this.Xb = this.Va = this.Hb = this.zb = this.yb = this.Ub = this.za = 0, this.Jc = o(8, p), this.ia = 0, this.pb = o(4, Wr), this.Pa = new Sr(), this.Bd = this.kc = 0, this.Ac = [], this.Bc = 0, this.zc = [0, 0, 0, 0], this.Gd = Array(new Yr()), this.Hd = 0, this.rb = Array(new Dr()), this.sb = 0, this.wa = Array(new Hr()), this.Y = 0, this.oc = [], this.pc = 0, this.sa = [], this.ta = 0, this.qa = [], this.ra = 0, this.Ha = [], this.B = this.R = this.Ia = 0, this.Ec = [], this.M = this.ja = this.Vb = this.Fc = 0, this.ya = Array(new Kr()), this.L = this.aa = 0, this.gd = s([4, 2], Hr), this.ga = null, this.Fa = [], this.Cc = this.qc = this.P = 0, this.Gb = [], this.Uc = 0, this.mb = [], this.nb = 0, this.rc = [], this.Ga = this.Vc = 0;
    }
    function xr(r, a2) {
      return 0 > r ? 0 : r > a2 ? a2 : r;
    }
    function zr() {
      this.T = this.U = this.ka = this.height = this.width = 0, this.y = [], this.f = [], this.ea = [], this.Rc = this.fa = this.W = this.N = this.O = 0, this.ma = "void", this.put = "VP8IoPutHook", this.ac = "VP8IoSetupHook", this.bc = "VP8IoTeardownHook", this.ha = this.Kb = 0, this.data = [], this.hb = this.ib = this.da = this.o = this.j = this.va = this.v = this.Da = this.ob = this.w = 0, this.F = [], this.J = 0;
    }
    function Er() {
      var r = new Jr();
      return null != r && (r.a = 0, r.sc = "OK", r.cb = 0, r.Xb = 0, it || (it = qr)), r;
    }
    function Xr(r, a2, n2) {
      return 0 == r.a && (r.a = a2, r.sc = n2, r.cb = 0), 0;
    }
    function $r(r, a2, n2) {
      return 3 <= n2 && 157 == r[a2 + 0] && 1 == r[a2 + 1] && 42 == r[a2 + 2];
    }
    function Zr(r, a2) {
      if (null == r)
        return 0;
      if (r.a = 0, r.sc = "OK", null == a2)
        return Xr(r, 2, "null VP8Io passed to VP8GetHeaders()");
      var n2 = a2.data, i3 = a2.w, t2 = a2.ha;
      if (4 > t2)
        return Xr(r, 7, "Truncated header.");
      var f2 = n2[i3 + 0] | n2[i3 + 1] << 8 | n2[i3 + 2] << 16, u2 = r.Od;
      if (u2.Rb = !(1 & f2), u2.td = f2 >> 1 & 7, u2.yd = f2 >> 4 & 1, u2.ub = f2 >> 5, 3 < u2.td)
        return Xr(r, 3, "Incorrect keyframe parameters.");
      if (!u2.yd)
        return Xr(r, 4, "Frame not displayable.");
      i3 += 3, t2 -= 3;
      var c2 = r.Kc;
      if (u2.Rb) {
        if (7 > t2)
          return Xr(r, 7, "cannot parse picture header");
        if (!$r(n2, i3, t2))
          return Xr(r, 3, "Bad code word");
        c2.c = 16383 & (n2[i3 + 4] << 8 | n2[i3 + 3]), c2.Td = n2[i3 + 4] >> 6, c2.i = 16383 & (n2[i3 + 6] << 8 | n2[i3 + 5]), c2.Ud = n2[i3 + 6] >> 6, i3 += 7, t2 -= 7, r.za = c2.c + 15 >> 4, r.Ub = c2.i + 15 >> 4, a2.width = c2.c, a2.height = c2.i, a2.Da = 0, a2.j = 0, a2.v = 0, a2.va = a2.width, a2.o = a2.height, a2.da = 0, a2.ib = a2.width, a2.hb = a2.height, a2.U = a2.width, a2.T = a2.height, l((f2 = r.Pa).jb, 0, 255, f2.jb.length), e(null != (f2 = r.Qa)), f2.Cb = 0, f2.Bb = 0, f2.Fb = 1, l(f2.Zb, 0, 0, f2.Zb.length), l(f2.Lb, 0, 0, f2.Lb);
      }
      if (u2.ub > t2)
        return Xr(r, 7, "bad partition length");
      v2(f2 = r.m, n2, i3, u2.ub), i3 += u2.ub, t2 -= u2.ub, u2.Rb && (c2.Ld = B(f2), c2.Kd = B(f2)), c2 = r.Qa;
      var o2, s2 = r.Pa;
      if (e(null != f2), e(null != c2), c2.Cb = B(f2), c2.Cb) {
        if (c2.Bb = B(f2), B(f2)) {
          for (c2.Fb = B(f2), o2 = 0; 4 > o2; ++o2)
            c2.Zb[o2] = B(f2) ? g(f2, 7) : 0;
          for (o2 = 0; 4 > o2; ++o2)
            c2.Lb[o2] = B(f2) ? g(f2, 6) : 0;
        }
        if (c2.Bb)
          for (o2 = 0; 3 > o2; ++o2)
            s2.jb[o2] = B(f2) ? w(f2, 8) : 255;
      } else
        c2.Bb = 0;
      if (f2.Ka)
        return Xr(r, 3, "cannot parse segment header");
      if ((c2 = r.ed).zd = B(f2), c2.Tb = w(f2, 6), c2.wb = w(f2, 3), c2.Pc = B(f2), c2.Pc && B(f2)) {
        for (s2 = 0; 4 > s2; ++s2)
          B(f2) && (c2.vd[s2] = g(f2, 6));
        for (s2 = 0; 4 > s2; ++s2)
          B(f2) && (c2.od[s2] = g(f2, 6));
      }
      if (r.L = 0 == c2.Tb ? 0 : c2.zd ? 1 : 2, f2.Ka)
        return Xr(r, 3, "cannot parse filter header");
      var h3 = t2;
      if (t2 = o2 = i3, i3 = o2 + h3, c2 = h3, r.Xb = (1 << w(r.m, 2)) - 1, h3 < 3 * (s2 = r.Xb))
        n2 = 7;
      else {
        for (o2 += 3 * s2, c2 -= 3 * s2, h3 = 0; h3 < s2; ++h3) {
          var b3 = n2[t2 + 0] | n2[t2 + 1] << 8 | n2[t2 + 2] << 16;
          b3 > c2 && (b3 = c2), v2(r.Jc[+h3], n2, o2, b3), o2 += b3, c2 -= b3, t2 += 3;
        }
        v2(r.Jc[+s2], n2, o2, c2), n2 = o2 < i3 ? 0 : 5;
      }
      if (0 != n2)
        return Xr(r, n2, "cannot parse partitions");
      for (n2 = w(o2 = r.m, 7), t2 = B(o2) ? g(o2, 4) : 0, i3 = B(o2) ? g(o2, 4) : 0, c2 = B(o2) ? g(o2, 4) : 0, s2 = B(o2) ? g(o2, 4) : 0, o2 = B(o2) ? g(o2, 4) : 0, h3 = r.Qa, b3 = 0; 4 > b3; ++b3) {
        if (h3.Cb) {
          var d3 = h3.Zb[b3];
          h3.Fb || (d3 += n2);
        } else {
          if (0 < b3) {
            r.pb[b3] = r.pb[0];
            continue;
          }
          d3 = n2;
        }
        var P2 = r.pb[b3];
        P2.Sc[0] = at[xr(d3 + t2, 127)], P2.Sc[1] = nt[xr(d3 + 0, 127)], P2.Eb[0] = 2 * at[xr(d3 + i3, 127)], P2.Eb[1] = 101581 * nt[xr(d3 + c2, 127)] >> 16, 8 > P2.Eb[1] && (P2.Eb[1] = 8), P2.Qc[0] = at[xr(d3 + s2, 117)], P2.Qc[1] = nt[xr(d3 + o2, 127)], P2.lc = d3 + o2;
      }
      if (!u2.Rb)
        return Xr(r, 4, "Not a key frame.");
      for (B(f2), u2 = r.Pa, n2 = 0; 4 > n2; ++n2) {
        for (t2 = 0; 8 > t2; ++t2)
          for (i3 = 0; 3 > i3; ++i3)
            for (c2 = 0; 11 > c2; ++c2)
              s2 = G(f2, ct[n2][t2][i3][c2]) ? w(f2, 8) : ut[n2][t2][i3][c2], u2.Wc[n2][t2].Yb[i3][c2] = s2;
        for (t2 = 0; 17 > t2; ++t2)
          u2.Xc[n2][t2] = u2.Wc[n2][ot[t2]];
      }
      return r.kc = B(f2), r.kc && (r.Bd = w(f2, 8)), r.cb = 1;
    }
    function qr(r, a2, n2, i3, t2, e2, f2) {
      var u2 = a2[t2].Yb[n2];
      for (n2 = 0; 16 > t2; ++t2) {
        if (!G(r, u2[n2 + 0]))
          return t2;
        for (; !G(r, u2[n2 + 1]); )
          if (u2 = a2[++t2].Yb[0], n2 = 0, 16 == t2)
            return 16;
        var l2 = a2[t2 + 1].Yb;
        if (G(r, u2[n2 + 2])) {
          var c2 = r, o2 = 0;
          if (G(c2, (h3 = u2)[(s2 = n2) + 3]))
            if (G(c2, h3[s2 + 6])) {
              for (u2 = 0, s2 = 2 * (o2 = G(c2, h3[s2 + 8])) + (h3 = G(c2, h3[s2 + 9 + o2])), o2 = 0, h3 = tt[s2]; h3[u2]; ++u2)
                o2 += o2 + G(c2, h3[u2]);
              o2 += 3 + (8 << s2);
            } else
              G(c2, h3[s2 + 7]) ? (o2 = 7 + 2 * G(c2, 165), o2 += G(c2, 145)) : o2 = 5 + G(c2, 159);
          else
            o2 = G(c2, h3[s2 + 4]) ? 3 + G(c2, h3[s2 + 5]) : 2;
          u2 = l2[2];
        } else
          o2 = 1, u2 = l2[1];
        l2 = f2 + et[t2], 0 > (c2 = r).b && V(c2);
        var s2, h3 = c2.b, b3 = (s2 = c2.Ca >> 1) - (c2.I >> h3) >> 31;
        --c2.b, c2.Ca += b3, c2.Ca |= 1, c2.I -= (s2 + 1 & b3) << h3, e2[l2] = ((o2 ^ b3) - b3) * i3[(0 < t2) + 0];
      }
      return 16;
    }
    function Qr(r) {
      var a2 = r.rb[r.sb - 1];
      a2.la = 0, a2.Na = 0, l(r.zc, 0, 0, r.zc.length), r.ja = 0;
    }
    function ra(r, a2, n2, i3, t2) {
      t2 = r[a2 + n2 + 32 * i3] + (t2 >> 3), r[a2 + n2 + 32 * i3] = -256 & t2 ? 0 > t2 ? 0 : 255 : t2;
    }
    function aa(r, a2, n2, i3, t2, e2) {
      ra(r, a2, 0, n2, i3 + t2), ra(r, a2, 1, n2, i3 + e2), ra(r, a2, 2, n2, i3 - e2), ra(r, a2, 3, n2, i3 - t2);
    }
    function na(r) {
      return (20091 * r >> 16) + r;
    }
    function ia(r, a2, n2, i3) {
      var t2, e2 = 0, f2 = c(16);
      for (t2 = 0; 4 > t2; ++t2) {
        var u2 = r[a2 + 0] + r[a2 + 8], l2 = r[a2 + 0] - r[a2 + 8], o2 = (35468 * r[a2 + 4] >> 16) - na(r[a2 + 12]), s2 = na(r[a2 + 4]) + (35468 * r[a2 + 12] >> 16);
        f2[e2 + 0] = u2 + s2, f2[e2 + 1] = l2 + o2, f2[e2 + 2] = l2 - o2, f2[e2 + 3] = u2 - s2, e2 += 4, a2++;
      }
      for (t2 = e2 = 0; 4 > t2; ++t2)
        u2 = (r = f2[e2 + 0] + 4) + f2[e2 + 8], l2 = r - f2[e2 + 8], o2 = (35468 * f2[e2 + 4] >> 16) - na(f2[e2 + 12]), ra(n2, i3, 0, 0, u2 + (s2 = na(f2[e2 + 4]) + (35468 * f2[e2 + 12] >> 16))), ra(n2, i3, 1, 0, l2 + o2), ra(n2, i3, 2, 0, l2 - o2), ra(n2, i3, 3, 0, u2 - s2), e2++, i3 += 32;
    }
    function ta(r, a2, n2, i3) {
      var t2 = r[a2 + 0] + 4, e2 = 35468 * r[a2 + 4] >> 16, f2 = na(r[a2 + 4]), u2 = 35468 * r[a2 + 1] >> 16;
      aa(n2, i3, 0, t2 + f2, r = na(r[a2 + 1]), u2), aa(n2, i3, 1, t2 + e2, r, u2), aa(n2, i3, 2, t2 - e2, r, u2), aa(n2, i3, 3, t2 - f2, r, u2);
    }
    function ea(r, a2, n2, i3, t2) {
      ia(r, a2, n2, i3), t2 && ia(r, a2 + 16, n2, i3 + 4);
    }
    function fa(r, a2, n2, i3) {
      fi(r, a2 + 0, n2, i3, 1), fi(r, a2 + 32, n2, i3 + 128, 1);
    }
    function ua(r, a2, n2, i3) {
      var t2;
      for (r = r[a2 + 0] + 4, t2 = 0; 4 > t2; ++t2)
        for (a2 = 0; 4 > a2; ++a2)
          ra(n2, i3, a2, t2, r);
    }
    function la(r, a2, n2, i3) {
      r[a2 + 0] && ci(r, a2 + 0, n2, i3), r[a2 + 16] && ci(r, a2 + 16, n2, i3 + 4), r[a2 + 32] && ci(r, a2 + 32, n2, i3 + 128), r[a2 + 48] && ci(r, a2 + 48, n2, i3 + 128 + 4);
    }
    function ca(r, a2, n2, i3) {
      var t2, e2 = c(16);
      for (t2 = 0; 4 > t2; ++t2) {
        var f2 = r[a2 + 0 + t2] + r[a2 + 12 + t2], u2 = r[a2 + 4 + t2] + r[a2 + 8 + t2], l2 = r[a2 + 4 + t2] - r[a2 + 8 + t2], o2 = r[a2 + 0 + t2] - r[a2 + 12 + t2];
        e2[0 + t2] = f2 + u2, e2[8 + t2] = f2 - u2, e2[4 + t2] = o2 + l2, e2[12 + t2] = o2 - l2;
      }
      for (t2 = 0; 4 > t2; ++t2)
        f2 = (r = e2[0 + 4 * t2] + 3) + e2[3 + 4 * t2], u2 = e2[1 + 4 * t2] + e2[2 + 4 * t2], l2 = e2[1 + 4 * t2] - e2[2 + 4 * t2], o2 = r - e2[3 + 4 * t2], n2[i3 + 0] = f2 + u2 >> 3, n2[i3 + 16] = o2 + l2 >> 3, n2[i3 + 32] = f2 - u2 >> 3, n2[i3 + 48] = o2 - l2 >> 3, i3 += 64;
    }
    function oa(r, a2, n2) {
      var i3, t2 = a2 - 32, e2 = Fi, f2 = 255 - r[t2 - 1];
      for (i3 = 0; i3 < n2; ++i3) {
        var u2, l2 = e2, c2 = f2 + r[a2 - 1];
        for (u2 = 0; u2 < n2; ++u2)
          r[a2 + u2] = l2[c2 + r[t2 + u2]];
        a2 += 32;
      }
    }
    function sa(r, a2) {
      oa(r, a2, 4);
    }
    function ha(r, a2) {
      oa(r, a2, 8);
    }
    function ba(r, a2) {
      oa(r, a2, 16);
    }
    function da(r, a2) {
      var n2;
      for (n2 = 0; 16 > n2; ++n2)
        u(r, a2 + 32 * n2, r, a2 - 32, 16);
    }
    function va(r, a2) {
      var n2;
      for (n2 = 16; 0 < n2; --n2)
        l(r, a2, r[a2 - 1], 16), a2 += 32;
    }
    function wa(r, a2, n2) {
      var i3;
      for (i3 = 0; 16 > i3; ++i3)
        l(a2, n2 + 32 * i3, r, 16);
    }
    function ga(r, a2) {
      var n2, i3 = 16;
      for (n2 = 0; 16 > n2; ++n2)
        i3 += r[a2 - 1 + 32 * n2] + r[a2 + n2 - 32];
      wa(i3 >> 5, r, a2);
    }
    function Pa(r, a2) {
      var n2, i3 = 8;
      for (n2 = 0; 16 > n2; ++n2)
        i3 += r[a2 - 1 + 32 * n2];
      wa(i3 >> 4, r, a2);
    }
    function ka(r, a2) {
      var n2, i3 = 8;
      for (n2 = 0; 16 > n2; ++n2)
        i3 += r[a2 + n2 - 32];
      wa(i3 >> 4, r, a2);
    }
    function ma(r, a2) {
      wa(128, r, a2);
    }
    function pa(r, a2, n2) {
      return r + 2 * a2 + n2 + 2 >> 2;
    }
    function Aa(r, a2) {
      var n2, i3 = a2 - 32;
      for (i3 = new Uint8Array([
        pa(r[i3 - 1], r[i3 + 0], r[i3 + 1]),
        pa(r[i3 + 0], r[i3 + 1], r[i3 + 2]),
        pa(r[i3 + 1], r[i3 + 2], r[i3 + 3]),
        pa(r[i3 + 2], r[i3 + 3], r[i3 + 4])
      ]), n2 = 0; 4 > n2; ++n2)
        u(r, a2 + 32 * n2, i3, 0, i3.length);
    }
    function La(r, a2) {
      var n2 = r[a2 - 1], i3 = r[a2 - 1 + 32], t2 = r[a2 - 1 + 64], e2 = r[a2 - 1 + 96];
      C(r, a2 + 0, 16843009 * pa(r[a2 - 1 - 32], n2, i3)), C(r, a2 + 32, 16843009 * pa(n2, i3, t2)), C(r, a2 + 64, 16843009 * pa(i3, t2, e2)), C(r, a2 + 96, 16843009 * pa(t2, e2, e2));
    }
    function Ra(r, a2) {
      var n2, i3 = 4;
      for (n2 = 0; 4 > n2; ++n2)
        i3 += r[a2 + n2 - 32] + r[a2 - 1 + 32 * n2];
      for (i3 >>= 3, n2 = 0; 4 > n2; ++n2)
        l(r, a2 + 32 * n2, i3, 4);
    }
    function ya(r, a2) {
      var n2 = r[a2 - 1 + 0], i3 = r[a2 - 1 + 32], t2 = r[a2 - 1 + 64], e2 = r[a2 - 1 - 32], f2 = r[a2 + 0 - 32], u2 = r[a2 + 1 - 32], l2 = r[a2 + 2 - 32], c2 = r[a2 + 3 - 32];
      r[a2 + 0 + 96] = pa(i3, t2, r[a2 - 1 + 96]), r[a2 + 1 + 96] = r[a2 + 0 + 64] = pa(n2, i3, t2), r[a2 + 2 + 96] = r[a2 + 1 + 64] = r[a2 + 0 + 32] = pa(e2, n2, i3), r[a2 + 3 + 96] = r[a2 + 2 + 64] = r[a2 + 1 + 32] = r[a2 + 0 + 0] = pa(f2, e2, n2), r[a2 + 3 + 64] = r[a2 + 2 + 32] = r[a2 + 1 + 0] = pa(u2, f2, e2), r[a2 + 3 + 32] = r[a2 + 2 + 0] = pa(l2, u2, f2), r[a2 + 3 + 0] = pa(c2, l2, u2);
    }
    function _a(r, a2) {
      var n2 = r[a2 + 1 - 32], i3 = r[a2 + 2 - 32], t2 = r[a2 + 3 - 32], e2 = r[a2 + 4 - 32], f2 = r[a2 + 5 - 32], u2 = r[a2 + 6 - 32], l2 = r[a2 + 7 - 32];
      r[a2 + 0 + 0] = pa(r[a2 + 0 - 32], n2, i3), r[a2 + 1 + 0] = r[a2 + 0 + 32] = pa(n2, i3, t2), r[a2 + 2 + 0] = r[a2 + 1 + 32] = r[a2 + 0 + 64] = pa(i3, t2, e2), r[a2 + 3 + 0] = r[a2 + 2 + 32] = r[a2 + 1 + 64] = r[a2 + 0 + 96] = pa(t2, e2, f2), r[a2 + 3 + 32] = r[a2 + 2 + 64] = r[a2 + 1 + 96] = pa(e2, f2, u2), r[a2 + 3 + 64] = r[a2 + 2 + 96] = pa(f2, u2, l2), r[a2 + 3 + 96] = pa(u2, l2, l2);
    }
    function Va(r, a2) {
      var n2 = r[a2 - 1 + 0], i3 = r[a2 - 1 + 32], t2 = r[a2 - 1 + 64], e2 = r[a2 - 1 - 32], f2 = r[a2 + 0 - 32], u2 = r[a2 + 1 - 32], l2 = r[a2 + 2 - 32], c2 = r[a2 + 3 - 32];
      r[a2 + 0 + 0] = r[a2 + 1 + 64] = e2 + f2 + 1 >> 1, r[a2 + 1 + 0] = r[a2 + 2 + 64] = f2 + u2 + 1 >> 1, r[a2 + 2 + 0] = r[a2 + 3 + 64] = u2 + l2 + 1 >> 1, r[a2 + 3 + 0] = l2 + c2 + 1 >> 1, r[a2 + 0 + 96] = pa(t2, i3, n2), r[a2 + 0 + 64] = pa(i3, n2, e2), r[a2 + 0 + 32] = r[a2 + 1 + 96] = pa(n2, e2, f2), r[a2 + 1 + 32] = r[a2 + 2 + 96] = pa(e2, f2, u2), r[a2 + 2 + 32] = r[a2 + 3 + 96] = pa(f2, u2, l2), r[a2 + 3 + 32] = pa(u2, l2, c2);
    }
    function Ba(r, a2) {
      var n2 = r[a2 + 0 - 32], i3 = r[a2 + 1 - 32], t2 = r[a2 + 2 - 32], e2 = r[a2 + 3 - 32], f2 = r[a2 + 4 - 32], u2 = r[a2 + 5 - 32], l2 = r[a2 + 6 - 32], c2 = r[a2 + 7 - 32];
      r[a2 + 0 + 0] = n2 + i3 + 1 >> 1, r[a2 + 1 + 0] = r[a2 + 0 + 64] = i3 + t2 + 1 >> 1, r[a2 + 2 + 0] = r[a2 + 1 + 64] = t2 + e2 + 1 >> 1, r[a2 + 3 + 0] = r[a2 + 2 + 64] = e2 + f2 + 1 >> 1, r[a2 + 0 + 32] = pa(n2, i3, t2), r[a2 + 1 + 32] = r[a2 + 0 + 96] = pa(i3, t2, e2), r[a2 + 2 + 32] = r[a2 + 1 + 96] = pa(t2, e2, f2), r[a2 + 3 + 32] = r[a2 + 2 + 96] = pa(e2, f2, u2), r[a2 + 3 + 64] = pa(f2, u2, l2), r[a2 + 3 + 96] = pa(u2, l2, c2);
    }
    function Ga(r, a2) {
      var n2 = r[a2 - 1 + 0], i3 = r[a2 - 1 + 32], t2 = r[a2 - 1 + 64], e2 = r[a2 - 1 + 96];
      r[a2 + 0 + 0] = n2 + i3 + 1 >> 1, r[a2 + 2 + 0] = r[a2 + 0 + 32] = i3 + t2 + 1 >> 1, r[a2 + 2 + 32] = r[a2 + 0 + 64] = t2 + e2 + 1 >> 1, r[a2 + 1 + 0] = pa(n2, i3, t2), r[a2 + 3 + 0] = r[a2 + 1 + 32] = pa(i3, t2, e2), r[a2 + 3 + 32] = r[a2 + 1 + 64] = pa(t2, e2, e2), r[a2 + 3 + 64] = r[a2 + 2 + 64] = r[a2 + 0 + 96] = r[a2 + 1 + 96] = r[a2 + 2 + 96] = r[a2 + 3 + 96] = e2;
    }
    function Ca(r, a2) {
      var n2 = r[a2 - 1 + 0], i3 = r[a2 - 1 + 32], t2 = r[a2 - 1 + 64], e2 = r[a2 - 1 + 96], f2 = r[a2 - 1 - 32], u2 = r[a2 + 0 - 32], l2 = r[a2 + 1 - 32], c2 = r[a2 + 2 - 32];
      r[a2 + 0 + 0] = r[a2 + 2 + 32] = n2 + f2 + 1 >> 1, r[a2 + 0 + 32] = r[a2 + 2 + 64] = i3 + n2 + 1 >> 1, r[a2 + 0 + 64] = r[a2 + 2 + 96] = t2 + i3 + 1 >> 1, r[a2 + 0 + 96] = e2 + t2 + 1 >> 1, r[a2 + 3 + 0] = pa(u2, l2, c2), r[a2 + 2 + 0] = pa(f2, u2, l2), r[a2 + 1 + 0] = r[a2 + 3 + 32] = pa(n2, f2, u2), r[a2 + 1 + 32] = r[a2 + 3 + 64] = pa(i3, n2, f2), r[a2 + 1 + 64] = r[a2 + 3 + 96] = pa(t2, i3, n2), r[a2 + 1 + 96] = pa(e2, t2, i3);
    }
    function Ia(r, a2) {
      var n2;
      for (n2 = 0; 8 > n2; ++n2)
        u(r, a2 + 32 * n2, r, a2 - 32, 8);
    }
    function Ua(r, a2) {
      var n2;
      for (n2 = 0; 8 > n2; ++n2)
        l(r, a2, r[a2 - 1], 8), a2 += 32;
    }
    function Ma(r, a2, n2) {
      var i3;
      for (i3 = 0; 8 > i3; ++i3)
        l(a2, n2 + 32 * i3, r, 8);
    }
    function Fa(r, a2) {
      var n2, i3 = 8;
      for (n2 = 0; 8 > n2; ++n2)
        i3 += r[a2 + n2 - 32] + r[a2 - 1 + 32 * n2];
      Ma(i3 >> 4, r, a2);
    }
    function ja(r, a2) {
      var n2, i3 = 4;
      for (n2 = 0; 8 > n2; ++n2)
        i3 += r[a2 + n2 - 32];
      Ma(i3 >> 3, r, a2);
    }
    function Oa(r, a2) {
      var n2, i3 = 4;
      for (n2 = 0; 8 > n2; ++n2)
        i3 += r[a2 - 1 + 32 * n2];
      Ma(i3 >> 3, r, a2);
    }
    function Sa(r, a2) {
      Ma(128, r, a2);
    }
    function Ta(r, a2, n2) {
      var i3 = r[a2 - n2], t2 = r[a2 + 0], e2 = 3 * (t2 - i3) + Ui[1020 + r[a2 - 2 * n2] - r[a2 + n2]], f2 = Mi[112 + (e2 + 4 >> 3)];
      r[a2 - n2] = Fi[255 + i3 + Mi[112 + (e2 + 3 >> 3)]], r[a2 + 0] = Fi[255 + t2 - f2];
    }
    function Ha(r, a2, n2, i3) {
      var t2 = r[a2 + 0], e2 = r[a2 + n2];
      return ji[255 + r[a2 - 2 * n2] - r[a2 - n2]] > i3 || ji[255 + e2 - t2] > i3;
    }
    function Da(r, a2, n2, i3) {
      return 4 * ji[255 + r[a2 - n2] - r[a2 + 0]] + ji[255 + r[a2 - 2 * n2] - r[a2 + n2]] <= i3;
    }
    function Wa(r, a2, n2, i3, t2) {
      var e2 = r[a2 - 3 * n2], f2 = r[a2 - 2 * n2], u2 = r[a2 - n2], l2 = r[a2 + 0], c2 = r[a2 + n2], o2 = r[a2 + 2 * n2], s2 = r[a2 + 3 * n2];
      return 4 * ji[255 + u2 - l2] + ji[255 + f2 - c2] > i3 ? 0 : ji[255 + r[a2 - 4 * n2] - e2] <= t2 && ji[255 + e2 - f2] <= t2 && ji[255 + f2 - u2] <= t2 && ji[255 + s2 - o2] <= t2 && ji[255 + o2 - c2] <= t2 && ji[255 + c2 - l2] <= t2;
    }
    function Ka(r, a2, n2, i3) {
      var t2 = 2 * i3 + 1;
      for (i3 = 0; 16 > i3; ++i3)
        Da(r, a2 + i3, n2, t2) && Ta(r, a2 + i3, n2);
    }
    function Na(r, a2, n2, i3) {
      var t2 = 2 * i3 + 1;
      for (i3 = 0; 16 > i3; ++i3)
        Da(r, a2 + i3 * n2, 1, t2) && Ta(r, a2 + i3 * n2, 1);
    }
    function Ya(r, a2, n2, i3) {
      var t2;
      for (t2 = 3; 0 < t2; --t2)
        Ka(r, a2 += 4 * n2, n2, i3);
    }
    function Ja(r, a2, n2, i3) {
      var t2;
      for (t2 = 3; 0 < t2; --t2)
        Na(r, a2 += 4, n2, i3);
    }
    function xa(r, a2, n2, i3, t2, e2, f2, u2) {
      for (e2 = 2 * e2 + 1; 0 < t2--; ) {
        if (Wa(r, a2, n2, e2, f2))
          if (Ha(r, a2, n2, u2))
            Ta(r, a2, n2);
          else {
            var l2 = r, c2 = a2, o2 = n2, s2 = l2[c2 - 2 * o2], h3 = l2[c2 - o2], b3 = l2[c2 + 0], d3 = l2[c2 + o2], v3 = l2[c2 + 2 * o2], w2 = 27 * (P2 = Ui[1020 + 3 * (b3 - h3) + Ui[1020 + s2 - d3]]) + 63 >> 7, g2 = 18 * P2 + 63 >> 7, P2 = 9 * P2 + 63 >> 7;
            l2[c2 - 3 * o2] = Fi[255 + l2[c2 - 3 * o2] + P2], l2[c2 - 2 * o2] = Fi[255 + s2 + g2], l2[c2 - o2] = Fi[255 + h3 + w2], l2[c2 + 0] = Fi[255 + b3 - w2], l2[c2 + o2] = Fi[255 + d3 - g2], l2[c2 + 2 * o2] = Fi[255 + v3 - P2];
          }
        a2 += i3;
      }
    }
    function za(r, a2, n2, i3, t2, e2, f2, u2) {
      for (e2 = 2 * e2 + 1; 0 < t2--; ) {
        if (Wa(r, a2, n2, e2, f2))
          if (Ha(r, a2, n2, u2))
            Ta(r, a2, n2);
          else {
            var l2 = r, c2 = a2, o2 = n2, s2 = l2[c2 - o2], h3 = l2[c2 + 0], b3 = l2[c2 + o2], d3 = Mi[112 + (4 + (v3 = 3 * (h3 - s2)) >> 3)], v3 = Mi[112 + (v3 + 3 >> 3)], w2 = d3 + 1 >> 1;
            l2[c2 - 2 * o2] = Fi[255 + l2[c2 - 2 * o2] + w2], l2[c2 - o2] = Fi[255 + s2 + v3], l2[c2 + 0] = Fi[255 + h3 - d3], l2[c2 + o2] = Fi[255 + b3 - w2];
          }
        a2 += i3;
      }
    }
    function Ea(r, a2, n2, i3, t2, e2) {
      xa(r, a2, n2, 1, 16, i3, t2, e2);
    }
    function Xa(r, a2, n2, i3, t2, e2) {
      xa(r, a2, 1, n2, 16, i3, t2, e2);
    }
    function $a(r, a2, n2, i3, t2, e2) {
      var f2;
      for (f2 = 3; 0 < f2; --f2)
        za(r, a2 += 4 * n2, n2, 1, 16, i3, t2, e2);
    }
    function Za(r, a2, n2, i3, t2, e2) {
      var f2;
      for (f2 = 3; 0 < f2; --f2)
        za(r, a2 += 4, 1, n2, 16, i3, t2, e2);
    }
    function qa(r, a2, n2, i3, t2, e2, f2, u2) {
      xa(r, a2, t2, 1, 8, e2, f2, u2), xa(n2, i3, t2, 1, 8, e2, f2, u2);
    }
    function Qa(r, a2, n2, i3, t2, e2, f2, u2) {
      xa(r, a2, 1, t2, 8, e2, f2, u2), xa(n2, i3, 1, t2, 8, e2, f2, u2);
    }
    function rn(r, a2, n2, i3, t2, e2, f2, u2) {
      za(r, a2 + 4 * t2, t2, 1, 8, e2, f2, u2), za(n2, i3 + 4 * t2, t2, 1, 8, e2, f2, u2);
    }
    function an(r, a2, n2, i3, t2, e2, f2, u2) {
      za(r, a2 + 4, 1, t2, 8, e2, f2, u2), za(n2, i3 + 4, 1, t2, 8, e2, f2, u2);
    }
    function nn() {
      this.ba = new ur(), this.ec = [], this.cc = [], this.Mc = [], this.Dc = this.Nc = this.dc = this.fc = 0, this.Oa = new cr(), this.memory = 0, this.Ib = "OutputFunc", this.Jb = "OutputAlphaFunc", this.Nd = "OutputRowFunc";
    }
    function tn() {
      this.data = [], this.offset = this.kd = this.ha = this.w = 0, this.na = [], this.xa = this.gb = this.Ja = this.Sa = this.P = 0;
    }
    function en() {
      this.nc = this.Ea = this.b = this.hc = 0, this.K = [], this.w = 0;
    }
    function fn() {
      this.ua = 0, this.Wa = new O(), this.vb = new O(), this.md = this.xc = this.wc = 0, this.vc = [], this.Wb = 0, this.Ya = new d2(), this.yc = new h2();
    }
    function un() {
      this.xb = this.a = 0, this.l = new zr(), this.ca = new ur(), this.V = [], this.Ba = 0, this.Ta = [], this.Ua = 0, this.m = new A(), this.Pb = 0, this.wd = new A(), this.Ma = this.$ = this.C = this.i = this.c = this.xd = 0, this.s = new fn(), this.ab = 0, this.gc = o(4, en), this.Oc = 0;
    }
    function ln() {
      this.Lc = this.Z = this.$a = this.i = this.c = 0, this.l = new zr(), this.ic = 0, this.ca = [], this.tb = 0, this.qd = null, this.rd = 0;
    }
    function cn(r, a2, n2, i3, t2, e2, f2) {
      for (r = null == r ? 0 : r[a2 + 0], a2 = 0; a2 < f2; ++a2)
        t2[e2 + a2] = r + n2[i3 + a2] & 255, r = t2[e2 + a2];
    }
    function on(r, a2, n2, i3, t2, e2, f2) {
      var u2;
      if (null == r)
        cn(null, null, n2, i3, t2, e2, f2);
      else
        for (u2 = 0; u2 < f2; ++u2)
          t2[e2 + u2] = r[a2 + u2] + n2[i3 + u2] & 255;
    }
    function sn(r, a2, n2, i3, t2, e2, f2) {
      if (null == r)
        cn(null, null, n2, i3, t2, e2, f2);
      else {
        var u2, l2 = r[a2 + 0], c2 = l2, o2 = l2;
        for (u2 = 0; u2 < f2; ++u2)
          c2 = o2 + (l2 = r[a2 + u2]) - c2, o2 = n2[i3 + u2] + (-256 & c2 ? 0 > c2 ? 0 : 255 : c2) & 255, c2 = l2, t2[e2 + u2] = o2;
      }
    }
    function hn(r, a2, n2, i3) {
      var t2 = a2.width, f2 = a2.o;
      if (e(null != r && null != a2), 0 > n2 || 0 >= i3 || n2 + i3 > f2)
        return null;
      if (!r.Cc) {
        if (null == r.ga) {
          var l2;
          if (r.ga = new ln(), (l2 = null == r.ga) || (l2 = a2.width * a2.o, e(0 == r.Gb.length), r.Gb = c(l2), r.Uc = 0, null == r.Gb ? l2 = 0 : (r.mb = r.Gb, r.nb = r.Uc, r.rc = null, l2 = 1), l2 = !l2), !l2) {
            l2 = r.ga;
            var o2 = r.Fa, s2 = r.P, h3 = r.qc, b3 = r.mb, d3 = r.nb, v3 = s2 + 1, w2 = h3 - 1, g2 = l2.l;
            if (e(null != o2 && null != b3 && null != a2), wt[0] = null, wt[1] = cn, wt[2] = on, wt[3] = sn, l2.ca = b3, l2.tb = d3, l2.c = a2.width, l2.i = a2.height, e(0 < l2.c && 0 < l2.i), 1 >= h3)
              a2 = 0;
            else if (l2.$a = o2[s2 + 0] >> 0 & 3, l2.Z = o2[s2 + 0] >> 2 & 3, l2.Lc = o2[s2 + 0] >> 4 & 3, s2 = o2[s2 + 0] >> 6 & 3, 0 > l2.$a || 1 < l2.$a || 4 <= l2.Z || 1 < l2.Lc || s2)
              a2 = 0;
            else if (g2.put = dr, g2.ac = br, g2.bc = vr, g2.ma = l2, g2.width = a2.width, g2.height = a2.height, g2.Da = a2.Da, g2.v = a2.v, g2.va = a2.va, g2.j = a2.j, g2.o = a2.o, l2.$a)
              r: {
                e(1 == l2.$a), a2 = Gr();
                a:
                  for (; ; ) {
                    if (null == a2) {
                      a2 = 0;
                      break r;
                    }
                    if (e(null != l2), l2.mc = a2, a2.c = l2.c, a2.i = l2.i, a2.l = l2.l, a2.l.ma = l2, a2.l.width = l2.c, a2.l.height = l2.i, a2.a = 0, P(a2.m, o2, v3, w2), !Cr(l2.c, l2.i, 1, a2, null))
                      break a;
                    if (1 == a2.ab && 3 == a2.gc[0].hc && Rr(a2.s) ? (l2.ic = 1, o2 = a2.c * a2.i, a2.Ta = null, a2.Ua = 0, a2.V = c(o2), a2.Ba = 0, null == a2.V ? (a2.a = 1, a2 = 0) : a2 = 1) : (l2.ic = 0, a2 = Ir(a2, l2.c)), !a2)
                      break a;
                    a2 = 1;
                    break r;
                  }
                l2.mc = null, a2 = 0;
              }
            else
              a2 = w2 >= l2.c * l2.i;
            l2 = !a2;
          }
          if (l2)
            return null;
          1 != r.ga.Lc ? r.Ga = 0 : i3 = f2 - n2;
        }
        e(null != r.ga), e(n2 + i3 <= f2);
        r: {
          if (a2 = (o2 = r.ga).c, f2 = o2.l.o, 0 == o2.$a) {
            if (v3 = r.rc, w2 = r.Vc, g2 = r.Fa, s2 = r.P + 1 + n2 * a2, h3 = r.mb, b3 = r.nb + n2 * a2, e(s2 <= r.P + r.qc), 0 != o2.Z)
              for (e(null != wt[o2.Z]), l2 = 0; l2 < i3; ++l2)
                wt[o2.Z](v3, w2, g2, s2, h3, b3, a2), v3 = h3, w2 = b3, b3 += a2, s2 += a2;
            else
              for (l2 = 0; l2 < i3; ++l2)
                u(h3, b3, g2, s2, a2), v3 = h3, w2 = b3, b3 += a2, s2 += a2;
            r.rc = v3, r.Vc = w2;
          } else {
            if (e(null != o2.mc), a2 = n2 + i3, e(null != (l2 = o2.mc)), e(a2 <= l2.i), l2.C >= a2)
              a2 = 1;
            else if (o2.ic || gn(), o2.ic) {
              o2 = l2.V, v3 = l2.Ba, w2 = l2.c;
              var k2 = l2.i, m2 = (g2 = 1, s2 = l2.$ / w2, h3 = l2.$ % w2, b3 = l2.m, d3 = l2.s, l2.$), p2 = w2 * k2, A2 = w2 * a2, L2 = d3.wc, y2 = m2 < A2 ? pr(d3, h3, s2) : null;
              e(m2 <= p2), e(a2 <= k2), e(Rr(d3));
              a:
                for (; ; ) {
                  for (; !b3.h && m2 < A2; ) {
                    if (h3 & L2 || (y2 = pr(d3, h3, s2)), e(null != y2), _(b3), 256 > (k2 = kr(y2.G[0], y2.H[0], b3)))
                      o2[v3 + m2] = k2, ++m2, ++h3 >= w2 && (h3 = 0, ++s2 <= a2 && !(s2 % 16) && _r(l2, s2));
                    else {
                      if (!(280 > k2)) {
                        g2 = 0;
                        break a;
                      }
                      k2 = gr(k2 - 256, b3);
                      var V2, B2 = kr(y2.G[4], y2.H[4], b3);
                      if (_(b3), !(m2 >= (B2 = Pr(w2, B2 = gr(B2, b3))) && p2 - m2 >= k2)) {
                        g2 = 0;
                        break a;
                      }
                      for (V2 = 0; V2 < k2; ++V2)
                        o2[v3 + m2 + V2] = o2[v3 + m2 + V2 - B2];
                      for (m2 += k2, h3 += k2; h3 >= w2; )
                        h3 -= w2, ++s2 <= a2 && !(s2 % 16) && _r(l2, s2);
                      m2 < A2 && h3 & L2 && (y2 = pr(d3, h3, s2));
                    }
                    e(b3.h == R(b3));
                  }
                  _r(l2, s2 > a2 ? a2 : s2);
                  break a;
                }
              !g2 || b3.h && m2 < p2 ? (g2 = 0, l2.a = b3.h ? 5 : 3) : l2.$ = m2, a2 = g2;
            } else
              a2 = Vr(l2, l2.V, l2.Ba, l2.c, l2.i, a2, Ur);
            if (!a2) {
              i3 = 0;
              break r;
            }
          }
          n2 + i3 >= f2 && (r.Cc = 1), i3 = 1;
        }
        if (!i3)
          return null;
        if (r.Cc && (null != (i3 = r.ga) && (i3.mc = null), r.ga = null, 0 < r.Ga)) {
          console.info(`Stickers decoder: SWebPDequantizeLevels`);
          return null;
        }
      }
      return r.nb + n2 * t2;
    }
    function bn(r, a2, n2, i3, t2, e2) {
      for (; 0 < t2--; ) {
        var f2, u2 = r, l2 = a2 + (n2 ? 1 : 0), c2 = r, o2 = a2 + (n2 ? 0 : 3);
        for (f2 = 0; f2 < i3; ++f2) {
          var s2 = c2[o2 + 4 * f2];
          255 != s2 && (s2 *= 32897, u2[l2 + 4 * f2 + 0] = u2[l2 + 4 * f2 + 0] * s2 >> 23, u2[l2 + 4 * f2 + 1] = u2[l2 + 4 * f2 + 1] * s2 >> 23, u2[l2 + 4 * f2 + 2] = u2[l2 + 4 * f2 + 2] * s2 >> 23);
        }
        a2 += e2;
      }
    }
    function dn(r, a2, n2, i3, t2) {
      for (; 0 < i3--; ) {
        var e2;
        for (e2 = 0; e2 < n2; ++e2) {
          var f2 = r[a2 + 2 * e2 + 0], u2 = 15 & (c2 = r[a2 + 2 * e2 + 1]), l2 = 4369 * u2, c2 = (240 & c2 | c2 >> 4) * l2 >> 16;
          r[a2 + 2 * e2 + 0] = (240 & f2 | f2 >> 4) * l2 >> 16 & 240 | (15 & f2 | f2 << 4) * l2 >> 16 >> 4 & 15, r[a2 + 2 * e2 + 1] = 240 & c2 | u2;
        }
        a2 += t2;
      }
    }
    function vn(r, a2, n2, i3, t2, e2, f2, u2) {
      var l2, c2, o2 = 255;
      for (c2 = 0; c2 < t2; ++c2) {
        for (l2 = 0; l2 < i3; ++l2) {
          var s2 = r[a2 + l2];
          e2[f2 + 4 * l2] = s2, o2 &= s2;
        }
        a2 += n2, f2 += u2;
      }
      return 255 != o2;
    }
    function wn(r, a2, n2, i3, t2) {
      var e2;
      for (e2 = 0; e2 < t2; ++e2)
        n2[i3 + e2] = r[a2 + e2] >> 8;
    }
    function gn() {
      Li = bn, Ri = dn, yi = vn, _i = wn;
    }
    function Pn(r, a2, n2) {
      t[r] = function(r2, i3, t2, f2, u2, l2, c2, o2, s2, h3, b3, d3, v3, w2, g2, P2, k2) {
        var m2, p2 = k2 - 1 >> 1, A2 = u2[l2 + 0] | c2[o2 + 0] << 16, L2 = s2[h3 + 0] | b3[d3 + 0] << 16;
        e(null != r2);
        var R2 = 3 * A2 + L2 + 131074 >> 2;
        for (a2(r2[i3 + 0], 255 & R2, R2 >> 16, v3, w2), null != t2 && (R2 = 3 * L2 + A2 + 131074 >> 2, a2(t2[f2 + 0], 255 & R2, R2 >> 16, g2, P2)), m2 = 1; m2 <= p2; ++m2) {
          var y2 = u2[l2 + m2] | c2[o2 + m2] << 16, _2 = s2[h3 + m2] | b3[d3 + m2] << 16, V2 = A2 + y2 + L2 + _2 + 524296, B2 = V2 + 2 * (y2 + L2) >> 3;
          R2 = B2 + A2 >> 1, A2 = (V2 = V2 + 2 * (A2 + _2) >> 3) + y2 >> 1, a2(r2[i3 + 2 * m2 - 1], 255 & R2, R2 >> 16, v3, w2 + (2 * m2 - 1) * n2), a2(r2[i3 + 2 * m2 - 0], 255 & A2, A2 >> 16, v3, w2 + (2 * m2 - 0) * n2), null != t2 && (R2 = V2 + L2 >> 1, A2 = B2 + _2 >> 1, a2(t2[f2 + 2 * m2 - 1], 255 & R2, R2 >> 16, g2, P2 + (2 * m2 - 1) * n2), a2(t2[f2 + 2 * m2 + 0], 255 & A2, A2 >> 16, g2, P2 + (2 * m2 + 0) * n2)), A2 = y2, L2 = _2;
        }
        1 & k2 || (R2 = 3 * A2 + L2 + 131074 >> 2, a2(r2[i3 + k2 - 1], 255 & R2, R2 >> 16, v3, w2 + (k2 - 1) * n2), null != t2 && (R2 = 3 * L2 + A2 + 131074 >> 2, a2(t2[f2 + k2 - 1], 255 & R2, R2 >> 16, g2, P2 + (k2 - 1) * n2)));
      };
    }
    function kn() {
      gt[Oi] = Pt, gt[Si] = mt, gt[Ti] = kt, gt[Hi] = pt, gt[Di] = At, gt[Wi] = Lt, gt[Ki] = Rt, gt[Ni] = mt, gt[Yi] = pt, gt[Ji] = At, gt[xi] = Lt;
    }
    function mn(r) {
      return r & -16384 ? 0 > r ? 0 : 255 : r >> Gt;
    }
    function pn(r, a2) {
      return mn((19077 * r >> 8) + (26149 * a2 >> 8) - 14234);
    }
    function An(r, a2, n2) {
      return mn((19077 * r >> 8) - (6419 * a2 >> 8) - (13320 * n2 >> 8) + 8708);
    }
    function Ln(r, a2) {
      return mn((19077 * r >> 8) + (33050 * a2 >> 8) - 17685);
    }
    function Rn(r, a2, n2, i3, t2) {
      i3[t2 + 0] = pn(r, n2), i3[t2 + 1] = An(r, a2, n2), i3[t2 + 2] = Ln(r, a2);
    }
    function yn(r, a2, n2, i3, t2) {
      i3[t2 + 0] = Ln(r, a2), i3[t2 + 1] = An(r, a2, n2), i3[t2 + 2] = pn(r, n2);
    }
    function _n(r, a2, n2, i3, t2) {
      var e2 = An(r, a2, n2);
      a2 = e2 << 3 & 224 | Ln(r, a2) >> 3, i3[t2 + 0] = 248 & pn(r, n2) | e2 >> 5, i3[t2 + 1] = a2;
    }
    function Vn(r, a2, n2, i3, t2) {
      var e2 = 240 & Ln(r, a2) | 15;
      i3[t2 + 0] = 240 & pn(r, n2) | An(r, a2, n2) >> 4, i3[t2 + 1] = e2;
    }
    function Bn(r, a2, n2, i3, t2) {
      i3[t2 + 0] = 255, Rn(r, a2, n2, i3, t2 + 1);
    }
    function Gn(r, a2, n2, i3, t2) {
      yn(r, a2, n2, i3, t2), i3[t2 + 3] = 255;
    }
    function Cn(r, a2, n2, i3, t2) {
      Rn(r, a2, n2, i3, t2), i3[t2 + 3] = 255;
    }
    function xr(r, a2) {
      return 0 > r ? 0 : r > a2 ? a2 : r;
    }
    function In(r, a2, n2) {
      t[r] = function(r2, i3, t2, e2, f2, u2, l2, c2, o2) {
        for (var s2 = c2 + (-2 & o2) * n2; c2 != s2; )
          a2(r2[i3 + 0], t2[e2 + 0], f2[u2 + 0], l2, c2), a2(r2[i3 + 1], t2[e2 + 0], f2[u2 + 0], l2, c2 + n2), i3 += 2, ++e2, ++u2, c2 += 2 * n2;
        1 & o2 && a2(r2[i3 + 0], t2[e2 + 0], f2[u2 + 0], l2, c2);
      };
    }
    function Un(r, a2, n2) {
      return 0 == n2 ? 0 == r ? 0 == a2 ? 6 : 5 : 0 == a2 ? 4 : 0 : n2;
    }
    function Mn(r, a2, n2, i3, t2) {
      switch (r >>> 30) {
        case 3:
          fi(a2, n2, i3, t2, 0);
          break;
        case 2:
          ui(a2, n2, i3, t2);
          break;
        case 1:
          ci(a2, n2, i3, t2);
      }
    }
    function Fn(r, a2) {
      var n2, i3, t2 = a2.M, e2 = a2.Nb, f2 = r.oc, c2 = r.pc + 40, o2 = r.oc, s2 = r.pc + 584, h3 = r.oc, b3 = r.pc + 600;
      for (n2 = 0; 16 > n2; ++n2)
        f2[c2 + 32 * n2 - 1] = 129;
      for (n2 = 0; 8 > n2; ++n2)
        o2[s2 + 32 * n2 - 1] = 129, h3[b3 + 32 * n2 - 1] = 129;
      for (0 < t2 ? f2[c2 - 1 - 32] = o2[s2 - 1 - 32] = h3[b3 - 1 - 32] = 129 : (l(f2, c2 - 32 - 1, 127, 21), l(o2, s2 - 32 - 1, 127, 9), l(h3, b3 - 32 - 1, 127, 9)), i3 = 0; i3 < r.za; ++i3) {
        var d3 = a2.ya[a2.aa + i3];
        if (0 < i3) {
          for (n2 = -1; 16 > n2; ++n2)
            u(f2, c2 + 32 * n2 - 4, f2, c2 + 32 * n2 + 12, 4);
          for (n2 = -1; 8 > n2; ++n2)
            u(o2, s2 + 32 * n2 - 4, o2, s2 + 32 * n2 + 4, 4), u(h3, b3 + 32 * n2 - 4, h3, b3 + 32 * n2 + 4, 4);
        }
        var v3 = r.Gd, w2 = r.Hd + i3, g2 = d3.ad, P2 = d3.Hc;
        if (0 < t2 && (u(f2, c2 - 32, v3[w2].y, 0, 16), u(o2, s2 - 32, v3[w2].f, 0, 8), u(h3, b3 - 32, v3[w2].ea, 0, 8)), d3.Za) {
          var k2 = f2, m2 = c2 - 32 + 16;
          for (0 < t2 && (i3 >= r.za - 1 ? l(k2, m2, v3[w2].y[15], 4) : u(k2, m2, v3[w2 + 1].y, 0, 4)), n2 = 0; 4 > n2; n2++)
            k2[m2 + 128 + n2] = k2[m2 + 256 + n2] = k2[m2 + 384 + n2] = k2[m2 + 0 + n2];
          for (n2 = 0; 16 > n2; ++n2, P2 <<= 2)
            k2 = f2, m2 = c2 + Tt[n2], ht[d3.Ob[n2]](k2, m2), Mn(P2, g2, 16 * +n2, k2, m2);
        } else if (k2 = Un(i3, t2, d3.Ob[0]), st[k2](f2, c2), 0 != P2)
          for (n2 = 0; 16 > n2; ++n2, P2 <<= 2)
            Mn(P2, g2, 16 * +n2, f2, c2 + Tt[n2]);
        for (n2 = d3.Gc, k2 = Un(i3, t2, d3.Dd), bt[k2](o2, s2), bt[k2](h3, b3), P2 = g2, k2 = o2, m2 = s2, 255 & (d3 = n2 >> 0) && (170 & d3 ? li(P2, 256, k2, m2) : oi(P2, 256, k2, m2)), d3 = h3, P2 = b3, 255 & (n2 >>= 8) && (170 & n2 ? li(g2, 320, d3, P2) : oi(g2, 320, d3, P2)), t2 < r.Ub - 1 && (u(v3[w2].y, 0, f2, c2 + 480, 16), u(v3[w2].f, 0, o2, s2 + 224, 8), u(v3[w2].ea, 0, h3, b3 + 224, 8)), n2 = 8 * e2 * r.B, v3 = r.sa, w2 = r.ta + 16 * i3 + 16 * e2 * r.R, g2 = r.qa, d3 = r.ra + 8 * i3 + n2, P2 = r.Ha, k2 = r.Ia + 8 * i3 + n2, n2 = 0; 16 > n2; ++n2)
          u(v3, w2 + n2 * r.R, f2, c2 + 32 * n2, 16);
        for (n2 = 0; 8 > n2; ++n2)
          u(g2, d3 + n2 * r.B, o2, s2 + 32 * n2, 8), u(P2, k2 + n2 * r.B, h3, b3 + 32 * n2, 8);
      }
    }
    function jn(r, a2, n2, i3, t2, u2, l2, c2, o2) {
      var s2 = [0], h3 = [0], b3 = 0, d3 = null != o2 ? o2.kd : 0, v3 = null != o2 ? o2 : new tn();
      if (null == r || 12 > n2)
        return 7;
      v3.data = r, v3.w = a2, v3.ha = n2, a2 = [a2], n2 = [n2], v3.gb = [v3.gb];
      r: {
        var w2 = a2, g2 = n2, k2 = v3.gb;
        if (e(null != r), e(null != g2), e(null != k2), k2[0] = 0, 12 <= g2[0] && !f(r, w2[0], "RIFF")) {
          if (f(r, w2[0] + 8, "WEBP")) {
            k2 = 3;
            break r;
          }
          var m2 = M(r, w2[0] + 4);
          if (12 > m2 || 4294967286 < m2) {
            k2 = 3;
            break r;
          }
          if (d3 && m2 > g2[0] - 8) {
            k2 = 7;
            break r;
          }
          k2[0] = m2, w2[0] += 12, g2[0] -= 12;
        }
        k2 = 0;
      }
      if (0 != k2)
        return k2;
      for (m2 = 0 < v3.gb[0], n2 = n2[0]; ; ) {
        r: {
          var p2 = r;
          g2 = a2, k2 = n2;
          var L2 = s2, R2 = h3, y2 = w2 = [0];
          if ((B2 = b3 = [b3])[0] = 0, 8 > k2[0])
            k2 = 7;
          else {
            if (!f(p2, g2[0], "VP8X")) {
              if (10 != M(p2, g2[0] + 4)) {
                k2 = 3;
                break r;
              }
              if (18 > k2[0]) {
                k2 = 7;
                break r;
              }
              var _2 = M(p2, g2[0] + 8), V2 = 1 + U(p2, g2[0] + 12);
              if (2147483648 <= V2 * (p2 = 1 + U(p2, g2[0] + 15))) {
                k2 = 3;
                break r;
              }
              null != y2 && (y2[0] = _2), null != L2 && (L2[0] = V2), null != R2 && (R2[0] = p2), g2[0] += 18, k2[0] -= 18, B2[0] = 1;
            }
            k2 = 0;
          }
        }
        if (b3 = b3[0], w2 = w2[0], 0 != k2)
          return k2;
        if (g2 = !!(2 & w2), !m2 && b3)
          return 3;
        if (null != u2 && (u2[0] = !!(16 & w2)), null != l2 && (l2[0] = g2), null != c2 && (c2[0] = 0), l2 = s2[0], w2 = h3[0], b3 && g2 && null == o2) {
          k2 = 0;
          break;
        }
        if (4 > n2) {
          k2 = 7;
          break;
        }
        if (m2 && b3 || !m2 && !b3 && !f(r, a2[0], "ALPH")) {
          n2 = [n2], v3.na = [v3.na], v3.P = [v3.P], v3.Sa = [v3.Sa];
          r: {
            _2 = r, k2 = a2, m2 = n2;
            var B2 = v3.gb;
            L2 = v3.na, R2 = v3.P, y2 = v3.Sa, V2 = 22, e(null != _2), e(null != m2), p2 = k2[0];
            var G2 = m2[0];
            for (e(null != L2), e(null != y2), L2[0] = null, R2[0] = null, y2[0] = 0; ; ) {
              if (k2[0] = p2, m2[0] = G2, 8 > G2) {
                k2 = 7;
                break r;
              }
              var C2 = M(_2, p2 + 4);
              if (4294967286 < C2) {
                k2 = 3;
                break r;
              }
              var I2 = 8 + C2 + 1 & -2;
              if (V2 += I2, 0 < B2 && V2 > B2) {
                k2 = 3;
                break r;
              }
              if (!f(_2, p2, "VP8 ") || !f(_2, p2, "VP8L")) {
                k2 = 0;
                break r;
              }
              if (G2[0] < I2) {
                k2 = 7;
                break r;
              }
              f(_2, p2, "ALPH") || (L2[0] = _2, R2[0] = p2 + 8, y2[0] = C2), p2 += I2, G2 -= I2;
            }
          }
          if (n2 = n2[0], v3.na = v3.na[0], v3.P = v3.P[0], v3.Sa = v3.Sa[0], 0 != k2)
            break;
        }
        n2 = [n2], v3.Ja = [v3.Ja], v3.xa = [v3.xa];
        r:
          if (B2 = r, k2 = a2, m2 = n2, L2 = v3.gb[0], R2 = v3.Ja, y2 = v3.xa, _2 = k2[0], p2 = !f(B2, _2, "VP8 "), V2 = !f(B2, _2, "VP8L"), e(null != B2), e(null != m2), e(null != R2), e(null != y2), 8 > m2[0])
            k2 = 7;
          else {
            if (p2 || V2) {
              if (B2 = M(B2, _2 + 4), 12 <= L2 && B2 > L2 - 12) {
                k2 = 3;
                break r;
              }
              if (d3 && B2 > m2[0] - 8) {
                k2 = 7;
                break r;
              }
              R2[0] = B2, k2[0] += 8, m2[0] -= 8, y2[0] = V2;
            } else
              y2[0] = 5 <= m2[0] && 47 == B2[_2 + 0] && !(B2[_2 + 4] >> 5), R2[0] = m2[0];
            k2 = 0;
          }
        if (n2 = n2[0], v3.Ja = v3.Ja[0], v3.xa = v3.xa[0], a2 = a2[0], 0 != k2)
          break;
        if (4294967286 < v3.Ja)
          return 3;
        if (null == c2 || g2 || (c2[0] = v3.xa ? 2 : 1), l2 = [l2], w2 = [w2], v3.xa) {
          if (5 > n2) {
            k2 = 7;
            break;
          }
          c2 = l2, d3 = w2, g2 = u2, null == r || 5 > n2 ? r = 0 : 5 <= n2 && 47 == r[a2 + 0] && !(r[a2 + 4] >> 5) ? (m2 = [0], B2 = [0], L2 = [0], P(R2 = new A(), r, a2, n2), wr(R2, m2, B2, L2) ? (null != c2 && (c2[0] = m2[0]), null != d3 && (d3[0] = B2[0]), null != g2 && (g2[0] = L2[0]), r = 1) : r = 0) : r = 0;
        } else {
          if (10 > n2) {
            k2 = 7;
            break;
          }
          c2 = w2, null == r || 10 > n2 || !$r(r, a2 + 3, n2 - 3) ? r = 0 : (d3 = r[a2 + 0] | r[a2 + 1] << 8 | r[a2 + 2] << 16, g2 = 16383 & (r[a2 + 7] << 8 | r[a2 + 6]), r = 16383 & (r[a2 + 9] << 8 | r[a2 + 8]), 1 & d3 || 3 < (d3 >> 1 & 7) || !(d3 >> 4 & 1) || d3 >> 5 >= v3.Ja || !g2 || !r ? r = 0 : (l2 && (l2[0] = g2), c2 && (c2[0] = r), r = 1));
        }
        if (!r)
          return 3;
        if (l2 = l2[0], w2 = w2[0], b3 && (s2[0] != l2 || h3[0] != w2))
          return 3;
        null != o2 && (o2[0] = v3, o2.offset = a2 - o2.w, e(4294967286 > a2 - o2.w), e(o2.offset == o2.ha - n2));
        break;
      }
      return 0 == k2 || 7 == k2 && b3 && null == o2 ? (null != u2 && (u2[0] |= null != v3.na && 0 < v3.na.length), null != i3 && (i3[0] = l2), null != t2 && (t2[0] = w2), 0) : k2;
    }
    function On(r, a2, n2) {
      var i3 = a2.width, t2 = a2.height, e2 = 0, f2 = 0, u2 = i3, l2 = t2;
      if (a2.Da = null != r && 0 < r.Da, a2.Da && (u2 = r.cd, l2 = r.bd, e2 = r.v, f2 = r.j, 11 > n2 || (e2 &= -2, f2 &= -2), 0 > e2 || 0 > f2 || 0 >= u2 || 0 >= l2 || e2 + u2 > i3 || f2 + l2 > t2))
        return 0;
      if (a2.v = e2, a2.j = f2, a2.va = e2 + u2, a2.o = f2 + l2, a2.U = u2, a2.T = l2, a2.da = null != r && 0 < r.da, a2.da) {
        if (!S(u2, l2, n2 = [r.ib], e2 = [r.hb]))
          return 0;
        a2.ib = n2[0], a2.hb = e2[0];
      }
      return a2.ob = null != r && r.ob, a2.Kb = null == r || !r.Sd, a2.da && (a2.ob = a2.ib < 3 * i3 / 4 && a2.hb < 3 * t2 / 4, a2.Kb = 0), 1;
    }
    function Sn(r) {
      if (null == r)
        return 2;
      if (11 > r.S) {
        var a2 = r.f.RGBA;
        a2.fb += (r.height - 1) * a2.A, a2.A = -a2.A;
      } else
        a2 = r.f.kb, r = r.height, a2.O += (r - 1) * a2.fa, a2.fa = -a2.fa, a2.N += (r - 1 >> 1) * a2.Ab, a2.Ab = -a2.Ab, a2.W += (r - 1 >> 1) * a2.Db, a2.Db = -a2.Db, null != a2.F && (a2.J += (r - 1) * a2.lb, a2.lb = -a2.lb);
      return 0;
    }
    function Tn(r, a2, n2, i3) {
      if (null == i3 || 0 >= r || 0 >= a2)
        return 2;
      if (null != n2) {
        if (n2.Da) {
          var t2 = n2.cd, e2 = n2.bd, f2 = -2 & n2.v, u2 = -2 & n2.j;
          if (0 > f2 || 0 > u2 || 0 >= t2 || 0 >= e2 || f2 + t2 > r || u2 + e2 > a2)
            return 2;
          r = t2, a2 = e2;
        }
        if (n2.da) {
          if (!S(r, a2, t2 = [n2.ib], e2 = [n2.hb]))
            return 2;
          r = t2[0], a2 = e2[0];
        }
      }
      i3.width = r, i3.height = a2;
      r: {
        var l2 = i3.width, o2 = i3.height;
        if (r = i3.S, 0 >= l2 || 0 >= o2 || !(r >= Oi && 13 > r))
          r = 2;
        else {
          if (0 >= i3.Rd && null == i3.sd) {
            f2 = e2 = t2 = a2 = 0;
            var s2 = (u2 = l2 * Wt[r]) * o2;
            if (11 > r || (e2 = (o2 + 1) / 2 * (a2 = (l2 + 1) / 2), 12 == r && (f2 = (t2 = l2) * o2)), null == (o2 = c(s2 + 2 * e2 + f2))) {
              r = 1;
              break r;
            }
            i3.sd = o2, 11 > r ? ((l2 = i3.f.RGBA).eb = o2, l2.fb = 0, l2.A = u2, l2.size = s2) : ((l2 = i3.f.kb).y = o2, l2.O = 0, l2.fa = u2, l2.Fd = s2, l2.f = o2, l2.N = 0 + s2, l2.Ab = a2, l2.Cd = e2, l2.ea = o2, l2.W = 0 + s2 + e2, l2.Db = a2, l2.Ed = e2, 12 == r && (l2.F = o2, l2.J = 0 + s2 + 2 * e2), l2.Tc = f2, l2.lb = t2);
          }
          if (a2 = 1, t2 = i3.S, e2 = i3.width, f2 = i3.height, t2 >= Oi && 13 > t2)
            if (11 > t2)
              r = i3.f.RGBA, a2 &= (u2 = Math.abs(r.A)) * (f2 - 1) + e2 <= r.size, a2 &= u2 >= e2 * Wt[t2], a2 &= null != r.eb;
            else {
              r = i3.f.kb, u2 = (e2 + 1) / 2, s2 = (f2 + 1) / 2, l2 = Math.abs(r.fa), o2 = Math.abs(r.Ab);
              var h3 = Math.abs(r.Db), b3 = Math.abs(r.lb), d3 = b3 * (f2 - 1) + e2;
              a2 &= l2 * (f2 - 1) + e2 <= r.Fd, a2 &= o2 * (s2 - 1) + u2 <= r.Cd, a2 = (a2 &= h3 * (s2 - 1) + u2 <= r.Ed) & l2 >= e2 & o2 >= u2 & h3 >= u2, a2 &= null != r.y, a2 &= null != r.f, a2 &= null != r.ea, 12 == t2 && (a2 &= b3 >= e2, a2 &= d3 <= r.Tc, a2 &= null != r.F);
            }
          else
            a2 = 0;
          r = a2 ? 0 : 2;
        }
      }
      return 0 != r || null != n2 && n2.fd && (r = Sn(i3)), r;
    }
    var Hn = 64, Dn = [
      0,
      1,
      3,
      7,
      15,
      31,
      63,
      127,
      255,
      511,
      1023,
      2047,
      4095,
      8191,
      16383,
      32767,
      65535,
      131071,
      262143,
      524287,
      1048575,
      2097151,
      4194303,
      8388607,
      16777215
    ], Wn = 24, Kn = 32, Nn = 8, Yn = [
      0,
      0,
      1,
      1,
      2,
      2,
      2,
      2,
      3,
      3,
      3,
      3,
      3,
      3,
      3,
      3,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      4,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      5,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      6,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7,
      7
    ];
    D("Predictor0", "PredictorAdd0"), t.Predictor0 = function() {
      return 4278190080;
    }, t.Predictor1 = function(r) {
      return r;
    }, t.Predictor2 = function(r, a2, n2) {
      return a2[n2 + 0];
    }, t.Predictor3 = function(r, a2, n2) {
      return a2[n2 + 1];
    }, t.Predictor4 = function(r, a2, n2) {
      return a2[n2 - 1];
    }, t.Predictor5 = function(r, a2, n2) {
      return K(K(r, a2[n2 + 1]), a2[n2 + 0]);
    }, t.Predictor6 = function(r, a2, n2) {
      return K(r, a2[n2 - 1]);
    }, t.Predictor7 = function(r, a2, n2) {
      return K(r, a2[n2 + 0]);
    }, t.Predictor8 = function(r, a2, n2) {
      return K(a2[n2 - 1], a2[n2 + 0]);
    }, t.Predictor9 = function(r, a2, n2) {
      return K(a2[n2 + 0], a2[n2 + 1]);
    }, t.Predictor10 = function(r, a2, n2) {
      return K(K(r, a2[n2 - 1]), K(a2[n2 + 0], a2[n2 + 1]));
    }, t.Predictor11 = function(r, a2, n2) {
      var i3 = a2[n2 + 0];
      return 0 >= J(i3 >> 24 & 255, r >> 24 & 255, (a2 = a2[n2 - 1]) >> 24 & 255) + J(i3 >> 16 & 255, r >> 16 & 255, a2 >> 16 & 255) + J(i3 >> 8 & 255, r >> 8 & 255, a2 >> 8 & 255) + J(255 & i3, 255 & r, 255 & a2) ? i3 : r;
    }, t.Predictor12 = function(r, a2, n2) {
      var i3 = a2[n2 + 0];
      return (N((r >> 24 & 255) + (i3 >> 24 & 255) - ((a2 = a2[n2 - 1]) >> 24 & 255)) << 24 | N((r >> 16 & 255) + (i3 >> 16 & 255) - (a2 >> 16 & 255)) << 16 | N((r >> 8 & 255) + (i3 >> 8 & 255) - (a2 >> 8 & 255)) << 8 | N((255 & r) + (255 & i3) - (255 & a2))) >>> 0;
    }, t.Predictor13 = function(r, a2, n2) {
      var i3 = a2[n2 - 1];
      return (Y((r = K(r, a2[n2 + 0])) >> 24 & 255, i3 >> 24 & 255) << 24 | Y(r >> 16 & 255, i3 >> 16 & 255) << 16 | Y(r >> 8 & 255, i3 >> 8 & 255) << 8 | Y(r >> 0 & 255, i3 >> 0 & 255)) >>> 0;
    };
    var Jn = t.PredictorAdd0;
    t.PredictorAdd1 = x, D("Predictor2", "PredictorAdd2"), D("Predictor3", "PredictorAdd3"), D("Predictor4", "PredictorAdd4"), D("Predictor5", "PredictorAdd5"), D("Predictor6", "PredictorAdd6"), D("Predictor7", "PredictorAdd7"), D("Predictor8", "PredictorAdd8"), D("Predictor9", "PredictorAdd9"), D("Predictor10", "PredictorAdd10"), D("Predictor11", "PredictorAdd11"), D("Predictor12", "PredictorAdd12"), D("Predictor13", "PredictorAdd13");
    var xn = t.PredictorAdd2;
    $(
      "ColorIndexInverseTransform",
      "MapARGB",
      "32b",
      function(r) {
        return r >> 8 & 255;
      },
      function(r) {
        return r;
      }
    ), $(
      "VP8LColorIndexInverseTransformAlpha",
      "MapAlpha",
      "8b",
      function(r) {
        return r;
      },
      function(r) {
        return r >> 8 & 255;
      }
    );
    var zn, En = t.ColorIndexInverseTransform, Xn = t.MapARGB, $n = t.VP8LColorIndexInverseTransformAlpha, Zn = t.MapAlpha, qn = t.VP8LPredictorsAdd = [];
    qn.length = 16, (t.VP8LPredictors = []).length = 16, (t.VP8LPredictorsAdd_C = []).length = 16, (t.VP8LPredictors_C = []).length = 16;
    var Qn, ri, ai, ni, ii, ti, ei, fi, ui, li, ci, oi, si, hi, bi, di, vi, wi, gi, Pi, ki, mi, pi, Ai, Li, Ri, yi, _i, Vi = c(511), Bi = c(2041), Gi = c(225), Ci = c(767), Ii = 0, Ui = Bi, Mi = Gi, Fi = Ci, ji = Vi, Oi = 0, Si = 1, Ti = 2, Hi = 3, Di = 4, Wi = 5, Ki = 6, Ni = 7, Yi = 8, Ji = 9, xi = 10, zi = [2, 3, 7], Ei = [3, 3, 11], Xi = [280, 256, 256, 256, 40], $i = [0, 1, 1, 1, 0], Zi = [17, 18, 0, 1, 2, 3, 4, 5, 16, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], qi = [
      24,
      7,
      23,
      25,
      40,
      6,
      39,
      41,
      22,
      26,
      38,
      42,
      56,
      5,
      55,
      57,
      21,
      27,
      54,
      58,
      37,
      43,
      72,
      4,
      71,
      73,
      20,
      28,
      53,
      59,
      70,
      74,
      36,
      44,
      88,
      69,
      75,
      52,
      60,
      3,
      87,
      89,
      19,
      29,
      86,
      90,
      35,
      45,
      68,
      76,
      85,
      91,
      51,
      61,
      104,
      2,
      103,
      105,
      18,
      30,
      102,
      106,
      34,
      46,
      84,
      92,
      67,
      77,
      101,
      107,
      50,
      62,
      120,
      1,
      119,
      121,
      83,
      93,
      17,
      31,
      100,
      108,
      66,
      78,
      118,
      122,
      33,
      47,
      117,
      123,
      49,
      63,
      99,
      109,
      82,
      94,
      0,
      116,
      124,
      65,
      79,
      16,
      32,
      98,
      110,
      48,
      115,
      125,
      81,
      95,
      64,
      114,
      126,
      97,
      111,
      80,
      113,
      127,
      96,
      112
    ], Qi = [2954, 2956, 2958, 2962, 2970, 2986, 3018, 3082, 3212, 3468, 3980, 5004], rt = 8, at = [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      17,
      18,
      19,
      20,
      20,
      21,
      21,
      22,
      22,
      23,
      23,
      24,
      25,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      64,
      65,
      66,
      67,
      68,
      69,
      70,
      71,
      72,
      73,
      74,
      75,
      76,
      76,
      77,
      78,
      79,
      80,
      81,
      82,
      83,
      84,
      85,
      86,
      87,
      88,
      89,
      91,
      93,
      95,
      96,
      98,
      100,
      101,
      102,
      104,
      106,
      108,
      110,
      112,
      114,
      116,
      118,
      122,
      124,
      126,
      128,
      130,
      132,
      134,
      136,
      138,
      140,
      143,
      145,
      148,
      151,
      154,
      157
    ], nt = [
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53,
      54,
      55,
      56,
      57,
      58,
      60,
      62,
      64,
      66,
      68,
      70,
      72,
      74,
      76,
      78,
      80,
      82,
      84,
      86,
      88,
      90,
      92,
      94,
      96,
      98,
      100,
      102,
      104,
      106,
      108,
      110,
      112,
      114,
      116,
      119,
      122,
      125,
      128,
      131,
      134,
      137,
      140,
      143,
      146,
      149,
      152,
      155,
      158,
      161,
      164,
      167,
      170,
      173,
      177,
      181,
      185,
      189,
      193,
      197,
      201,
      205,
      209,
      213,
      217,
      221,
      225,
      229,
      234,
      239,
      245,
      249,
      254,
      259,
      264,
      269,
      274,
      279,
      284
    ], it = null, tt = [
      [173, 148, 140, 0],
      [176, 155, 140, 135, 0],
      [180, 157, 141, 134, 130, 0],
      [254, 254, 243, 230, 196, 177, 153, 140, 133, 130, 129, 0]
    ], et = [0, 1, 4, 8, 5, 2, 3, 6, 9, 12, 13, 10, 7, 11, 14, 15], ft = [-0, 1, -1, 2, -2, 3, 4, 6, -3, 5, -4, -5, -6, 7, -7, 8, -8, -9], ut = [
      [
        [
          [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
          [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
          [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128]
        ],
        [
          [253, 136, 254, 255, 228, 219, 128, 128, 128, 128, 128],
          [189, 129, 242, 255, 227, 213, 255, 219, 128, 128, 128],
          [106, 126, 227, 252, 214, 209, 255, 255, 128, 128, 128]
        ],
        [
          [1, 98, 248, 255, 236, 226, 255, 255, 128, 128, 128],
          [181, 133, 238, 254, 221, 234, 255, 154, 128, 128, 128],
          [78, 134, 202, 247, 198, 180, 255, 219, 128, 128, 128]
        ],
        [
          [1, 185, 249, 255, 243, 255, 128, 128, 128, 128, 128],
          [184, 150, 247, 255, 236, 224, 128, 128, 128, 128, 128],
          [77, 110, 216, 255, 236, 230, 128, 128, 128, 128, 128]
        ],
        [
          [1, 101, 251, 255, 241, 255, 128, 128, 128, 128, 128],
          [170, 139, 241, 252, 236, 209, 255, 255, 128, 128, 128],
          [37, 116, 196, 243, 228, 255, 255, 255, 128, 128, 128]
        ],
        [
          [1, 204, 254, 255, 245, 255, 128, 128, 128, 128, 128],
          [207, 160, 250, 255, 238, 128, 128, 128, 128, 128, 128],
          [102, 103, 231, 255, 211, 171, 128, 128, 128, 128, 128]
        ],
        [
          [1, 152, 252, 255, 240, 255, 128, 128, 128, 128, 128],
          [177, 135, 243, 255, 234, 225, 128, 128, 128, 128, 128],
          [80, 129, 211, 255, 194, 224, 128, 128, 128, 128, 128]
        ],
        [
          [1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128],
          [246, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128],
          [255, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128]
        ]
      ],
      [
        [
          [198, 35, 237, 223, 193, 187, 162, 160, 145, 155, 62],
          [131, 45, 198, 221, 172, 176, 220, 157, 252, 221, 1],
          [68, 47, 146, 208, 149, 167, 221, 162, 255, 223, 128]
        ],
        [
          [1, 149, 241, 255, 221, 224, 255, 255, 128, 128, 128],
          [184, 141, 234, 253, 222, 220, 255, 199, 128, 128, 128],
          [81, 99, 181, 242, 176, 190, 249, 202, 255, 255, 128]
        ],
        [
          [1, 129, 232, 253, 214, 197, 242, 196, 255, 255, 128],
          [99, 121, 210, 250, 201, 198, 255, 202, 128, 128, 128],
          [23, 91, 163, 242, 170, 187, 247, 210, 255, 255, 128]
        ],
        [
          [1, 200, 246, 255, 234, 255, 128, 128, 128, 128, 128],
          [109, 178, 241, 255, 231, 245, 255, 255, 128, 128, 128],
          [44, 130, 201, 253, 205, 192, 255, 255, 128, 128, 128]
        ],
        [
          [1, 132, 239, 251, 219, 209, 255, 165, 128, 128, 128],
          [94, 136, 225, 251, 218, 190, 255, 255, 128, 128, 128],
          [22, 100, 174, 245, 186, 161, 255, 199, 128, 128, 128]
        ],
        [
          [1, 182, 249, 255, 232, 235, 128, 128, 128, 128, 128],
          [124, 143, 241, 255, 227, 234, 128, 128, 128, 128, 128],
          [35, 77, 181, 251, 193, 211, 255, 205, 128, 128, 128]
        ],
        [
          [1, 157, 247, 255, 236, 231, 255, 255, 128, 128, 128],
          [121, 141, 235, 255, 225, 227, 255, 255, 128, 128, 128],
          [45, 99, 188, 251, 195, 217, 255, 224, 128, 128, 128]
        ],
        [
          [1, 1, 251, 255, 213, 255, 128, 128, 128, 128, 128],
          [203, 1, 248, 255, 255, 128, 128, 128, 128, 128, 128],
          [137, 1, 177, 255, 224, 255, 128, 128, 128, 128, 128]
        ]
      ],
      [
        [
          [253, 9, 248, 251, 207, 208, 255, 192, 128, 128, 128],
          [175, 13, 224, 243, 193, 185, 249, 198, 255, 255, 128],
          [73, 17, 171, 221, 161, 179, 236, 167, 255, 234, 128]
        ],
        [
          [1, 95, 247, 253, 212, 183, 255, 255, 128, 128, 128],
          [239, 90, 244, 250, 211, 209, 255, 255, 128, 128, 128],
          [155, 77, 195, 248, 188, 195, 255, 255, 128, 128, 128]
        ],
        [
          [1, 24, 239, 251, 218, 219, 255, 205, 128, 128, 128],
          [201, 51, 219, 255, 196, 186, 128, 128, 128, 128, 128],
          [69, 46, 190, 239, 201, 218, 255, 228, 128, 128, 128]
        ],
        [
          [1, 191, 251, 255, 255, 128, 128, 128, 128, 128, 128],
          [223, 165, 249, 255, 213, 255, 128, 128, 128, 128, 128],
          [141, 124, 248, 255, 255, 128, 128, 128, 128, 128, 128]
        ],
        [
          [1, 16, 248, 255, 255, 128, 128, 128, 128, 128, 128],
          [190, 36, 230, 255, 236, 255, 128, 128, 128, 128, 128],
          [149, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128]
        ],
        [
          [1, 226, 255, 128, 128, 128, 128, 128, 128, 128, 128],
          [247, 192, 255, 128, 128, 128, 128, 128, 128, 128, 128],
          [240, 128, 255, 128, 128, 128, 128, 128, 128, 128, 128]
        ],
        [
          [1, 134, 252, 255, 255, 128, 128, 128, 128, 128, 128],
          [213, 62, 250, 255, 255, 128, 128, 128, 128, 128, 128],
          [55, 93, 255, 128, 128, 128, 128, 128, 128, 128, 128]
        ],
        [
          [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
          [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
          [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128]
        ]
      ],
      [
        [
          [202, 24, 213, 235, 186, 191, 220, 160, 240, 175, 255],
          [126, 38, 182, 232, 169, 184, 228, 174, 255, 187, 128],
          [61, 46, 138, 219, 151, 178, 240, 170, 255, 216, 128]
        ],
        [
          [1, 112, 230, 250, 199, 191, 247, 159, 255, 255, 128],
          [166, 109, 228, 252, 211, 215, 255, 174, 128, 128, 128],
          [39, 77, 162, 232, 172, 180, 245, 178, 255, 255, 128]
        ],
        [
          [1, 52, 220, 246, 198, 199, 249, 220, 255, 255, 128],
          [124, 74, 191, 243, 183, 193, 250, 221, 255, 255, 128],
          [24, 71, 130, 219, 154, 170, 243, 182, 255, 255, 128]
        ],
        [
          [1, 182, 225, 249, 219, 240, 255, 224, 128, 128, 128],
          [149, 150, 226, 252, 216, 205, 255, 171, 128, 128, 128],
          [28, 108, 170, 242, 183, 194, 254, 223, 255, 255, 128]
        ],
        [
          [1, 81, 230, 252, 204, 203, 255, 192, 128, 128, 128],
          [123, 102, 209, 247, 188, 196, 255, 233, 128, 128, 128],
          [20, 95, 153, 243, 164, 173, 255, 203, 128, 128, 128]
        ],
        [
          [1, 222, 248, 255, 216, 213, 128, 128, 128, 128, 128],
          [168, 175, 246, 252, 235, 205, 255, 255, 128, 128, 128],
          [47, 116, 215, 255, 211, 212, 255, 255, 128, 128, 128]
        ],
        [
          [1, 121, 236, 253, 212, 214, 255, 255, 128, 128, 128],
          [141, 84, 213, 252, 201, 202, 255, 219, 128, 128, 128],
          [42, 80, 160, 240, 162, 185, 255, 205, 128, 128, 128]
        ],
        [
          [1, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128],
          [244, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128],
          [238, 1, 255, 128, 128, 128, 128, 128, 128, 128, 128]
        ]
      ]
    ], lt = [
      [
        [231, 120, 48, 89, 115, 113, 120, 152, 112],
        [152, 179, 64, 126, 170, 118, 46, 70, 95],
        [175, 69, 143, 80, 85, 82, 72, 155, 103],
        [56, 58, 10, 171, 218, 189, 17, 13, 152],
        [114, 26, 17, 163, 44, 195, 21, 10, 173],
        [121, 24, 80, 195, 26, 62, 44, 64, 85],
        [144, 71, 10, 38, 171, 213, 144, 34, 26],
        [170, 46, 55, 19, 136, 160, 33, 206, 71],
        [63, 20, 8, 114, 114, 208, 12, 9, 226],
        [81, 40, 11, 96, 182, 84, 29, 16, 36]
      ],
      [
        [134, 183, 89, 137, 98, 101, 106, 165, 148],
        [72, 187, 100, 130, 157, 111, 32, 75, 80],
        [66, 102, 167, 99, 74, 62, 40, 234, 128],
        [41, 53, 9, 178, 241, 141, 26, 8, 107],
        [74, 43, 26, 146, 73, 166, 49, 23, 157],
        [65, 38, 105, 160, 51, 52, 31, 115, 128],
        [104, 79, 12, 27, 217, 255, 87, 17, 7],
        [87, 68, 71, 44, 114, 51, 15, 186, 23],
        [47, 41, 14, 110, 182, 183, 21, 17, 194],
        [66, 45, 25, 102, 197, 189, 23, 18, 22]
      ],
      [
        [88, 88, 147, 150, 42, 46, 45, 196, 205],
        [43, 97, 183, 117, 85, 38, 35, 179, 61],
        [39, 53, 200, 87, 26, 21, 43, 232, 171],
        [56, 34, 51, 104, 114, 102, 29, 93, 77],
        [39, 28, 85, 171, 58, 165, 90, 98, 64],
        [34, 22, 116, 206, 23, 34, 43, 166, 73],
        [107, 54, 32, 26, 51, 1, 81, 43, 31],
        [68, 25, 106, 22, 64, 171, 36, 225, 114],
        [34, 19, 21, 102, 132, 188, 16, 76, 124],
        [62, 18, 78, 95, 85, 57, 50, 48, 51]
      ],
      [
        [193, 101, 35, 159, 215, 111, 89, 46, 111],
        [60, 148, 31, 172, 219, 228, 21, 18, 111],
        [112, 113, 77, 85, 179, 255, 38, 120, 114],
        [40, 42, 1, 196, 245, 209, 10, 25, 109],
        [88, 43, 29, 140, 166, 213, 37, 43, 154],
        [61, 63, 30, 155, 67, 45, 68, 1, 209],
        [100, 80, 8, 43, 154, 1, 51, 26, 71],
        [142, 78, 78, 16, 255, 128, 34, 197, 171],
        [41, 40, 5, 102, 211, 183, 4, 1, 221],
        [51, 50, 17, 168, 209, 192, 23, 25, 82]
      ],
      [
        [138, 31, 36, 171, 27, 166, 38, 44, 229],
        [67, 87, 58, 169, 82, 115, 26, 59, 179],
        [63, 59, 90, 180, 59, 166, 93, 73, 154],
        [40, 40, 21, 116, 143, 209, 34, 39, 175],
        [47, 15, 16, 183, 34, 223, 49, 45, 183],
        [46, 17, 33, 183, 6, 98, 15, 32, 183],
        [57, 46, 22, 24, 128, 1, 54, 17, 37],
        [65, 32, 73, 115, 28, 128, 23, 128, 205],
        [40, 3, 9, 115, 51, 192, 18, 6, 223],
        [87, 37, 9, 115, 59, 77, 64, 21, 47]
      ],
      [
        [104, 55, 44, 218, 9, 54, 53, 130, 226],
        [64, 90, 70, 205, 40, 41, 23, 26, 57],
        [54, 57, 112, 184, 5, 41, 38, 166, 213],
        [30, 34, 26, 133, 152, 116, 10, 32, 134],
        [39, 19, 53, 221, 26, 114, 32, 73, 255],
        [31, 9, 65, 234, 2, 15, 1, 118, 73],
        [75, 32, 12, 51, 192, 255, 160, 43, 51],
        [88, 31, 35, 67, 102, 85, 55, 186, 85],
        [56, 21, 23, 111, 59, 205, 45, 37, 192],
        [55, 38, 70, 124, 73, 102, 1, 34, 98]
      ],
      [
        [125, 98, 42, 88, 104, 85, 117, 175, 82],
        [95, 84, 53, 89, 128, 100, 113, 101, 45],
        [75, 79, 123, 47, 51, 128, 81, 171, 1],
        [57, 17, 5, 71, 102, 57, 53, 41, 49],
        [38, 33, 13, 121, 57, 73, 26, 1, 85],
        [41, 10, 67, 138, 77, 110, 90, 47, 114],
        [115, 21, 2, 10, 102, 255, 166, 23, 6],
        [101, 29, 16, 10, 85, 128, 101, 196, 26],
        [57, 18, 10, 102, 102, 213, 34, 20, 43],
        [117, 20, 15, 36, 163, 128, 68, 1, 26]
      ],
      [
        [102, 61, 71, 37, 34, 53, 31, 243, 192],
        [69, 60, 71, 38, 73, 119, 28, 222, 37],
        [68, 45, 128, 34, 1, 47, 11, 245, 171],
        [62, 17, 19, 70, 146, 85, 55, 62, 70],
        [37, 43, 37, 154, 100, 163, 85, 160, 1],
        [63, 9, 92, 136, 28, 64, 32, 201, 85],
        [75, 15, 9, 9, 64, 255, 184, 119, 16],
        [86, 6, 28, 5, 64, 255, 25, 248, 1],
        [56, 8, 17, 132, 137, 255, 55, 116, 128],
        [58, 15, 20, 82, 135, 57, 26, 121, 40]
      ],
      [
        [164, 50, 31, 137, 154, 133, 25, 35, 218],
        [51, 103, 44, 131, 131, 123, 31, 6, 158],
        [86, 40, 64, 135, 148, 224, 45, 183, 128],
        [22, 26, 17, 131, 240, 154, 14, 1, 209],
        [45, 16, 21, 91, 64, 222, 7, 1, 197],
        [56, 21, 39, 155, 60, 138, 23, 102, 213],
        [83, 12, 13, 54, 192, 255, 68, 47, 28],
        [85, 26, 85, 85, 128, 128, 32, 146, 171],
        [18, 11, 7, 63, 144, 171, 4, 4, 246],
        [35, 27, 10, 146, 174, 171, 12, 26, 128]
      ],
      [
        [190, 80, 35, 99, 180, 80, 126, 54, 45],
        [85, 126, 47, 87, 176, 51, 41, 20, 32],
        [101, 75, 128, 139, 118, 146, 116, 128, 85],
        [56, 41, 15, 176, 236, 85, 37, 9, 62],
        [71, 30, 17, 119, 118, 255, 17, 18, 138],
        [101, 38, 60, 138, 55, 70, 43, 26, 142],
        [146, 36, 19, 30, 171, 255, 97, 27, 20],
        [138, 45, 61, 62, 219, 1, 81, 188, 64],
        [32, 41, 20, 117, 151, 142, 20, 21, 163],
        [112, 19, 12, 61, 195, 128, 48, 4, 24]
      ]
    ], ct = [
      [
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [176, 246, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [223, 241, 252, 255, 255, 255, 255, 255, 255, 255, 255],
          [249, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 244, 252, 255, 255, 255, 255, 255, 255, 255, 255],
          [234, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 246, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [239, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [251, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [251, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 254, 253, 255, 254, 255, 255, 255, 255, 255, 255],
          [250, 255, 254, 255, 254, 255, 255, 255, 255, 255, 255],
          [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ]
      ],
      [
        [
          [217, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [225, 252, 241, 253, 255, 255, 254, 255, 255, 255, 255],
          [234, 250, 241, 250, 253, 255, 253, 254, 255, 255, 255]
        ],
        [
          [255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [223, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [238, 253, 254, 254, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 248, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [249, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 253, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [247, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [253, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255],
          [250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ]
      ],
      [
        [
          [186, 251, 250, 255, 255, 255, 255, 255, 255, 255, 255],
          [234, 251, 244, 254, 255, 255, 255, 255, 255, 255, 255],
          [251, 251, 243, 253, 254, 255, 254, 255, 255, 255, 255]
        ],
        [
          [255, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [236, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [251, 253, 253, 254, 254, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 254, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ]
      ],
      [
        [
          [248, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [250, 254, 252, 254, 255, 255, 255, 255, 255, 255, 255],
          [248, 254, 249, 253, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255],
          [246, 253, 253, 255, 255, 255, 255, 255, 255, 255, 255],
          [252, 254, 251, 254, 254, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 254, 252, 255, 255, 255, 255, 255, 255, 255, 255],
          [248, 254, 253, 255, 255, 255, 255, 255, 255, 255, 255],
          [253, 255, 254, 254, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [245, 251, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [253, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 251, 253, 255, 255, 255, 255, 255, 255, 255, 255],
          [252, 253, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 254, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [249, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 254, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 253, 255, 255, 255, 255, 255, 255, 255, 255],
          [250, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ],
        [
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [254, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255],
          [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
        ]
      ]
    ], ot = [0, 1, 2, 3, 6, 4, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 0], st = [], ht = [], bt = [], dt = 1, vt = 2, wt = [], gt = [];
    Pn("UpsampleRgbLinePair", Rn, 3), Pn("UpsampleBgrLinePair", yn, 3), Pn("UpsampleRgbaLinePair", Cn, 4), Pn("UpsampleBgraLinePair", Gn, 4), Pn("UpsampleArgbLinePair", Bn, 4), Pn("UpsampleRgba4444LinePair", Vn, 2), Pn("UpsampleRgb565LinePair", _n, 2);
    var Pt = t.UpsampleRgbLinePair, kt = t.UpsampleBgrLinePair, mt = t.UpsampleRgbaLinePair, pt = t.UpsampleBgraLinePair, At = t.UpsampleArgbLinePair, Lt = t.UpsampleRgba4444LinePair, Rt = t.UpsampleRgb565LinePair, yt = 16, _t = 1 << yt - 1, Vt = -227, Bt = 482, Gt = 6, It = 0, Ut = c(256), Mt = c(256), Ft = c(256), jt = c(256), Ot = c(Bt - Vt), St = c(Bt - Vt);
    In("YuvToRgbRow", Rn, 3), In("YuvToBgrRow", yn, 3), In("YuvToRgbaRow", Cn, 4), In("YuvToBgraRow", Gn, 4), In("YuvToArgbRow", Bn, 4), In("YuvToRgba4444Row", Vn, 2), In("YuvToRgb565Row", _n, 2);
    var Tt = [0, 4, 8, 12, 128, 132, 136, 140, 256, 260, 264, 268, 384, 388, 392, 396], Ht = [0, 2, 8], Dt = [8, 7, 6, 4, 4, 2, 2, 2, 1, 1, 1, 1];
    this.WebPDecodeRGBA = function(r, a2, n2, i3, t2) {
      var f2 = Si, s2 = new nn(), h3 = new ur();
      s2.ba = h3, h3.S = f2, h3.width = [h3.width], h3.height = [h3.height];
      var b3 = h3.width, d3 = h3.height, v3 = new lr();
      if (null == v3 || null == r)
        var w2 = 2;
      else
        e(null != v3), w2 = jn(r, a2, n2, v3.width, v3.height, v3.Pd, v3.Qd, v3.format, null);
      if (0 != w2 ? b3 = 0 : (null != b3 && (b3[0] = v3.width[0]), null != d3 && (d3[0] = v3.height[0]), b3 = 1), b3) {
        h3.width = h3.width[0], h3.height = h3.height[0], null != i3 && (i3[0] = h3.width), null != t2 && (t2[0] = h3.height);
        r: {
          if (i3 = new zr(), (t2 = new tn()).data = r, t2.w = a2, t2.ha = n2, t2.kd = 1, a2 = [0], e(null != t2), (0 == (r = jn(t2.data, t2.w, t2.ha, null, null, null, a2, null, t2)) || 7 == r) && a2[0] && (r = 4), 0 == (a2 = r)) {
            if (e(null != s2), i3.data = t2.data, i3.w = t2.w + t2.offset, i3.ha = t2.ha - t2.offset, i3.put = dr, i3.ac = br, i3.bc = vr, i3.ma = s2, t2.xa) {
              if (null == (r = Gr())) {
                s2 = 1;
                break r;
              }
              if (function(r2, a3) {
                var n3 = [0], i4 = [0], t3 = [0];
                a:
                  for (; ; ) {
                    if (null == r2)
                      return 0;
                    if (null == a3)
                      return r2.a = 2, 0;
                    if (r2.l = a3, r2.a = 0, P(r2.m, a3.data, a3.w, a3.ha), !wr(r2.m, n3, i4, t3)) {
                      r2.a = 3;
                      break a;
                    }
                    if (r2.xb = vt, a3.width = n3[0], a3.height = i4[0], !Cr(n3[0], i4[0], 1, r2, null))
                      break a;
                    return 1;
                  }
                return e(0 != r2.a), 0;
              }(r, i3)) {
                if (i3 = 0 == (a2 = Tn(i3.width, i3.height, s2.Oa, s2.ba))) {
                  a: {
                    i3 = r;
                    n:
                      for (; ; ) {
                        if (null == i3) {
                          i3 = 0;
                          break a;
                        }
                        if (e(null != i3.s.yc), e(null != i3.s.Ya), e(0 < i3.s.Wb), e(null != (n2 = i3.l)), e(null != (t2 = n2.ma)), 0 != i3.xb) {
                          if (i3.ca = t2.ba, i3.tb = t2.tb, e(null != i3.ca), !On(t2.Oa, n2, Hi)) {
                            i3.a = 2;
                            break n;
                          }
                          if (!Ir(i3, n2.width))
                            break n;
                          if (n2.da)
                            break n;
                          if ((n2.da || tr(i3.ca.S)) && gn(), 11 > i3.ca.S || (console.info(`Stickers decoder: WebPInitConvertARGBToYUV`), null != i3.ca.f.kb.F && gn()), i3.Pb && 0 < i3.s.ua && null == i3.s.vb.X && !F(i3.s.vb, i3.s.Wa.Xa)) {
                            i3.a = 1;
                            break n;
                          }
                          i3.xb = 0;
                        }
                        if (!Vr(i3, i3.V, i3.Ba, i3.c, i3.i, n2.o, Lr))
                          break n;
                        t2.Dc = i3.Ma, i3 = 1;
                        break a;
                      }
                    e(0 != i3.a), i3 = 0;
                  }
                  i3 = !i3;
                }
                i3 && (a2 = r.a);
              } else
                a2 = r.a;
            } else {
              if (null == (r = new Er())) {
                s2 = 1;
                break r;
              }
              if (r.Fa = t2.na, r.P = t2.P, r.qc = t2.Sa, Zr(r, i3)) {
                if (0 == (a2 = Tn(i3.width, i3.height, s2.Oa, s2.ba))) {
                  if (r.Aa = 0, n2 = s2.Oa, e(null != (t2 = r)), null != n2) {
                    if (0 < (b3 = 0 > (b3 = n2.Md) ? 0 : 100 < b3 ? 255 : 255 * b3 / 100)) {
                      for (d3 = v3 = 0; 4 > d3; ++d3)
                        12 > (w2 = t2.pb[d3]).lc && (w2.ia = b3 * Dt[0 > w2.lc ? 0 : w2.lc] >> 3), v3 |= w2.ia;
                      v3 && (console.info(`Stickers decoder: VP8InitRandom`), t2.ia = 1);
                    }
                    t2.Ga = n2.Id, 100 < t2.Ga ? t2.Ga = 100 : 0 > t2.Ga && (t2.Ga = 0);
                  }
                  (function(r2, a3) {
                    if (null == r2)
                      return 0;
                    if (null == a3)
                      return Xr(r2, 2, "NULL VP8Io parameter in VP8Decode().");
                    if (!r2.cb && !Zr(r2, a3))
                      return 0;
                    if (e(r2.cb), null == a3.ac || a3.ac(a3)) {
                      a3.ob && (r2.L = 0);
                      var n3 = Ht[r2.L];
                      if (2 == r2.L ? (r2.yb = 0, r2.zb = 0) : (r2.yb = a3.v - n3 >> 4, r2.zb = a3.j - n3 >> 4, 0 > r2.yb && (r2.yb = 0), 0 > r2.zb && (r2.zb = 0)), r2.Va = a3.o + 15 + n3 >> 4, r2.Hb = a3.va + 15 + n3 >> 4, r2.Hb > r2.za && (r2.Hb = r2.za), r2.Va > r2.Ub && (r2.Va = r2.Ub), 0 < r2.L) {
                        var i4 = r2.ed;
                        for (n3 = 0; 4 > n3; ++n3) {
                          var t3;
                          if (r2.Qa.Cb) {
                            var f3 = r2.Qa.Lb[n3];
                            r2.Qa.Fb || (f3 += i4.Tb);
                          } else
                            f3 = i4.Tb;
                          for (t3 = 0; 1 >= t3; ++t3) {
                            var s3 = r2.gd[n3][t3], h4 = f3;
                            if (i4.Pc && (h4 += i4.vd[0], t3 && (h4 += i4.od[0])), 0 < (h4 = 0 > h4 ? 0 : 63 < h4 ? 63 : h4)) {
                              var b4 = h4;
                              0 < i4.wb && (b4 = 4 < i4.wb ? b4 >> 2 : b4 >> 1) > 9 - i4.wb && (b4 = 9 - i4.wb), 1 > b4 && (b4 = 1), s3.dd = b4, s3.tc = 2 * h4 + b4, s3.ld = 40 <= h4 ? 2 : 15 <= h4 ? 1 : 0;
                            } else
                              s3.tc = 0;
                            s3.La = t3;
                          }
                        }
                      }
                      n3 = 0;
                    } else
                      Xr(r2, 6, "Frame setup failed"), n3 = r2.a;
                    if (n3 = 0 == n3) {
                      if (n3) {
                        r2.$c = 0, 0 < r2.Aa || (r2.Ic = 1);
                        a: {
                          n3 = r2.Ic, i4 = 4 * (b4 = r2.za);
                          var d4 = 32 * b4, v4 = b4 + 1, w3 = 0 < r2.L ? b4 * (0 < r2.Aa ? 2 : 1) : 0, g2 = (2 == r2.Aa ? 2 : 1) * b4;
                          if ((s3 = i4 + 832 + (t3 = 3 * (16 * n3 + Ht[r2.L]) / 2 * d4) + (f3 = null != r2.Fa && 0 < r2.Fa.length ? r2.Kc.c * r2.Kc.i : 0)) != s3)
                            n3 = 0;
                          else {
                            if (s3 > r2.Vb) {
                              if (r2.Vb = 0, r2.Ec = c(s3), r2.Fc = 0, null == r2.Ec) {
                                n3 = Xr(r2, 1, "no memory during frame initialization.");
                                break a;
                              }
                              r2.Vb = s3;
                            }
                            s3 = r2.Ec, h4 = r2.Fc, r2.Ac = s3, r2.Bc = h4, h4 += i4, r2.Gd = o(d4, Yr), r2.Hd = 0, r2.rb = o(v4 + 1, Dr), r2.sb = 1, r2.wa = w3 ? o(w3, Hr) : null, r2.Y = 0, r2.D.Nb = 0, r2.D.wa = r2.wa, r2.D.Y = r2.Y, 0 < r2.Aa && (r2.D.Y += b4), e(true), r2.oc = s3, r2.pc = h4, h4 += 832, r2.ya = o(g2, Kr), r2.aa = 0, r2.D.ya = r2.ya, r2.D.aa = r2.aa, 2 == r2.Aa && (r2.D.aa += b4), r2.R = 16 * b4, r2.B = 8 * b4, b4 = (d4 = Ht[r2.L]) * r2.R, d4 = d4 / 2 * r2.B, r2.sa = s3, r2.ta = h4 + b4, r2.qa = r2.sa, r2.ra = r2.ta + 16 * n3 * r2.R + d4, r2.Ha = r2.qa, r2.Ia = r2.ra + 8 * n3 * r2.B + d4, r2.$c = 0, h4 += t3, r2.mb = f3 ? s3 : null, r2.nb = f3 ? h4 : null, e(h4 + f3 <= r2.Fc + r2.Vb), Qr(r2), l(r2.Ac, r2.Bc, 0, i4), n3 = 1;
                          }
                        }
                        if (n3) {
                          if (a3.ka = 0, a3.y = r2.sa, a3.O = r2.ta, a3.f = r2.qa, a3.N = r2.ra, a3.ea = r2.Ha, a3.Vd = r2.Ia, a3.fa = r2.R, a3.Rc = r2.B, a3.F = null, a3.J = 0, !Ii) {
                            for (n3 = -255; 255 >= n3; ++n3)
                              Vi[255 + n3] = 0 > n3 ? -n3 : n3;
                            for (n3 = -1020; 1020 >= n3; ++n3)
                              Bi[1020 + n3] = -128 > n3 ? -128 : 127 < n3 ? 127 : n3;
                            for (n3 = -112; 112 >= n3; ++n3)
                              Gi[112 + n3] = -16 > n3 ? -16 : 15 < n3 ? 15 : n3;
                            for (n3 = -255; 510 >= n3; ++n3)
                              Ci[255 + n3] = 0 > n3 ? 0 : 255 < n3 ? 255 : n3;
                            Ii = 1;
                          }
                          ei = ca, fi = ea, li = fa, ci = ua, oi = la, ui = ta, si = Ea, hi = Xa, bi = qa, di = Qa, vi = $a, wi = Za, gi = rn, Pi = an, ki = Ka, mi = Na, pi = Ya, Ai = Ja, ht[0] = Ra, ht[1] = sa, ht[2] = Aa, ht[3] = La, ht[4] = ya, ht[5] = Va, ht[6] = _a, ht[7] = Ba, ht[8] = Ca, ht[9] = Ga, st[0] = ga, st[1] = ba, st[2] = da, st[3] = va, st[4] = Pa, st[5] = ka, st[6] = ma, bt[0] = Fa, bt[1] = ha, bt[2] = Ia, bt[3] = Ua, bt[4] = Oa, bt[5] = ja, bt[6] = Sa, n3 = 1;
                        } else
                          n3 = 0;
                      }
                      n3 && (n3 = function(r3, a4) {
                        for (r3.M = 0; r3.M < r3.Va; ++r3.M) {
                          var n4, i5 = r3.Jc[r3.M & r3.Xb], t4 = r3.m, f4 = r3;
                          for (n4 = 0; n4 < f4.za; ++n4) {
                            var o2 = t4, s4 = f4, h5 = s4.Ac, b5 = s4.Bc + 4 * n4, d5 = s4.zc, v5 = s4.ya[s4.aa + n4];
                            if (s4.Qa.Bb ? v5.$b = G(o2, s4.Pa.jb[0]) ? 2 + G(o2, s4.Pa.jb[2]) : G(o2, s4.Pa.jb[1]) : v5.$b = 0, s4.kc && (v5.Ad = G(o2, s4.Bd)), v5.Za = !G(o2, 145) + 0, v5.Za) {
                              var w4 = v5.Ob, g3 = 0;
                              for (s4 = 0; 4 > s4; ++s4) {
                                var P2, k2 = d5[0 + s4];
                                for (P2 = 0; 4 > P2; ++P2) {
                                  k2 = lt[h5[b5 + P2]][k2];
                                  for (var m2 = ft[G(o2, k2[0])]; 0 < m2; )
                                    m2 = ft[2 * m2 + G(o2, k2[m2])];
                                  k2 = -m2, h5[b5 + P2] = k2;
                                }
                                u(w4, g3, h5, b5, 4), g3 += 4, d5[0 + s4] = k2;
                              }
                            } else
                              k2 = G(o2, 156) ? G(o2, 128) ? 1 : 3 : G(o2, 163) ? 2 : 0, v5.Ob[0] = k2, l(h5, b5, k2, 4), l(d5, 0, k2, 4);
                            v5.Dd = G(o2, 142) ? G(o2, 114) ? G(o2, 183) ? 1 : 3 : 2 : 0;
                          }
                          if (f4.m.Ka)
                            return Xr(r3, 7, "Premature end-of-partition0 encountered.");
                          for (; r3.ja < r3.za; ++r3.ja) {
                            if (f4 = i5, o2 = (t4 = r3).rb[t4.sb - 1], h5 = t4.rb[t4.sb + t4.ja], n4 = t4.ya[t4.aa + t4.ja], b5 = t4.kc ? n4.Ad : 0)
                              o2.la = h5.la = 0, n4.Za || (o2.Na = h5.Na = 0), n4.Hc = 0, n4.Gc = 0, n4.ia = 0;
                            else {
                              var p2, A2;
                              if (o2 = h5, h5 = f4, b5 = t4.Pa.Xc, d5 = t4.ya[t4.aa + t4.ja], v5 = t4.pb[d5.$b], s4 = d5.ad, w4 = 0, g3 = t4.rb[t4.sb - 1], k2 = P2 = 0, l(s4, w4, 0, 384), d5.Za)
                                var L2 = 0, R2 = b5[3];
                              else {
                                m2 = c(16);
                                var y2 = o2.Na + g3.Na;
                                if (y2 = it(h5, b5[1], y2, v5.Eb, 0, m2, 0), o2.Na = g3.Na = (0 < y2) + 0, 1 < y2)
                                  ei(m2, 0, s4, w4);
                                else {
                                  var _2 = m2[0] + 3 >> 3;
                                  for (m2 = 0; 256 > m2; m2 += 16)
                                    s4[w4 + m2] = _2;
                                }
                                L2 = 1, R2 = b5[0];
                              }
                              var V2 = 15 & o2.la, B2 = 15 & g3.la;
                              for (m2 = 0; 4 > m2; ++m2) {
                                var C2 = 1 & B2;
                                for (_2 = A2 = 0; 4 > _2; ++_2)
                                  V2 = V2 >> 1 | (C2 = (y2 = it(h5, R2, y2 = C2 + (1 & V2), v5.Sc, L2, s4, w4)) > L2) << 7, A2 = A2 << 2 | (3 < y2 ? 3 : 1 < y2 ? 2 : 0 != s4[w4 + 0]), w4 += 16;
                                V2 >>= 4, B2 = B2 >> 1 | C2 << 7, P2 = (P2 << 8 | A2) >>> 0;
                              }
                              for (R2 = V2, L2 = B2 >> 4, p2 = 0; 4 > p2; p2 += 2) {
                                for (A2 = 0, V2 = o2.la >> 4 + p2, B2 = g3.la >> 4 + p2, m2 = 0; 2 > m2; ++m2) {
                                  for (C2 = 1 & B2, _2 = 0; 2 > _2; ++_2)
                                    y2 = C2 + (1 & V2), V2 = V2 >> 1 | (C2 = 0 < (y2 = it(h5, b5[2], y2, v5.Qc, 0, s4, w4))) << 3, A2 = A2 << 2 | (3 < y2 ? 3 : 1 < y2 ? 2 : 0 != s4[w4 + 0]), w4 += 16;
                                  V2 >>= 2, B2 = B2 >> 1 | C2 << 5;
                                }
                                k2 |= A2 << 4 * p2, R2 |= V2 << 4 << p2, L2 |= (240 & B2) << p2;
                              }
                              o2.la = R2, g3.la = L2, d5.Hc = P2, d5.Gc = k2, d5.ia = 43690 & k2 ? 0 : v5.ia, b5 = !(P2 | k2);
                            }
                            if (0 < t4.L && (t4.wa[t4.Y + t4.ja] = t4.gd[n4.$b][n4.Za], t4.wa[t4.Y + t4.ja].La |= !b5), f4.Ka)
                              return Xr(r3, 7, "Premature end-of-file encountered.");
                          }
                          if (Qr(r3), t4 = a4, f4 = 1, n4 = (i5 = r3).D, o2 = 0 < i5.L && i5.M >= i5.zb && i5.M <= i5.Va, 0 == i5.Aa)
                            a: {
                              if (n4.M = i5.M, n4.uc = o2, Fn(i5, n4), f4 = 1, n4 = (A2 = i5.D).Nb, o2 = (k2 = Ht[i5.L]) * i5.R, h5 = k2 / 2 * i5.B, m2 = 16 * n4 * i5.R, _2 = 8 * n4 * i5.B, b5 = i5.sa, d5 = i5.ta - o2 + m2, v5 = i5.qa, s4 = i5.ra - h5 + _2, w4 = i5.Ha, g3 = i5.Ia - h5 + _2, B2 = 0 == (V2 = A2.M), P2 = V2 >= i5.Va - 1, 2 == i5.Aa && Fn(i5, A2), A2.uc)
                                for (C2 = (y2 = i5).D.M, e(y2.D.uc), A2 = y2.yb; A2 < y2.Hb; ++A2) {
                                  L2 = A2, R2 = C2;
                                  var I2 = (U2 = (W2 = y2).D).Nb;
                                  p2 = W2.R;
                                  var U2 = U2.wa[U2.Y + L2], M2 = W2.sa, F2 = W2.ta + 16 * I2 * p2 + 16 * L2, j2 = U2.dd, O2 = U2.tc;
                                  if (0 != O2)
                                    if (e(3 <= O2), 1 == W2.L)
                                      0 < L2 && mi(M2, F2, p2, O2 + 4), U2.La && Ai(M2, F2, p2, O2), 0 < R2 && ki(M2, F2, p2, O2 + 4), U2.La && pi(M2, F2, p2, O2);
                                    else {
                                      var S2 = W2.B, T2 = W2.qa, H2 = W2.ra + 8 * I2 * S2 + 8 * L2, D2 = W2.Ha, W2 = W2.Ia + 8 * I2 * S2 + 8 * L2;
                                      I2 = U2.ld, 0 < L2 && (hi(M2, F2, p2, O2 + 4, j2, I2), di(T2, H2, D2, W2, S2, O2 + 4, j2, I2)), U2.La && (wi(M2, F2, p2, O2, j2, I2), Pi(T2, H2, D2, W2, S2, O2, j2, I2)), 0 < R2 && (si(M2, F2, p2, O2 + 4, j2, I2), bi(T2, H2, D2, W2, S2, O2 + 4, j2, I2)), U2.La && (vi(M2, F2, p2, O2, j2, I2), gi(T2, H2, D2, W2, S2, O2, j2, I2));
                                    }
                                }
                              if (i5.ia && console.info(`Stickers decoder: DitherRow`), null != t4.put) {
                                if (A2 = 16 * V2, V2 = 16 * (V2 + 1), B2 ? (t4.y = i5.sa, t4.O = i5.ta + m2, t4.f = i5.qa, t4.N = i5.ra + _2, t4.ea = i5.Ha, t4.W = i5.Ia + _2) : (A2 -= k2, t4.y = b5, t4.O = d5, t4.f = v5, t4.N = s4, t4.ea = w4, t4.W = g3), P2 || (V2 -= k2), V2 > t4.o && (V2 = t4.o), t4.F = null, t4.J = null, null != i5.Fa && 0 < i5.Fa.length && A2 < V2 && (t4.J = hn(i5, t4, A2, V2 - A2), t4.F = i5.mb, null == t4.F && 0 == t4.F.length)) {
                                  f4 = Xr(i5, 3, "Could not decode alpha data.");
                                  break a;
                                }
                                A2 < t4.j && (k2 = t4.j - A2, A2 = t4.j, e(!(1 & k2)), t4.O += i5.R * k2, t4.N += i5.B * (k2 >> 1), t4.W += i5.B * (k2 >> 1), null != t4.F && (t4.J += t4.width * k2)), A2 < V2 && (t4.O += t4.v, t4.N += t4.v >> 1, t4.W += t4.v >> 1, null != t4.F && (t4.J += t4.v), t4.ka = A2 - t4.j, t4.U = t4.va - t4.v, t4.T = V2 - A2, f4 = t4.put(t4));
                              }
                              n4 + 1 != i5.Ic || P2 || (u(i5.sa, i5.ta - o2, b5, d5 + 16 * i5.R, o2), u(i5.qa, i5.ra - h5, v5, s4 + 8 * i5.B, h5), u(i5.Ha, i5.Ia - h5, w4, g3 + 8 * i5.B, h5));
                            }
                          if (!f4)
                            return Xr(r3, 6, "Output aborted.");
                        }
                        return 1;
                      }(r2, a3)), null != a3.bc && a3.bc(a3), n3 &= 1;
                    }
                    return n3 ? (r2.cb = 0, n3) : 0;
                  })(r, i3) || (a2 = r.a);
                }
              } else
                a2 = r.a;
            }
            0 == a2 && null != s2.Oa && s2.Oa.fd && (a2 = Sn(s2.ba));
          }
          s2 = a2;
        }
        f2 = 0 != s2 ? null : 11 > f2 ? h3.f.RGBA.eb : h3.f.kb.y;
      } else
        f2 = null;
      return f2;
    };
    var Wt = [3, 4, 3, 4, 4, 2, 2, 4, 4, 4, 2, 1, 1];
  };
  function b(r, a) {
    for (var n = "", i2 = 0; i2 < 4; i2++)
      n += String.fromCharCode(r[a++]);
    return n;
  }
  function d(r, a) {
    return (r[a + 0] << 0 | r[a + 1] << 8 | r[a + 2] << 16) >>> 0;
  }
  function v(r, a) {
    return (r[a + 0] << 0 | r[a + 1] << 8 | r[a + 2] << 16 | r[a + 3] << 24) >>> 0;
  }
  function decodeWebP(r, a) {
    return new Promise((resolve, reject) => {
      try {
        performance.now();
        var e2 = new h(), f2 = new Uint8Array(r), u2 = function(r2, a2) {
          var n = {}, i2 = 0, t2 = false, e3 = 0, f3 = 0;
          if (n.frames = [], !function(r3, a3, n2, i3) {
            for (var t3 = 0; t3 < 4; t3++)
              if (r3[a3 + t3] != "RIFF".charCodeAt(t3))
                return true;
            return false;
          }(r2, a2)) {
            var u3, l3;
            for (v(r2, a2 += 4), a2 += 8; a2 < r2.length; ) {
              var c2 = b(r2, a2), o2 = v(r2, a2 += 4);
              a2 += 4;
              var s2 = o2 + (1 & o2);
              switch (c2) {
                case "VP8 ":
                case "VP8L":
                  void 0 === n.frames[i2] && (n.frames[i2] = {}), (g = n.frames[i2]).src_off = t2 ? f3 : a2 - 8, g.src_size = e3 + o2 + 8, i2++, t2 && (t2 = false, e3 = 0, f3 = 0);
                  break;
                case "VP8X":
                  (g = n.header = {}).feature_flags = r2[a2];
                  var h2 = a2 + 4;
                  g.canvas_width = 1 + d(r2, h2), h2 += 3, g.canvas_height = 1 + d(r2, h2), h2 += 3;
                  break;
                case "ALPH":
                  t2 = true, e3 = s2 + 8, f3 = a2 - 8;
                  break;
                case "ANIM":
                  (g = n.header).bgcolor = v(r2, a2), h2 = a2 + 4, g.loop_count = (u3 = r2)[(l3 = h2) + 0] << 0 | u3[l3 + 1] << 8, h2 += 2;
                  break;
                case "ANMF":
                  var w, g;
                  (g = n.frames[i2] = {}).offset_x = 2 * d(r2, a2), a2 += 3, g.offset_y = 2 * d(r2, a2), a2 += 3, g.width = 1 + d(r2, a2), a2 += 3, g.height = 1 + d(r2, a2), a2 += 3, g.duration = d(r2, a2), a2 += 3, w = r2[a2++], g.dispose = 1 & w, g.blend = w >> 1 & 1;
              }
              "ANMF" != c2 && (a2 += s2);
            }
            return n;
          }
        }(f2, 0);
        null == u2.frames && reject("Cannot parse WebP Riff"), u2.frames = [u2.frames[0]], function(r2, a2, n) {
          var i2, t2;
          if (null == a2.frames)
            return a2;
          var e3 = [0], f3 = [0], u3 = a2.frames[0], l3 = r2.WebPDecodeRGBA(
            n,
            null != (i2 = u3.src_off) ? i2 : 0,
            null != (t2 = u3.src_size) ? t2 : 0,
            f3,
            e3
          );
          u3.rgba = l3, u3.imgwidth = f3[0], u3.imgheight = e3[0];
        }(e2, u2, f2);
        var l2 = function(r2, a2) {
          var n = r2.header ? r2.header : null, t2 = r2.frames ? r2.frames : null, e3 = n && n.canvas_width, f3 = n && n.canvas_height;
          if (null == e3 || null == f3 || null == t2 || null == n)
            return console.error(`WebP image wasn't decoded`), null;
          try {
            var u3 = new Uint8Array(e3 * f3 * 4), l3 = t2[0];
            if (null == l3.imgwidth || null == l3.imgheight)
              return null;
            for (var c2 = l3.imgwidth, o2 = l3.imgheight, s2 = l3.rgba, h2 = null == l3.offset_x ? 0 : l3.offset_x, b2 = null == l3.offset_y ? 0 : l3.offset_y, d2 = 0, v2 = b2; v2 < b2 + o2; v2++)
              for (var w = h2; w < h2 + c2; w++, d2 += 4)
                u3[4 * (w + v2 * e3)] = s2[d2], u3[4 * (w + v2 * e3) + 1] = s2[d2 + 1], u3[4 * (w + v2 * e3) + 2] = s2[d2 + 2], u3[4 * (w + v2 * e3) + 3] = s2[d2 + 3];
            for (var g = { width: e3, height: f3, rgba: u3 }, P = 0; P < a2; P++)
              g = i(g);
            return {
              width: g.width,
              height: g.height,
              rgba: g.rgba.buffer
            };
          } catch (r3) {
            return console.error(`Frame drawing was failed. ${r3}`), null;
          }
        }(u2, a);
        if (null == l2)
          return void reject(new Error("WebP Image cannot be parsed"));
        resolve(l2);
      } catch (r2) {
        reject(new Error("WebP Image cannot be parsed: " + r2.toString));
      }
    });
  }
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var sparkMd5 = { exports: {} };
  (function(module, exports) {
    (function(factory) {
      {
        module.exports = factory();
      }
    })(function(undefined$1) {
      var hex_chr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
      function md5cycle(x, k) {
        var a = x[0], b2 = x[1], c2 = x[2], d2 = x[3];
        a += (b2 & c2 | ~b2 & d2) + k[0] - 680876936 | 0;
        a = (a << 7 | a >>> 25) + b2 | 0;
        d2 += (a & b2 | ~a & c2) + k[1] - 389564586 | 0;
        d2 = (d2 << 12 | d2 >>> 20) + a | 0;
        c2 += (d2 & a | ~d2 & b2) + k[2] + 606105819 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
        b2 += (c2 & d2 | ~c2 & a) + k[3] - 1044525330 | 0;
        b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
        a += (b2 & c2 | ~b2 & d2) + k[4] - 176418897 | 0;
        a = (a << 7 | a >>> 25) + b2 | 0;
        d2 += (a & b2 | ~a & c2) + k[5] + 1200080426 | 0;
        d2 = (d2 << 12 | d2 >>> 20) + a | 0;
        c2 += (d2 & a | ~d2 & b2) + k[6] - 1473231341 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
        b2 += (c2 & d2 | ~c2 & a) + k[7] - 45705983 | 0;
        b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
        a += (b2 & c2 | ~b2 & d2) + k[8] + 1770035416 | 0;
        a = (a << 7 | a >>> 25) + b2 | 0;
        d2 += (a & b2 | ~a & c2) + k[9] - 1958414417 | 0;
        d2 = (d2 << 12 | d2 >>> 20) + a | 0;
        c2 += (d2 & a | ~d2 & b2) + k[10] - 42063 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
        b2 += (c2 & d2 | ~c2 & a) + k[11] - 1990404162 | 0;
        b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
        a += (b2 & c2 | ~b2 & d2) + k[12] + 1804603682 | 0;
        a = (a << 7 | a >>> 25) + b2 | 0;
        d2 += (a & b2 | ~a & c2) + k[13] - 40341101 | 0;
        d2 = (d2 << 12 | d2 >>> 20) + a | 0;
        c2 += (d2 & a | ~d2 & b2) + k[14] - 1502002290 | 0;
        c2 = (c2 << 17 | c2 >>> 15) + d2 | 0;
        b2 += (c2 & d2 | ~c2 & a) + k[15] + 1236535329 | 0;
        b2 = (b2 << 22 | b2 >>> 10) + c2 | 0;
        a += (b2 & d2 | c2 & ~d2) + k[1] - 165796510 | 0;
        a = (a << 5 | a >>> 27) + b2 | 0;
        d2 += (a & c2 | b2 & ~c2) + k[6] - 1069501632 | 0;
        d2 = (d2 << 9 | d2 >>> 23) + a | 0;
        c2 += (d2 & b2 | a & ~b2) + k[11] + 643717713 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
        b2 += (c2 & a | d2 & ~a) + k[0] - 373897302 | 0;
        b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
        a += (b2 & d2 | c2 & ~d2) + k[5] - 701558691 | 0;
        a = (a << 5 | a >>> 27) + b2 | 0;
        d2 += (a & c2 | b2 & ~c2) + k[10] + 38016083 | 0;
        d2 = (d2 << 9 | d2 >>> 23) + a | 0;
        c2 += (d2 & b2 | a & ~b2) + k[15] - 660478335 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
        b2 += (c2 & a | d2 & ~a) + k[4] - 405537848 | 0;
        b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
        a += (b2 & d2 | c2 & ~d2) + k[9] + 568446438 | 0;
        a = (a << 5 | a >>> 27) + b2 | 0;
        d2 += (a & c2 | b2 & ~c2) + k[14] - 1019803690 | 0;
        d2 = (d2 << 9 | d2 >>> 23) + a | 0;
        c2 += (d2 & b2 | a & ~b2) + k[3] - 187363961 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
        b2 += (c2 & a | d2 & ~a) + k[8] + 1163531501 | 0;
        b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
        a += (b2 & d2 | c2 & ~d2) + k[13] - 1444681467 | 0;
        a = (a << 5 | a >>> 27) + b2 | 0;
        d2 += (a & c2 | b2 & ~c2) + k[2] - 51403784 | 0;
        d2 = (d2 << 9 | d2 >>> 23) + a | 0;
        c2 += (d2 & b2 | a & ~b2) + k[7] + 1735328473 | 0;
        c2 = (c2 << 14 | c2 >>> 18) + d2 | 0;
        b2 += (c2 & a | d2 & ~a) + k[12] - 1926607734 | 0;
        b2 = (b2 << 20 | b2 >>> 12) + c2 | 0;
        a += (b2 ^ c2 ^ d2) + k[5] - 378558 | 0;
        a = (a << 4 | a >>> 28) + b2 | 0;
        d2 += (a ^ b2 ^ c2) + k[8] - 2022574463 | 0;
        d2 = (d2 << 11 | d2 >>> 21) + a | 0;
        c2 += (d2 ^ a ^ b2) + k[11] + 1839030562 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
        b2 += (c2 ^ d2 ^ a) + k[14] - 35309556 | 0;
        b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
        a += (b2 ^ c2 ^ d2) + k[1] - 1530992060 | 0;
        a = (a << 4 | a >>> 28) + b2 | 0;
        d2 += (a ^ b2 ^ c2) + k[4] + 1272893353 | 0;
        d2 = (d2 << 11 | d2 >>> 21) + a | 0;
        c2 += (d2 ^ a ^ b2) + k[7] - 155497632 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
        b2 += (c2 ^ d2 ^ a) + k[10] - 1094730640 | 0;
        b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
        a += (b2 ^ c2 ^ d2) + k[13] + 681279174 | 0;
        a = (a << 4 | a >>> 28) + b2 | 0;
        d2 += (a ^ b2 ^ c2) + k[0] - 358537222 | 0;
        d2 = (d2 << 11 | d2 >>> 21) + a | 0;
        c2 += (d2 ^ a ^ b2) + k[3] - 722521979 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
        b2 += (c2 ^ d2 ^ a) + k[6] + 76029189 | 0;
        b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
        a += (b2 ^ c2 ^ d2) + k[9] - 640364487 | 0;
        a = (a << 4 | a >>> 28) + b2 | 0;
        d2 += (a ^ b2 ^ c2) + k[12] - 421815835 | 0;
        d2 = (d2 << 11 | d2 >>> 21) + a | 0;
        c2 += (d2 ^ a ^ b2) + k[15] + 530742520 | 0;
        c2 = (c2 << 16 | c2 >>> 16) + d2 | 0;
        b2 += (c2 ^ d2 ^ a) + k[2] - 995338651 | 0;
        b2 = (b2 << 23 | b2 >>> 9) + c2 | 0;
        a += (c2 ^ (b2 | ~d2)) + k[0] - 198630844 | 0;
        a = (a << 6 | a >>> 26) + b2 | 0;
        d2 += (b2 ^ (a | ~c2)) + k[7] + 1126891415 | 0;
        d2 = (d2 << 10 | d2 >>> 22) + a | 0;
        c2 += (a ^ (d2 | ~b2)) + k[14] - 1416354905 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
        b2 += (d2 ^ (c2 | ~a)) + k[5] - 57434055 | 0;
        b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
        a += (c2 ^ (b2 | ~d2)) + k[12] + 1700485571 | 0;
        a = (a << 6 | a >>> 26) + b2 | 0;
        d2 += (b2 ^ (a | ~c2)) + k[3] - 1894986606 | 0;
        d2 = (d2 << 10 | d2 >>> 22) + a | 0;
        c2 += (a ^ (d2 | ~b2)) + k[10] - 1051523 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
        b2 += (d2 ^ (c2 | ~a)) + k[1] - 2054922799 | 0;
        b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
        a += (c2 ^ (b2 | ~d2)) + k[8] + 1873313359 | 0;
        a = (a << 6 | a >>> 26) + b2 | 0;
        d2 += (b2 ^ (a | ~c2)) + k[15] - 30611744 | 0;
        d2 = (d2 << 10 | d2 >>> 22) + a | 0;
        c2 += (a ^ (d2 | ~b2)) + k[6] - 1560198380 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
        b2 += (d2 ^ (c2 | ~a)) + k[13] + 1309151649 | 0;
        b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
        a += (c2 ^ (b2 | ~d2)) + k[4] - 145523070 | 0;
        a = (a << 6 | a >>> 26) + b2 | 0;
        d2 += (b2 ^ (a | ~c2)) + k[11] - 1120210379 | 0;
        d2 = (d2 << 10 | d2 >>> 22) + a | 0;
        c2 += (a ^ (d2 | ~b2)) + k[2] + 718787259 | 0;
        c2 = (c2 << 15 | c2 >>> 17) + d2 | 0;
        b2 += (d2 ^ (c2 | ~a)) + k[9] - 343485551 | 0;
        b2 = (b2 << 21 | b2 >>> 11) + c2 | 0;
        x[0] = a + x[0] | 0;
        x[1] = b2 + x[1] | 0;
        x[2] = c2 + x[2] | 0;
        x[3] = d2 + x[3] | 0;
      }
      function md5blk(s2) {
        var md5blks = [], i2;
        for (i2 = 0; i2 < 64; i2 += 4) {
          md5blks[i2 >> 2] = s2.charCodeAt(i2) + (s2.charCodeAt(i2 + 1) << 8) + (s2.charCodeAt(i2 + 2) << 16) + (s2.charCodeAt(i2 + 3) << 24);
        }
        return md5blks;
      }
      function md5blk_array(a) {
        var md5blks = [], i2;
        for (i2 = 0; i2 < 64; i2 += 4) {
          md5blks[i2 >> 2] = a[i2] + (a[i2 + 1] << 8) + (a[i2 + 2] << 16) + (a[i2 + 3] << 24);
        }
        return md5blks;
      }
      function md51(s2) {
        var n = s2.length, state = [1732584193, -271733879, -1732584194, 271733878], i2, length, tail, tmp, lo, hi;
        for (i2 = 64; i2 <= n; i2 += 64) {
          md5cycle(state, md5blk(s2.substring(i2 - 64, i2)));
        }
        s2 = s2.substring(i2 - 64);
        length = s2.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= s2.charCodeAt(i2) << (i2 % 4 << 3);
        }
        tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
        if (i2 > 55) {
          md5cycle(state, tail);
          for (i2 = 0; i2 < 16; i2 += 1) {
            tail[i2] = 0;
          }
        }
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(state, tail);
        return state;
      }
      function md51_array(a) {
        var n = a.length, state = [1732584193, -271733879, -1732584194, 271733878], i2, length, tail, tmp, lo, hi;
        for (i2 = 64; i2 <= n; i2 += 64) {
          md5cycle(state, md5blk_array(a.subarray(i2 - 64, i2)));
        }
        a = i2 - 64 < n ? a.subarray(i2 - 64) : new Uint8Array(0);
        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= a[i2] << (i2 % 4 << 3);
        }
        tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
        if (i2 > 55) {
          md5cycle(state, tail);
          for (i2 = 0; i2 < 16; i2 += 1) {
            tail[i2] = 0;
          }
        }
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(state, tail);
        return state;
      }
      function rhex(n) {
        var s2 = "", j;
        for (j = 0; j < 4; j += 1) {
          s2 += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
        }
        return s2;
      }
      function hex(x) {
        var i2;
        for (i2 = 0; i2 < x.length; i2 += 1) {
          x[i2] = rhex(x[i2]);
        }
        return x.join("");
      }
      if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592")
        ;
      if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) {
        (function() {
          function clamp(val, length) {
            val = val | 0 || 0;
            if (val < 0) {
              return Math.max(val + length, 0);
            }
            return Math.min(val, length);
          }
          ArrayBuffer.prototype.slice = function(from, to) {
            var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
            if (to !== undefined$1) {
              end = clamp(to, length);
            }
            if (begin > end) {
              return new ArrayBuffer(0);
            }
            num = end - begin;
            target = new ArrayBuffer(num);
            targetArray = new Uint8Array(target);
            sourceArray = new Uint8Array(this, begin, num);
            targetArray.set(sourceArray);
            return target;
          };
        })();
      }
      function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
          str = unescape(encodeURIComponent(str));
        }
        return str;
      }
      function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i2;
        for (i2 = 0; i2 < length; i2 += 1) {
          arr[i2] = str.charCodeAt(i2);
        }
        return returnUInt8Array ? arr : buff;
      }
      function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
      }
      function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);
        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);
        return result;
      }
      function hexToBinaryString(hex2) {
        var bytes = [], length = hex2.length, x;
        for (x = 0; x < length - 1; x += 2) {
          bytes.push(parseInt(hex2.substr(x, 2), 16));
        }
        return String.fromCharCode.apply(String, bytes);
      }
      function SparkMD52() {
        this.reset();
      }
      SparkMD52.prototype.append = function(str) {
        this.appendBinary(toUtf8(str));
        return this;
      };
      SparkMD52.prototype.appendBinary = function(contents) {
        this._buff += contents;
        this._length += contents.length;
        var length = this._buff.length, i2;
        for (i2 = 64; i2 <= length; i2 += 64) {
          md5cycle(this._hash, md5blk(this._buff.substring(i2 - 64, i2)));
        }
        this._buff = this._buff.substring(i2 - 64);
        return this;
      };
      SparkMD52.prototype.end = function(raw) {
        var buff = this._buff, length = buff.length, i2, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ret;
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= buff.charCodeAt(i2) << (i2 % 4 << 3);
        }
        this._finish(tail, length);
        ret = hex(this._hash);
        if (raw) {
          ret = hexToBinaryString(ret);
        }
        this.reset();
        return ret;
      };
      SparkMD52.prototype.reset = function() {
        this._buff = "";
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];
        return this;
      };
      SparkMD52.prototype.getState = function() {
        return {
          buff: this._buff,
          length: this._length,
          hash: this._hash.slice()
        };
      };
      SparkMD52.prototype.setState = function(state) {
        this._buff = state.buff;
        this._length = state.length;
        this._hash = state.hash;
        return this;
      };
      SparkMD52.prototype.destroy = function() {
        delete this._hash;
        delete this._buff;
        delete this._length;
      };
      SparkMD52.prototype._finish = function(tail, length) {
        var i2 = length, tmp, lo, hi;
        tail[i2 >> 2] |= 128 << (i2 % 4 << 3);
        if (i2 > 55) {
          md5cycle(this._hash, tail);
          for (i2 = 0; i2 < 16; i2 += 1) {
            tail[i2] = 0;
          }
        }
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
      };
      SparkMD52.hash = function(str, raw) {
        return SparkMD52.hashBinary(toUtf8(str), raw);
      };
      SparkMD52.hashBinary = function(content, raw) {
        var hash = md51(content), ret = hex(hash);
        return raw ? hexToBinaryString(ret) : ret;
      };
      SparkMD52.ArrayBuffer = function() {
        this.reset();
      };
      SparkMD52.ArrayBuffer.prototype.append = function(arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr), length = buff.length, i2;
        this._length += arr.byteLength;
        for (i2 = 64; i2 <= length; i2 += 64) {
          md5cycle(this._hash, md5blk_array(buff.subarray(i2 - 64, i2)));
        }
        this._buff = i2 - 64 < length ? new Uint8Array(buff.buffer.slice(i2 - 64)) : new Uint8Array(0);
        return this;
      };
      SparkMD52.ArrayBuffer.prototype.end = function(raw) {
        var buff = this._buff, length = buff.length, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], i2, ret;
        for (i2 = 0; i2 < length; i2 += 1) {
          tail[i2 >> 2] |= buff[i2] << (i2 % 4 << 3);
        }
        this._finish(tail, length);
        ret = hex(this._hash);
        if (raw) {
          ret = hexToBinaryString(ret);
        }
        this.reset();
        return ret;
      };
      SparkMD52.ArrayBuffer.prototype.reset = function() {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];
        return this;
      };
      SparkMD52.ArrayBuffer.prototype.getState = function() {
        var state = SparkMD52.prototype.getState.call(this);
        state.buff = arrayBuffer2Utf8Str(state.buff);
        return state;
      };
      SparkMD52.ArrayBuffer.prototype.setState = function(state) {
        state.buff = utf8Str2ArrayBuffer(state.buff, true);
        return SparkMD52.prototype.setState.call(this, state);
      };
      SparkMD52.ArrayBuffer.prototype.destroy = SparkMD52.prototype.destroy;
      SparkMD52.ArrayBuffer.prototype._finish = SparkMD52.prototype._finish;
      SparkMD52.ArrayBuffer.hash = function(arr, raw) {
        var hash = md51_array(new Uint8Array(arr)), ret = hex(hash);
        return raw ? hexToBinaryString(ret) : ret;
      };
      return SparkMD52;
    });
  })(sparkMd5);
  var sparkMd5Exports = sparkMd5.exports;
  var SparkMD5 = /* @__PURE__ */ getDefaultExportFromCjs(sparkMd5Exports);
  const StickersMap = /* @__PURE__ */ new Map([
    ["AgADAQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/000.png"],
    ["AgADAgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/001.png"],
    ["AgADFQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/002.png"],
    ["AgADAwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/003.png"],
    ["AgADBQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/004.png"],
    ["AgADBgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/005.png"],
    ["AgADBwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/006.png"],
    ["AgADEwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/007.png"],
    ["AgADCAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/008.png"],
    ["AgADEQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/009.png"],
    ["AgADCQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/010.png"],
    ["AgADEAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/011.png"],
    ["AgADCgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/012.png"],
    ["AgADCwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/013.png"],
    ["AgADEgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/014.png"],
    ["AgADDAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/015.png"],
    ["AgADDQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/016.png"],
    ["AgADDgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/017.png"],
    ["AgADDwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/018.png"],
    ["AgADFAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/019.png"],
    ["AgADFgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/020.png"],
    ["AgADGAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/021.png"],
    ["AgADGQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/022.png"],
    ["AgADGgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/023.png"],
    ["AgADGwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/024.png"],
    ["AgADHAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/025.png"],
    ["AgADHQADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/026.png"],
    ["AgADHgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/027.png"],
    ["AgADHwADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/028.png"],
    ["AgADIAADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/029.png"],
    ["AgADWgADwDZPEw", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/030.png"],
    ["AgAD6RsAAoV_EEk", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/031.png"],
    ["AgADnx4AAjpJKUk", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/032.png"],
    ["AgADexwAAujVUEk", "https://cyan-2048.github.io/kaigram-assets/stickers/HotCherry/033.png"],
    ["AgAD8gADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/000.png"],
    ["AgADBAEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/001.png"],
    ["AgAD_gADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/002.png"],
    ["AgAD_wADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/003.png"],
    ["AgADAQEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/004.png"],
    ["AgAD8wADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/005.png"],
    ["AgAD9AADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/006.png"],
    ["AgAD9QADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/007.png"],
    ["AgAD9gADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/008.png"],
    ["AgAD9wADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/009.png"],
    ["AgAD-AADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/010.png"],
    ["AgADBwEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/011.png"],
    ["AgAD-QADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/012.png"],
    ["AgADBQEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/013.png"],
    ["AgAD-gADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/014.png"],
    ["AgAD-wADVp29Cg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/015.png"],
    ["AgADAgEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/016.png"],
    ["AgADAwEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/017.png"],
    ["AgADBgEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/018.png"],
    ["AgADCAEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/019.png"],
    ["AgADCQEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/020.png"],
    ["AgADCwEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/021.png"],
    ["AgADDAEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/022.png"],
    ["AgADDQEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/023.png"],
    ["AgADDgEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/024.png"],
    ["AgAD2gEAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/025.png"],
    ["AgADSAIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/026.png"],
    ["AgADSQIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/027.png"],
    ["AgADTwIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/028.png"],
    ["AgADSgIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/029.png"],
    ["AgADryUAApuicEs", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/030.png"],
    ["AgADTgIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/031.png"],
    ["AgADTQIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/032.png"],
    ["AgADSwIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/033.png"],
    ["AgADUAIAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/034.png"],
    ["AgADBQMAAladvQo", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/035.png"],
    ["AgADex0AAkWOKUg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/036.png"],
    ["AgADQxgAArbIKUg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/037.png"],
    ["AgADXhgAAogOKEg", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/038.png"],
    ["AgADRh4AAvyUOEk", "https://cyan-2048.github.io/kaigram-assets/stickers/UtyaDuck/039.png"],
    ["AgADLQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/000.png"],
    ["AgADLgMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/001.png"],
    ["AgADLwMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/002.png"],
    ["AgADSAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/003.png"],
    ["AgADMgMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/004.png"],
    ["AgADMwMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/005.png"],
    ["AgADNAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/006.png"],
    ["AgADPAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/007.png"],
    ["AgADNQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/008.png"],
    ["AgADNgMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/009.png"],
    ["AgADNwMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/010.png"],
    ["AgADOAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/011.png"],
    ["AgADOgMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/012.png"],
    ["AgADOwMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/013.png"],
    ["AgADRwMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/014.png"],
    ["AgADPQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/015.png"],
    ["AgADPgMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/016.png"],
    ["AgADOQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/017.png"],
    ["AgADPwMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/018.png"],
    ["AgADQAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/019.png"],
    ["AgADQQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/020.png"],
    ["AgADSQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/021.png"],
    ["AgADRAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/022.png"],
    ["AgADRQMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/023.png"],
    ["AgADRgMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/024.png"],
    ["AgADTAMAAsbMYwI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/025.png"],
    ["AgADhwwAAnou0Eo", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/026.png"],
    ["AgAD8RIAAsYwAAFI", "https://cyan-2048.github.io/kaigram-assets/stickers/MiBunny/027.png"],
    ["AgADKwwAAhU6cEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/000.png"],
    ["AgAD0wgAAmxpeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/001.png"],
    ["AgADFwkAAobXeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/002.png"],
    ["AgADtAkAAoK1eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/003.png"],
    ["AgADTQkAAnYreUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/004.png"],
    ["AgADQAoAA4h4SA", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/005.png"],
    ["AgADgAoAAn-IeUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/006.png"],
    ["AgADPgoAAkRoeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/007.png"],
    ["AgADGAwAAvE8eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/008.png"],
    ["AgADcAkAAuE_eEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/009.png"],
    ["AgADGgcAAnT3eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/010.png"],
    ["AgADowkAAmgQeUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/011.png"],
    ["AgAD2gcAAriHeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/012.png"],
    ["AgAD1gkAAqn5eEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/013.png"],
    ["AgAD5wgAAjWteUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/014.png"],
    ["AgADNwgAArkCeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/015.png"],
    ["AgADZQoAAh8veUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/016.png"],
    ["AgADlwoAAubLeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/017.png"],
    ["AgADqQkAAkFKeUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/018.png"],
    ["AgADZgoAAgUzcUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/019.png"],
    ["AgADNggAAmb_cUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/020.png"],
    ["AgADdwkAAodNeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/021.png"],
    ["AgADpgcAAqrieUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/022.png"],
    ["AgADiwgAAub8cUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/023.png"],
    ["AgADpQoAAn9_eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/024.png"],
    ["AgADLQkAAun1eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/025.png"],
    ["AgADWwgAApI_cEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/026.png"],
    ["AgADHAkAAjvxcUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/027.png"],
    ["AgADoQkAAkkNcUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/028.png"],
    ["AgADLQ4AAquAeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/029.png"],
    ["AgADwgcAAnpyeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/030.png"],
    ["AgADTAkAAoF-eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/031.png"],
    ["AgADmwgAAuEyeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/032.png"],
    ["AgADKQkAArZCeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/033.png"],
    ["AgADPAkAAt2zeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/034.png"],
    ["AgADyggAAu5ucEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/035.png"],
    ["AgADUQsAAuyPeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/036.png"],
    ["AgAD8AkAAjD9eUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/037.png"],
    ["AgADSAkAAm6KeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/038.png"],
    ["AgADBAkAAhKSeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/039.png"],
    ["AgAD1woAAkaxeUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/040.png"],
    ["AgADQQkAApzGeUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/041.png"],
    ["AgADzggAAsG1cEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/042.png"],
    ["AgADTQcAAvwNeUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/043.png"],
    ["AgADOgkAAlIeeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/044.png"],
    ["AgADswkAAnBRcEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/045.png"],
    ["AgADFAoAAjPpeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/046.png"],
    ["AgADYAkAArJKcUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/047.png"],
    ["AgADNggAAg0ZeEg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/048.png"],
    ["AgADQQoAAuSZyUg", "https://cyan-2048.github.io/kaigram-assets/stickers/NarkoLilAladin/049.png"]
  ]);
  const categories = {
    Symbols: 7,
    Activities: 5,
    Flags: 8,
    "Travel & Places": 4,
    "Food & Drink": 3,
    "Animals & Nature": 2,
    "People & Body": 1,
    Objects: 6,
    "Smileys & Emotion": 0
    /* Smileys */
  };
  console.log("HEAVY TASKS WORKER");
  function md5(buffer) {
    const e2 = SparkMD5.ArrayBuffer.hash(buffer);
    return e2;
  }
  const categoryPlusEmojis = {
    "Smileys & Emotion": [
      ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "🫠", "😉"],
      ["😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "☺️", "😚", "😙", "🥲", "😋"],
      ["😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣", "🤫", "🤔", "🫡"],
      ["🤐", "🤨", "😐", "😑", "😶", "🫥", "😶‍🌫️", "😏", "😒", "🙄", "😬", "😮‍💨"],
      ["🤥", "🫨", "🙂‍↔️", "🙂‍↕️", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"],
      ["🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "😵‍💫", "🤯", "🤠", "🥳", "🥸"],
      ["😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "☹️", "😮", "😯", "😲", "😳"],
      ["🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣"],
      ["😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀"],
      ["☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹"],
      ["😻", "😼", "😽", "🙀", "😿", "😾", "🙈", "🙉", "🙊", "💌", "💘", "💝"],
      ["💖", "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️‍🔥", "❤️‍🩹", "❤️", "🩷"],
      ["🧡", "💛", "💚", "💙", "🩵", "💜", "🤎", "🖤", "🩶", "🤍", "💋", "💯"],
      ["💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤"]
    ],
    "People & Body": [
      ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "🫷", "🫸", "👌"],
      ["🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕"],
      ["👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶"],
      ["👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶"],
      ["👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"],
      ["🫦", "👶", "🧒", "👦", "👧", "🧑", "👱", "👨", "🧔", "🧔‍♂️", "🧔‍♀️", "👨‍🦰"],
      ["👨‍🦱", "👨‍🦳", "👨‍🦲", "👩", "👩‍🦰", "🧑‍🦰", "👩‍🦱", "🧑‍🦱", "👩‍🦳", "🧑‍🦳", "👩‍🦲", "🧑‍🦲"],
      ["👱‍♀️", "👱‍♂️", "🧓", "👴", "👵", "🙍", "🙍‍♂️", "🙍‍♀️", "🙎", "🙎‍♂️", "🙎‍♀️", "🙅"],
      ["🙅‍♂️", "🙅‍♀️", "🙆", "🙆‍♂️", "🙆‍♀️", "💁", "💁‍♂️", "💁‍♀️", "🙋", "🙋‍♂️", "🙋‍♀️", "🧏"],
      ["🧏‍♂️", "🧏‍♀️", "🙇", "🙇‍♂️", "🙇‍♀️", "🤦", "🤦‍♂️", "🤦‍♀️", "🤷", "🤷‍♂️", "🤷‍♀️", "🧑‍⚕️"],
      ["👨‍⚕️", "👩‍⚕️", "🧑‍🎓", "👨‍🎓", "👩‍🎓", "🧑‍🏫", "👨‍🏫", "👩‍🏫", "🧑‍⚖️", "👨‍⚖️", "👩‍⚖️", "🧑‍🌾"],
      ["👨‍🌾", "👩‍🌾", "🧑‍🍳", "👨‍🍳", "👩‍🍳", "🧑‍🔧", "👨‍🔧", "👩‍🔧", "🧑‍🏭", "👨‍🏭", "👩‍🏭", "🧑‍💼"],
      ["👨‍💼", "👩‍💼", "🧑‍🔬", "👨‍🔬", "👩‍🔬", "🧑‍💻", "👨‍💻", "👩‍💻", "🧑‍🎤", "👨‍🎤", "👩‍🎤", "🧑‍🎨"],
      ["👨‍🎨", "👩‍🎨", "🧑‍✈️", "👨‍✈️", "👩‍✈️", "🧑‍🚀", "👨‍🚀", "👩‍🚀", "🧑‍🚒", "👨‍🚒", "👩‍🚒", "👮"],
      ["👮‍♂️", "👮‍♀️", "🕵️", "🕵️‍♂️", "🕵️‍♀️", "💂", "💂‍♂️", "💂‍♀️", "🥷", "👷", "👷‍♂️", "👷‍♀️"],
      ["🫅", "🤴", "👸", "👳", "👳‍♂️", "👳‍♀️", "👲", "🧕", "🤵", "🤵‍♂️", "🤵‍♀️", "👰"],
      ["👰‍♂️", "👰‍♀️", "🤰", "🫃", "🫄", "🤱", "👩‍🍼", "👨‍🍼", "🧑‍🍼", "👼", "🎅", "🤶"],
      ["🧑‍🎄", "🦸", "🦸‍♂️", "🦸‍♀️", "🦹", "🦹‍♂️", "🦹‍♀️", "🧙", "🧙‍♂️", "🧙‍♀️", "🧚", "🧚‍♂️"],
      ["🧚‍♀️", "🧛", "🧛‍♂️", "🧛‍♀️", "🧜", "🧜‍♂️", "🧜‍♀️", "🧝", "🧝‍♂️", "🧝‍♀️", "🧞", "🧞‍♂️"],
      ["🧞‍♀️", "🧟", "🧟‍♂️", "🧟‍♀️", "🧌", "💆", "💆‍♂️", "💆‍♀️", "💇", "💇‍♂️", "💇‍♀️", "🚶"],
      ["🚶‍♂️", "🚶‍♀️", "🚶‍➡️", "🚶‍♀️‍➡️", "🚶‍♂️‍➡️", "🧍", "🧍‍♂️", "🧍‍♀️", "🧎", "🧎‍♂️", "🧎‍♀️", "🧎‍➡️"],
      ["🧎‍♀️‍➡️", "🧎‍♂️‍➡️", "🧑‍🦯", "🧑‍🦯‍➡️", "👨‍🦯", "👨‍🦯‍➡️", "👩‍🦯", "👩‍🦯‍➡️", "🧑‍🦼", "🧑‍🦼‍➡️", "👨‍🦼", "👨‍🦼‍➡️"],
      ["👩‍🦼", "👩‍🦼‍➡️", "🧑‍🦽", "🧑‍🦽‍➡️", "👨‍🦽", "👨‍🦽‍➡️", "👩‍🦽", "👩‍🦽‍➡️", "🏃", "🏃‍♂️", "🏃‍♀️", "🏃‍➡️"],
      ["🏃‍♀️‍➡️", "🏃‍♂️‍➡️", "💃", "🕺", "🕴️", "👯", "👯‍♂️", "👯‍♀️", "🧖", "🧖‍♂️", "🧖‍♀️", "🧗"],
      ["🧗‍♂️", "🧗‍♀️", "🤺", "🏇", "⛷️", "🏂", "🏌️", "🏌️‍♂️", "🏌️‍♀️", "🏄", "🏄‍♂️", "🏄‍♀️"],
      ["🚣", "🚣‍♂️", "🚣‍♀️", "🏊", "🏊‍♂️", "🏊‍♀️", "⛹️", "⛹️‍♂️", "⛹️‍♀️", "🏋️", "🏋️‍♂️", "🏋️‍♀️"],
      ["🚴", "🚴‍♂️", "🚴‍♀️", "🚵", "🚵‍♂️", "🚵‍♀️", "🤸", "🤸‍♂️", "🤸‍♀️", "🤼", "🤼‍♂️", "🤼‍♀️"],
      ["🤽", "🤽‍♂️", "🤽‍♀️", "🤾", "🤾‍♂️", "🤾‍♀️", "🤹", "🤹‍♂️", "🤹‍♀️", "🧘", "🧘‍♂️", "🧘‍♀️"],
      ["🛀", "🛌", "🧑‍🤝‍🧑", "👭", "👫", "👬", "💏", "👩‍❤️‍💋‍👨", "👨‍❤️‍💋‍👨", "👩‍❤️‍💋‍👩", "💑", "👩‍❤️‍👨"],
      ["👨‍❤️‍👨", "👩‍❤️‍👩", "👨‍👩‍👦", "👨‍👩‍👧", "👨‍👩‍👧‍👦", "👨‍👩‍👦‍👦", "👨‍👩‍👧‍👧", "👨‍👨‍👦", "👨‍👨‍👧", "👨‍👨‍👧‍👦", "👨‍👨‍👦‍👦", "👨‍👨‍👧‍👧"],
      ["👩‍👩‍👦", "👩‍👩‍👧", "👩‍👩‍👧‍👦", "👩‍👩‍👦‍👦", "👩‍👩‍👧‍👧", "👨‍👦", "👨‍👦‍👦", "👨‍👧", "👨‍👧‍👦", "👨‍👧‍👧", "👩‍👦", "👩‍👦‍👦"],
      ["👩‍👧", "👩‍👧‍👦", "👩‍👧‍👧", "🗣️", "👤", "👥", "🫂", "👪", "🧑‍🧑‍🧒", "🧑‍🧑‍🧒‍🧒", "🧑‍🧒", "🧑‍🧒‍🧒"],
      ["👣"]
    ],
    Component: [["🏻", "🏼", "🏽", "🏾", "🏿"]],
    "Animals & Nature": [
      ["🐵", "🐒", "🦍", "🦧", "🐶", "🐕", "🦮", "🐕‍🦺", "🐩", "🐺", "🦊", "🦝"],
      ["🐱", "🐈", "🐈‍⬛", "🦁", "🐯", "🐅", "🐆", "🐴", "🫎", "🫏", "🐎", "🦄"],
      ["🦓", "🦌", "🦬", "🐮", "🐂", "🐃", "🐄", "🐷", "🐖", "🐗", "🐽", "🐏"],
      ["🐑", "🐐", "🐪", "🐫", "🦙", "🦒", "🐘", "🦣", "🦏", "🦛", "🐭", "🐁"],
      ["🐀", "🐹", "🐰", "🐇", "🐿️", "🦫", "🦔", "🦇", "🐻", "🐻‍❄️", "🐨", "🐼"],
      ["🦥", "🦦", "🦨", "🦘", "🦡", "🐾", "🦃", "🐔", "🐓", "🐣", "🐤", "🐥"],
      ["🐦", "🐧", "🕊️", "🦅", "🦆", "🦢", "🦉", "🦤", "🪶", "🦩", "🦚", "🦜"],
      ["🪽", "🐦‍⬛", "🪿", "🐦‍🔥", "🐸", "🐊", "🐢", "🦎", "🐍", "🐲", "🐉", "🦕"],
      ["🦖", "🐳", "🐋", "🐬", "🦭", "🐟", "🐠", "🐡", "🦈", "🐙", "🐚", "🪸"],
      ["🪼", "🐌", "🦋", "🐛", "🐜", "🐝", "🪲", "🐞", "🦗", "🪳", "🕷️", "🕸️"],
      ["🦂", "🦟", "🪰", "🪱", "🦠", "💐", "🌸", "💮", "🪷", "🏵️", "🌹", "🥀"],
      ["🌺", "🌻", "🌼", "🌷", "🪻", "🌱", "🪴", "🌲", "🌳", "🌴", "🌵", "🌾"],
      ["🌿", "☘️", "🍀", "🍁", "🍂", "🍃", "🪹", "🪺", "🍄"]
    ],
    "Food & Drink": [
      ["🍇", "🍈", "🍉", "🍊", "🍋", "🍋‍🟩", "🍌", "🍍", "🥭", "🍎", "🍏", "🍐"],
      ["🍑", "🍒", "🍓", "🫐", "🥝", "🍅", "🫒", "🥥", "🥑", "🍆", "🥔", "🥕"],
      ["🌽", "🌶️", "🫑", "🥒", "🥬", "🥦", "🧄", "🧅", "🥜", "🫘", "🌰", "🫚"],
      ["🫛", "🍄‍🟫", "🍞", "🥐", "🥖", "🫓", "🥨", "🥯", "🥞", "🧇", "🧀", "🍖"],
      ["🍗", "🥩", "🥓", "🍔", "🍟", "🍕", "🌭", "🥪", "🌮", "🌯", "🫔", "🥙"],
      ["🧆", "🥚", "🍳", "🥘", "🍲", "🫕", "🥣", "🥗", "🍿", "🧈", "🧂", "🥫"],
      ["🍱", "🍘", "🍙", "🍚", "🍛", "🍜", "🍝", "🍠", "🍢", "🍣", "🍤", "🍥"],
      ["🥮", "🍡", "🥟", "🥠", "🥡", "🦀", "🦞", "🦐", "🦑", "🦪", "🍦", "🍧"],
      ["🍨", "🍩", "🍪", "🎂", "🍰", "🧁", "🥧", "🍫", "🍬", "🍭", "🍮", "🍯"],
      ["🍼", "🥛", "☕", "🫖", "🍵", "🍶", "🍾", "🍷", "🍸", "🍹", "🍺", "🍻"],
      ["🥂", "🥃", "🫗", "🥤", "🧋", "🧃", "🧉", "🧊", "🥢", "🍽️", "🍴", "🥄"],
      ["🔪", "🫙", "🏺"]
    ],
    "Travel & Places": [
      ["🌍", "🌎", "🌏", "🌐", "🗺️", "🗾", "🧭", "🏔️", "⛰️", "🌋", "🗻", "🏕️"],
      ["🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱", "🪨", "🪵", "🛖", "🏘️"],
      ["🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨", "🏩", "🏪", "🏫"],
      ["🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽", "⛪", "🕌", "🛕", "🕍", "⛩️"],
      ["🕋", "⛲", "⛺", "🌁", "🌃", "🏙️", "🌄", "🌅", "🌆", "🌇", "🌉", "♨️"],
      ["🎠", "🛝", "🎡", "🎢", "💈", "🎪", "🚂", "🚃", "🚄", "🚅", "🚆", "🚇"],
      ["🚈", "🚉", "🚊", "🚝", "🚞", "🚋", "🚌", "🚍", "🚎", "🚐", "🚑", "🚒"],
      ["🚓", "🚔", "🚕", "🚖", "🚗", "🚘", "🚙", "🛻", "🚚", "🚛", "🚜", "🏎️"],
      ["🏍️", "🛵", "🦽", "🦼", "🛺", "🚲", "🛴", "🛹", "🛼", "🚏", "🛣️", "🛤️"],
      ["🛢️", "⛽", "🛞", "🚨", "🚥", "🚦", "🛑", "🚧", "⚓", "🛟", "⛵", "🛶"],
      ["🚤", "🛳️", "⛴️", "🛥️", "🚢", "✈️", "🛩️", "🛫", "🛬", "🪂", "💺", "🚁"],
      ["🚟", "🚠", "🚡", "🛰️", "🚀", "🛸", "🛎️", "🧳", "⌛", "⏳", "⌚", "⏰"],
      ["⏱️", "⏲️", "🕰️", "🕛", "🕧", "🕐", "🕜", "🕑", "🕝", "🕒", "🕞", "🕓"],
      ["🕟", "🕔", "🕠", "🕕", "🕡", "🕖", "🕢", "🕗", "🕣", "🕘", "🕤", "🕙"],
      ["🕥", "🕚", "🕦", "🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌙"],
      ["🌚", "🌛", "🌜", "🌡️", "☀️", "🌝", "🌞", "🪐", "⭐", "🌟", "🌠", "🌌"],
      ["☁️", "⛅", "⛈️", "🌤️", "🌥️", "🌦️", "🌧️", "🌨️", "🌩️", "🌪️", "🌫️", "🌬️"],
      ["🌀", "🌈", "🌂", "☂️", "☔", "⛱️", "⚡", "❄️", "☃️", "⛄", "☄️", "🔥"],
      ["💧", "🌊"]
    ],
    Activities: [
      ["🎃", "🎄", "🎆", "🎇", "🧨", "✨", "🎈", "🎉", "🎊", "🎋", "🎍", "🎎"],
      ["🎏", "🎐", "🎑", "🧧", "🎀", "🎁", "🎗️", "🎟️", "🎫", "🎖️", "🏆", "🏅"],
      ["🥇", "🥈", "🥉", "⚽", "⚾", "🥎", "🏀", "🏐", "🏈", "🏉", "🎾", "🥏"],
      ["🎳", "🏏", "🏑", "🏒", "🥍", "🏓", "🏸", "🥊", "🥋", "🥅", "⛳", "⛸️"],
      ["🎣", "🤿", "🎽", "🎿", "🛷", "🥌", "🎯", "🪀", "🪁", "🔫", "🎱", "🔮"],
      ["🪄", "🎮", "🕹️", "🎰", "🎲", "🧩", "🧸", "🪅", "🪩", "🪆", "♠️", "♥️"],
      ["♦️", "♣️", "♟️", "🃏", "🀄", "🎴", "🎭", "🖼️", "🎨", "🧵", "🪡", "🧶"],
      ["🪢"]
    ],
    Objects: [
      ["👓", "🕶️", "🥽", "🥼", "🦺", "👔", "👕", "👖", "🧣", "🧤", "🧥", "🧦"],
      ["👗", "👘", "🥻", "🩱", "🩲", "🩳", "👙", "👚", "🪭", "👛", "👜", "👝"],
      ["🛍️", "🎒", "🩴", "👞", "👟", "🥾", "🥿", "👠", "👡", "🩰", "👢", "🪮"],
      ["👑", "👒", "🎩", "🎓", "🧢", "🪖", "⛑️", "📿", "💄", "💍", "💎", "🔇"],
      ["🔈", "🔉", "🔊", "📢", "📣", "📯", "🔔", "🔕", "🎼", "🎵", "🎶", "🎙️"],
      ["🎚️", "🎛️", "🎤", "🎧", "📻", "🎷", "🪗", "🎸", "🎹", "🎺", "🎻", "🪕"],
      ["🥁", "🪘", "🪇", "🪈", "📱", "📲", "☎️", "📞", "📟", "📠", "🔋", "🪫"],
      ["🔌", "💻", "🖥️", "🖨️", "⌨️", "🖱️", "🖲️", "💽", "💾", "💿", "📀", "🧮"],
      ["🎥", "🎞️", "📽️", "🎬", "📺", "📷", "📸", "📹", "📼", "🔍", "🔎", "🕯️"],
      ["💡", "🔦", "🏮", "🪔", "📔", "📕", "📖", "📗", "📘", "📙", "📚", "📓"],
      ["📒", "📃", "📜", "📄", "📰", "🗞️", "📑", "🔖", "🏷️", "💰", "🪙", "💴"],
      ["💵", "💶", "💷", "💸", "💳", "🧾", "💹", "✉️", "📧", "📨", "📩", "📤"],
      ["📥", "📦", "📫", "📪", "📬", "📭", "📮", "🗳️", "✏️", "✒️", "🖋️", "🖊️"],
      ["🖌️", "🖍️", "📝", "💼", "📁", "📂", "🗂️", "📅", "📆", "🗒️", "🗓️", "📇"],
      ["📈", "📉", "📊", "📋", "📌", "📍", "📎", "🖇️", "📏", "📐", "✂️", "🗃️"],
      ["🗄️", "🗑️", "🔒", "🔓", "🔏", "🔐", "🔑", "🗝️", "🔨", "🪓", "⛏️", "⚒️"],
      ["🛠️", "🗡️", "⚔️", "💣", "🪃", "🏹", "🛡️", "🪚", "🔧", "🪛", "🔩", "⚙️"],
      ["🗜️", "⚖️", "🦯", "🔗", "⛓️‍💥", "⛓️", "🪝", "🧰", "🧲", "🪜", "⚗️", "🧪"],
      ["🧫", "🧬", "🔬", "🔭", "📡", "💉", "🩸", "💊", "🩹", "🩼", "🩺", "🩻"],
      ["🚪", "🛗", "🪞", "🪟", "🛏️", "🛋️", "🪑", "🚽", "🪠", "🚿", "🛁", "🪤"],
      ["🪒", "🧴", "🧷", "🧹", "🧺", "🧻", "🪣", "🧼", "🫧", "🪥", "🧽", "🧯"],
      ["🛒", "🚬", "⚰️", "🪦", "⚱️", "🧿", "🪬", "🗿", "🪧", "🪪"]
    ],
    Symbols: [
      ["🏧", "🚮", "🚰", "♿", "🚹", "🚺", "🚻", "🚼", "🚾", "🛂", "🛃", "🛄"],
      ["🛅", "⚠️", "🚸", "⛔", "🚫", "🚳", "🚭", "🚯", "🚱", "🚷", "📵", "🔞"],
      ["☢️", "☣️", "⬆️", "↗️", "➡️", "↘️", "⬇️", "↙️", "⬅️", "↖️", "↕️", "↔️"],
      ["↩️", "↪️", "⤴️", "⤵️", "🔃", "🔄", "🔙", "🔚", "🔛", "🔜", "🔝", "🛐"],
      ["⚛️", "🕉️", "✡️", "☸️", "☯️", "✝️", "☦️", "☪️", "☮️", "🕎", "🔯", "🪯"],
      ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"],
      ["⛎", "🔀", "🔁", "🔂", "▶️", "⏩", "⏭️", "⏯️", "◀️", "⏪", "⏮️", "🔼"],
      ["⏫", "🔽", "⏬", "⏸️", "⏹️", "⏺️", "⏏️", "🎦", "🔅", "🔆", "📶", "🛜"],
      ["📳", "📴", "⚧️", "✖️", "➕", "➖", "➗", "🟰", "♾️", "‼️", "⁉️", "❓"],
      ["❔", "❕", "❗", "〰️", "💱", "💲", "♻️", "⚜️", "🔱", "📛", "🔰", "⭕"],
      ["✅", "☑️", "✔️", "❌", "❎", "➰", "➿", "〽️", "✳️", "✴️", "❇️", "©️"],
      ["®️", "™️", "#️⃣", "*️⃣", "0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"],
      ["8️⃣", "9️⃣", "🔟", "🔠", "🔡", "🔢", "🔣", "🔤", "🅰️", "🆎", "🅱️", "🆑"],
      ["🆒", "🆓", "ℹ️", "🆔", "Ⓜ️", "🆕", "🆖", "🅾️", "🆗", "🅿️", "🆘", "🆙"],
      ["🆚", "🈁", "🈂️", "🈷️", "🈶", "🈯", "🉐", "🈹", "🈚", "🈲", "🉑", "🈸"],
      ["🈴", "🈳", "㊗️", "㊙️", "🈺", "🈵", "🔴", "🟠", "🟡", "🟢", "🔵", "🟣"],
      ["🟤", "⚫", "⚪", "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "⬛", "⬜"],
      ["◼️", "◻️", "◾", "◽", "▪️", "▫️", "🔶", "🔷", "🔸", "🔹", "🔺", "🔻"],
      ["💠", "🔘", "🔳", "🔲"]
    ],
    Flags: [
      ["🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇦🇨", "🇦🇩", "🇦🇪", "🇦🇫"],
      ["🇦🇬", "🇦🇮", "🇦🇱", "🇦🇲", "🇦🇴", "🇦🇶", "🇦🇷", "🇦🇸", "🇦🇹", "🇦🇺", "🇦🇼", "🇦🇽"],
      ["🇦🇿", "🇧🇦", "🇧🇧", "🇧🇩", "🇧🇪", "🇧🇫", "🇧🇬", "🇧🇭", "🇧🇮", "🇧🇯", "🇧🇱", "🇧🇲"],
      ["🇧🇳", "🇧🇴", "🇧🇶", "🇧🇷", "🇧🇸", "🇧🇹", "🇧🇻", "🇧🇼", "🇧🇾", "🇧🇿", "🇨🇦", "🇨🇨"],
      ["🇨🇩", "🇨🇫", "🇨🇬", "🇨🇭", "🇨🇮", "🇨🇰", "🇨🇱", "🇨🇲", "🇨🇳", "🇨🇴", "🇨🇵", "🇨🇷"],
      ["🇨🇺", "🇨🇻", "🇨🇼", "🇨🇽", "🇨🇾", "🇨🇿", "🇩🇪", "🇩🇬", "🇩🇯", "🇩🇰", "🇩🇲", "🇩🇴"],
      ["🇩🇿", "🇪🇦", "🇪🇨", "🇪🇪", "🇪🇬", "🇪🇭", "🇪🇷", "🇪🇸", "🇪🇹", "🇪🇺", "🇫🇮", "🇫🇯"],
      ["🇫🇰", "🇫🇲", "🇫🇴", "🇫🇷", "🇬🇦", "🇬🇧", "🇬🇩", "🇬🇪", "🇬🇫", "🇬🇬", "🇬🇭", "🇬🇮"],
      ["🇬🇱", "🇬🇲", "🇬🇳", "🇬🇵", "🇬🇶", "🇬🇷", "🇬🇸", "🇬🇹", "🇬🇺", "🇬🇼", "🇬🇾", "🇭🇰"],
      ["🇭🇲", "🇭🇳", "🇭🇷", "🇭🇹", "🇭🇺", "🇮🇨", "🇮🇩", "🇮🇪", "🇮🇱", "🇮🇲", "🇮🇳", "🇮🇴"],
      ["🇮🇶", "🇮🇷", "🇮🇸", "🇮🇹", "🇯🇪", "🇯🇲", "🇯🇴", "🇯🇵", "🇰🇪", "🇰🇬", "🇰🇭", "🇰🇮"],
      ["🇰🇲", "🇰🇳", "🇰🇵", "🇰🇷", "🇰🇼", "🇰🇾", "🇰🇿", "🇱🇦", "🇱🇧", "🇱🇨", "🇱🇮", "🇱🇰"],
      ["🇱🇷", "🇱🇸", "🇱🇹", "🇱🇺", "🇱🇻", "🇱🇾", "🇲🇦", "🇲🇨", "🇲🇩", "🇲🇪", "🇲🇫", "🇲🇬"],
      ["🇲🇭", "🇲🇰", "🇲🇱", "🇲🇲", "🇲🇳", "🇲🇴", "🇲🇵", "🇲🇶", "🇲🇷", "🇲🇸", "🇲🇹", "🇲🇺"],
      ["🇲🇻", "🇲🇼", "🇲🇽", "🇲🇾", "🇲🇿", "🇳🇦", "🇳🇨", "🇳🇪", "🇳🇫", "🇳🇬", "🇳🇮", "🇳🇱"],
      ["🇳🇴", "🇳🇵", "🇳🇷", "🇳🇺", "🇳🇿", "🇴🇲", "🇵🇦", "🇵🇪", "🇵🇫", "🇵🇬", "🇵🇭", "🇵🇰"],
      ["🇵🇱", "🇵🇲", "🇵🇳", "🇵🇷", "🇵🇸", "🇵🇹", "🇵🇼", "🇵🇾", "🇶🇦", "🇷🇪", "🇷🇴", "🇷🇸"],
      ["🇷🇺", "🇷🇼", "🇸🇦", "🇸🇧", "🇸🇨", "🇸🇩", "🇸🇪", "🇸🇬", "🇸🇭", "🇸🇮", "🇸🇯", "🇸🇰"],
      ["🇸🇱", "🇸🇲", "🇸🇳", "🇸🇴", "🇸🇷", "🇸🇸", "🇸🇹", "🇸🇻", "🇸🇽", "🇸🇾", "🇸🇿", "🇹🇦"],
      ["🇹🇨", "🇹🇩", "🇹🇫", "🇹🇬", "🇹🇭", "🇹🇯", "🇹🇰", "🇹🇱", "🇹🇲", "🇹🇳", "🇹🇴", "🇹🇷"],
      ["🇹🇹", "🇹🇻", "🇹🇼", "🇹🇿", "🇺🇦", "🇺🇬", "🇺🇲", "🇺🇳", "🇺🇸", "🇺🇾", "🇺🇿", "🇻🇦"],
      ["🇻🇨", "🇻🇪", "🇻🇬", "🇻🇮", "🇻🇳", "🇻🇺", "🇼🇫", "🇼🇸", "🇽🇰", "🇾🇪", "🇾🇹", "🇿🇦"],
      ["🇿🇲", "🇿🇼", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"]
    ]
  };
  Object.entries(categoryPlusEmojis).forEach((e2) => {
    if (typeof categories[e2[0]] != "undefined")
      categoryPlusEmojis[categories[e2[0]]] = e2[1];
  });
  function _decodeWebP(buffer, scaleCount) {
    return __async(this, null, function* () {
      const result = yield decodeWebP(buffer, scaleCount).catch(() => null);
      return result;
    });
  }
  const exposed = {
    decodeWebP: _decodeWebP,
    md5,
    getEmojiPage: function getEmojiPage(category, page) {
      return categoryPlusEmojis[category][page];
    },
    getLastEmojiPage: function getLastEmojiPage(category) {
      const arr = categoryPlusEmojis[category];
      return arr.length - 1;
    },
    getOptimizedSticker: function getOptimizedSticker(id) {
      return StickersMap.get(id);
    }
  };
  expose(exposed);
})();
