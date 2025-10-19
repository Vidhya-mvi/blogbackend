const Blog = require("../models/blog");
const User = require("../models/user"); 


const getImageUrl = (req) => {
    if (!req.file) return "";

    return req.file.path;
};


// Create a new blog 
const createBlog = async (req, res) => {
    const { title, content, genre } = req.body;

    try {
        if (!title || !content || !genre) {
            return res.status(400).json({ error: "Title, content, and genre are required" });
        }

      
        const image = getImageUrl(req); 

        const newBlog = new Blog({
            title,
            content,
            genre,
            image,
            postedBy: req.user.id,
        });

        const savedBlog = await newBlog.save();
        res.status(201).json(savedBlog);
    } catch (err) {
        console.error("Error saving blog:", err);
        res.status(500).json({ error: "Failed to create blog" });
    }
};

// Get all blogs
const getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("postedBy", "username")
      .populate("comments.postedBy", "username")
      .sort({ createdAt: -1 });

    
    res.status(200).json(blogs || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
};

// Get blogs by genre
const getBlogsByGenre = async (req, res) => {
  try {
    const genre = req.params.genre;
    const blogs = await Blog.find({ genre: { $regex: new RegExp(genre, "i") } })
      .populate("postedBy", "username");

 
    res.status(200).json(blogs || []);
  } catch (error) {
    console.error("Error fetching blogs by genre:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get blogs for a specific user
const getUserBlogs = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "User ID is missing" });

    const blogs = await Blog.find({ postedBy: userId })
      .populate("postedBy", "username email");

   
    res.status(200).json(blogs || []);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ error: "Invalid user ID format" });
    }
    console.error("Error fetching user blogs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Search blogs
const searchBlogs = async (req, res) => {
  try {
    let { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    query = query.trim();
    const escapeRegExp = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const safeQuery = escapeRegExp(query);

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: safeQuery, $options: "i" } },
        { content: { $regex: safeQuery, $options: "i" } },
        { genre: { $regex: safeQuery, $options: "i" } },
      ],
    }).populate("postedBy", "username");


    res.status(200).json(blogs || []);
  } catch (error) {
    console.error("Error searching blogs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Update blog 
const updateBlog = async (req, res) => {
  try {
    const { title, content, genre } = req.body;
    const updatedData = { title, content, genre };

    if (req.file) {
      updatedData.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

    res.json(updatedBlog);
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Failed to update blog" });
  }
};

// Get a single blog by ID
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id)
            .populate("postedBy", "username")
            .populate("comments.postedBy", "username");

        if (!blog) return res.status(404).json({ message: "Blog not found" });

        res.status(200).json(blog);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ error: "Invalid blog ID format" });
        }
        console.error("Failed to fetch the blog:", err.message);
        res.status(500).json({ error: "Failed to fetch the blog" });
    }
};
// Delete a blog
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) return res.status(404).json({ message: "Blog not found" });

        if (blog.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to delete this blog" });
        }

      

        await Blog.findByIdAndDelete(req.params.id); 
        
        res.json({ message: "Blog deleted successfully" });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ error: "Invalid blog ID format" });
        }
        console.error("Error deleting blog:", err);
        res.status(500).json({ error: "Failed to delete the blog" });
    }
};

const toggleLikeBlog = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized: No user ID found" });
        }

        const userId = req.user.id;
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        const hasLiked = blog.likes.includes(userId); 

        const updateQuery = hasLiked
            ? { $pull: { likes: userId } } 
            : { $addToSet: { likes: userId } }; 

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateQuery, { 
            new: true,
            select: 'likes' 
        });

        res.json({
            message: hasLiked ? "Unliked the blog" : "Liked the blog",
            likes: updatedBlog.likes,
        });
    } catch (err) {
        console.error("Error toggling like:", err);
        res.status(500).json({ error: "Failed to like/unlike the blog" });
    }
};

// Add a comment
const addComment = async (req, res) => {
    const { text } = req.body;

    if (!text) return res.status(400).json({ message: "Comment cannot be empty" });

    try {
        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { text, postedBy: req.user.id } } },
            { new: true }
        )
            .populate("comments.postedBy", "username")
            .populate("postedBy", "username");
            
        if (!blog) return res.status(404).json({ message: "Blog not found" });


        res.json(blog);
    } catch (err) {
        console.error("Error adding comment:", err);
        res.status(500).json({ error: "Failed to add comment" });
    }
};

const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const blogId = req.params.id;

    try {
        const blog = await Blog.findById(blogId);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        const comment = blog.comments.id(commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        if (comment.postedBy.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        comment.remove(); 
        await blog.save();

        res.json({ message: "Comment deleted successfully" });
    } catch (err) {
         if (err.name === 'CastError') {
            return res.status(400).json({ error: "Invalid ID format" });
        }
        console.error("Error deleting comment:", err);
        res.status(500).json({ error: "Failed to delete comment" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
             return res.status(403).json({ message: "Access denied. Admin role required." });
        }
        
        const users = await User.find({}).select("-password");
        res.status(200).json(users);
    } catch (err) {
        console.error("Failed to fetch users:", err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
};



module.exports = {
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
};