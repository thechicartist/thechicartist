(function () {
  const form = document.getElementById("inspirationPreferences");
  if (!form) return;

  const nameField = document.getElementById("inspirationName");
  const emailField = document.getElementById("inspirationEmail");
  const status = document.getElementById("inspirationStatus");
  const submit = form.querySelector('button[type="submit"]');

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  // Resolves as soon as OneSignal is ready. If it's already set (e.g. the
  // "onesignalready" event fired before this script ran), resolve right away.
  // Otherwise wait for the event, with a timeout so we don't hang forever if
  // OneSignal genuinely fails to load.
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

    if (!nameField.checkValidity()) {
      nameField.reportValidity();
      return;
    }
    if (!emailField.checkValidity()) {
      emailField.reportValidity();
      return;
    }

    const name = nameField.value.trim();
    const email = emailField.value.trim();

    submit.disabled = true;
    setStatus(window.TheChicArtistOneSignal ? "Saving your email…" : "Setting things up…");

    let oneSignal;
    try {
      oneSignal = await waitForOneSignal(8000);
    } catch (error) {
      submit.disabled = false;
      setStatus("The notification service is still loading. Please try again in a moment.", true);
      return;
    }

    try {
      oneSignal.setConsentGiven(true);
      await oneSignal.User.addTags({ inspiration_email: "true", first_name: name });
      await oneSignal.User.addEmail(email);

      setStatus("You're subscribed, " + name + ". Thanks for joining!");
      form.reset();

      // Best-effort, silent: try to also get browser push permission in the
      // background. Never block or affect the visible email success message
      // on this — if it's denied, unsupported, or errors, just ignore it.
      oneSignal.Notifications.requestPermission().catch(function () {
        /* silently ignored */
      });
    } catch (error) {
      console.error("Could not save inspiration subscription", error);
      setStatus("We couldn't save your subscription. Please try again.", true);
    } finally {
      submit.disabled = false;
    }
  });
})();