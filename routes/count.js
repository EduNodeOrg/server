const auth = require('../middleware/auth');
const { authorize } = require('../models/User');

// Admin-only statistics
router.get("/users", auth, authorize('admin'), async (req, res) => {
  // ... existing user count logic ...
});

router.get("/courses", auth, authorize('admin'), async (req, res) => {
  // ... existing course count logic ...
}); 