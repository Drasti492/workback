router.post("/callback", async (req, res) => {
  const payload = req.body?.response;
  if (!payload) return res.sendStatus(400);

  const payment = await Payment.findOne({
    externalReference: payload.ExternalReference
  });

  if (!payment) return res.sendStatus(404);

  payment.checkoutRequestID = payload.CheckoutRequestID;
  payment.resultDesc = payload.ResultDesc;

  if (payload.ResultCode === 0) {
    payment.status = "success";
    payment.mpesaReceipt = payload.MpesaReceiptNumber;
  } else {
    payment.status = "failed";
  }

  await payment.save();
  res.sendStatus(200);
});
