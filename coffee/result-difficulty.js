(() => {
  "use strict";

  const result = document.getElementById("result");
  const banner = document.getElementById("resultModeBanner");
  const bannerIcon = document.getElementById("resultModeIcon");
  const bannerTitle = document.getElementById("resultModeTitle");
  const bannerDesc = document.getElementById("resultModeDesc");
  const bannerLevel = document.getElementById("resultModeLevel");
  const overview = document.getElementById("resultOverview");
  const insight = document.getElementById("modeInsight");
  const journey = document.getElementById("journeyList");
  const metricBlock = document.getElementById("metricBlock");
  const insightBlock = document.getElementById("insightBlock");
  const flavorBlock = document.getElementById("flavorBlock");
  const journeyBlock = document.getElementById("journeyBlock");
  const captureBlock = document.getElementById("captureBlock");
  const metricHeading = document.querySelector("#metricBlock .block-copy b");
  const flavorHeading = document.querySelector("#flavorBlock .block-copy b");
  const captureHeading = document.querySelector("#captureBlock .block-copy b");
  const summary = document.getElementById("flavorSummary");
  const quote = document.getElementById("quote");

  if (!result || !banner || !overview || !insight || !journey) return;

  const configs = {
    simple: {
      icon: "🌱", title: "簡單版結算", level: "3 STEP",
      desc: "保留最重要的三個感官結果，讓你快速看懂這杯咖啡。",
      metricTitle: "核心感受", flavorTitle: "風味摘要", captureTitle: "三次捕捉"
    },
    expert: {
      icon: "🔎", title: "專家版結算", level: "6 STEP",
      desc: "整合六項感官指標、風味家族與每階段的兩次選擇。",
      metricTitle: "完整指標", flavorTitle: "風味輪廓", captureTitle: "六次捕捉"
    },
    master: {
      icon: "👑", title: "大師版結算", level: "9 STEP",
      desc: "展開九步品嚐時間線、進階穩定度與完整風味分析。",
      metricTitle: "大師指標", flavorTitle: "深度風味輪廓", captureTitle: "九次捕捉"
    }
  };

  const stageColors = ["#ff8aa0", "#8fe3c2", "#ffd56a"];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function getRun() {
    const run = window.__coffeeRun;
    if (!run || !Array.isArray(run.choices) || !run.choices.length) return null;
    return run;
  }

  function getScore() {
    const match = quote?.textContent.match(/(\d+)\s*\/\s*100/);
    return match ? Number(match[1]) : 0;
  }

  function getFamily() {
    return summary?.querySelector(".summary-title b")?.textContent.trim() || "分析中";
  }

  function getSignature() {
    const text = summary?.querySelector(".signature-note b")?.textContent.trim();
    return text || "尚未產生";
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function calculateInsights(run) {
    const durations = run.choices.map((choice) => Number(choice.duration) || 0);
    const accuracies = run.choices.map((choice) => Number(choice.accuracy) || 0);
    const durationAverage = average(durations);
    const variance = average(durations.map((value) => (value - durationAverage) ** 2));
    const consistency = Math.round(clamp(100 - Math.sqrt(variance) / 11, 0, 100));
    const precision = Math.round(clamp(average(accuracies) * 100, 0, 100));
    const unique = new Set(run.choices.map((choice) => choice.detail || choice.word)).size;
    const breadth = Math.round((unique / run.choices.length) * 100);
    const families = new Set(run.choices.map((choice) => choice.fx || "muted")).size;
    const familyBreadth = Math.round((families / 6) * 100);
    return { consistency, precision, breadth, familyBreadth, unique };
  }

  function buildOverview(run, mode) {
    const score = getScore();
    const family = getFamily();
    overview.innerHTML = `
      <div class="overview-card"><span>完成模式</span><b>${configs[mode].title.replace("結算", "")}</b></div>
      <div class="overview-card"><span>主要風味</span><b>${family}</b></div>
      <div class="overview-card"><span>總評分</span><b>${score} / 100</b></div>`;
  }

  function buildInsight(run, mode) {
    const data = calculateInsights(run);
    const signature = getSignature();

    if (mode === "simple") {
      insight.innerHTML = `
        <div class="insight-lead">你完成了聞香、啜飲與餘韻三個核心動作。這杯咖啡最容易被你感受到的是 <b>${signature}</b>。</div>
        <div class="insight-grid">
          <div class="insight-card"><span>完成步驟</span><b>3 / 3</b></div>
          <div class="insight-card"><span>風味種類</span><b>${data.unique}</b></div>
          <div class="insight-card"><span>辨識直覺</span><b>${data.precision}</b></div>
        </div>`;
      return;
    }

    if (mode === "expert") {
      insight.innerHTML = `
        <div class="insight-lead">六步結果已把第一層香氣、晃杯後香氣、酸甜、口感與兩段餘韻整合在一起。代表風味為 <b>${signature}</b>。</div>
        <div class="insight-grid">
          <div class="insight-card"><span>選擇穩定度</span><b>${data.consistency}</b></div>
          <div class="insight-card"><span>光圈辨識度</span><b>${data.precision}</b></div>
          <div class="insight-card"><span>風味廣度</span><b>${data.breadth}</b></div>
        </div>`;
      return;
    }

    insight.innerHTML = `
      <div class="insight-lead">九步結果已整合觀察、短吸、深聞、酸質、鼻後香、質地與三層餘韻。你的大師級代表風味是 <b>${signature}</b>。</div>
      <div class="insight-grid">
        <div class="insight-card"><span>感官穩定度</span><b>${data.consistency}</b></div>
        <div class="insight-card"><span>辨識精度</span><b>${data.precision}</b></div>
        <div class="insight-card"><span>家族跨度</span><b>${data.familyBreadth}</b></div>
      </div>`;
  }

  function buildJourney(run) {
    journey.innerHTML = run.choices.map((choice, index) => {
      const phase = Number(choice.phase) || 0;
      const flavor = choice.word || `${choice.cat || "風味"}・${choice.detail || "細項"}`;
      return `<div class="journey-item" style="--journey-color:${stageColors[phase] || stageColors[0]}">
        <span class="journey-number">${String(index + 1).padStart(2, "0")}</span>
        <div class="journey-copy"><b>${choice.action || "完成品嚐動作"}</b><small>${["聞香", "啜飲", "餘韻"][phase]}階段・長按 ${Math.round(Number(choice.duration) || 0)} ms</small></div>
        <span class="journey-flavor">${flavor}</span>
      </div>`;
    }).join("");
  }

  function updateBlockOrder(mode) {
    journeyBlock.hidden = mode !== "master";
    const blocks = [metricBlock, insightBlock, flavorBlock, journeyBlock, captureBlock];
    let number = 1;
    blocks.forEach((block) => {
      if (!block || block.hidden) return;
      const index = block.querySelector(".block-index");
      if (index) index.textContent = String(number).padStart(2, "0");
      number += 1;
    });
  }

  function applyLayout() {
    if (result.classList.contains("hidden")) return;
    const run = getRun();
    if (!run || run.choices.length !== run.total) return;

    const mode = configs[run.mode] ? run.mode : run.total >= 9 ? "master" : run.total >= 6 ? "expert" : "simple";
    const config = configs[mode];

    result.classList.remove("result-simple", "result-expert", "result-master");
    result.classList.add(`result-${mode}`);
    result.dataset.resultMode = mode;

    bannerIcon.textContent = config.icon;
    bannerTitle.textContent = config.title;
    bannerDesc.textContent = config.desc;
    bannerLevel.textContent = config.level;
    metricHeading.textContent = config.metricTitle;
    flavorHeading.textContent = config.flavorTitle;
    captureHeading.textContent = config.captureTitle;

    updateBlockOrder(mode);
    buildOverview(run, mode);
    buildInsight(run, mode);
    buildJourney(run);
  }

  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(applyLayout, 320);
  };

  new MutationObserver(() => {
    if (result.classList.contains("hidden")) {
      result.classList.remove("result-simple", "result-expert", "result-master");
      overview.innerHTML = "";
      insight.innerHTML = "";
      journey.innerHTML = "";
      journeyBlock.hidden = false;
      return;
    }
    schedule();
  }).observe(result, { attributes: true, attributeFilter: ["class"] });

  new MutationObserver(schedule).observe(summary, { childList: true, subtree: true, characterData: true });
  new MutationObserver(schedule).observe(quote, { childList: true, subtree: true, characterData: true });
})();
