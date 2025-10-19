const express = require("express");
const router = express.Router();
const {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLikeBlog,
  addComment,
  deleteComment,
  getUserBlogs,
  getBlogsByGenre,
  getAllUsers,
  searchBlogs
} = require("../controllers/blogController");

const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.get("/blogs", getBlogs);
router.get("/blogs/search", searchBlogs);
router.get("/blogs/genre/:genre", getBlogsByGenre);
router.get("/blogs/:id", getBlogById);



router.post("/blogs", authMiddleware, upload.single("image"), createBlog);

router.put("/blogs/:id", authMiddleware, upload.single("image"), updateBlog);

router.delete("/blogs/:id", authMiddleware, deleteBlog);


router.put("/blogs/like/:id", authMiddleware, toggleLikeBlog);
router.post("/blogs/comment/:id", authMiddleware, addComment);
router.delete("/blogs/comment/:id/:commentId", authMiddleware, deleteComment);

router.get("/blogs/user/:userId", authMiddleware, getUserBlogs);

router.get("/users", authMiddleware, isAdmin, getAllUsers);

module.exports = router;