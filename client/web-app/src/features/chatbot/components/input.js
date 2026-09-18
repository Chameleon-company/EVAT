function setupChatInput() {
    const input =
        document.getElementById(
            "user-input"
        );

    if (!input) return;


    input.addEventListener(
        "input",
        () => {

            input.style.height = "auto";

            input.style.height =
                `${Math.min(
                    input.scrollHeight,
                    140
                )}px`;
        }
    );


    input.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                const form =
                    document.getElementById(
                        "chat-form"
                    );

                if (form) {
                    form.requestSubmit();
                }
            }
        }
    );
}