function addChips(options = []) {

  const chat =
    document.getElementById("chat");


  if (
    !chat ||
    !Array.isArray(options) ||
    options.length === 0
  ) {
    return;
  }


  const row =
    document.createElement("div");


  row.className =
    "mb-4 flex items-end gap-3";


  // EVAT avatar
  const avatar =
    document.createElement("div");


  avatar.className = `
    flex
    h-8
    w-8
    shrink-0
    items-center
    justify-center
    rounded-xl
    border
    border-emerald-300/15
    bg-emerald-400/[0.06]
    text-sm
    text-emerald-300
    backdrop-blur-xl
  `;


  avatar.textContent =
    "⚡";


  // Glass container
  const wrap =
    document.createElement("div");


  wrap.className = `
    rounded-2xl
    border
    border-white/[0.08]
    bg-white/[0.04]
    p-3
    shadow-[0_10px_35px_rgba(0,0,0,0.2)]
    backdrop-blur-2xl
  `;


  const chips =
    document.createElement("div");


  chips.className =
    "flex flex-wrap gap-2";


  options.forEach((option) => {

    const chip =
      document.createElement(
        "button"
      );


    chip.type =
      "button";


    chip.className = `
      rounded-xl
      border
      border-emerald-300/15
      bg-emerald-400/[0.06]
      px-4
      py-2
      text-xs
      font-medium
      text-emerald-200/80
      backdrop-blur-xl
      transition
      hover:border-emerald-300/30
      hover:bg-emerald-400/[0.12]
      hover:text-emerald-100
      hover:shadow-[0_0_20px_rgba(16,185,129,0.08)]
      active:scale-95
    `;


    chip.textContent =
      option;


    chip.addEventListener(
      "click",
      async () => {

        window.showFcpChips =
          false;


        addMessage(
          option,
          "user"
        );


        await sendMessage(
          option
        );


        row.remove();

      }
    );


    chips.appendChild(
      chip
    );

  });


  wrap.appendChild(
    chips
  );


  row.append(
    avatar,
    wrap
  );


  chat.appendChild(
    row
  );


  if (
    typeof persistChat ===
    "function"
  ) {
    persistChat();
  }


  if (
    typeof scrollToBottom ===
    "function"
  ) {
    scrollToBottom();
  }
}