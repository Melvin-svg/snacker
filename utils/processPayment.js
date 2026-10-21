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
    if (data.checkoutUrl) {
      // Open the YouPI-PG FCFS payment queue / dynamic QR window
      window.open(data.checkoutUrl, "_blank");
      return { ok: true, orderId: data.orderId, checkoutUrl: data.checkoutUrl };
    }

    return { ok: true, orderId: data.orderId };
  } catch (error) {
    console.error("Error processing payment:", error.message);
    throw error;
  }
};
