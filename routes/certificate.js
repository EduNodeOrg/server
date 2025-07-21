const auth = require('../middleware/auth');
const { authorize } = require('../models/User');

// Admin-only certificate management
router.post("/", async (req, res) => {
  // ... existing certificate creation logic ...
});

router.delete("/:id", async (req, res) => {
  // ... existing deletion logic ...
});

// User-specific certificate access
router.get("/user/:userId", auth, authorize('user'), async (req, res) => {
  // ... existing user certificate logic ...
}); 