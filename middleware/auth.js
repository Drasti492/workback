router.post(
  "/submit-application",
  (req, res, next) => authMiddleware(req, res, next), // ensures it’s a function
  applicationController.submitApplication
);
