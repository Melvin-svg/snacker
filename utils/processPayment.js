export const processPayment = async (amount, user) => {
  try {
    const response = await fetch("/api/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Failed to initialize payment");
    }

    const data = await response.json();

    // A closed Radix/vaul drawer can leave `pointer-events: none` on <body>, which the
    // YouPI modal (appended to <body>) inherits, making it unclickable.
    if (typeof document !== "undefined") {
      document.body.style.pointerEvents = "";
    }

    return new Promise((resolve) => {
      // 1. In-App Popup Modal with YouPI-PG SDK
      if (typeof window !== "undefined" && window.Youpi && data.checkoutUrl) {
        window.Youpi.pay({
          checkoutUrl: data.checkoutUrl,
          order_id: data.orderId,
          amount: parseFloat(amount),
          currency: "INR",
          name: "Snacker Wallet",
          description: "Snacker Points Top-Up",
          customer: {
            name: user?.fullName || user?.firstName || "Customer",
            email: user?.primaryEmailAddress?.emailAddress || "",
          },
          handler: function (res) {
            console.log("YouPI in-app modal confirmed payment:", res);
            resolve({ ok: true, orderId: data.orderId, utr: res?.utr });
          },
          onClose: function () {
            console.log("Customer closed YouPI payment modal");
            resolve({ ok: true, orderId: data.orderId, closed: true });
          },
        });
        return;
      }

      // 2. Fallback: Open hosted checkout window
      if (data.checkoutUrl) {
        // Mobile browsers block window.open() outside the tap handler (we awaited a fetch
        // first) and return null. Fall back to opening checkout in this tab.
        const tab = window.open(data.checkoutUrl, "_blank");
        if (!tab) {
          window.location.assign(data.checkoutUrl);
        }
        resolve({ ok: true, orderId: data.orderId, checkoutUrl: data.checkoutUrl });
        return;
      }

      resolve({ ok: true, orderId: data.orderId });
    });
  } catch (error) {
    console.error("Error processing payment:", error.message);
    throw error;
  }
};
