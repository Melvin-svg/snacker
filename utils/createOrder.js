export const createOrder = async (products) => {
  try {
    // Only ids and counts are sent; the server prices the order and picks the slots.
    const res = await fetch("/api/create-order", {
      method: "POST",
      body: JSON.stringify({
        products: products.map(({ productId, count }) => ({ productId, count })),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (data.success) {
      return { success: true, orderId: data.orderId, amount: data.amount };
    }
    return {
      success: false,
      insufficientCredit: data.insufficientCredit,
      insufficientStock: data.insufficientStock,
      error: data.error,
    };
  } catch (error) {
    console.log(error);
    return { success: false, error: error.message };
  }
};
