(() => {
  "use strict";

  const result = document.getElementById("result");
  const summary = document.getElementById("flavorSummary");
  const quote = document.getElementById("quote");
  const canvas = document.getElementById("canvas");
  if (!result || !summary || !quote || !canvas) return;

  const styles = {
    fruit:  { accent: "#ff8a65", sub: "#8fe3c2", cheek: "#ffb08f", coffee: "#7a3f2b", accessory: "leaf" },
    floral: { accent: "#f6a6ff", sub: "#ffd2f1", cheek: "#ffc7ea", coffee: "#6c3b55", accessory: "flower" },
    sweet:  { accent: "#ffd56a", sub: "#fff0a8", cheek: "#ffcf84", coffee: "#8d5a32", accessory: "honey" },
    body:   { accent: "#c98145", sub: "#dca56d", cheek: "#d8b28a", coffee: "#4d2d22", accessory: "bean" },
    mature: { accent: "#d679b7", sub: "#b5639d", cheek: "#d3a0c5", coffee: "#5a2a42", accessory: "beret" },
    muted:  { accent: "#8ca5b3", sub: "#b7ccd5", cheek: "#b5c8d0", coffee: "#5b5d63", accessory: "drop" }
  };

  const familyFromText = (text) => {
    if (text.includes("果香明亮")) return "fruit";
    if (text.includes("花香優雅")) return "floral";
    if (text.includes("甜香回甘")) return "sweet";
    if (text.includes("醇厚可可")) return "body";
    if (text.includes("酒香香料")) return "mature";
    return "muted";
  };

  const moodFromScore = (score) => score >= 85 ? "excited" : score >= 70 ? "happy" : score >= 55 ? "calm" : "tired";
  const px = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

  function drawAccessory(ctx, x, y, s, style) {
    switch (style.accessory) {
      case "leaf":
        px(ctx, x + 22*s, y - 17*s, 10*s, 6*s, "#6fcf97");
        px(ctx, x + 13*s, y - 11*s, 13*s, 6*s, "#86e3a7");
        px(ctx, x + 29*s, y - 9*s, 11*s, 6*s, "#4fbf7b");
        break;
      case "flower":
        px(ctx, x + 22*s, y - 17*s, 10*s, 10*s, "#ffd2f1");
        px(ctx, x + 12*s, y - 11*s, 10*s, 10*s, "#f6a6ff");
        px(ctx, x + 32*s, y - 11*s, 10*s, 10*s, "#f6a6ff");
        px(ctx, x + 22*s, y - 1*s, 10*s, 10*s, "#ffd2f1");
        px(ctx, x + 22*s, y - 9*s, 10*s, 10*s, "#fff0a8");
        break;
      case "honey":
        px(ctx, x + 16*s, y - 15*s, 24*s, 8*s, "#ffd56a");
        px(ctx, x + 20*s, y - 7*s, 6*s, 9*s, "#ffbf45");
        px(ctx, x + 30*s, y - 7*s, 6*s, 13*s, "#ffbf45");
        break;
      case "bean":
        px(ctx, x + 15*s, y - 15*s, 26*s, 11*s, "#6d3f2a");
        px(ctx, x + 27*s, y - 15*s, 3*s, 11*s, "#b87550");
        break;
      case "beret":
        px(ctx, x + 10*s, y - 15*s, 34*s, 11*s, "#8d3d70");
        px(ctx, x + 34*s, y - 21*s, 8*s, 8*s, "#b5639d");
        break;
      default:
        px(ctx, x + 22*s, y - 17*s, 10*s, 6*s, "#b7ccd5");
        px(ctx, x + 18*s, y - 11*s, 18*s, 10*s, "#8ca5b3");
        px(ctx, x + 22*s, y - 1*s, 10*s, 8*s, "#6f858f");
    }
  }

  function drawFace(ctx, x, y, s, style, mood) {
    const dark = "#1a100d";
    if (mood === "excited") {
      px(ctx, x + 15*s, y + 20*s, 6*s, 6*s, dark);
      px(ctx, x + 39*s, y + 20*s, 6*s, 6*s, dark);
      px(ctx, x + 17*s, y + 19*s, 2*s, 2*s, "#fff2cf");
      px(ctx, x + 41*s, y + 19*s, 2*s, 2*s, "#fff2cf");
    } else if (mood === "happy") {
      px(ctx, x + 15*s, y + 22*s, 6*s, 4*s, dark);
      px(ctx, x + 39*s, y + 22*s, 6*s, 4*s, dark);
    } else if (mood === "calm") {
      px(ctx, x + 15*s, y + 23*s, 6*s, 3*s, dark);
      px(ctx, x + 39*s, y + 23*s, 6*s, 3*s, dark);
    } else {
      px(ctx, x + 15*s, y + 24*s, 6*s, 2*s, dark);
      px(ctx, x + 39*s, y + 24*s, 6*s, 2*s, dark);
    }

    px(ctx, x + 9*s, y + 34*s, 7*s, 4*s, style.cheek);
    px(ctx, x + 44*s, y + 34*s, 7*s, 4*s, style.cheek);
    px(ctx, x + 26*s, y + 30*s, 8*s, 6*s, "#c98a62");

    if (mood === "excited") {
      px(ctx, x + 22*s, y + 40*s, 16*s, 4*s, "#bd6f42");
      px(ctx, x + 25*s, y + 44*s, 10*s, 4*s, "#bd6f42");
    } else if (mood === "happy") {
      px(ctx, x + 24*s, y + 40*s, 12*s, 4*s, "#bd6f42");
      px(ctx, x + 27*s, y + 44*s, 6*s, 2*s, "#bd6f42");
    } else if (mood === "calm") {
      px(ctx, x + 24*s, y + 41*s, 12*s, 3*s, "#bd6f42");
    } else {
      px(ctx, x + 24*s, y + 44*s, 12*s, 3*s, "#8d5437");
    }
  }

  function clearAvatarArea(ctx) {
    const left = 235, top = 215, width = 430, height = 345;
    ctx.fillStyle = "#3a241c";
    ctx.fillRect(left, top, width, height);
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    ctx.lineWidth = 1;
    for (let x = left; x <= left + width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + height); ctx.stroke();
    }
    for (let y = top; y <= top + height; y += 30) {
      ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + width, y); ctx.stroke();
    }
  }

  function drawAvatar(ctx, family, score) {
    const style = styles[family];
    const mood = moodFromScore(score);
    const s = 3;
    const centerX = 450;
    const y = 300;
    const x = centerX - 31*s;
    const dark = "#1a100d";

    clearAvatarArea(ctx);

    px(ctx, centerX - 102, y - 28, 9, 9, style.sub);
    px(ctx, centerX + 94, y - 46, 9, 9, style.sub);
    px(ctx, centerX - 126, y + 68, 6, 6, style.accent);
    px(ctx, centerX + 119, y + 83, 6, 6, style.accent);
    if (score >= 85) {
      px(ctx, centerX - 142, y + 12, 5, 18, style.accent);
      px(ctx, centerX - 148, y + 18, 18, 5, style.accent);
      px(ctx, centerX + 137, y + 24, 5, 18, style.sub);
      px(ctx, centerX + 131, y + 30, 18, 5, style.sub);
    }

    px(ctx, x - 14*s, y + 6*s, 92*s, 72*s, dark);
    px(ctx, x + 64*s, y + 22*s, 28*s, 44*s, dark);
    px(ctx, x, y + 12*s, 62*s, 46*s, "#fff2cf");
    px(ctx, x, y + 40*s, 62*s, 18*s, "#e9c99f");
    px(ctx, x + 6*s, y, 50*s, 18*s, dark);
    px(ctx, x + 12*s, y + 4*s, 38*s, 8*s, style.coffee);

    drawAccessory(ctx, x, y, s, style);
    drawFace(ctx, x, y, s, style, mood);

    px(ctx, x + 62*s, y + 18*s, 8*s, 34*s, dark);
    px(ctx, x + 70*s, y + 18*s, 10*s, 8*s, dark);
    px(ctx, x + 70*s, y + 44*s, 10*s, 8*s, dark);
  }

  function applyAvatar() {
    if (result.classList.contains("hidden")) return;
    const familyText = summary.querySelector(".summary-title b")?.textContent || "";
    const scoreMatch = quote.textContent.match(/(\d+)\s*\/\s*100/);
    if (!familyText || !scoreMatch) return;

    const family = familyFromText(familyText);
    const score = Number(scoreMatch[1]);
    const key = `${family}-${score}`;
    if (canvas.dataset.avatarFeedback === key) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAvatar(ctx, family, score);
    canvas.dataset.avatarFeedback = key;
  }

  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(applyAvatar, 180);
  };

  new MutationObserver(() => {
    if (result.classList.contains("hidden")) {
      delete canvas.dataset.avatarFeedback;
      return;
    }
    schedule();
  }).observe(result, { attributes: true, attributeFilter: ["class"] });

  new MutationObserver(schedule).observe(summary, { childList: true, subtree: true, characterData: true });
  new MutationObserver(schedule).observe(quote, { childList: true, subtree: true, characterData: true });
})();
