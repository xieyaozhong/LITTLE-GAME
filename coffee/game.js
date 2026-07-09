(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const E = {
    app: document.querySelector(".app"), modePicker: $("modePicker"), modeBadge: $("modeBadge"), modeNote: $("modeNote"),
    status: $("status"), stage: $("stage"), desc: $("desc"), count: $("count"), game: $("game"), scene: $("scene"),
    word: $("word"), particles: $("particles"), pulse: $("pulse"), hint: $("hint"), hold: $("hold"),
    actionGuide: $("actionGuide"), actionIcon: $("actionIcon"), actionStep: $("actionStep"), actionText: $("actionText"), actionTip: $("actionTip"),
    result: $("result"), title: $("title"), metrics: $("metrics"), tags: $("tags"), quote: $("quote"), canvas: $("canvas"),
    toast: $("toast"), download: $("download"), restart: $("restart")
  };

  const phaseInfo = [
    { name: "聞香", speed: 1450 },
    { name: "啜飲", speed: 1750 },
    { name: "餘韻", speed: 2050 }
  ];

  const o = (cat, detail, score, fx) => ({ cat, detail, score, fx });
  const groups = {
    simpleAroma: [
      o("果香", "清新水果", 82, "fruit"), o("花香", "柔和花朵", 88, "floral"), o("甜香", "蜂蜜焦糖", 86, "sweet"),
      o("堅果", "榛果杏仁", 68, "body"), o("發酵香", "紅酒果乾", 52, "mature"), o("清新", "明亮乾淨", 78, "muted"),
      o("香氣強度", "輕柔", 64, "muted"), o("香氣強度", "濃郁", 84, "body")
    ],
    simpleSip: [
      o("酸質", "明亮", 84, "fruit"), o("酸質", "柔和", 76, "fruit"), o("甜感", "清甜", 88, "sweet"),
      o("苦感", "柔和可可", 58, "muted"), o("口感", "輕盈", 66, "muted"), o("口感", "滑順", 92, "body"),
      o("醇厚度", "厚實", 86, "body"), o("平衡", "酸甜均衡", 94, "body")
    ],
    simpleFinish: [
      o("回甘", "蜂蜜甜感", 94, "sweet"), o("果甜", "水果回甜", 86, "fruit"), o("餘韻", "可可綿長", 90, "body"),
      o("餘韻", "花香回返", 92, "floral"), o("餘韻長度", "短促", 34, "muted"), o("餘韻長度", "綿長", 94, "body"),
      o("乾淨度", "乾淨收尾", 84, "muted"), o("乾澀", "茶單寧", 38, "muted")
    ],
    aromaFirst: [
      o("果香", "柑橘調", 84, "fruit"), o("果香", "莓果調", 90, "fruit"), o("果香", "核果調", 86, "fruit"),
      o("果香", "熱帶水果", 78, "fruit"), o("花香", "白花調", 94, "floral"), o("花香", "玫瑰調", 88, "floral"),
      o("甜香", "蜂蜜調", 88, "sweet"), o("甜香", "黑糖調", 78, "sweet"), o("堅果", "榛果調", 70, "body"),
      o("堅果", "杏仁調", 66, "body"), o("清新", "草本清新", 58, "muted"), o("香氣強度", "鮮明", 90, "fruit")
    ],
    aromaSwirl: [
      o("果香", "佛手柑", 94, "fruit"), o("果香", "白葡萄", 90, "fruit"), o("果香", "水蜜桃", 92, "fruit"),
      o("果香", "覆盆子", 96, "fruit"), o("果香", "黑醋栗", 88, "fruit"), o("花香", "茉莉", 100, "floral"),
      o("花香", "橙花", 96, "floral"), o("花香", "洋甘菊", 86, "floral"), o("甜香", "香草", 84, "sweet"),
      o("甜香", "黑糖", 80, "sweet"), o("發酵香", "紅酒", 58, "mature"), o("發酵香", "蘭姆酒", 54, "mature"),
      o("過熟感", "熟香蕉", 30, "muted"), o("香氣強度", "濃郁", 86, "body")
    ],
    acidSweet: [
      o("酸質", "檸檬酸", 76, "fruit"), o("酸質", "柳橙酸", 82, "fruit"), o("酸質", "青蘋果酸", 86, "fruit"),
      o("酸質", "白葡萄酸", 90, "fruit"), o("酸質", "莓果酸", 88, "fruit"), o("酸質", "百香果酸", 82, "fruit"),
      o("甜感", "蜂蜜", 94, "sweet"), o("甜感", "楓糖", 92, "sweet"), o("甜感", "蔗糖", 88, "sweet"),
      o("甜感", "黑糖", 86, "sweet"), o("甜感", "太妃糖", 90, "sweet"), o("平衡", "酸甜均衡", 96, "body")
    ],
    textureBody: [
      o("口感", "絲滑", 100, "body"), o("口感", "奶油感", 96, "body"), o("口感", "果汁感", 90, "fruit"),
      o("口感", "糖漿感", 92, "sweet"), o("口感", "氣泡感", 82, "fruit"), o("口感", "水潤", 72, "muted"),
      o("口感", "粗糙", 34, "muted"), o("醇厚度", "輕盈", 64, "muted"), o("醇厚度", "中等", 80, "body"),
      o("醇厚度", "厚實", 94, "body"), o("醇厚", "牛奶巧克力", 92, "body"), o("醇厚", "黑巧克力", 84, "body"),
      o("醇厚", "可可脂", 88, "body"), o("平衡", "柔和圓潤", 94, "body")
    ],
    finishImmediate: [
      o("果甜", "蘋果回甜", 76, "fruit"), o("果甜", "葡萄回甜", 84, "fruit"), o("果甜", "莓果回甜", 88, "fruit"),
      o("果甜", "桃子回甜", 90, "fruit"), o("糖香", "焦糖回甘", 94, "sweet"), o("糖香", "黑糖回甘", 90, "sweet"),
      o("糖香", "楓糖尾韻", 92, "sweet"), o("回甘", "蜂蜜甜感", 100, "sweet"), o("回甘", "蔗糖甜感", 96, "sweet"),
      o("餘韻", "可可初現", 88, "body"), o("花香", "茉莉回香", 98, "floral"), o("柑橘", "佛手柑回香", 92, "fruit")
    ],
    finishDeep: [
      o("餘韻長度", "短促", 30, "muted"), o("餘韻長度", "中等", 72, "body"), o("餘韻長度", "綿長", 96, "body"),
      o("餘韻", "可可綿長", 96, "body"), o("餘韻", "堅果悠長", 92, "body"), o("餘韻", "奶油柔順", 94, "body"),
      o("餘韻", "花香回返", 98, "floral"), o("香料", "肉桂", 78, "mature"), o("香料", "丁香", 68, "mature"),
      o("香料", "豆蔻", 74, "mature"), o("酒香", "紅酒發酵", 60, "mature"), o("酒香", "威士忌桶", 64, "mature"),
      o("酒香", "蘭姆葡萄", 66, "mature"), o("煙燻", "雪松木", 56, "mature"), o("煙燻", "烤木質", 50, "mature"),
      o("乾澀", "茶單寧", 34, "muted"), o("乾淨度", "乾淨收尾", 88, "muted"), o("乾淨度", "混濁殘留", 24, "muted")
    ],
    cleanliness: [
      o("乾淨度", "明亮清晰", 92, "fruit"), o("乾淨度", "純淨無雜味", 96, "floral"), o("乾淨度", "柔和乾淨", 84, "muted"),
      o("香氣強度", "輕柔", 66, "muted"), o("香氣強度", "鮮明", 92, "fruit"), o("香氣強度", "濃郁", 86, "body"),
      o("發酵感", "活潑", 58, "mature"), o("過熟感", "悶熟", 28, "muted"), o("雜味", "木紙感", 22, "muted")
    ],
    acidTemperature: [
      o("溫度感", "偏熱", 58, "mature"), o("溫度感", "溫暖", 82, "sweet"), o("溫度感", "適中", 92, "body"),
      o("溫度感", "微涼", 68, "muted"), o("酸質形態", "明亮", 92, "fruit"), o("酸質形態", "柔和", 82, "fruit"),
      o("酸質形態", "圓潤", 88, "body"), o("酸質形態", "尖銳", 42, "muted"),
      o("酸質", "檸檬酸", 76, "fruit"), o("酸質", "柳橙酸", 82, "fruit"), o("酸質", "青蘋果酸", 86, "fruit"),
      o("酸質", "白葡萄酸", 90, "fruit"), o("酸質", "莓果酸", 88, "fruit"), o("酸質", "百香果酸", 82, "fruit")
    ],
    retronasalSweet: [
      o("鼻後香", "柑橘回升", 88, "fruit"), o("鼻後香", "莓果回升", 90, "fruit"), o("鼻後香", "花香回升", 96, "floral"),
      o("鼻後香", "可可回升", 84, "body"), o("甜感", "蜂蜜", 94, "sweet"), o("甜感", "楓糖", 92, "sweet"),
      o("甜感", "蔗糖", 88, "sweet"), o("甜感", "黑糖", 86, "sweet"), o("甜感", "太妃糖", 90, "sweet"),
      o("甜感強度", "清甜", 84, "sweet"), o("甜感強度", "圓潤", 92, "sweet"), o("甜感強度", "厚甜", 88, "body")
    ],
    representative: [
      o("代表風格", "清新明亮", 92, "fruit"), o("代表風格", "花香優雅", 96, "floral"), o("代表風格", "蜂蜜甜潤", 94, "sweet"),
      o("代表風格", "果汁多汁", 90, "fruit"), o("代表風格", "絲滑圓潤", 96, "body"), o("代表風格", "可可醇厚", 92, "body"),
      o("代表風格", "酒香成熟", 70, "mature"), o("代表風格", "香料深邃", 74, "mature"), o("代表風格", "木質沉穩", 62, "mature"),
      o("代表風格", "茶感乾淨", 82, "muted"), o("代表風格", "酸甜平衡", 98, "body"), o("代表風格", "餘韻悠長", 96, "body")
    ]
  };

  const modes = {
    simple: {
      label: "簡單版", total: 3, cycle: 560,
      note: "每一步只出現該感官最容易理解的形容詞，快速完成聞香、啜飲與餘韻。",
      steps: [
        { phase: 0, sense: "嗅覺・香氣大類", icon: "👃", action: "把杯子靠近鼻尖，安靜聞香 2–3 秒", tip: "只選你第一時間聞到的香氣方向。", options: groups.simpleAroma },
        { phase: 1, sense: "味覺・酸甜苦與口感", icon: "☕", action: "小口啜飲，讓咖啡鋪滿舌面", tip: "從酸、甜、苦、滑順與厚薄中選一個最明顯的感受。", options: groups.simpleSip },
        { phase: 2, sense: "餘韻・回甘與長度", icon: "⏳", action: "吞下後停一下，感受留下的味道", tip: "只選最後仍留在口中的回甘、香氣或長短。", options: groups.simpleFinish }
      ]
    },
    expert: {
      label: "專家版", total: 6, cycle: 440,
      note: "每個動作都有獨立感官詞庫，香氣、酸甜、質地與餘韻不再混在一起。",
      steps: [
        { phase: 0, sense: "嗅覺・第一層香氣", icon: "👃", action: "先不晃杯，聞第一層香氣", tip: "此步只出現水果、花、甜香、堅果與香氣強度。", options: groups.aromaFirst },
        { phase: 0, sense: "嗅覺・晃杯後細項", icon: "🌀", action: "輕晃杯子，再聞一次香氣變化", tip: "此步只辨認更具體的水果、花香、甜香與發酵香。", options: groups.aromaSwirl },
        { phase: 1, sense: "味覺・酸質與甜感", icon: "☕", action: "小口啜飲，先找酸與甜", tip: "此步不判斷質地，只選酸質種類、甜感或酸甜平衡。", options: groups.acidSweet },
        { phase: 1, sense: "觸覺・口感與醇厚", icon: "💨", action: "用吸氣式啜吸，感受口感與厚度", tip: "此步只出現絲滑、奶油、果汁、糖漿、氣泡與厚薄。", options: groups.textureBody },
        { phase: 2, sense: "餘韻・立即回甘", icon: "✨", action: "吞下後立即辨認第一個回甘", tip: "此步只捕捉果甜、糖香、蜂蜜、花香與初現可可。", options: groups.finishImmediate },
        { phase: 2, sense: "餘韻・深層與長度", icon: "⏳", action: "等待 5 秒，再確認餘韻", tip: "此步只判斷餘韻長度、香料、酒香、煙燻、木質與乾澀。", options: groups.finishDeep }
      ]
    },
    master: {
      label: "大師版", total: 9, cycle: 350,
      note: "九個步驟各自使用專屬感官詞庫，從乾淨度、鼻後香到代表風格逐層辨識。",
      steps: [
        { phase: 0, sense: "嗅覺・乾淨度與強度", icon: "👀", action: "先觀察蒸氣並感受香氣乾淨度", tip: "只判斷清晰、純淨、濃淡、發酵或雜味，不選水果名稱。", options: groups.cleanliness },
        { phase: 0, sense: "嗅覺・香氣方向", icon: "👃", action: "短吸聞香，辨認香氣方向", tip: "先決定水果、花、甜香或堅果等大方向。", options: groups.aromaFirst },
        { phase: 0, sense: "嗅覺・具體香氣細項", icon: "🌀", action: "輕晃後深聞，找出具體細項", tip: "再縮小成佛手柑、茉莉、蜂蜜、黑醋栗或紅酒等細項。", options: groups.aromaSwirl },
        { phase: 1, sense: "味覺・溫度與酸質", icon: "☕", action: "第一小口，只判斷酸質與溫度", tip: "此步只顯示溫度感、酸質形態與具體酸質。", options: groups.acidTemperature },
        { phase: 1, sense: "鼻後嗅覺・香氣與甜感", icon: "💨", action: "啜吸帶入空氣，辨認鼻後香與甜感", tip: "此步只判斷鼻後回升的香氣與甜感種類、強度。", options: groups.retronasalSweet },
        { phase: 1, sense: "口腔觸覺・質地與醇厚", icon: "👅", action: "含住 2 秒，比較質地與醇厚", tip: "此步只判斷絲滑、奶油、果汁、糖漿、氣泡、厚薄與可可質地。", options: groups.textureBody },
        { phase: 2, sense: "餘韻・第一個尾韻", icon: "✨", action: "吞下後立即記錄第一個尾韻", tip: "此步只捕捉最先出現的果甜、糖香、回甘、花香或可可。", options: groups.finishImmediate },
        { phase: 2, sense: "餘韻・長度與深層香氣", icon: "⏳", action: "等待 5 秒，辨認深層餘韻", tip: "此步只判斷長短、香料、酒香、煙燻、木質、乾澀與收尾乾淨度。", options: groups.finishDeep },
        { phase: 2, sense: "整體判讀・代表風格", icon: "🧠", action: "回想整杯，選出代表風格", tip: "最後用一個整體形容詞總結這杯咖啡，而不是再選單一水果。", options: groups.representative }
      ]
    }
  };

  const S = { mode: "simple", started: false, done: false, pressing: false, t0: 0, pulseStart: performance.now(), pulseScale: 0.3, wordIndex: -1, current: null, inputs: [], result: null };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const currentMode = () => modes[S.mode];
  const currentStepIndex = () => Math.min(S.inputs.length, currentMode().total - 1);
  const currentStep = () => currentMode().steps[currentStepIndex()];
  const currentPool = () => currentStep().options;

  function toast(text) {
    E.toast.textContent = text;
    E.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => E.toast.classList.remove("show"), 950);
  }

  function tone(frequency, duration = 0.07) {
    try {
      tone.ctx = tone.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = tone.ctx.createOscillator();
      const gain = tone.ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, tone.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, tone.ctx.currentTime + duration);
      oscillator.connect(gain).connect(tone.ctx.destination);
      oscillator.start();
      oscillator.stop(tone.ctx.currentTime + duration);
    } catch (_) {}
  }

  function updateModeUI() {
    document.querySelectorAll(".mode-btn").forEach((button) => button.classList.toggle("active", button.dataset.mode === S.mode));
    E.app.classList.remove("mode-simple", "mode-expert", "mode-master");
    E.app.classList.add(`mode-${S.mode}`);
    E.modeBadge.textContent = `${currentMode().label}・${currentMode().total} 步`;
    E.modeNote.textContent = currentMode().note;
    E.modePicker.classList.toggle("locked", S.started);
  }

  function updateActionGuide() {
    const step = currentStep();
    E.actionIcon.textContent = step.icon;
    E.actionStep.textContent = `STEP ${currentStepIndex() + 1} / ${currentMode().total}・${phaseInfo[step.phase].name}・${step.sense}`;
    E.actionText.textContent = step.action;
    E.actionTip.textContent = step.tip;
  }

  function updateUI() {
    updateModeUI();
    updateActionGuide();
    E.count.textContent = `${S.inputs.length} / ${currentMode().total}`;
    if (!S.started) {
      E.stage.textContent = `準備品飲｜${currentMode().label}`;
      E.desc.textContent = `完成 ${currentMode().total} 個動作，每一步只顯示對應感官詞。`;
      E.hint.innerHTML = `<b>先看上方的動作與感官</b><span>開始後，每一步的選項會自動切換成正確的形容詞與風味範圍。</span>`;
      return;
    }
    const step = currentStep();
    E.stage.textContent = `第 ${currentStepIndex() + 1} 步｜${phaseInfo[step.phase].name}`;
    E.desc.textContent = `${step.sense}：${step.action}`;
    E.hint.innerHTML = `<b>${step.sense}・${currentPool().length} 個對應選項</b><span>${step.tip}</span>`;
  }

  function animatePulse(now) {
    if (!S.done) {
      const phase = ((now - S.pulseStart) % phaseInfo[currentStep().phase].speed) / phaseInfo[currentStep().phase].speed;
      const wave = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * wave);
      S.pulseScale = 0.28 + eased * 0.92;
      E.pulse.style.transform = `scale(${S.pulseScale})`;
      E.pulse.style.opacity = 0.55 + eased * 0.45;
      requestAnimationFrame(animatePulse);
    }
  }

  function clearFx() {
    E.scene.classList.remove("fx-fruit", "fx-floral", "fx-sweet", "fx-body", "fx-mature", "fx-muted");
    E.particles.innerHTML = "";
  }

  const palettes = {
    fruit: ["#ff6f61", "#ffb347", "#ffd166", "#ff8aa0"], floral: ["#f6a6ff", "#ffb8e8", "#e4c3ff", "#ffd2f1"],
    sweet: ["#ffd56a", "#ffbf45", "#fff0a8", "#ffde8a"], body: ["#c98145", "#9b5b36", "#dca56d", "#6d3f2a"],
    mature: ["#d679b7", "#8d3d70", "#b5639d", "#6f315f"], muted: ["#8ca5b3", "#667983", "#9bb0ba", "#52656e"]
  };

  function setFx(type) {
    clearFx();
    E.scene.classList.add(`fx-${type}`);
    const colors = palettes[type] || palettes.muted;
    const count = S.mode === "simple" ? 8 : S.mode === "expert" ? 11 : 14;
    for (let i = 0; i < count; i += 1) {
      const particle = document.createElement("i");
      const angle = Math.random() * Math.PI * 2;
      const radius = 72 + Math.random() * 105;
      particle.className = "particle";
      particle.style.setProperty("--x", `${Math.cos(angle) * radius}px`);
      particle.style.setProperty("--y", `${Math.sin(angle) * radius}px`);
      particle.style.setProperty("--delay", `${-Math.random() * 1.5}s`);
      particle.style.setProperty("--scale", `${0.7 + Math.random() * 1.2}`);
      particle.style.setProperty("--pc", colors[i % colors.length]);
      E.particles.appendChild(particle);
    }
  }

  function startGame() {
    S.started = true;
    S.pulseStart = performance.now();
    E.hold.textContent = "按住品嚐・選到符合感受的詞放開";
    updateUI();
    toast(`${currentMode().label}開始・每一步使用專屬感官詞庫`);
    tone(440);
  }

  function press(event) {
    event.preventDefault();
    window.getSelection?.()?.removeAllRanges();
    if (!S.started) { startGame(); return; }
    if (S.done || S.pressing) return;
    S.pressing = true;
    S.t0 = performance.now();
    S.wordIndex = -1;
    S.current = null;
    E.scene.classList.add("pressing");
    E.word.classList.add("active");
    E.hold.classList.add("down");
    E.actionGuide.classList.add("active");
    navigator.vibrate?.(16);

    const loop = () => {
      if (!S.pressing) return;
      const elapsed = performance.now() - S.t0;
      const phase = (elapsed % 2900) / 2900;
      E.hold.style.setProperty("--progress", `${phase < 0.5 ? phase * 200 : (1 - phase) * 200}%`);
      const words = currentPool();
      const index = Math.floor(elapsed / currentMode().cycle) % words.length;
      const item = words[index];
      if (index !== S.wordIndex) {
        S.wordIndex = index;
        S.current = item;
        E.word.innerHTML = `<span>${item.cat}</span><small>${item.detail}</small>`;
        setFx(item.fx);
        tone(320 + (index % 12) * 24, 0.035);
        navigator.vibrate?.(7);
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  function release(event) {
    if (!S.pressing || S.done) return;
    event.preventDefault();
    S.pressing = false;
    E.scene.classList.remove("pressing");
    E.word.classList.remove("active");
    E.hold.classList.remove("down");
    E.actionGuide.classList.remove("active");

    const stepIndex = currentStepIndex();
    const step = currentStep();
    const item = S.current || currentPool()[0];
    const duration = performance.now() - S.t0;
    const ring = clamp(1 - Math.abs(S.pulseScale - 0.95) / 0.75, 0, 1);
    const accuracy = clamp(ring * 0.52 + (item.score / 100) * 0.48, 0, 1);
    S.inputs.push({
      duration, accuracy, word: `${item.cat}・${item.detail}`, cat: item.cat, detail: item.detail, score: item.score, fx: item.fx,
      phase: step.phase, step: stepIndex, action: step.action, sense: step.sense, mode: S.mode
    });

    window.__coffeeRun = {
      mode: S.mode, modeLabel: currentMode().label, total: currentMode().total,
      phaseNames: phaseInfo.map((phase) => phase.name), choices: S.inputs.map((input) => ({ ...input }))
    };

    E.word.innerHTML = `<span>抓到：${item.cat}</span><small>${item.detail}</small>`;
    toast(`${step.sense}：${item.cat}・${item.detail}`);
    tone(420 + item.score * 2, 0.08);
    E.count.textContent = `${S.inputs.length} / ${currentMode().total}`;
    setTimeout(clearFx, 420);

    if (S.inputs.length >= currentMode().total) { setTimeout(finish, 480); return; }
    S.pulseStart = performance.now();
    setTimeout(() => {
      updateUI();
      E.word.innerHTML = `<span>按住探索感官</span><small>${currentStep().sense}</small>`;
      toast(`下一步：${currentStep().sense}`);
    }, 330);
  }

  function phaseAverage(key, phase) {
    const items = S.inputs.filter((input) => input.phase === phase);
    return items.length ? items.reduce((sum, input) => sum + input[key], 0) / items.length : 0.5;
  }

  function calculateResult() {
    const total = S.inputs.length;
    const durations = S.inputs.map((input) => input.duration);
    const accuracies = S.inputs.map((input) => input.accuracy);
    const average = durations.reduce((a, b) => a + b, 0) / total;
    const accuracyAverage = accuracies.reduce((a, b) => a + b, 0) / total;
    const shortRatio = durations.filter((value) => value < 700).length / total;
    const longRatio = durations.filter((value) => value > 1600).length / total;
    const variance = durations.reduce((sum, value) => sum + (value - average) ** 2, 0) / total;
    const consistency = clamp(1 - Math.sqrt(variance) / 1300, 0, 1);
    const aromaAccuracy = phaseAverage("accuracy", 0);
    const sipAccuracy = phaseAverage("accuracy", 1);
    const finishAccuracy = phaseAverage("accuracy", 2);
    const metrics = {
      香氣: Math.round(clamp(42 + aromaAccuracy * 43 + shortRatio * 12, 20, 100)),
      明亮感: Math.round(clamp(34 + shortRatio * 32 + aromaAccuracy * 18 + (1 - longRatio) * 10, 15, 100)),
      醇厚度: Math.round(clamp(32 + longRatio * 28 + sipAccuracy * 24 + average / 90, 20, 100)),
      順口度: Math.round(clamp(38 + accuracyAverage * 42 + consistency * 18, 20, 100)),
      平衡感: Math.round(clamp(40 + consistency * 36 + sipAccuracy * 16, 20, 100)),
      餘韻: Math.round(clamp(36 + finishAccuracy * 42 + average / 95, 20, 100))
    };
    metrics.甜感 = Math.round(clamp(38 + metrics.平衡感 * 0.27 + metrics.順口度 * 0.2, 20, 100));
    const chosen = S.inputs.map((input) => input.word);
    let name = "焦糖微光咖啡", character = "溫柔小咖啡師", quote = "甜感柔和、層次舒服，是一杯會讓人慢慢放鬆的咖啡。", mood = "happy";
    if (metrics.明亮感 > metrics.醇厚度 + 13) { name = "花果晨光咖啡"; character = "果香探險家"; quote = "明亮果酸帶著花香跳躍，入口清爽，細節活潑而鮮明。"; mood = "fruit"; }
    else if (metrics.醇厚度 > metrics.明亮感 + 15) { name = "絲絨可可咖啡"; character = "可可守護者"; quote = "厚實口感包住舌尖，留下巧克力、焦糖與堅果般的溫暖。"; mood = "body"; }
    else if (metrics.平衡感 > 80 && metrics.順口度 > 78) { name = "黃金平衡咖啡"; character = "啜飲魔法師"; quote = "酸、甜與醇厚互相襯托，乾淨、完整，又富有層次。"; mood = "gold"; }
    else if (metrics.甜感 > 78) { name = "蜂蜜抱抱咖啡"; character = "甜感小精靈"; quote = "蜂蜜、焦糖與柔和果甜慢慢融化，圓潤而討喜。"; mood = "sweet"; }
    const score = Math.round((metrics.香氣 + metrics.順口度 + metrics.平衡感 + metrics.餘韻 + metrics.甜感) / 5);
    return { metrics, chosen, name, character, quote, mood, score, mode: S.mode, modeLabel: currentMode().label, total };
  }

  const beans = (value) => {
    const filled = clamp(Math.round(value / 20), 1, 5);
    return "◆".repeat(filled) + "◇".repeat(5 - filled);
  };

  function finish() {
    S.done = true;
    S.result = calculateResult();
    const r = S.result;
    E.stage.textContent = "評測完成";
    E.desc.textContent = `${r.modeLabel} ${r.total} 步已完成，每個結果都來自對應感官詞庫。`;
    E.title.textContent = r.name;
    E.metrics.innerHTML = ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"]
      .map((key) => `<div class="metric"><b>${key} ${r.metrics[key]}</b><span class="beans">${beans(r.metrics[key])}</span></div>`).join("");
    E.tags.innerHTML = r.chosen.map((flavor, index) => `<span class="tag">${String(index + 1).padStart(2, "0")}・${flavor}</span>`).join("");
    E.quote.innerHTML = `<b>${r.character}</b><br>${r.quote}<br><span class="result-mode-chip">${r.modeLabel}・${r.total} 步</span><br>總評分：<b>${r.score} / 100</b>`;
    drawCard(r);
    setTimeout(() => {
      E.game.classList.add("hidden");
      E.status.classList.add("hidden");
      E.modePicker.classList.add("hidden");
      E.result.classList.remove("hidden");
      E.result.scrollIntoView({ behavior: "smooth" });
    }, 350);
    [523, 659, 784].forEach((frequency, index) => setTimeout(() => tone(frequency, 0.11), index * 100));
  }

  function wrap(ctx, text, x, y, maxWidth, lineHeight, maxLines = 3) {
    let line = "", row = 0;
    for (const ch of [...text]) {
      if (ctx.measureText(line + ch).width > maxWidth && line) {
        ctx.fillText(line, x, y + row * lineHeight);
        line = ch;
        row += 1;
        if (row >= maxLines - 1) break;
      } else line += ch;
    }
    ctx.fillText(line, x, y + row * lineHeight);
  }

  function drawCup(ctx, x, y, p, mood) {
    const dark = "#1a100d";
    ctx.fillStyle = dark; ctx.fillRect(x - 8*p, y, 82*p, 60*p); ctx.fillRect(x + 66*p, y + 12*p, 28*p, 36*p);
    ctx.fillStyle = "#fff2cf"; ctx.fillRect(x, y + 8*p, 62*p, 44*p);
    ctx.fillStyle = "#e9c99f"; ctx.fillRect(x, y + 40*p, 62*p, 12*p);
    ctx.fillStyle = dark; ctx.fillRect(x + 6*p, y - 8*p, 50*p, 20*p);
    ctx.fillStyle = "#5b2f21"; ctx.fillRect(x + 12*p, y - 2*p, 38*p, 9*p);
    ctx.fillStyle = dark; ctx.fillRect(x + 16*p, y + 24*p, 6*p, 6*p); ctx.fillRect(x + 40*p, y + 24*p, 6*p, 6*p);
    ctx.fillStyle = "#bd6f42"; ctx.fillRect(x + 24*p, y + 34*p, 16*p, 4*p); ctx.fillRect(x + 28*p, y + 38*p, 8*p, 4*p);
    const accent = mood === "fruit" ? "#ff8aa0" : mood === "gold" || mood === "sweet" ? "#ffd56a" : "#8fe3c2";
    ctx.fillStyle = accent; ctx.fillRect(x - 18*p, y - 8*p, 7*p, 7*p); ctx.fillRect(x + 78*p, y - 20*p, 7*p, 7*p);
  }

  function drawCard(r) {
    const canvas = E.canvas;
    canvas.width = 900;
    canvas.height = 1200;
    delete canvas.dataset.avatarFeedback;
    const ctx = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#211511"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,.035)";
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.fillStyle = "#fff2cf"; ctx.fillRect(40, 40, W - 80, H - 80);
    ctx.fillStyle = "#3a241c"; ctx.fillRect(54, 54, W - 108, H - 108);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd56a"; ctx.font = "bold 46px monospace"; ctx.fillText("TODAY'S PIXEL COFFEE", W / 2, 135);
    ctx.fillStyle = "#f3d5aa"; ctx.font = "24px monospace"; ctx.fillText(`像素咖啡品味所・${r.modeLabel}`, W / 2, 180);
    drawCup(ctx, 326, 280, 4, r.mood);
    ctx.fillStyle = "#fff2cf"; ctx.font = "bold 42px monospace"; wrap(ctx, r.name, W / 2, 575, 680, 50, 2);
    ctx.fillStyle = "#8fe3c2"; ctx.font = "bold 24px monospace"; ctx.fillText(r.character, W / 2, 675);
    ctx.textAlign = "left"; ctx.font = "bold 16px monospace";
    let x = 90, y = 715;
    r.chosen.forEach((flavor, index) => {
      const text = `${index + 1}.${flavor}`;
      const width = Math.min(245, ctx.measureText(text).width + 24);
      if (x + width > 810) { x = 90; y += 42; }
      ctx.fillStyle = index % 2 ? "#7b4a34" : "#7c3d55";
      ctx.fillRect(x, y, width, 31);
      ctx.strokeStyle = "#fff2cf"; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, 31);
      ctx.fillStyle = "#fff2cf"; ctx.fillText(text, x + 10, y + 21);
      x += width + 9;
    });
    const metricStart = r.total >= 9 ? 860 : r.total >= 6 ? 830 : 800;
    ["香氣", "明亮感", "醇厚度", "順口度", "平衡感", "餘韻"].forEach((key, index) => {
      const xx = index % 2 ? 470 : 110, yy = metricStart + Math.floor(index / 2) * 74;
      ctx.fillStyle = "#f3d5aa"; ctx.font = "bold 20px monospace"; ctx.fillText(`${key} ${r.metrics[key]}`, xx, yy);
      ctx.fillStyle = "#ffd56a"; ctx.font = "23px monospace"; ctx.fillText(beans(r.metrics[key]), xx, yy + 30);
    });
    ctx.fillStyle = "#211511"; ctx.fillRect(92, 1070, 716, 72);
    ctx.fillStyle = "#8fe3c2"; ctx.fillRect(92, 1070, 10, 72);
    ctx.fillStyle = "#ffe9c5"; ctx.font = "18px monospace"; wrap(ctx, r.quote, 120, 1098, 650, 25, 2);
    ctx.textAlign = "right"; ctx.fillStyle = "#ffd56a"; ctx.font = "bold 28px monospace"; ctx.fillText(`${r.score} / 100`, 780, 1175);
  }

  function reset() {
    S.started = false; S.done = false; S.pressing = false; S.inputs = []; S.current = null; S.result = null; S.wordIndex = -1;
    S.pulseStart = performance.now();
    window.__coffeeRun = null;
    clearFx();
    E.game.classList.remove("hidden"); E.status.classList.remove("hidden"); E.modePicker.classList.remove("hidden"); E.result.classList.add("hidden");
    E.hold.textContent = "開始品飲";
    E.hold.style.setProperty("--progress", "0%");
    E.word.innerHTML = "<span>按住探索感官</span><small>每一步會顯示正確的形容詞</small>";
    updateUI();
    scrollTo({ top: 0, behavior: "smooth" });
  }

  document.querySelectorAll(".mode-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (S.started) return;
      S.mode = button.dataset.mode;
      S.inputs = [];
      S.pulseStart = performance.now();
      updateUI();
      toast(`${currentMode().label}：${currentMode().total} 步・專屬感官詞庫已切換`);
      tone(S.mode === "simple" ? 440 : S.mode === "expert" ? 560 : 680, 0.06);
    });
  });

  E.hold.addEventListener("pointerdown", press);
  addEventListener("pointerup", release);
  addEventListener("pointercancel", release);
  ["contextmenu", "selectstart", "dragstart"].forEach((type) => E.game.addEventListener(type, (event) => event.preventDefault()));
  document.addEventListener("selectionchange", () => { if (S.pressing) window.getSelection?.()?.removeAllRanges(); });
  E.download.onclick = () => {
    const anchor = document.createElement("a");
    anchor.download = `${S.result.name}-${S.result.modeLabel}-咖啡評測.png`;
    anchor.href = E.canvas.toDataURL("image/png");
    anchor.click();
    toast("評測圖已產生");
  };
  E.restart.onclick = reset;

  updateUI();
  requestAnimationFrame(animatePulse);
})();