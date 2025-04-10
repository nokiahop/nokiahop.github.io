var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __async = (__this, __arguments, generator) => {
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
System.register(["./index-C8fhbZiK.js", "./abstract-DkGzNGxR.js"], function(exports, module) {
  "use strict";
  var Deque, deeplinkBuilder, assertNever, isPresent, chatFolder, chatInvite, message, Long, normalizeInputReaction, isTlRpcError, basic, BaseStorageDriver, getPlatform, CurrentUserService, __tlWriterMap, __tlReaderMap, UpdatesStateService, DefaultDcsService, MtcuteError, AsyncLock, BaseService, ConditionVariable, EarlyTimer, INVITE_LINK_REGEX, LogManager, Logger, LongMap, LongSet, LruMap, LruSet, ONE, SortedArray, SortedLinkedList, TWO, TlBinaryReader, TlBinaryWriter, TlSerializationCounter, ZERO, addPublicKey, assertTrue, assertTypeIs, assertTypeIsNot, asyncResettable, bigIntAbs, bigIntBitLength, bigIntGcd, bigIntMin, bigIntModInv, bigIntModPow, bigIntToBuffer, bufferToBigInt, bufferToReversed, bufferToStream, buffersEqual, cloneBuffer, compareLongs, composeMiddlewares, computeNewPasswordHash, computePasswordHash, computeSrpParams, concatBuffers, createAesIgeForMessage, createAesIgeForMessageOld, createChunkedReader, createControllablePromise, dataViewFromBuffer, decodeWaveform, defaultProductionDc, defaultProductionIpv6Dc, defaultTestDc, defaultTestIpv6Dc, determinePartSize, encodeInlineMessageId, encodeWaveform, extractFileName, extractUsernames, findKeyByFingerprints, generateKeyAndIvFromNonce, getAllPeersFrom, getBarePeerId, getMarkedPeerId, getRandomInt, hasValueAtKey, inflateSvgPath, inputPeerToPeer, isInputPeerChannel, isInputPeerChat, isInputPeerUser, isProbablyPlainText, jsonToTlJson, longFromBuffer, longFromFastString, longToFastString, makeArrayPaginated, makeArrayWithTotal, millerRabin, mtpAssertTypeIs, normalizeDate, normalizeInlineId, normalizeMessageId, normalizePhoneNumber, parseBasicDcOption, parseInlineMessageId, parseMarkedPeerId, parsePublicKey, randomBigInt, randomBigIntBits, randomBigIntInRange, randomLong, readStringSession, removeFromLongArray, resolveMaybeDynamic, serializeBasicDcOption, sleep, sleepWithAbort, streamToBuffer, strippedPhotoToJpg, svgPathToFile, throttle, timers, tlJsonToJson, toInputChannel, toInputPeer, toInputUser, toggleChannelIdMark, twoMultiplicity, writeStringSession, xorBuffer, xorBufferInPlace, AllStories, Audio, BaseTelegramClient, BaseWebSocketTransport, Boost, BoostSlot, BoostStats, BotChatJoinRequestUpdate, factories, factories$1, factories$2, BotKeyboardBuilder, BotReactionCountUpdate, BotReactionUpdate, BotStoppedUpdate, BusinessAccount, BusinessCallbackQuery, BusinessChatLink, BusinessConnection, BusinessIntro, BusinessMessage, BusinessWorkHours, CallbackQuery, Chat, ChatEvent, ChatInviteLink, ChatInviteLinkMember, ChatJoinRequestUpdate, ChatLocation, ChatMember, ChatMemberUpdate, ChatPermissions, ChatPhoto, ChatPhotoSize, ChatPreview, ChatlistPreview, ChosenInlineResult, CollectibleInfo, Contact, Conversation, DeleteBusinessMessageUpdate, DeleteMessageUpdate, DeleteStoryUpdate, Dialog, Dice, Document, DraftMessage, ExtendedMediaPreview, FactCheck, FileLocation, ForumTopic, FullChat, Game, GameHighScore, HistoryReadUpdate, IdbStorage, IdbStorageDriver, InlineCallbackQuery, InlineQuery, factories$3, IntermediatePacketCodec, Invoice, LiveLocation, Location, MASK_POSITION_POINT_TO_TL, MediaStory, Message, MessageEffect, MessageEntity, MessageForwardInfo, MessageReactions, MessageRepliesInfo, MtArgumentError, MtClient, MtEmptyError, MtInvalidPeerTypeError, MtMessageNotFoundError, MtPeerNotFoundError, MtSecurityError, MtTimeoutError, MtTypeAssertionError, MtUnsupportedError, ObfuscatedPacketCodec, PaddedIntermediatePacketCodec, PaidMedia, PaidPeerReaction, PeerReaction, PeerStories, PeersIndex, Photo, Poll, PollAnswer, PollUpdate, PollVoteUpdate, PreCheckoutQuery, RawDocument, RawLocation, RepliedMessageInfo, SearchFilters, SentCode, SessionConnection, StarGift, StarsStatus, StarsTransaction, Sticker, StickerSet, StorageManager, StoriesStealthMode, Story, StoryInteractions, StoryInteractiveChannelPost, StoryInteractiveLocation, StoryInteractiveReaction, StoryInteractiveUrl, StoryInteractiveVenue, StoryInteractiveWeather, StoryRepost, StoryUpdate, StoryViewer, StoryViewersList, StreamedCodec, TakeoutSession, TelegramClient, TelegramStorageManager, TelegramWorker, TelegramWorkerPort, Thumbnail, TransportError, TransportState, UpdatesManager, User, UserStarGift, UserStatusUpdate, UserTypingUpdate, Venue, Video, Voice, WebCryptoProvider, WebDocument, WebPage, WebPlatform, WebSocketTransport, WrappedCodec, _actionFromTl, _callDiscardReasonFromTl, _callDiscardReasonToTl, _messageActionFromTl, _messageMediaFromTl, _storyInteractiveElementFromTl, businessWorkHoursDaysToRaw, defaultReconnectionStrategy, inputTextToTl, isUploadedFile, tl, normalizeInputMessageId, normalizeInputStickerSet, parsePeer, toReactionEmoji, dayjs, heavyTasks, md, stores, utils, solid, files, signals, BaseCryptoProvider, factorizePQSync;
  return {
    setters: [(module2) => {
      Deque = module2.D;
      deeplinkBuilder = module2.d;
      assertNever = module2.a;
      isPresent = module2.i;
      chatFolder = module2.c;
      chatInvite = module2.b;
      message = module2.m;
      Long = module2.L;
      normalizeInputReaction = module2.n;
      isTlRpcError = module2.e;
      basic = module2.f;
      BaseStorageDriver = module2.B;
      getPlatform = module2.g;
      CurrentUserService = module2.C;
      __tlWriterMap = module2._;
      __tlReaderMap = module2.h;
      UpdatesStateService = module2.U;
      DefaultDcsService = module2.j;
      MtcuteError = module2.M;
      AsyncLock = module2.A;
      BaseService = module2.k;
      ConditionVariable = module2.l;
      EarlyTimer = module2.E;
      INVITE_LINK_REGEX = module2.I;
      LogManager = module2.o;
      Logger = module2.p;
      LongMap = module2.q;
      LongSet = module2.r;
      LruMap = module2.s;
      LruSet = module2.t;
      ONE = module2.O;
      SortedArray = module2.S;
      SortedLinkedList = module2.u;
      TWO = module2.T;
      TlBinaryReader = module2.v;
      TlBinaryWriter = module2.w;
      TlSerializationCounter = module2.x;
      ZERO = module2.Z;
      addPublicKey = module2.y;
      assertTrue = module2.z;
      assertTypeIs = module2.F;
      assertTypeIsNot = module2.G;
      asyncResettable = module2.H;
      bigIntAbs = module2.J;
      bigIntBitLength = module2.K;
      bigIntGcd = module2.N;
      bigIntMin = module2.P;
      bigIntModInv = module2.Q;
      bigIntModPow = module2.R;
      bigIntToBuffer = module2.V;
      bufferToBigInt = module2.W;
      bufferToReversed = module2.X;
      bufferToStream = module2.Y;
      buffersEqual = module2.$;
      cloneBuffer = module2.a0;
      compareLongs = module2.a1;
      composeMiddlewares = module2.a2;
      computeNewPasswordHash = module2.a3;
      computePasswordHash = module2.a4;
      computeSrpParams = module2.a5;
      concatBuffers = module2.a6;
      createAesIgeForMessage = module2.a7;
      createAesIgeForMessageOld = module2.a8;
      createChunkedReader = module2.a9;
      createControllablePromise = module2.aa;
      dataViewFromBuffer = module2.ab;
      decodeWaveform = module2.ac;
      defaultProductionDc = module2.ad;
      defaultProductionIpv6Dc = module2.ae;
      defaultTestDc = module2.af;
      defaultTestIpv6Dc = module2.ag;
      determinePartSize = module2.ah;
      encodeInlineMessageId = module2.ai;
      encodeWaveform = module2.aj;
      extractFileName = module2.ak;
      extractUsernames = module2.al;
      findKeyByFingerprints = module2.am;
      generateKeyAndIvFromNonce = module2.an;
      getAllPeersFrom = module2.ao;
      getBarePeerId = module2.ap;
      getMarkedPeerId = module2.aq;
      getRandomInt = module2.ar;
      hasValueAtKey = module2.as;
      inflateSvgPath = module2.at;
      inputPeerToPeer = module2.au;
      isInputPeerChannel = module2.av;
      isInputPeerChat = module2.aw;
      isInputPeerUser = module2.ax;
      isProbablyPlainText = module2.ay;
      jsonToTlJson = module2.az;
      longFromBuffer = module2.aA;
      longFromFastString = module2.aB;
      longToFastString = module2.aC;
      makeArrayPaginated = module2.aD;
      makeArrayWithTotal = module2.aE;
      millerRabin = module2.aF;
      mtpAssertTypeIs = module2.aG;
      normalizeDate = module2.aH;
      normalizeInlineId = module2.aI;
      normalizeMessageId = module2.aJ;
      normalizePhoneNumber = module2.aK;
      parseBasicDcOption = module2.aL;
      parseInlineMessageId = module2.aM;
      parseMarkedPeerId = module2.aN;
      parsePublicKey = module2.aO;
      randomBigInt = module2.aP;
      randomBigIntBits = module2.aQ;
      randomBigIntInRange = module2.aR;
      randomLong = module2.aS;
      readStringSession = module2.aT;
      removeFromLongArray = module2.aU;
      resolveMaybeDynamic = module2.aV;
      serializeBasicDcOption = module2.aW;
      sleep = module2.aX;
      sleepWithAbort = module2.aY;
      streamToBuffer = module2.aZ;
      strippedPhotoToJpg = module2.a_;
      svgPathToFile = module2.a$;
      throttle = module2.b0;
      timers = module2.b1;
      tlJsonToJson = module2.b2;
      toInputChannel = module2.b3;
      toInputPeer = module2.b4;
      toInputUser = module2.b5;
      toggleChannelIdMark = module2.b6;
      twoMultiplicity = module2.b7;
      writeStringSession = module2.b8;
      xorBuffer = module2.b9;
      xorBufferInPlace = module2.ba;
      AllStories = module2.bb;
      Audio = module2.bc;
      BaseTelegramClient = module2.bd;
      BaseWebSocketTransport = module2.be;
      Boost = module2.bf;
      BoostSlot = module2.bg;
      BoostStats = module2.bh;
      BotChatJoinRequestUpdate = module2.bi;
      factories = module2.bj;
      factories$1 = module2.bk;
      factories$2 = module2.bl;
      BotKeyboardBuilder = module2.bm;
      BotReactionCountUpdate = module2.bn;
      BotReactionUpdate = module2.bo;
      BotStoppedUpdate = module2.bp;
      BusinessAccount = module2.bq;
      BusinessCallbackQuery = module2.br;
      BusinessChatLink = module2.bs;
      BusinessConnection = module2.bt;
      BusinessIntro = module2.bu;
      BusinessMessage = module2.bv;
      BusinessWorkHours = module2.bw;
      CallbackQuery = module2.bx;
      Chat = module2.by;
      ChatEvent = module2.bz;
      ChatInviteLink = module2.bA;
      ChatInviteLinkMember = module2.bB;
      ChatJoinRequestUpdate = module2.bC;
      ChatLocation = module2.bD;
      ChatMember = module2.bE;
      ChatMemberUpdate = module2.bF;
      ChatPermissions = module2.bG;
      ChatPhoto = module2.bH;
      ChatPhotoSize = module2.bI;
      ChatPreview = module2.bJ;
      ChatlistPreview = module2.bK;
      ChosenInlineResult = module2.bL;
      CollectibleInfo = module2.bM;
      Contact = module2.bN;
      Conversation = module2.bO;
      DeleteBusinessMessageUpdate = module2.bP;
      DeleteMessageUpdate = module2.bQ;
      DeleteStoryUpdate = module2.bR;
      Dialog = module2.bS;
      Dice = module2.bT;
      Document = module2.bU;
      DraftMessage = module2.bV;
      ExtendedMediaPreview = module2.bW;
      FactCheck = module2.bX;
      FileLocation = module2.bY;
      ForumTopic = module2.bZ;
      FullChat = module2.b_;
      Game = module2.b$;
      GameHighScore = module2.c0;
      HistoryReadUpdate = module2.c1;
      IdbStorage = module2.c2;
      IdbStorageDriver = module2.c3;
      InlineCallbackQuery = module2.c4;
      InlineQuery = module2.c5;
      factories$3 = module2.c6;
      IntermediatePacketCodec = module2.c7;
      Invoice = module2.c8;
      LiveLocation = module2.c9;
      Location = module2.ca;
      MASK_POSITION_POINT_TO_TL = module2.cb;
      MediaStory = module2.cc;
      Message = module2.cd;
      MessageEffect = module2.ce;
      MessageEntity = module2.cf;
      MessageForwardInfo = module2.cg;
      MessageReactions = module2.ch;
      MessageRepliesInfo = module2.ci;
      MtArgumentError = module2.cj;
      MtClient = module2.ck;
      MtEmptyError = module2.cl;
      MtInvalidPeerTypeError = module2.cm;
      MtMessageNotFoundError = module2.cn;
      MtPeerNotFoundError = module2.co;
      MtSecurityError = module2.cp;
      MtTimeoutError = module2.cq;
      MtTypeAssertionError = module2.cr;
      MtUnsupportedError = module2.cs;
      ObfuscatedPacketCodec = module2.ct;
      PaddedIntermediatePacketCodec = module2.cu;
      PaidMedia = module2.cv;
      PaidPeerReaction = module2.cw;
      PeerReaction = module2.cx;
      PeerStories = module2.cy;
      PeersIndex = module2.cz;
      Photo = module2.cA;
      Poll = module2.cB;
      PollAnswer = module2.cC;
      PollUpdate = module2.cD;
      PollVoteUpdate = module2.cE;
      PreCheckoutQuery = module2.cF;
      RawDocument = module2.cG;
      RawLocation = module2.cH;
      RepliedMessageInfo = module2.cI;
      SearchFilters = module2.cJ;
      SentCode = module2.cK;
      SessionConnection = module2.cL;
      StarGift = module2.cM;
      StarsStatus = module2.cN;
      StarsTransaction = module2.cO;
      Sticker = module2.cP;
      StickerSet = module2.cQ;
      StorageManager = module2.cR;
      StoriesStealthMode = module2.cS;
      Story = module2.cT;
      StoryInteractions = module2.cU;
      StoryInteractiveChannelPost = module2.cV;
      StoryInteractiveLocation = module2.cW;
      StoryInteractiveReaction = module2.cX;
      StoryInteractiveUrl = module2.cY;
      StoryInteractiveVenue = module2.cZ;
      StoryInteractiveWeather = module2.c_;
      StoryRepost = module2.c$;
      StoryUpdate = module2.d0;
      StoryViewer = module2.d1;
      StoryViewersList = module2.d2;
      StreamedCodec = module2.d3;
      TakeoutSession = module2.d4;
      TelegramClient = module2.d5;
      TelegramStorageManager = module2.d6;
      TelegramWorker = module2.d7;
      TelegramWorkerPort = module2.d8;
      Thumbnail = module2.d9;
      TransportError = module2.da;
      TransportState = module2.db;
      UpdatesManager = module2.dc;
      User = module2.dd;
      UserStarGift = module2.de;
      UserStatusUpdate = module2.df;
      UserTypingUpdate = module2.dg;
      Venue = module2.dh;
      Video = module2.di;
      Voice = module2.dj;
      WebCryptoProvider = module2.dk;
      WebDocument = module2.dl;
      WebPage = module2.dm;
      WebPlatform = module2.dn;
      WebSocketTransport = module2.dp;
      WrappedCodec = module2.dq;
      _actionFromTl = module2.dr;
      _callDiscardReasonFromTl = module2.ds;
      _callDiscardReasonToTl = module2.dt;
      _messageActionFromTl = module2.du;
      _messageMediaFromTl = module2.dv;
      _storyInteractiveElementFromTl = module2.dw;
      businessWorkHoursDaysToRaw = module2.dx;
      defaultReconnectionStrategy = module2.dy;
      inputTextToTl = module2.dz;
      isUploadedFile = module2.dA;
      tl = module2.dB;
      normalizeInputMessageId = module2.dC;
      normalizeInputStickerSet = module2.dD;
      parsePeer = module2.dE;
      toReactionEmoji = module2.dF;
      dayjs = module2.dG;
      heavyTasks = module2.dH;
      md = module2.dI;
      stores = module2.dJ;
      utils = module2.dK;
      solid = module2.dL;
      files = module2.dM;
      signals = module2.dN;
    }, (module2) => {
      BaseCryptoProvider = module2.B;
      factorizePQSync = module2.f;
    }],
    execute: function() {
      function joinTextWithEntities(parts, delim = "") {
        const textParts = [];
        const newEntities = [];
        let position = 0;
        if (typeof delim === "string") {
          delim = { text: delim };
        }
        const pushPart = (part) => {
          textParts.push(part.text);
          const entitiesOffset = position;
          position += part.text.length;
          if (part.entities) {
            for(let   entity of part.entities) {
              newEntities.push(__spreadProps(__spreadValues({}, entity), {
                offset: entity.offset + entitiesOffset
              }));
            }
          }
        };
        for(let   part of parts) {
          if (position > 0) {
            pushPart(delim);
          }
          pushPart(typeof part === "string" ? { text: part } : part);
        }
        return {
          text: textParts.join(""),
          entities: newEntities
        };
      }
      function makeInspectable(obj, props, hide) {
        return obj;
      }
      class RpsMeter {
        constructor(size = 500, time = 5e3) {
          __publicField(this, "_hits");
          __publicField(this, "time");
          this.size = size;
          if (typeof process === "undefined" || !process.hrtime.bigint) {
            throw new Error("RPS meter is not supported on this platform");
          }
          this._hits = new Deque(size);
          this.time = BigInt(time) * BigInt(1e6);
        }
        hit() {
          this._hits.pushBack(process.hrtime.bigint());
        }
        getRps() {
          if (!this._hits.length)
            return 0;
          const now = process.hrtime.bigint();
          const window2 = now - this.time;
          const iter = this._hits.iter();
          let first = iter.next();
          let idx = 0;
          while (!first.done && first.value < window2) {
            first = iter.next();
            idx += 1;
          }
          if (!first.value)
            return 0;
          const hits = this._hits.length - idx;
          return hits * 1e9 / Number(now - first.value);
        }
      }
      const botStart = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ username, parameter }) => ["resolve", { domain: username, start: parameter }],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const username = query.get("domain");
          const parameter = query.get("start");
          if (!username || !parameter)
            return null;
          return { username, parameter };
        },
        externalBuild: ({ username, parameter }) => [username, { start: parameter }],
        externalParse: (path, query) => {
          if (path.includes("/") || path[0] === "+" || path.length <= 2)
            return null;
          const username = path;
          const parameter = query.get("start");
          if (!parameter)
            return null;
          return { username, parameter };
        }
      });
      function normalizeBotAdmin(rights) {
        if (!(rights == null ? void 0 : rights.length))
          return;
        return rights.map((it) => {
          switch (it) {
            case "changeInfo":
              return "change_info";
            case "postMessages":
              return "post_messages";
            case "editMessages":
              return "edit_messages";
            case "deleteMessages":
              return "delete_messages";
            case "banUsers":
              return "restrict_members";
            case "inviteUsers":
              return "invite_users";
            case "pinMessages":
              return "pin_messages";
            case "manageTopics":
              return "manage_topics";
            case "addAdmins":
              return "promote_members";
            case "manageCall":
              return "manage_video_chats";
            case "anonymous":
              return "anonymous";
            case "other":
              return "manage_chat";
            case "postStories":
              return "post_stories";
            case "editStories":
              return "edit_stories";
            case "deleteStories":
              return "delete_stories";
            default:
              assertNever();
              return "";
          }
        }).join("+");
      }
      function parseBotAdmin(rights) {
        if (!rights)
          return;
        return rights.split("+").map((it) => {
          switch (it) {
            case "change_info":
              return "changeInfo";
            case "post_messages":
              return "postMessages";
            case "edit_messages":
              return "editMessages";
            case "delete_messages":
              return "deleteMessages";
            case "restrict_members":
              return "banUsers";
            case "invite_users":
              return "inviteUsers";
            case "pin_messages":
              return "pinMessages";
            case "manage_topics":
              return "manageTopics";
            case "promote_members":
              return "addAdmins";
            case "manage_video_chats":
              return "manageCall";
            case "anonymous":
              return "anonymous";
            case "manage_chat":
              return "other";
            case "post_stories":
              return "postStories";
            case "edit_stories":
              return "editStories";
            case "delete_stories":
              return "deleteStories";
            default:
              return null;
          }
        }).filter(isPresent);
      }
      const botAddToGroup = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ bot, parameter, admin }) => [
          "resolve",
          { domain: bot, startgroup: parameter != null ? parameter : true, admin: normalizeBotAdmin(admin) }
        ],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const bot = query.get("domain");
          const parameter = query.get("startgroup");
          const admin = query.get("admin");
          if (!bot || parameter === null)
            return null;
          return {
            bot,
            parameter: parameter === "" ? void 0 : parameter,
            admin: parseBotAdmin(admin)
          };
        },
        externalBuild: ({ bot, parameter, admin }) => [
          bot,
          { startgroup: parameter != null ? parameter : true, admin: normalizeBotAdmin(admin) }
        ],
        externalParse: (path, query) => {
          if (path.includes("/") || path[0] === "+" || path.length <= 2)
            return null;
          const bot = path;
          const parameter = query.get("startgroup");
          const admin = query.get("admin");
          if (parameter === null)
            return null;
          return {
            bot,
            parameter: parameter === "" ? void 0 : parameter,
            admin: parseBotAdmin(admin)
          };
        }
      });
      const botAddToChannel = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ bot, admin }) => [
          "resolve",
          { domain: bot, startchannel: true, admin: normalizeBotAdmin(admin) }
        ],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const bot = query.get("domain");
          const parameter = query.get("startchannel");
          const admin = query.get("admin");
          if (!bot || parameter === null)
            return null;
          return {
            bot,
            admin: parseBotAdmin(admin)
          };
        },
        externalBuild: ({ bot, admin }) => [bot, { startchannel: true, admin: normalizeBotAdmin(admin) }],
        externalParse: (path, query) => {
          if (path.includes("/") || path[0] === "+" || path.length <= 2)
            return null;
          const bot = path;
          const parameter = query.get("startchannel");
          const admin = query.get("admin");
          if (parameter === null)
            return null;
          return {
            bot,
            admin: parseBotAdmin(admin)
          };
        }
      });
      const botGame = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ bot, game }) => ["resolve", { domain: bot, game }],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const bot = query.get("domain");
          const game = query.get("game");
          if (!bot || !game)
            return null;
          return { bot, game };
        },
        externalBuild: ({ bot, game }) => [bot, { game }],
        externalParse: (path, query) => {
          if (path.includes("/") || path[0] === "+" || path.length <= 2)
            return null;
          const bot = path;
          const game = query.get("game");
          if (!game)
            return null;
          return { bot, game };
        }
      });
      const botWebApp = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ bot, app, parameter }) => ["resolve", { domain: bot, appname: app, startapp: parameter }],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const bot = query.get("domain");
          const app = query.get("appname");
          const parameter = query.get("startapp");
          if (!bot || !app)
            return null;
          return { bot, app, parameter: parameter || void 0 };
        },
        externalBuild: ({ bot, app, parameter }) => [`${bot}/${app}`, { startapp: parameter }],
        externalParse: (path, query) => {
          const [bot, app, rest] = path.split("/");
          if (!app || rest)
            return null;
          const parameter = query.get("startapp");
          return { bot, app, parameter: parameter || void 0 };
        }
      });
      const videoChat = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ username, inviteHash, isLivestream }) => [
          "resolve",
          {
            domain: username,
            [isLivestream ? "livestream" : "videochat"]: inviteHash || true
          }
        ],
        externalBuild: ({ username, inviteHash, isLivestream }) => [
          username,
          {
            [isLivestream ? "livestream" : "videochat"]: inviteHash || true
          }
        ],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const domain = query.get("domain");
          if (!domain)
            return null;
          const livestream = query.get("livestream");
          const videochat = query.get("videochat");
          const voicechat = query.get("voicechat");
          if (livestream === null && videochat === null && voicechat === null)
            return null;
          const inviteHash = livestream || videochat || voicechat;
          return {
            username: domain,
            inviteHash: inviteHash || void 0,
            isLivestream: livestream !== null
          };
        },
        externalParse: (path, query) => {
          if (path.length <= 1 || path.includes("/") || path[0] === "+")
            return null;
          const livestream = query.get("livestream");
          const videochat = query.get("videochat");
          const voicechat = query.get("voicechat");
          if (livestream === null && videochat === null && voicechat === null)
            return null;
          const inviteHash = livestream || videochat || voicechat;
          return {
            username: path,
            inviteHash: inviteHash || void 0,
            isLivestream: livestream !== null
          };
        }
      });
      const share = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ url, text }) => ["msg_url", { url, text }],
        internalParse: (path, query) => {
          if (path !== "msg_url")
            return null;
          const url = query.get("url");
          if (!url)
            return null;
          const text = query.get("text");
          return { url, text: text || void 0 };
        },
        externalBuild: ({ url, text }) => ["share", { url, text }],
        externalParse: (path, query) => {
          if (path !== "share")
            return null;
          const url = query.get("url");
          if (!url)
            return null;
          const text = query.get("text");
          return { url, text: text || void 0 };
        }
      });
      const boost = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: (params) => {
          if ("username" in params) {
            return ["boost", { domain: params.username }];
          }
          return ["boost", { channel: params.channelId }];
        },
        internalParse: (path, query) => {
          if (path !== "boost")
            return null;
          const username = query.get("domain");
          if (username) {
            return { username };
          }
          const channelId = Number(query.get("channel"));
          if (!Number.isNaN(channelId)) {
            return { channelId: Number(channelId) };
          }
          return null;
        },
        externalBuild: (params) => {
          if ("username" in params) {
            return [params.username, { boost: true }];
          }
          return [`c/${params.channelId}`, { boost: true }];
        },
        externalParse: (path, query) => {
          if (!query.has("boost"))
            return null;
          if (path.startsWith("c/")) {
            const channelId = Number(path.slice(2));
            if (Number.isNaN(channelId))
              return null;
            return { channelId };
          }
          if (path.includes("/"))
            return null;
          return { username: path };
        }
      });
      const folder = /* @__PURE__ */ deeplinkBuilder({
        // tg://addlist?slug=XXX
        internalBuild: ({ slug }) => ["addlist", { slug }],
        internalParse: (path, query) => {
          if (path !== "addlist")
            return null;
          const slug = query.get("slug");
          if (!slug)
            return null;
          return { slug };
        },
        // https://t.me/addlist/XXX
        externalBuild: ({ slug }) => [`addlist/${slug}`, null],
        externalParse: (path) => {
          const [prefix, slug] = path.split("/");
          if (prefix !== "addlist")
            return null;
          return { slug };
        }
      });
      const mtproxy = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: (params) => ["proxy", params],
        externalBuild: (params) => ["proxy", params],
        internalParse: (path, query) => {
          if (path !== "proxy")
            return null;
          const server = query.get("server");
          const port = Number(query.get("port"));
          const secret = query.get("secret");
          if (!server || Number.isNaN(port) || !secret)
            return null;
          return { server, port, secret };
        },
        externalParse: (path, query) => {
          if (path !== "proxy")
            return null;
          const server = query.get("server");
          const port = Number(query.get("port"));
          const secret = query.get("secret");
          if (!server || Number.isNaN(port) || !secret)
            return null;
          return { server, port, secret };
        }
      });
      const socks5 = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: (params) => ["socks", params],
        externalBuild: (params) => ["socks", params],
        internalParse: (path, query) => {
          if (path !== "socks")
            return null;
          const server = query.get("server");
          const port = Number(query.get("port"));
          const user = query.get("user");
          const pass = query.get("pass");
          if (!server || Number.isNaN(port))
            return null;
          return { server, port, user: user || void 0, pass: pass || void 0 };
        },
        externalParse: (path, query) => {
          if (path !== "socks")
            return null;
          const server = query.get("server");
          const port = Number(query.get("port"));
          const user = query.get("user");
          const pass = query.get("pass");
          if (!server || Number.isNaN(port))
            return null;
          return { server, port, user: user || void 0, pass: pass || void 0 };
        }
      });
      const stickerset = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ slug, emoji }) => [emoji ? "addemoji" : "addstickers", { set: slug }],
        internalParse: (path, query) => {
          if (path !== "addstickers" && path !== "addemoji")
            return null;
          const slug = query.get("set");
          if (!slug)
            return null;
          return { slug, emoji: path === "addemoji" };
        },
        externalBuild: ({ slug, emoji }) => [`${emoji ? "addemoji" : "addstickers"}/${slug}`, null],
        externalParse: (path) => {
          const [prefix, slug] = path.split("/");
          if (prefix !== "addstickers" && prefix !== "addemoji")
            return null;
          return { slug, emoji: prefix === "addemoji" };
        }
      });
      const publicUsername = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ username }) => ["resolve", { domain: username }],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const domain = query.get("domain");
          if (!domain)
            return null;
          if ([...query.keys()].length > 1)
            return null;
          return { username: domain };
        },
        externalBuild: ({ username }) => [username, null],
        externalParse: (path, query) => {
          if (path.length <= 1 || path.includes("/") || path[0] === "+")
            return null;
          if ([...query.keys()].length > 0)
            return null;
          return { username: path };
        }
      });
      const temporaryProfile = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ token }) => ["contact", { token }],
        internalParse: (path, query) => {
          if (path !== "contact")
            return null;
          const token = query.get("token");
          if (!token)
            return null;
          return { token };
        },
        externalBuild: ({ token }) => [`contact/${token}`, null],
        externalParse: (path) => {
          const [prefix, token] = path.split("/");
          if (prefix !== "contact")
            return null;
          return { token };
        }
      });
      const phoneNumber = /* @__PURE__ */ deeplinkBuilder({
        internalBuild: ({ phone }) => ["resolve", { phone }],
        internalParse: (path, query) => {
          if (path !== "resolve")
            return null;
          const phone = query.get("phone");
          if (!phone)
            return null;
          return { phone };
        },
        externalBuild: ({ phone }) => [`+${phone}`, null],
        externalParse: (path) => {
          const m = path.match(/^\+(\d+)$/);
          if (!m)
            return null;
          return { phone: m[1] };
        }
      });
      const bundle$2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        boost,
        botAddToChannel,
        botAddToGroup,
        botGame,
        botStart,
        botWebApp,
        chatFolder,
        chatInvite,
        folder,
        message,
        mtproxy,
        phoneNumber,
        publicUsername,
        share,
        socks5,
        stickerset,
        temporaryProfile,
        videoChat
      }, Symbol.toStringTag, { value: "Module" }));
      class StoryElement {
        constructor(_position) {
          this._position = _position;
        }
        static at(params) {
          var _a;
          return new StoryElement({
            _: "mediaAreaCoordinates",
            x: params.x,
            y: params.y,
            w: params.width,
            h: params.height,
            rotation: (_a = params.rotation) != null ? _a : 0
          });
        }
        venue(params) {
          var _a;
          return {
            _: "mediaAreaVenue",
            coordinates: this._position,
            geo: {
              _: "geoPoint",
              lat: params.latitude,
              long: params.longitude,
              accessHash: Long.ZERO
            },
            title: params.title,
            address: params.address,
            provider: (_a = params.source.provider) != null ? _a : "foursquare",
            venueId: params.source.id,
            venueType: params.source.type
          };
        }
        venueFromInline(queryId, resultId) {
          return {
            _: "inputMediaAreaVenue",
            coordinates: this._position,
            queryId,
            resultId
          };
        }
        location(params) {
          return {
            _: "mediaAreaGeoPoint",
            coordinates: this._position,
            geo: {
              _: "geoPoint",
              lat: params.latitude,
              long: params.longitude,
              accessHash: Long.ZERO
            }
          };
        }
        reaction(reaction, params = {}) {
          this._position.h *= 9 / 16;
          return {
            _: "mediaAreaSuggestedReaction",
            coordinates: this._position,
            reaction: normalizeInputReaction(reaction),
            dark: params.dark,
            flipped: params.flipped
          };
        }
        url(url) {
          return {
            _: "mediaAreaUrl",
            coordinates: this._position,
            url
          };
        }
      }
      const default_ = {
        _: "botCommandScopeDefault"
      };
      const allPrivate = {
        _: "botCommandScopeUsers"
      };
      const allGroups = {
        _: "botCommandScopeChats"
      };
      const allGroupAdmins = {
        _: "botCommandScopeChatAdmins"
      };
      function peer(peer2) {
        return {
          type: "peer",
          peer: peer2
        };
      }
      function groupAdmins(peer2) {
        return {
          type: "peer_admins",
          peer: peer2
        };
      }
      function groupMember(chat, user) {
        return {
          type: "member",
          chat,
          user
        };
      }
      function cmd(command, description) {
        return {
          _: "botCommand",
          command,
          description
        };
      }
      const inner = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        allGroupAdmins,
        allGroups,
        allPrivate,
        cmd,
        default_,
        groupAdmins,
        groupMember,
        peer
      }, Symbol.toStringTag, { value: "Module" }));
      const all$1 = { _: "inputPrivacyValueAllowAll" };
      const contacts$1 = { _: "inputPrivacyValueAllowContacts" };
      const closeFriends = {
        _: "inputPrivacyValueAllowCloseFriends"
      };
      function users$1(users2) {
        return {
          allow: true,
          users: Array.isArray(users2) ? users2 : [users2]
        };
      }
      function chatParticipants$1(chats) {
        return {
          allow: true,
          chats: Array.isArray(chats) ? chats : [chats]
        };
      }
      const allow = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        all: all$1,
        chatParticipants: chatParticipants$1,
        closeFriends,
        contacts: contacts$1,
        users: users$1
      }, Symbol.toStringTag, { value: "Module" }));
      const all = { _: "inputPrivacyValueDisallowAll" };
      const contacts = { _: "inputPrivacyValueDisallowContacts" };
      function users(users2) {
        return {
          allow: false,
          users: Array.isArray(users2) ? users2 : [users2]
        };
      }
      function chatParticipants(chats) {
        return {
          allow: false,
          chats: Array.isArray(chats) ? chats : [chats]
        };
      }
      const disallow = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        all,
        chatParticipants,
        contacts,
        users
      }, Symbol.toStringTag, { value: "Module" }));
      const bundle$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        allow,
        disallow
      }, Symbol.toStringTag, { value: "Module" }));
      function onRpcError(handler) {
        return (ctx, next) => __async(this, null, function* () {
          let res = yield next(ctx);
          if (isTlRpcError(res)) {
            const handlerRes = yield handler(ctx, res);
            if (handlerRes !== void 0) {
              res = handlerRes;
            }
          }
          return res;
        });
      }
      function onMethod(method, middleware) {
        return (ctx, next) => __async(this, null, function* () {
          if (ctx.request._ !== method) {
            return next(ctx);
          }
          return middleware(ctx, next);
        });
      }
      const bundle = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        basic,
        onMethod,
        onRpcError
      }, Symbol.toStringTag, { value: "Module" }));
      class MemoryStorageDriver {
        constructor() {
          __publicField(this, "states", /* @__PURE__ */ new Map());
        }
        getState(repo, def) {
          if (!this.states.has(repo)) {
            this.states.set(repo, def());
          }
          return this.states.get(repo);
        }
        load() {
        }
      }
      class MemoryAuthKeysRepository {
        constructor(_driver) {
          __publicField(this, "state");
          this._driver = _driver;
          this.state = this._driver.getState("authKeys", () => ({
            authKeys: /* @__PURE__ */ new Map(),
            authKeysTemp: /* @__PURE__ */ new Map(),
            authKeysTempExpiry: /* @__PURE__ */ new Map()
          }));
        }
        set(dc, key) {
          if (key) {
            this.state.authKeys.set(dc, key);
          } else {
            this.state.authKeys.delete(dc);
          }
        }
        get(dc) {
          var _a;
          return (_a = this.state.authKeys.get(dc)) != null ? _a : null;
        }
        setTemp(dc, idx, key, expires) {
          const k = `${dc}:${idx}`;
          if (key) {
            this.state.authKeysTemp.set(k, key);
            this.state.authKeysTempExpiry.set(k, expires);
          } else {
            this.state.authKeysTemp.delete(k);
            this.state.authKeysTempExpiry.delete(k);
          }
        }
        getTemp(dc, idx, now) {
          var _a, _b;
          const k = `${dc}:${idx}`;
          if (now > ((_a = this.state.authKeysTempExpiry.get(k)) != null ? _a : 0)) {
            return null;
          }
          return (_b = this.state.authKeysTemp.get(k)) != null ? _b : null;
        }
        deleteByDc(dc) {
          this.state.authKeys.delete(dc);
          for(let   key of this.state.authKeysTemp.keys()) {
            if (key.startsWith(`${dc}:`)) {
              this.state.authKeysTemp.delete(key);
              this.state.authKeysTempExpiry.delete(key);
            }
          }
        }
        deleteAll() {
          this.state.authKeys.clear();
          this.state.authKeysTemp.clear();
          this.state.authKeysTempExpiry.clear();
        }
      }
      class MemoryKeyValueRepository {
        constructor(_driver) {
          __publicField(this, "state");
          this._driver = _driver;
          this.state = this._driver.getState("kv", () => /* @__PURE__ */ new Map());
        }
        set(key, value) {
          this.state.set(key, value);
        }
        get(key) {
          var _a;
          return (_a = this.state.get(key)) != null ? _a : null;
        }
        delete(key) {
          this.state.delete(key);
        }
        deleteAll() {
          this.state.clear();
        }
      }
      class MemoryPeersRepository {
        constructor(_driver) {
          __publicField(this, "state");
          this._driver = _driver;
          this.state = this._driver.getState("peers", () => ({
            entities: /* @__PURE__ */ new Map(),
            usernameIndex: /* @__PURE__ */ new Map(),
            phoneIndex: /* @__PURE__ */ new Map()
          }));
        }
        store(peer2) {
          const old = this.state.entities.get(peer2.id);
          if (old) {
            old.usernames.forEach((username) => {
              this.state.usernameIndex.delete(username);
            });
            if (old.phone) {
              this.state.phoneIndex.delete(old.phone);
            }
          }
          if (peer2.usernames) {
            for(let   username of peer2.usernames) {
              this.state.usernameIndex.set(username, peer2.id);
            }
          }
          if (peer2.phone)
            this.state.phoneIndex.set(peer2.phone, peer2.id);
          this.state.entities.set(peer2.id, peer2);
        }
        getById(id, allowMin) {
          const ent = this.state.entities.get(id);
          if (!ent || ent.isMin && !allowMin)
            return null;
          return ent;
        }
        getByUsername(username) {
          const id = this.state.usernameIndex.get(username.toLowerCase());
          if (!id)
            return null;
          const ent = this.state.entities.get(id);
          if (!ent || ent.isMin)
            return null;
          return ent;
        }
        getByPhone(phone) {
          const id = this.state.phoneIndex.get(phone);
          if (!id)
            return null;
          const ent = this.state.entities.get(id);
          if (!ent || ent.isMin)
            return null;
          return ent;
        }
        deleteAll() {
          this.state.entities.clear();
          this.state.phoneIndex.clear();
          this.state.usernameIndex.clear();
        }
      }
      class MemoryRefMessagesRepository {
        constructor(_driver) {
          __publicField(this, "state");
          this._driver = _driver;
          this.state = this._driver.getState("refMessages", () => ({
            refs: /* @__PURE__ */ new Map()
          }));
        }
        store(peerId, chatId, msgId) {
          if (!this.state.refs.has(peerId)) {
            this.state.refs.set(peerId, /* @__PURE__ */ new Set());
          }
          this.state.refs.get(peerId).add(`${chatId}:${msgId}`);
        }
        getByPeer(peerId) {
          const refs = this.state.refs.get(peerId);
          if (!(refs == null ? void 0 : refs.size))
            return null;
          const [ref] = refs;
          const [chatId, msgId] = ref.split(":");
          return [Number(chatId), Number(msgId)];
        }
        delete(chatId, msgIds) {
          for(let   refs of this.state.refs.values()) {
            for(let   msg of msgIds) {
              refs.delete(`${chatId}:${msg}`);
            }
          }
        }
        deleteByPeer(peerId) {
          this.state.refs.delete(peerId);
        }
        deleteAll() {
          this.state.refs.clear();
        }
      }
      class MemoryStorage {
        constructor() {
          __publicField(this, "driver", new MemoryStorageDriver());
          __publicField(this, "kv", new MemoryKeyValueRepository(this.driver));
          __publicField(this, "authKeys", new MemoryAuthKeysRepository(this.driver));
          __publicField(this, "peers", new MemoryPeersRepository(this.driver));
          __publicField(this, "refMessages", new MemoryRefMessagesRepository(this.driver));
        }
      }
      const MIGRATIONS_TABLE_NAME = "mtcute_migrations";
      const MIGRATIONS_TABLE_SQL = `
create table if not exists ${MIGRATIONS_TABLE_NAME} (
    repo text not null primary key,
    version integer not null
);
`.trim();
      class BaseSqliteStorageDriver extends BaseStorageDriver {
        constructor() {
          super(...arguments);
          __publicField(this, "db");
          __publicField(this, "_pending", []);
          __publicField(this, "_runMany");
          __publicField(this, "_cleanup");
          __publicField(this, "_migrations", /* @__PURE__ */ new Map());
          __publicField(this, "_maxVersion", /* @__PURE__ */ new Map());
          // todo: remove in 1.0.0
          __publicField(this, "_legacyMigrations", /* @__PURE__ */ new Map());
          __publicField(this, "_onLoad", /* @__PURE__ */ new Set());
          __publicField(this, "_runLegacyMigrations", false);
        }
        registerLegacyMigration(repo, migration) {
          if (this.loaded) {
            throw new Error("Cannot register migrations after loading");
          }
          this._legacyMigrations.set(repo, migration);
        }
        registerMigration(repo, version, migration) {
          var _a;
          if (this.loaded) {
            throw new Error("Cannot register migrations after loading");
          }
          let map = this._migrations.get(repo);
          if (!map) {
            map = /* @__PURE__ */ new Map();
            this._migrations.set(repo, map);
          }
          if (map.has(version)) {
            throw new Error(`Migration for ${repo} version ${version} is already registered`);
          }
          map.set(version, migration);
          const prevMax = (_a = this._maxVersion.get(repo)) != null ? _a : 0;
          if (version > prevMax) {
            this._maxVersion.set(repo, version);
          }
        }
        onLoad(cb) {
          if (this.loaded) {
            cb(this.db);
          } else {
            this._onLoad.add(cb);
          }
        }
        _writeLater(stmt, params) {
          this._pending.push([stmt, params]);
        }
        _initialize() {
          var _a;
          const hasLegacyTables = this.db.prepare("select name from sqlite_master where type = 'table' and name = 'kv'").get();
          if (hasLegacyTables) {
            this._log.info("legacy tables detected, will run migrations");
            this._runLegacyMigrations = true;
          }
          this.db.exec(MIGRATIONS_TABLE_SQL);
          const writeVersion = this.db.prepare(
            `insert or replace into ${MIGRATIONS_TABLE_NAME} (repo, version) values (?, ?)`
          );
          const getVersion = this.db.prepare(`select version from ${MIGRATIONS_TABLE_NAME} where repo = ?`);
          const didUpgrade = /* @__PURE__ */ new Set();
          for(let   repo of this._migrations.keys()) {
            const res = getVersion.get(repo);
            const startVersion = (_a = res == null ? void 0 : res.version) != null ? _a : 0;
            let fromVersion = startVersion;
            const migrations = this._migrations.get(repo);
            const targetVer = this._maxVersion.get(repo);
            while (fromVersion < targetVer) {
              const nextVersion = fromVersion + 1;
              const migration = migrations.get(nextVersion);
              if (!migration) {
                throw new Error(`No migration for ${repo} to version ${nextVersion}`);
              }
              migration(this.db);
              fromVersion = nextVersion;
              didUpgrade.add(repo);
            }
            if (fromVersion !== startVersion) {
              writeVersion.run(repo, targetVer);
            }
          }
        }
        _load() {
          return __async(this, null, function* () {
            this.db = this._createDatabase();
            this._runMany = this.db.transaction((stmts) => {
              stmts.forEach((stmt) => {
                stmt[0].run(stmt[1]);
              });
            });
            this.db.transaction(() => this._initialize())();
            this._cleanup = getPlatform().beforeExit(() => {
              this._save();
              this._destroy();
            });
            for(let   cb of this._onLoad)
              cb(this.db);
            if (this._runLegacyMigrations) {
              this.db.transaction(() => {
                for(let   migration of this._legacyMigrations.values()) {
                  migration(this.db);
                }
                this._runMany(this._pending);
              })();
            }
          });
        }
        _save() {
          if (!this._pending.length)
            return;
          this._runMany(this._pending);
          this._pending = [];
        }
        _destroy() {
          var _a;
          this.db.close();
          (_a = this._cleanup) == null ? void 0 : _a.call(this);
          this._cleanup = void 0;
        }
      }
      class SqliteAuthKeysRepository {
        constructor(_driver) {
          __publicField(this, "_set");
          __publicField(this, "_del");
          __publicField(this, "_get");
          __publicField(this, "_setTemp");
          __publicField(this, "_delTemp");
          __publicField(this, "_getTemp");
          __publicField(this, "_delTempAll");
          __publicField(this, "_delAll");
          this._driver = _driver;
          _driver.registerMigration("auth_keys", 1, (db) => {
            db.exec(`
                create table if not exists auth_keys (
                    dc integer primary key,
                    key blob not null
                );
                create table if not exists temp_auth_keys (
                    dc integer not null,
                    idx integer not null,
                    key blob not null,
                    expires integer not null,
                    primary key (dc, idx)
                );
            `);
          });
          _driver.onLoad((db) => {
            this._get = db.prepare("select key from auth_keys where dc = ?");
            this._getTemp = db.prepare("select key from temp_auth_keys where dc = ? and idx = ? and expires > ?");
            this._set = db.prepare("insert or replace into auth_keys (dc, key) values (?, ?)");
            this._setTemp = this._driver.db.prepare(
              "insert or replace into temp_auth_keys (dc, idx, key, expires) values (?, ?, ?, ?)"
            );
            this._del = db.prepare("delete from auth_keys where dc = ?");
            this._delTemp = db.prepare("delete from temp_auth_keys where dc = ? and idx = ?");
            this._delTempAll = db.prepare("delete from temp_auth_keys where dc = ?");
            this._delAll = db.prepare("delete from auth_keys");
          });
        }
        set(dc, key) {
          if (!key) {
            this._del.run(dc);
            return;
          }
          this._set.run(dc, key);
        }
        get(dc) {
          const row = this._get.get(dc);
          if (!row)
            return null;
          return row.key;
        }
        setTemp(dc, idx, key, expires) {
          if (!key) {
            this._delTemp.run(dc, idx);
            return;
          }
          this._setTemp.run(dc, idx, key, expires);
        }
        getTemp(dc, idx, now) {
          const row = this._getTemp.get(dc, idx, now);
          if (!row)
            return null;
          return row.key;
        }
        deleteByDc(dc) {
          this._del.run(dc);
          this._delTempAll.run(dc);
        }
        deleteAll() {
          this._delAll.run();
        }
      }
      class SqliteKeyValueRepository {
        constructor(_driver) {
          __publicField(this, "_set");
          __publicField(this, "_get");
          __publicField(this, "_del");
          __publicField(this, "_delAll");
          this._driver = _driver;
          _driver.registerMigration("kv", 1, (db) => {
            db.exec(`
                create table key_value (
                    key text primary key,
                    value blob not null
                );
            `);
          });
          _driver.onLoad((db) => {
            this._get = db.prepare("select value from key_value where key = ?");
            this._set = db.prepare("insert or replace into key_value (key, value) values (?, ?)");
            this._del = db.prepare("delete from key_value where key = ?");
            this._delAll = db.prepare("delete from key_value");
          });
          _driver.registerLegacyMigration("kv", (db) => {
            const all2 = db.prepare("select key, value from kv").all();
            const obj = {};
            for(let   { key, value } of all2) {
              obj[key] = JSON.parse(value);
            }
            db.exec("drop table kv");
            const options = {
              driver: this._driver,
              readerMap: __tlReaderMap,
              writerMap: __tlWriterMap,
              log: this._driver["_log"]
            };
            if (obj.self) {
              new CurrentUserService(this, options).store({
                userId: obj.self.userId,
                isBot: obj.self.isBot,
                isPremium: false,
                usernames: []
              });
            }
            if (obj.pts) {
              const svc = new UpdatesStateService(this, options);
              svc.setPts(obj.pts);
              if (obj.qts)
                svc.setQts(obj.qts);
              if (obj.date)
                svc.setDate(obj.date);
              if (obj.seq)
                svc.setSeq(obj.seq);
              const channels = db.prepare("select * from pts").all();
              for(let   channel of channels) {
                svc.setChannelPts(channel.channel_id, channel.pts);
              }
            }
            db.exec("drop table pts");
            if (obj.def_dc) {
              new DefaultDcsService(this, options).store(obj.def_dc);
            }
          });
        }
        set(key, value) {
          this._driver._writeLater(this._set, [key, value]);
        }
        get(key) {
          const res = this._get.get(key);
          if (!res)
            return null;
          return res.value;
        }
        delete(key) {
          this._del.run(key);
        }
        deleteAll() {
          this._delAll.run();
        }
      }
      function mapPeerDto(dto) {
        return {
          id: dto.id,
          accessHash: dto.hash,
          isMin: dto.isMin === 1,
          usernames: JSON.parse(dto.usernames),
          updated: dto.updated,
          phone: dto.phone || void 0,
          complete: dto.complete
        };
      }
      class SqlitePeersRepository {
        constructor(_driver) {
          __publicField(this, "_loaded", false);
          __publicField(this, "_store");
          __publicField(this, "_getById");
          __publicField(this, "_getByIdAllowMin");
          __publicField(this, "_getByUsername");
          __publicField(this, "_getByPhone");
          __publicField(this, "_delAll");
          this._driver = _driver;
          _driver.registerMigration("peers", 1, (db) => {
            db.exec(`
                create table peers (
                    id integer primary key,
                    hash text not null,
                    usernames json not null,
                    updated integer not null,
                    phone text,
                    complete blob
                );
                create index idx_peers_usernames on peers (usernames);
                create index idx_peers_phone on peers (phone);
            `);
          });
          _driver.registerMigration("peers", 2, (db) => {
            db.exec("alter table peers add column isMin integer not null default false;");
          });
          _driver.onLoad((db) => {
            this._loaded = true;
            this._store = db.prepare(
              "insert or replace into peers (id, hash, isMin, usernames, updated, phone, complete) values (?, ?, ?, ?, ?, ?, ?)"
            );
            this._getById = db.prepare("select * from peers where id = ? and isMin = false");
            this._getByIdAllowMin = db.prepare("select * from peers where id = ?");
            this._getByUsername = db.prepare(
              "select * from peers where exists (select 1 from json_each(usernames) where value = ?) and isMin = false"
            );
            this._getByPhone = db.prepare("select * from peers where phone = ? and isMin = false");
            this._delAll = db.prepare("delete from peers");
          });
          _driver.registerLegacyMigration("peers", (db) => {
            db.exec("drop table entities");
          });
        }
        _ensureLoaded() {
          if (!this._loaded) {
            throw new MtcuteError("Peers repository is not loaded. Have you called client.start() (or similar)?");
          }
        }
        store(peer2) {
          var _a;
          this._driver._writeLater(this._store, [
            peer2.id,
            peer2.accessHash,
            peer2.isMin ? 1 : 0,
            JSON.stringify(peer2.usernames),
            peer2.updated,
            (_a = peer2.phone) != null ? _a : null,
            peer2.complete
          ]);
        }
        getById(id, allowMin) {
          this._ensureLoaded();
          const row = (allowMin ? this._getByIdAllowMin : this._getById).get(id);
          if (!row)
            return null;
          return mapPeerDto(row);
        }
        getByUsername(username) {
          this._ensureLoaded();
          const row = this._getByUsername.get(username);
          if (!row)
            return null;
          return mapPeerDto(row);
        }
        getByPhone(phone) {
          this._ensureLoaded();
          const row = this._getByPhone.get(phone);
          if (!row)
            return null;
          return mapPeerDto(row);
        }
        deleteAll() {
          this._delAll.run();
        }
      }
      class SqliteRefMessagesRepository {
        constructor(_driver) {
          __publicField(this, "_store");
          __publicField(this, "_getByPeer");
          __publicField(this, "_del");
          __publicField(this, "_delByPeer");
          __publicField(this, "_delAll");
          this._driver = _driver;
          _driver.registerMigration("ref_messages", 1, (db) => {
            db.exec(`
                create table if not exists message_refs (
                    peer_id integer not null,
                    chat_id integer not null,
                    msg_id integer not null
                );
                create index if not exists idx_message_refs_peer on message_refs (peer_id);
                create index if not exists idx_message_refs on message_refs (chat_id, msg_id);
            `);
          });
          _driver.onLoad(() => {
            this._store = this._driver.db.prepare(
              "insert or replace into message_refs (peer_id, chat_id, msg_id) values (?, ?, ?)"
            );
            this._getByPeer = this._driver.db.prepare("select chat_id, msg_id from message_refs where peer_id = ?");
            this._del = this._driver.db.prepare("delete from message_refs where chat_id = ? and msg_id = ?");
            this._delByPeer = this._driver.db.prepare("delete from message_refs where peer_id = ?");
            this._delAll = this._driver.db.prepare("delete from message_refs");
          });
        }
        store(peerId, chatId, msgId) {
          this._store.run(peerId, chatId, msgId);
        }
        getByPeer(peerId) {
          const res = this._getByPeer.get(peerId);
          if (!res)
            return null;
          const res_ = res;
          return [res_.chat_id, res_.msg_id];
        }
        delete(chatId, msgIds) {
          for(let   msgId of msgIds) {
            this._driver._writeLater(this._del, [chatId, msgId]);
          }
        }
        deleteByPeer(peerId) {
          this._delByPeer.run(peerId);
        }
        deleteAll() {
          this._delAll.run();
        }
      }
      class BaseSqliteStorage {
        constructor(driver) {
          __publicField(this, "authKeys");
          __publicField(this, "kv");
          __publicField(this, "refMessages");
          __publicField(this, "peers");
          this.driver = driver;
          this.authKeys = new SqliteAuthKeysRepository(this.driver);
          this.kv = new SqliteKeyValueRepository(this.driver);
          this.refMessages = new SqliteRefMessagesRepository(this.driver);
          this.peers = new SqlitePeersRepository(this.driver);
        }
      }
      const mtcuteUtils = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        AsyncLock,
        BaseCryptoProvider,
        BaseService,
        ConditionVariable,
        CurrentUserService,
        DefaultDcsService,
        Deque,
        EarlyTimer,
        INVITE_LINK_REGEX,
        LogManager,
        Logger,
        LongMap,
        LongSet,
        LruMap,
        LruSet,
        ONE,
        RpsMeter,
        SortedArray,
        SortedLinkedList,
        TWO,
        TlBinaryReader,
        TlBinaryWriter,
        TlSerializationCounter,
        UpdatesStateService,
        ZERO,
        addPublicKey,
        assertTrue,
        assertTypeIs,
        assertTypeIsNot,
        asyncResettable,
        bigIntAbs,
        bigIntBitLength,
        bigIntGcd,
        bigIntMin,
        bigIntModInv,
        bigIntModPow,
        bigIntToBuffer,
        bufferToBigInt,
        bufferToReversed,
        bufferToStream,
        buffersEqual,
        cloneBuffer,
        compareLongs,
        composeMiddlewares,
        computeNewPasswordHash,
        computePasswordHash,
        computeSrpParams,
        concatBuffers,
        createAesIgeForMessage,
        createAesIgeForMessageOld,
        createChunkedReader,
        createControllablePromise,
        dataViewFromBuffer,
        decodeWaveform,
        defaultProductionDc,
        defaultProductionIpv6Dc,
        defaultTestDc,
        defaultTestIpv6Dc,
        determinePartSize,
        encodeInlineMessageId,
        encodeWaveform,
        extractFileName,
        extractUsernames,
        factorizePQSync,
        findKeyByFingerprints,
        generateKeyAndIvFromNonce,
        getAllPeersFrom,
        getBarePeerId,
        getMarkedPeerId,
        getRandomInt,
        hasValueAtKey,
        inflateSvgPath,
        inputPeerToPeer,
        isInputPeerChannel,
        isInputPeerChat,
        isInputPeerUser,
        isPresent,
        isProbablyPlainText,
        isTlRpcError,
        joinTextWithEntities,
        jsonToTlJson,
        links: bundle$2,
        longFromBuffer,
        longFromFastString,
        longToFastString,
        makeArrayPaginated,
        makeArrayWithTotal,
        makeInspectable,
        millerRabin,
        mtpAssertTypeIs,
        normalizeDate,
        normalizeInlineId,
        normalizeMessageId,
        normalizePhoneNumber,
        parseBasicDcOption,
        parseInlineMessageId,
        parseMarkedPeerId,
        parsePublicKey,
        randomBigInt,
        randomBigIntBits,
        randomBigIntInRange,
        randomLong,
        readStringSession,
        removeFromLongArray,
        resolveMaybeDynamic,
        serializeBasicDcOption,
        sleep,
        sleepWithAbort,
        streamToBuffer,
        strippedPhotoToJpg,
        svgPathToFile,
        throttle,
        timers,
        tlJsonToJson,
        toInputChannel,
        toInputPeer,
        toInputUser,
        toggleChannelIdMark,
        twoMultiplicity,
        writeStringSession,
        xorBuffer,
        xorBufferInPlace
      }, Symbol.toStringTag, { value: "Module" }));
      const mtcuteWeb = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
        __proto__: null,
        AllStories,
        Audio,
        BaseSqliteStorage,
        BaseSqliteStorageDriver,
        BaseStorageDriver,
        BaseTelegramClient,
        BaseWebSocketTransport,
        Boost,
        BoostSlot,
        BoostStats,
        BotChatJoinRequestUpdate,
        BotCommands: inner,
        BotInline: factories,
        BotInlineMessage: factories$1,
        BotKeyboard: factories$2,
        BotKeyboardBuilder,
        BotReactionCountUpdate,
        BotReactionUpdate,
        BotStoppedUpdate,
        BusinessAccount,
        BusinessCallbackQuery,
        BusinessChatLink,
        BusinessConnection,
        BusinessIntro,
        BusinessMessage,
        BusinessWorkHours,
        CallbackQuery,
        Chat,
        ChatEvent,
        ChatInviteLink,
        ChatInviteLinkMember,
        ChatJoinRequestUpdate,
        ChatLocation,
        ChatMember,
        ChatMemberUpdate,
        ChatPermissions,
        ChatPhoto,
        ChatPhotoSize,
        ChatPreview,
        ChatlistPreview,
        ChosenInlineResult,
        CollectibleInfo,
        Contact,
        Conversation,
        DeleteBusinessMessageUpdate,
        DeleteMessageUpdate,
        DeleteStoryUpdate,
        Dialog,
        Dice,
        Document,
        DraftMessage,
        ExtendedMediaPreview,
        FactCheck,
        FileLocation,
        ForumTopic,
        FullChat,
        Game,
        GameHighScore,
        HistoryReadUpdate,
        IdbStorage,
        IdbStorageDriver,
        InlineCallbackQuery,
        InlineQuery,
        InputMedia: factories$3,
        IntermediatePacketCodec,
        Invoice,
        LiveLocation,
        Location,
        Long,
        MASK_POSITION_POINT_TO_TL,
        MediaStory,
        MemoryStorage,
        MemoryStorageDriver,
        Message,
        MessageEffect,
        MessageEntity,
        MessageForwardInfo,
        MessageReactions,
        MessageRepliesInfo,
        MtArgumentError,
        MtClient,
        MtEmptyError,
        MtInvalidPeerTypeError,
        MtMessageNotFoundError,
        MtPeerNotFoundError,
        MtSecurityError,
        MtTimeoutError,
        MtTypeAssertionError,
        MtUnsupportedError,
        MtcuteError,
        ObfuscatedPacketCodec,
        PaddedIntermediatePacketCodec,
        PaidMedia,
        PaidPeerReaction,
        PeerReaction,
        PeerStories,
        PeersIndex,
        Photo,
        Poll,
        PollAnswer,
        PollUpdate,
        PollVoteUpdate,
        PreCheckoutQuery,
        PrivacyRule: bundle$1,
        RawDocument,
        RawLocation,
        RepliedMessageInfo,
        SearchFilters,
        SentCode,
        SessionConnection,
        StarGift,
        StarsStatus,
        StarsTransaction,
        Sticker,
        StickerSet,
        StorageManager,
        StoriesStealthMode,
        Story,
        StoryElement,
        StoryInteractions,
        StoryInteractiveChannelPost,
        StoryInteractiveLocation,
        StoryInteractiveReaction,
        StoryInteractiveUrl,
        StoryInteractiveVenue,
        StoryInteractiveWeather,
        StoryRepost,
        StoryUpdate,
        StoryViewer,
        StoryViewersList,
        StreamedCodec,
        TakeoutSession,
        TelegramClient,
        TelegramStorageManager,
        TelegramWorker,
        TelegramWorkerPort,
        Thumbnail,
        TransportError,
        TransportState,
        UpdatesManager,
        User,
        UserStarGift,
        UserStatusUpdate,
        UserTypingUpdate,
        Venue,
        Video,
        Voice,
        WebCryptoProvider,
        WebDocument,
        WebPage,
        WebPlatform,
        WebSocketTransport,
        WrappedCodec,
        _actionFromTl,
        _callDiscardReasonFromTl,
        _callDiscardReasonToTl,
        _messageActionFromTl,
        _messageMediaFromTl,
        _storyInteractiveElementFromTl,
        assertNever,
        businessWorkHoursDaysToRaw,
        defaultReconnectionStrategy,
        getAllPeersFrom,
        getBarePeerId,
        getMarkedPeerId,
        inputTextToTl,
        isUploadedFile,
        mtp: tl.mtp,
        networkMiddlewares: bundle,
        normalizeInputMessageId,
        normalizeInputReaction,
        normalizeInputStickerSet,
        parseMarkedPeerId,
        parsePeer,
        tl: tl.tl,
        toReactionEmoji,
        toggleChannelIdMark
      }, Symbol.toStringTag, { value: "Module" }));
      const KeyboardEvent_key_property = Object.getOwnPropertyDescriptor(KeyboardEvent.prototype, "key");
      Object.defineProperty(KeyboardEvent.prototype, "key", {
        enumerable: true,
        configurable: true,
        get() {
          const evt_key = KeyboardEvent_key_property.get.call(this);
          if ((this.ctrlKey || this.altKey) && evt_key.startsWith("Arrow") && (evt_key.endsWith("Left") || evt_key.endsWith("Right"))) {
            return "Soft" + evt_key.slice(5);
          }
          if (this.shiftKey && evt_key.startsWith("Arrow") && (evt_key.endsWith("Left") || evt_key.endsWith("Right"))) {
            return evt_key.endsWith("Left") ? "*" : "#";
          }
          return evt_key;
        }
      });
      Object.assign(window, {
        signals,
        files,
        solid,
        utils,
        stores,
        md,
        heavyTasks,
        dayjs,
        mtcute: __spreadValues(__spreadValues({}, mtcuteWeb), mtcuteUtils)
      });
    }
  };
});
