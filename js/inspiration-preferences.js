(function () {
  const form = document.getElementById("inspirationPreferences");
  if (!form) return;

  const emailChannel = form.querySelector('input[value="email"]');
  const emailField = document.getElementById("inspirationEmail");
  const status = document.getElementById("inspirationStatus");
  const submit = form.querySelector('button[type="submit"]');

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function updateEmailField() {
    emailField.disabled = !emailChannel.checked;
    emailField.required = emailChannel.checked;
  }

  emailChannel.addEventListener("change", updateEmailField);
  updateEmailField();

  // Resolves as soon as OneSignal is ready. If it's already set (e.g. the
  // "onesignalready" event fired before this script ran), resolve right away.
  // Otherwise wait for the event, with a timeout so we don't hang forever if
  // OneSignal genuinely fails to load (blocked script, network error, etc).
  function waitForOneSignal(timeoutMs) {
    if (window.TheChicArtistOneSignal) {
      return Promise.resolve(window.TheChicArtistOneSignal);
    }
    return new Promise(function (resolve, reject) {
      const timer = setTimeout(function () {
        window.removeEventListener("onesignalready", onReady);
        reject(new Error("Timed out waiting for OneSignal"));
      }, timeoutMs);

      function onReady() {
        clearTimeout(timer);
        resolve(window.TheChicArtistOneSignal);
      }

      window.addEventListener("onesignalready", onReady, { once: true });
    });
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    submit.disabled = true;
    if (!window.TheChicArtistOneSignal) {
      setStatus("Setting things up…");
    }

    let oneSignal;
    try {
      oneSignal = await waitForOneSignal(8000);
    } catch (error) {
      submit.disabled = false;
      setStatus("The notification service is still loading. Please try again in a moment.", true);
      return;
    }

    const data = new FormData(form);
    const frequency = data.get("frequency");
    const wantsPush = data.getAll("channels").includes("push") && frequency !== "off";
    const wantsEmail = data.getAll("channels").includes("email") && frequency !== "off";
    const email = String(data.get("email") || "").trim();

    if (wantsEmail && !emailField.checkValidity()) {
      emailField.reportValidity();
      submit.disabled = false;
      return;
    }

    setStatus("Saving your preferences…");

    try {
      oneSignal.setConsentGiven(true);
      await oneSignal.User.addTags({
        inspiration_frequency: frequency,
        inspiration_push: String(wantsPush),
        inspiration_email: String(wantsEmail)
      });

      if (wantsEmail) {
        await oneSignal.User.addEmail(email);
      }

      if (wantsPush) {
        await oneSignal.Notifications.requestPermission();
      }

      if (frequency === "off") {
        setStatus("You will not receive inspiration messages from this preference form.");
      } else if (wantsPush && wantsEmail) {
        setStatus("Your daily inspiration preferences are saved. Check your email to confirm your subscription if prompted.");
      } else if (wantsEmail) {
        setStatus("Your email preferences are saved. Check your email to confirm your subscription if prompted.");
      } else if (wantsPush) {
        setStatus("Your browser notification preferences are saved. Choose Allow if your browser asks for permission.");
      } else {
        setStatus("Choose email or browser notifications to receive inspiration.", true);
      }
    } catch (error) {
      console.error("Could not save inspiration preferences", error);
      setStatus("We couldn’t save your preferences. Please try again.", true);
    } finally {
      submit.disabled = false;
    }
  });
})();